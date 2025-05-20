
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types/category';
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

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const categoriesData: Category[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          categoriesData.push({
            id: docSnapshot.id,
            name: data.name,
            description: data.description,
            order: data.order !== undefined ? data.order : 0,
            color: data.color,
            iconName: data.iconName,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Category);
        });
        setCategories(categoriesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des catégories depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les catégories.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addCategory = useCallback(
    async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!categoryData.name || categoryData.name.trim() === '') {
        toast({
          title: 'Validation échouée',
          description: 'Le nom de la catégorie est requis.',
          variant: 'destructive',
        });
        throw new Error('Le nom de la catégorie est requis.');
      }
      try {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          name: categoryData.name.trim(),
          order: categoryData.order !== undefined ? categoryData.order : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Catégorie ajoutée',
          description: `La catégorie "${categoryData.name.trim()}" a été ajoutée avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout de la catégorie: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "La catégorie n'a pas pu être ajoutée.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateCategory = useCallback(
    async (categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (updates.name !== undefined && updates.name.trim() === '') {
         toast({
          title: 'Validation échouée',
          description: 'Le nom de la catégorie ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('Le nom de la catégorie ne peut pas être vide.');
      }
      const categoryRef = doc(db, 'categories', categoryId);
      try {
        await updateDoc(categoryRef, {
          ...updates,
          ...(updates.name && { name: updates.name.trim() }),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Catégorie mise à jour',
          description: `La catégorie a été mise à jour avec succès.`,
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la catégorie: ', err);
        toast({
          title: 'Erreur de mise à jour',
          description: "La catégorie n'a pas pu être mise à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      const categoryRef = doc(db, 'categories', categoryId);
      try {
        await deleteDoc(categoryRef);
        toast({
          title: 'Catégorie supprimée',
          description: 'La catégorie a été supprimée avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la suppression de la catégorie: ', err);
        toast({
          title: 'Erreur de suppression',
          description: "La catégorie n'a pas pu être supprimée.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );
  
  const updateCategoryOrder = useCallback(
    async (orderedItems: Array<{ id: string; order: number }>) => {
      const batch = writeBatch(db);
      orderedItems.forEach(item => {
        const categoryRef = doc(db, 'categories', item.id);
        batch.update(categoryRef, { order: item.order, updatedAt: serverTimestamp() });
      });
      try {
        await batch.commit();
        toast({
          title: 'Ordre des catégories mis à jour',
          description: "L'ordre des catégories a été sauvegardé.",
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'ordre des catégories: ", err);
        toast({
          title: "Erreur de sauvegarde",
          description: "L'ordre des catégories n'a pas pu être sauvegardé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
    isLoading,
    error,
  };
}
