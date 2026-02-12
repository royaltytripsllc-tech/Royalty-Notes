
import React, { useState } from 'react';
import { Plus, Clock, AlertCircle, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { Task, Priority } from '../types';

interface TimeboxerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Timeboxer: React.FC<TimeboxerProps> = ({ tasks, setTasks }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: Priority.MEDIUM,
    startTime: '09:00',
    endTime: '10:00'
  });

  const addTask = () => {
    if (!newTask.title) return;
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: '', priority: Priority.MEDIUM, startTime: '09:00', endTime: '10:00' });
    setShowAdd(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL: return 'bg-purple-600 text-white border-purple-700';
      case Priority.HIGH: return 'bg-rose-100 text-rose-600 border-rose-200';
      case Priority.MEDIUM: return 'bg-amber-100 text-amber-600 border-amber-200';
      case Priority.LOW: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-8 max-w-4xl w-full mx-auto space-y-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Today's Timebox</h1>
            <p className="text-slate-500 mt-1">Schedule your day for maximum productivity.</p>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Plus size={20} /> Add Block
          </button>
        </div>

        {showAdd && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <input 
              type="text"
              placeholder="What are you working on?"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full text-lg font-medium border-none focus:outline-none"
            />
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {[Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL].map(p => (
                    <button 
                      key={p}
                      onClick={() => setNewTask({ ...newTask, priority: p })}
                      className={`
                        flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all
                        ${newTask.priority === p ? getPriorityColor(p) : 'bg-slate-50 text-slate-400 border border-transparent'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Time Slot</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={newTask.startTime}
                    onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                    className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                  />
                  <span className="text-slate-300">to</span>
                  <input 
                    type="time" 
                    value={newTask.endTime}
                    onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                    className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={addTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Schedule Task
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Clock size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400">No tasks scheduled yet. Start by adding your first time block.</p>
            </div>
          ) : (
            tasks.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(task => (
              <div 
                key={task.id}
                className={`
                  group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all
                  ${task.completed ? 'opacity-60 grayscale' : ''}
                  ${task.priority === Priority.CRITICAL && !task.completed ? 'ring-2 ring-purple-600 ring-offset-2' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-400'}
                    `}
                  >
                    {task.completed && <CheckCircle2 size={14} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)} flex items-center gap-1`}>
                        {task.priority === Priority.CRITICAL && <AlertTriangle size={10} />}
                        {task.priority}
                      </span>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {task.startTime} - {task.endTime}
                      </span>
                    </div>
                    <h4 className={`font-semibold text-slate-800 ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                  </div>
                </div>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeboxer;
