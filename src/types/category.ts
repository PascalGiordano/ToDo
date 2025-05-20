
import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  order: number;
  color?: string; // Hex color code
  iconName?: string; // Name of a lucide-react icon
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
