
import React, { useState } from 'react';
import { Bell, Plus, Trash2, SwitchCamera as Switch, RefreshCcw } from 'lucide-react';
import { Reminder } from '../types';

interface ReminderManagerProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

const ReminderManager: React.FC<ReminderManagerProps> = ({ reminders, setReminders }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newReminder, setNewReminder] = useState({
    message: '',
    time: '12:00',
    recurring: false,
    frequency: 'daily' as 'daily' | 'weekly'
  });

  const addReminder = () => {
    if (!newReminder.message) return;
    const r: Reminder = {
      id: Date.now().toString(),
      ...newReminder,
      enabled: true
    };
    setReminders([r, ...reminders]);
    setNewReminder({ message: '', time: '12:00', recurring: false, frequency: 'daily' });
    setShowAdd(false);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reminders</h1>
            <p className="text-slate-500 mt-1">Never miss lunch, breaks, or important dates.</p>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          >
            <Plus size={24} />
          </button>
        </div>

        {showAdd && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <input 
              type="text"
              placeholder="Reminder message (e.g. Time for Lunch)"
              value={newReminder.message}
              onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
              className="w-full text-lg font-medium border-none focus:outline-none"
            />
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Time</label>
                <input 
                  type="time" 
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-3 self-end py-2">
                <input 
                  type="checkbox" 
                  id="recurring"
                  checked={newReminder.recurring}
                  onChange={(e) => setNewReminder({ ...newReminder, recurring: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-slate-600">Recurring</label>
              </div>
              {newReminder.recurring && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Frequency</label>
                  <select 
                    value={newReminder.frequency}
                    onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value as any })}
                    className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
              <button onClick={addReminder} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Add Reminder</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reminders.map(rem => (
            <div key={rem.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rem.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className={`font-semibold ${rem.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{rem.message}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-500">{rem.time}</span>
                    {rem.recurring && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase">
                        <RefreshCcw size={10} /> {rem.frequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleReminder(rem.id)}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${rem.enabled ? 'bg-indigo-600' : 'bg-slate-200'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-all
                    ${rem.enabled ? 'left-7' : 'left-1'}
                  `} />
                </button>
                <button onClick={() => deleteReminder(rem.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReminderManager;
