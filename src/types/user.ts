
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Firestore document ID (could also be Firebase Auth UID)
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatarUrl?: string; // URL to an image
  initials?: string; // e.g., JD for John Doe
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  // roles?: string[]; // Future extension for role-based access
}
