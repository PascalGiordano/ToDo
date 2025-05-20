
import type { Timestamp } from 'firebase/firestore';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  actions?: ActionItem[]; // Nouveau champ pour les actions
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Subtask {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  checklist: ChecklistItem[];
}

export interface Task {
  id: string; // Firestore document ID
  name: string;
  content: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  attachments: string[]; // URLs for placeholder images
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  projectId?: string; // ID of the associated project
  projectName?: string; // Name of the associated project (for easier display)
  assignedUserIds?: string[]; // IDs of assigned users
  assignedUserNames?: string[]; // Names of assigned users for display
  dueDate?: Date | Timestamp; // Date d'échéance
  createdAt: Date | Timestamp; // Can be Date in app state, Timestamp from Firestore
  updatedAt: Date | Timestamp; // Can be Date in app state, Timestamp from Firestore
}
