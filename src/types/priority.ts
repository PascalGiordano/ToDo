
import type { Timestamp } from 'firebase/firestore';

export interface Priority {
  id: string; // Firestore document ID
  name: string; // e.g., 'Haute', 'Moyenne', 'Basse'
  value: string; // Could be the same as name or a more technical value like 'high', 'medium', 'low'
  order: number;
  color?: string; // Hex color code
  iconName?: string; // Name of a lucide-react icon
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
