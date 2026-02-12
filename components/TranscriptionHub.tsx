
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Loader2, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Upload, 
  Music,
  FileAudio
} from 'lucide-react';
import { processMeetingAudio } from '../services/geminiService';
import { Note, Priority } from '../types';

interface TranscriptionHubProps {
  onNoteCreated: (note: Note) => void;
}

const TranscriptionHub: React.FC<TranscriptionHubProps> = ({ onNoteCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessing(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessing(e.dataTransfer.files[0]);
    }
  };

  const handleProcessing = async (audioSource: Blob | File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioSource);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        try {
          const result = await processMeetingAudio(base64Audio);

          const newNote: Note = {
            id: Date.now().toString(),
            title: audioSource instanceof File ? `Upload: ${audioSource.name}` : `Meeting: ${new Date().toLocaleString()}`,
            content: `${result.minutes}\n\n---\n**Full Transcript:**\n${result.transcript}`,
            tags: ['AI-Transcription', 'Meeting'],
            updatedAt: Date.now(),
            priority: Priority.MEDIUM,
            isMeetingMinute: true,
            actionItems: result.actionItems
          };

          onNoteCreated(newNote);
        } catch (apiErr) {
          setError('AI processing failed. The audio might be too long or poor quality.');
          console.error(apiErr);
        }
      };
    } catch (err) {
      setError('Failed to read audio source.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 overflow-y-auto">
      <div 
        className={`
          max-w-xl w-full bg-white p-12 rounded-[40px] shadow-2xl shadow-indigo-100 border transition-all duration-300
          ${dragActive ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02]' : 'border-slate-100'}
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">AI Transcription Hub</h2>
            <p className="text-slate-500">Transform your recordings or files into structured notes instantly.</p>
          </div>

          <div className="relative py-8">
            {isRecording ? (
              <div className="space-y-6">
                <div className="flex justify-center items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-4xl font-mono font-bold text-slate-800">{formatTime(duration)}</span>
                </div>
                <p className="text-slate-400 animate-pulse">OmniNote is listening to the meeting...</p>
                <button 
                  onClick={stopRecording}
                  className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 mx-auto group"
                >
                  <Square size={32} className="group-active:scale-90 transition-transform" />
                </button>
              </div>
            ) : isProcessing ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <Loader2 size={48} className="animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-slate-800">Processing Audio...</p>
                  <p className="text-slate-500 text-sm">Gemini is transcribing and identifying action items.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Record Button */}
                <button 
                  onClick={startRecording}
                  className="p-8 bg-indigo-600 rounded-3xl flex flex-col items-center gap-4 text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic size={32} />
                  </div>
                  <div>
                    <span className="font-bold text-lg block">Record Live</span>
                    <span className="text-white/70 text-sm">Transcribe meetings as they happen</span>
                  </div>
                </button>

                {/* Upload Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform group-hover:text-indigo-600">
                    <Upload size={32} />
                  </div>
                  <div>
                    <span className="font-bold text-lg block text-slate-800">Upload File</span>
                    <span className="text-slate-400 text-sm">MP3, WAV, or AAC audio files</span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={handleFileSelect}
                  />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm animate-in fade-in zoom-in duration-200">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
            <FeatureCard icon={<FileText size={18} />} label="Auto Minutes" />
            <FeatureCard icon={<CheckCircle size={18} />} label="Action Items" />
            <FeatureCard icon={<FileAudio size={18} />} label="Drag & Drop" />
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm flex items-center gap-2">
        <Info size={14} /> OmniNote AI detects specific owners for each action item automatically.
      </p>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
    <div className="text-indigo-600">{icon}</div>
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
  </div>
);

export default TranscriptionHub;
