
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Sparkles, 
  Trash2, 
  Tag, 
  History,
  Copy,
  Check,
  User,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Camera,
  Plus,
  Maximize2,
  FileSearch,
  Loader2,
  Monitor,
  Lightbulb,
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Note, ActionItem, Priority, BrainDumpItem } from '../types';
import { summarizeNote, extractTextFromImage } from '../services/geminiService';

interface NoteEditorProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onBack: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onBack }) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSummarize = async () => {
    if (!note.content) return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeNote(note.content);
      onUpdate({ content: `${note.content}\n\n---\n**AI Summary:**\n${summary}` });
    } catch (error) {
      console.error('Failed to summarize', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExtractText = async (index: number) => {
    const images = note.images || [];
    if (!images[index]) return;
    
    setIsExtracting(index);
    try {
      const text = await extractTextFromImage(images[index]);
      const newContent = note.content 
        ? `${note.content}\n\n---\n**AI Extracted Text:**\n${text}`
        : `**AI Extracted Text:**\n${text}`;
      onUpdate({ content: newContent });
    } catch (error) {
      console.error('Failed to extract text', error);
    } finally {
      setIsExtracting(null);
    }
  };

  const handleShare = () => {
    const shareId = note.sharedId || Math.random().toString(36).substring(7);
    onUpdate({ sharedId: shareId });
    const shareUrl = `${window.location.origin}/#/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate({ tags: note.tags.filter(t => t !== tagToRemove) });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImagesPromises = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const newImages = await Promise.all(newImagesPromises);
      onUpdate({ images: [...(note.images || []), ...newImages] });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            onUpdate({ images: [...(note.images || []), base64] });
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const captureScreen = async () => {
    try {
      setIsCapturingScreen(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      await new Promise(r => setTimeout(r, 500));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onUpdate({ images: [...(note.images || []), dataUrl] });
      }

      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Screen capture failed:', err);
    } finally {
      setIsCapturingScreen(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onUpdate({ images: [...(note.images || []), dataUrl] });
        stopCamera();
      }
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...(note.images || [])];
    updatedImages.splice(index, 1);
    onUpdate({ images: updatedImages });
  };

  // Brain Dump Handlers
  const addBrainDumpItem = () => {
    const newItem: BrainDumpItem = {
      id: Date.now().toString(),
      text: '',
      priority: Priority.MEDIUM,
      completed: false
    };
    onUpdate({ brainDump: [...(note.brainDump || []), newItem] });
  };

  const updateBrainDumpItem = (id: string, updates: Partial<BrainDumpItem>) => {
    const updatedItems = (note.brainDump || []).map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdate({ brainDump: updatedItems });
  };

  const removeBrainDumpItem = (id: string) => {
    onUpdate({ brainDump: (note.brainDump || []).filter(item => item.id !== id) });
  };

  const getPriorityColors = (p: Priority) => {
    switch(p) {
      case Priority.CRITICAL: return 'border-l-purple-600 bg-purple-50/50';
      case Priority.HIGH: return 'border-l-rose-500 bg-rose-50/30';
      case Priority.LOW: return 'border-l-emerald-500 bg-emerald-50/30';
      default: return 'border-l-amber-500 bg-amber-50/30';
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Camera Overlay */}
      {isCameraActive && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <button 
            onClick={stopCamera}
            className="absolute top-6 right-6 p-2 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
          
          <div className="w-full max-w-2xl px-4 flex flex-col items-center gap-6">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto rounded-3xl bg-slate-900 border border-white/10"
            />
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-1 border-4 border-slate-400 group active:scale-95 transition-all shadow-2xl shadow-white/10"
            >
              <div className="w-full h-full rounded-full bg-white border border-slate-200" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Editor Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
              title="Attach from Device"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              onClick={startCamera}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
              title="Take Photo"
            >
              <Camera size={18} />
            </button>
            <button 
              onClick={captureScreen}
              disabled={isCapturingScreen}
              className={`p-2 rounded-lg transition-all ${isCapturingScreen ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'}`}
              title="Add Screenshot"
            >
              <Monitor size={18} />
            </button>
            <button 
              onClick={addBrainDumpItem}
              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-all"
              title="Quick Brain Dump"
            >
              <Lightbulb size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileSelect}
            />
          </div>

          <button 
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={16} className={isSummarizing ? 'animate-pulse' : ''} />
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={note.priority || Priority.MEDIUM}
            onChange={(e) => onUpdate({ priority: e.target.value as Priority })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none transition-colors ${
              note.priority === Priority.CRITICAL ? 'bg-purple-600 text-white' :
              note.priority === Priority.HIGH ? 'bg-rose-50 text-rose-600' :
              note.priority === Priority.LOW ? 'bg-emerald-50 text-emerald-600' :
              'bg-amber-50 text-amber-600'
            }`}
          >
            <option value={Priority.CRITICAL}>Critical Priority</option>
            <option value={Priority.HIGH}>High Priority</option>
            <option value={Priority.MEDIUM}>Medium Priority</option>
            <option value={Priority.LOW}>Low Priority</option>
          </select>

          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
            {copied ? 'Link Copied' : 'Share'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="mx-8 mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm flex items-center gap-2 border border-rose-100 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={16} />
          {cameraError}
          <button onClick={() => setCameraError(null)} className="ml-auto text-rose-400"><X size={14}/></button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Title & Tags */}
        <div className="px-8 py-6 space-y-4">
          <input 
            type="text"
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Note Title"
            className={`w-full text-4xl font-extrabold border-none focus:outline-none placeholder:text-slate-200 ${note.priority === Priority.CRITICAL ? 'text-purple-800' : 'text-slate-900'}`}
          />
          
          <div className="flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-slate-400" />
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium group">
                #{tag}
                <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                  <X size={10} />
                </button>
              </span>
            ))}
            <input 
              type="text"
              placeholder="Add tag..."
              className="text-xs bg-transparent border-none focus:outline-none text-slate-400 min-w-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  const newTag = target.value.trim().replace('#', '');
                  if (newTag && !note.tags.includes(newTag)) {
                    onUpdate({ tags: [...note.tags, newTag] });
                    target.value = '';
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Brain Dump Section */}
        {note.brainDump && note.brainDump.length > 0 && (
          <div className="mx-8 mb-10 p-6 bg-amber-50/20 rounded-3xl border border-amber-100 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-xs">
                <Lightbulb size={16} /> Quick Brain Dump
              </div>
              <button 
                onClick={addBrainDumpItem}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
              >
                Add another item
              </button>
            </div>
            
            <div className="space-y-3">
              {note.brainDump.map((item) => (
                <div 
                  key={item.id} 
                  className={`
                    flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl border-l-4 transition-all shadow-sm bg-white
                    ${getPriorityColors(item.priority)}
                  `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      onClick={() => updateBrainDumpItem(item.id, { completed: !item.completed })}
                      className={`shrink-0 transition-colors ${item.completed ? 'text-indigo-500' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <input 
                      type="text"
                      value={item.text}
                      onChange={(e) => updateBrainDumpItem(item.id, { text: e.target.value })}
                      placeholder="Type a thought..."
                      className={`flex-1 bg-transparent border-none focus:outline-none text-sm font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 ml-8 md:ml-0">
                    {/* Priority Cycles */}
                    <div className="flex gap-1">
                      {[Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL].map(p => (
                        <button 
                          key={p}
                          onClick={() => updateBrainDumpItem(item.id, { priority: p })}
                          className={`
                            w-2 h-2 rounded-full transition-all
                            ${item.priority === p ? (
                              p === Priority.CRITICAL ? 'bg-purple-600 scale-150' :
                              p === Priority.HIGH ? 'bg-rose-500 scale-125' : 
                              p === Priority.MEDIUM ? 'bg-amber-500 scale-125' : 
                              'bg-emerald-500 scale-125'
                            ) : 'bg-slate-200'}
                          `}
                          title={`${p} Priority`}
                        />
                      ))}
                    </div>
                    
                    {/* Reminder Inputs */}
                    <div className="flex items-center gap-1">
                      <input 
                        type="date" 
                        value={item.reminderDate || ''}
                        onChange={(e) => updateBrainDumpItem(item.id, { reminderDate: e.target.value })}
                        className="text-[10px] bg-slate-100 p-1 rounded border-none focus:outline-none w-24"
                      />
                      <input 
                        type="time" 
                        value={item.reminderTime || ''}
                        onChange={(e) => updateBrainDumpItem(item.id, { reminderTime: e.target.value })}
                        className="text-[10px] bg-slate-100 p-1 rounded border-none focus:outline-none w-20"
                      />
                    </div>

                    <button 
                      onClick={() => removeBrainDumpItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images Grid */}
        {note.images && note.images.length > 0 && (
          <div className="mx-8 mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {note.images.map((img, idx) => (
              <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                <img src={img} alt={`Attached ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleExtractText(idx)}
                    disabled={isExtracting === idx}
                    className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50"
                    title="AI Extract Text (Scan)"
                  >
                    {isExtracting === idx ? <Loader2 size={18} className="animate-spin" /> : <FileSearch size={18} />}
                  </button>
                  <button 
                    onClick={() => removeImage(idx)}
                    className="p-2 bg-white text-rose-500 rounded-xl hover:bg-rose-50 transition-colors shadow-lg"
                    title="Delete Image"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-8">
          <textarea 
            value={note.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onPaste={handlePaste}
            placeholder="Start writing your main thoughts... (You can also paste images directly from clipboard)"
            className="w-full min-h-[400px] resize-none border-none focus:outline-none text-slate-700 leading-relaxed text-lg placeholder:text-slate-200"
          />
        </div>

        {/* AI Extracted Meeting Minutes & Action Items */}
        {note.isMeetingMinute && note.actionItems && (
          <div className="mx-8 mt-12 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
              <Sparkles size={16} /> AI Extracted Action Items
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {note.actionItems.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 hover:border-indigo-200 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{item.owner}</p>
                    <p className="text-slate-600 text-sm mt-1 leading-snug">{item.task}</p>
                    {item.deadline && (
                      <div className="mt-2 text-[10px] font-medium text-amber-600 uppercase">
                        Due: {item.deadline}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
