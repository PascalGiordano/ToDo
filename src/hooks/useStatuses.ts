
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Status } from '@/types/status';
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

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'statuses'), orderBy('order', 'asc'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const statusesData: Status[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          statusesData.push({
            id: docSnapshot.id,
            name: data.name,
            value: data.value || data.name.toLowerCase().replace(/\s+/g, '-'),
            order: data.order !== undefined ? data.order : 0, 
            color: data.color,
            iconName: data.iconName,
            isCompletionStatus: data.isCompletionStatus || false,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Status);
        });
        setStatuses(statusesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des statuts depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les statuts.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addStatus = useCallback(
    async (statusData: Omit<Status, 'id' | 'createdAt' | 'updatedAt'>) => {
      const finalName = statusData.name.trim();
      const finalValue = (statusData.value || finalName.toLowerCase().replace(/\s+/g, '-')).trim();

      if (!finalName) {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du statut est requis.',
          variant: 'destructive',
        });
        throw new Error('Le nom du statut est requis.');
      }
       if (!finalValue) {
        toast({
          title: 'Validation échouée',
          description: 'La valeur technique du statut est requise (ou sera auto-générée).',
          variant: 'destructive',
        });
        throw new Error('La valeur technique du statut est requise.');
      }

      try {
        await addDoc(collection(db, 'statuses'), {
          ...statusData,
          name: finalName,
          value: finalValue,
          order: statusData.order !== undefined ? statusData.order : 0,
          isCompletionStatus: statusData.isCompletionStatus || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Statut ajouté',
          description: `Le statut "${finalName}" a été ajouté avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout du statut: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "Le statut n'a pas pu être ajouté.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateStatus = useCallback(
    async (statusId: string, updates: Partial<Omit<Status, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const finalName = updates.name?.trim();
      const finalValue = updates.value?.trim() || (finalName ? finalName.toLowerCase().replace(/\s+/g, '-') : undefined);

      if (updates.name !== undefined && !finalName) {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du statut ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('Le nom du statut ne peut pas être vide.');
      }
      if (updates.value !== undefined && !finalValue && !finalName) { 
        toast({
          title: 'Validation échouée',
          description: 'La valeur technique du statut ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('La valeur technique du statut ne peut pas être vide.');
      }
      
      const statusRef = doc(db, 'statuses', statusId);
      const dataToUpdate: Partial<Status> = {...updates};
      if (finalName) dataToUpdate.name = finalName;
      if (finalValue) dataToUpdate.value = finalValue;

      try {
        await updateDoc(statusRef, {
          ...dataToUpdate,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Statut mis à jour',
          description: `Le statut a été mis à jour avec succès.`,
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour du statut: ', err);
        toast({
          title: 'Erreur de mise à jour',
          description: "Le statut n'a pas pu être mis à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteStatus = useCallback(
    async (statusId: string) => {
      const statusRef = doc(db, 'statuses', statusId);
      try {
        await deleteDoc(statusRef);
        toast({
          title: 'Statut supprimé',
          description: 'Le statut a été supprimé avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la suppression du statut: ', err);
        toast({
          title: 'Erreur de suppression',
          description: "Le statut n'a pas pu être supprimé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateStatusOrder = useCallback(
    async (orderedItems: Array<{ id: string; order: number }>) => {
      const batch = writeBatch(db);
      orderedItems.forEach(item => {
        const statusRef = doc(db, 'statuses', item.id);
        batch.update(statusRef, { order: item.order, updatedAt: serverTimestamp() });
      });
      try {
        await batch.commit();
        toast({
          title: 'Ordre des statuts mis à jour',
          description: "L'ordre des statuts a été sauvegardé.",
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'ordre des statuts: ", err);
        toast({
          title: "Erreur de sauvegarde",
          description: "L'ordre des statuts n'a pas pu être sauvegardé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    statuses,
    addStatus,
    updateStatus,
    deleteStatus,
    updateStatusOrder,
    isLoading,
    error,
  };
}
