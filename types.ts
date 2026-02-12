
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  startTime: string;
  endTime: string;
  completed: boolean;
  date: string;
}

export interface Reminder {
  id: string;
  message: string;
  time: string;
  recurring: boolean;
  frequency?: 'daily' | 'weekly';
  enabled: boolean;
}

export interface ActionItem {
  owner: string;
  task: string;
  deadline?: string;
}

export interface BrainDumpItem {
  id: string;
  text: string;
  priority: Priority;
  reminderTime?: string;
  reminderDate?: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  priority?: Priority;
  isMeetingMinute?: boolean;
  actionItems?: ActionItem[];
  sharedId?: string;
  images?: string[];
  brainDump?: BrainDumpItem[];
}

export type View = 'notes' | 'timebox' | 'reminders' | 'ai-transcribe';
