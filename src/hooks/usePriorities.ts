
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Priority } from '@/types/priority';
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
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function usePriorities() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'priorities'), orderBy('order', 'asc'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const prioritiesData: Priority[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          prioritiesData.push({
            id: docSnapshot.id,
            name: data.name,
            value: data.value || data.name.toLowerCase().replace(/\s+/g, '-'),
            order: data.order !== undefined ? data.order : 0, 
            color: data.color,
            iconName: data.iconName,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Priority);
        });
        setPriorities(prioritiesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des priorités depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les priorités.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addPriority = useCallback(
    async (priorityData: Omit<Priority, 'id' | 'createdAt' | 'updatedAt'>) => {
      const finalName = priorityData.name.trim();
      const finalValue = (priorityData.value || finalName.toLowerCase().replace(/\s+/g, '-')).trim();

      if (!finalName) {
        toast({
          title: 'Validation échouée',
          description: 'Le nom de la priorité est requis.',
          variant: 'destructive',
        });
        throw new Error('Le nom de la priorité est requis.');
      }
      if (!finalValue) {
        toast({
          title: 'Validation échouée',
          description: 'La valeur technique de la priorité est requise (ou sera auto-générée).',
          variant: 'destructive',
        });
        throw new Error('La valeur technique de la priorité est requise.');
      }

      try {
        await addDoc(collection(db, 'priorities'), {
          ...priorityData,
          name: finalName,
          value: finalValue,
          order: priorityData.order !== undefined ? priorityData.order : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Priorité ajoutée',
          description: `La priorité "${finalName}" a été ajoutée avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout de la priorité: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "La priorité n'a pas pu être ajoutée.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updatePriority = useCallback(
    async (priorityId: string, updates: Partial<Omit<Priority, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const finalName = updates.name?.trim();
      const finalValue = updates.value?.trim() || (finalName ? finalName.toLowerCase().replace(/\s+/g, '-') : undefined);

      if (updates.name !== undefined && !finalName) {
        toast({
          title: 'Validation échouée',
          description: 'Le nom de la priorité ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('Le nom de la priorité ne peut pas être vide.');
      }
       if (updates.value !== undefined && !finalValue && !finalName) { // Only error if value becomes empty AND name isn't there to regenerate it
        toast({
          title: 'Validation échouée',
          description: 'La valeur technique de la priorité ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('La valeur technique de la priorité ne peut pas être vide.');
      }

      const priorityRef = doc(db, 'priorities', priorityId);
      const dataToUpdate: Partial<Priority> = {...updates};
      if (finalName) dataToUpdate.name = finalName;
      if (finalValue) dataToUpdate.value = finalValue;


      try {
        await updateDoc(priorityRef, {
          ...dataToUpdate,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Priorité mise à jour',
          description: `La priorité a été mise à jour avec succès.`,
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la priorité: ', err);
        toast({
          title: 'Erreur de mise à jour',
          description: "La priorité n'a pas pu être mise à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deletePriority = useCallback(
    async (priorityId: string) => {
      const priorityRef = doc(db, 'priorities', priorityId);
      try {
        await deleteDoc(priorityRef);
        toast({
          title: 'Priorité supprimée',
          description: 'La priorité a été supprimée avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la suppression de la priorité: ', err);
        toast({
          title: 'Erreur de suppression',
          description: "La priorité n'a pas pu être supprimée.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updatePriorityOrder = useCallback(
    async (orderedItems: Array<{ id: string; order: number }>) => {
      const batch = writeBatch(db);
      orderedItems.forEach(item => {
        const priorityRef = doc(db, 'priorities', item.id);
        batch.update(priorityRef, { order: item.order, updatedAt: serverTimestamp() });
      });
      try {
        await batch.commit();
        toast({
          title: 'Ordre des priorités mis à jour',
          description: "L'ordre des priorités a été sauvegardé.",
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'ordre des priorités: ", err);
        toast({
          title: "Erreur de sauvegarde",
          description: "L'ordre des priorités n'a pas pu être sauvegardé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );


  return {
    priorities,
    addPriority,
    updatePriority,
    deletePriority,
    updatePriorityOrder,
    isLoading,
    error,
  };
}
