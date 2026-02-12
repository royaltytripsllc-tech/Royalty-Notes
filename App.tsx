
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Bell, 
  Mic, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical,
  ChevronRight,
  Menu,
  X,
  Share2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import { Note, Task, Reminder, View, Priority } from './types';
import NoteEditor from './components/NoteEditor';
import Timeboxer from './components/Timeboxer';
import ReminderManager from './components/ReminderManager';
import TranscriptionHub from './components/TranscriptionHub';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'title'>('updated');

  // Persistence
  useEffect(() => {
    const savedNotes = localStorage.getItem('omninote_notes');
    const savedTasks = localStorage.getItem('omninote_tasks');
    const savedReminders = localStorage.getItem('omninote_reminders');

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  useEffect(() => {
    localStorage.setItem('omninote_notes', JSON.stringify(notes));
    localStorage.setItem('omninote_tasks', JSON.stringify(tasks));
    localStorage.setItem('omninote_reminders', JSON.stringify(reminders));
  }, [notes, tasks, reminders]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      priority: Priority.MEDIUM,
      updatedAt: Date.now(),
      images: []
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setActiveView('notes');
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  // Advanced Filtering Logic
  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !filterTag || n.tags.includes(filterTag);
        const matchesPriority = filterPriority === 'All' || n.priority === filterPriority;
        return matchesSearch && matchesTag && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') return b.updatedAt - a.updatedAt;
        return a.title.localeCompare(b.title);
      });
  }, [notes, searchQuery, filterTag, filterPriority, sortBy]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'}
        fixed md:relative z-40 h-full transition-all duration-300 bg-white border-r border-slate-200 flex flex-col
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <BookOpen size={24} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            OmniNote Pro
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={<BookOpen size={18} />} 
            label="All Notes" 
            active={activeView === 'notes'} 
            onClick={() => setActiveView('notes')} 
          />
          <NavItem 
            icon={<Calendar size={18} />} 
            label="Timebox Tasks" 
            active={activeView === 'timebox'} 
            onClick={() => setActiveView('timebox')} 
          />
          <NavItem 
            icon={<Bell size={18} />} 
            label="Reminders" 
            active={activeView === 'reminders'} 
            onClick={() => setActiveView('reminders')} 
          />
          <NavItem 
            icon={<Mic size={18} />} 
            label="AI Transcribe" 
            active={activeView === 'ai-transcribe'} 
            onClick={() => setActiveView('ai-transcribe')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleCreateNote}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} /> New Note
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeView === 'notes' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Notes List */}
            <div className={`
              ${selectedNoteId ? 'hidden md:flex' : 'flex'}
              w-full md:w-80 flex-col bg-slate-50 border-r border-slate-200
            `}>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    <Filter size={18} />
                  </button>
                </div>

                {showFilters && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filter by Tag</label>
                      <select 
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="">All Tags</option>
                        {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Priority</label>
                      <select 
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="All">All Priorities</option>
                        <option value={Priority.CRITICAL}>Critical</option>
                        <option value={Priority.HIGH}>High</option>
                        <option value={Priority.MEDIUM}>Medium</option>
                        <option value={Priority.LOW}>Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sort By</label>
                      <button 
                        onClick={() => setSortBy(sortBy === 'updated' ? 'title' : 'updated')}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <ArrowUpDown size={14} />
                        {sortBy === 'updated' ? 'Recently Updated' : 'Alphabetical'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {filteredNotes.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`
                      p-4 rounded-xl cursor-pointer transition-all group
                      ${selectedNoteId === note.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-100'}
                      ${note.priority === Priority.CRITICAL ? 'border-l-4 border-l-purple-600' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.priority === Priority.CRITICAL && <AlertTriangle size={14} className="text-purple-600 shrink-0" />}
                        {note.priority === Priority.HIGH && <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="High Priority" />}
                        <h3 className={`font-semibold text-slate-800 truncate ${note.priority === Priority.CRITICAL ? 'text-purple-700' : ''}`}>
                          {note.title || 'Untitled'}
                        </h3>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Thumbnail if image exists */}
                    {note.images && note.images.length > 0 && (
                      <div className="w-full h-24 mb-2 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        <img src={note.images[0]} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                      </div>
                    )}

                    <p className="text-sm text-slate-500 line-clamp-2">
                      {note.content.substring(0, 100) || 'No content yet...'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <div className="py-20 text-center text-slate-400 text-sm">
                    No notes found matching filters.
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className={`flex-1 flex flex-col bg-white ${!selectedNoteId ? 'hidden md:flex' : ''}`}>
              {selectedNoteId ? (
                <NoteEditor 
                  note={selectedNote!} 
                  onUpdate={(updates) => updateNote(selectedNote!.id, updates)} 
                  onBack={() => setSelectedNoteId(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen size={32} />
                  </div>
                  <p>Select a note or create a new one to begin</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'timebox' && (
          <Timeboxer tasks={tasks} setTasks={setTasks} />
        )}

        {activeView === 'reminders' && (
          <ReminderManager reminders={reminders} setReminders={setReminders} />
        )}

        {activeView === 'ai-transcribe' && (
          <TranscriptionHub onNoteCreated={(n) => {
            setNotes([n, ...notes]);
            setSelectedNoteId(n.id);
            setActiveView('notes');
          }} />
        )}
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
      ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
    `}
  >
    {icon}
    {label}
  </button>
);

export default App;
