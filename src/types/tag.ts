
import type { Timestamp } from 'firebase/firestore';

export interface Tag {
  id: string; // Firestore document ID
  name: string;
  color?: string; // Hex color code
  iconName?: string; // Name of a lucide-react icon
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
