
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '@/types/project';
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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'projects'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          projectsData.push({
            id: docSnapshot.id,
            name: data.name,
            description: data.description,
            color: data.color,
            iconName: data.iconName,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Project);
        });
        setProjects(projectsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur de chargement des projets depuis Firestore: ', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les projets.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addProject = useCallback(
    async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!projectData.name || projectData.name.trim() === '') {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du projet est requis.',
          variant: 'destructive',
        });
        throw new Error('Le nom du projet est requis.');
      }
      try {
        await addDoc(collection(db, 'projects'), {
          ...projectData,
          name: projectData.name.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Projet ajouté',
          description: `Le projet "${projectData.name.trim()}" a été ajouté avec succès.`,
        });
      } catch (err) {
        console.error("Erreur lors de l'ajout du projet: ", err);
        toast({
          title: "Erreur d'ajout",
          description: "Le projet n'a pas pu être ajouté.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (updates.name !== undefined && updates.name.trim() === '') {
        toast({
          title: 'Validation échouée',
          description: 'Le nom du projet ne peut pas être vide.',
          variant: 'destructive',
        });
        throw new Error('Le nom du projet ne peut pas être vide.');
      }
      const projectRef = doc(db, 'projects', projectId);
      try {
        await updateDoc(projectRef, {
          ...updates,
          ...(updates.name && { name: updates.name.trim() }),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Projet mis à jour',
          description: `Le projet a été mis à jour avec succès.`,
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour du projet: ', err);
        toast({
          title: 'Erreur de mise à jour',
          description: "Le projet n'a pas pu être mis à jour.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const projectRef = doc(db, 'projects', projectId);
      try {
        await deleteDoc(projectRef);
        toast({
          title: 'Projet supprimé',
          description: 'Le projet a été supprimé avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la suppression du projet: ', err);
        toast({
          title: 'Erreur de suppression',
          description: "Le projet n'a pas pu être supprimé.",
          variant: 'destructive',
        });
        throw err;
      }
    },
    [toast]
  );

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    isLoading,
    error,
  };
}
