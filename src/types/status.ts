
import type { Timestamp } from 'firebase/firestore';

export interface Status {
  id: string; // Firestore document ID
  name: string; // e.g., 'À Faire', 'En Cours', 'Terminé'
  value: string; // Could be the same as name or a technical value like 'to-do', 'in-progress', 'done'
  order: number;
  color?: string; // Hex color code
  iconName?: string; // Name of a lucide-react icon
  isCompletionStatus?: boolean; // Indicates if this status means the task is "done"
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
