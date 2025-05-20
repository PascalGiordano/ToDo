
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/user';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          usersData.push({
            id: docSnapshot.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            mobile: data.mobile,
            avatarUrl: data.avatarUrl,
            initials: data.initials || getInitials(data.name),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as User);
        });
        setUsers(usersData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des utilisateurs depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les utilisateurs.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addUser = useCallback(
    async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
      const finalName = userData.name.trim();
      const finalEmail = userData.email.trim();

      if (!finalName) {
        toast({
          title: 'Validation échouée',
          description: "Le nom de l'utilisateur est requis.",
          variant: 'destructive',
        });
        throw new Error("Le nom de l'utilisateur est requis.");
      }
      if (!finalEmail) {
        toast({
          title: 'Validation échouée',
          description: "L'email de l'utilisateur est requis.",
          variant: 'destructive',
        });
        throw new Error("L'email de l'utilisateur est requis.");
      }
      // Basic email format validation
      if (!/\S+@\S+\.\S+/.test(finalEmail)) {
         toast({
          title: 'Validation échouée',
          description: "Format d'email invalide.",
          variant: 'destructive',
        });
        throw new Error("Format d'email invalide.");
      }


      try {
        await addDoc(collection(db, 'users'), {
          ...userData,
          name: finalName,
          email: finalEmail,
          initials: userData.initials || getInitials(finalName),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Utilisateur ajouté',
          description: `L'utilisateur "${finalName}" a été ajouté avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout de l'utilisateur: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "L'utilisateur n'a pas pu être ajouté.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateUser = useCallback(
    async (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const finalName = updates.name?.trim();
      const finalEmail = updates.email?.trim();

      if (updates.name !== undefined && !finalName) {
         toast({
          title: 'Validation échouée',
          description: "Le nom de l'utilisateur ne peut pas être vide.",
          variant: 'destructive',
        });
        throw new Error("Le nom de l'utilisateur ne peut pas être vide.");
      }
       if (updates.email !== undefined && !finalEmail) {
         toast({
          title: 'Validation échouée',
          description: "L'email de l'utilisateur ne peut pas être vide.",
          variant: 'destructive',
        });
        throw new Error("L'email de l'utilisateur ne peut pas être vide.");
      }
      if (finalEmail && !/\S+@\S+\.\S+/.test(finalEmail)) {
         toast({
          title: 'Validation échouée',
          description: "Format d'email invalide.",
          variant: 'destructive',
        });
        throw new Error("Format d'email invalide.");
      }

      const userRef = doc(db, 'users', userId);
      const dataToUpdate: Partial<User> = {...updates};
      if (finalName) dataToUpdate.name = finalName;
      if (finalEmail) dataToUpdate.email = finalEmail;
      if (finalName && (!updates.initials || updates.initials.trim() === '')) {
        dataToUpdate.initials = getInitials(finalName);
      }


      try {
        await updateDoc(userRef, {
          ...dataToUpdate,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Utilisateur mis à jour',
          description: `L'utilisateur a été mis à jour avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'utilisateur: ", err);
        toast({
          title: 'Erreur de mise à jour',
          description: "L'utilisateur n'a pas pu être mis à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      const userRef = doc(db, 'users', userId);
      try {
        await deleteDoc(userRef);
        toast({
          title: 'Utilisateur supprimé',
          description: "L'utilisateur a été supprimé avec succès.",
        });
      } catch (err) {
        console.error("Erreur lors de la suppression de l'utilisateur: ", err);
        toast({
          title: 'Erreur de suppression',
          description: "L'utilisateur n'a pas pu être supprimé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    isLoading,
    error,
  };
}
