
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tag } from '@/types/tag';
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

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'tags'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tagsData: Tag[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          tagsData.push({
            id: docSnapshot.id,
            name: data.name,
            color: data.color,
            iconName: data.iconName,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Tag);
        });
        setTags(tagsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des tags depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les tags.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addTag = useCallback(
    async (tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!tagData.name || tagData.name.trim() === '') {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du tag est requis.',
          variant: 'destructive',
        });
        throw new Error('Le nom du tag est requis.');
      }
      try {
        await addDoc(collection(db, 'tags'), {
          ...tagData,
          name: tagData.name.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Tag ajouté',
          description: `Le tag "${tagData.name.trim()}" a été ajouté avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout du tag: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "Le tag n'a pas pu être ajouté.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateTag = useCallback(
    async (tagId: string, updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (updates.name !== undefined && updates.name.trim() === '') {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du tag ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('Le nom du tag ne peut pas être vide.');
      }
      const tagRef = doc(db, 'tags', tagId);
      try {
        await updateDoc(tagRef, {
          ...updates,
          ...(updates.name && { name: updates.name.trim() }),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Tag mis à jour',
          description: `Le tag a été mis à jour avec succès.`,
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour du tag: ', err);
        toast({
          title: 'Erreur de mise à jour',
          description: "Le tag n'a pas pu être mis à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteTag = useCallback(
    async (tagId: string) => {
      const tagRef = doc(db, 'tags', tagId);
      try {
        await deleteDoc(tagRef);
        toast({
          title: 'Tag supprimé',
          description: 'Le tag a été supprimé avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la suppression du tag: ', err);
        toast({
          title: 'Erreur de suppression',
          description: "Le tag n'a pas pu être supprimé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    tags,
    addTag,
    updateTag,
    deleteTag,
    isLoading,
    error,
  };
}
