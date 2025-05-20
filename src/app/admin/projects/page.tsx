
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Briefcase, Edit, Trash2, AlertTriangle, Palette, Feather } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/project';
import { ProjectForm } from '@/components/admin/ProjectForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { renderIcon } from '@/lib/utils';
import { Alert, AlertDescription as ShadAlertDescription, AlertTitle as ShadAlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminProjectsPage() {
  const { projects, addProject, updateProject, deleteProject, isLoading, error } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleOpenNewProjectForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const confirmDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleDeleteConfirmed = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleFormSubmit = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
  };

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Gestion des Projets</CardTitle>
              </div>
              <Button onClick={handleOpenNewProjectForm}>
                <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un Projet
              </Button>
            </div>
            <CardDescription>Créez, modifiez et supprimez des projets pour regrouper vos tâches.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
            {!isLoading && error && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <ShadAlertTitle>Erreur de chargement</ShadAlertTitle>
                  <ShadAlertDescription>
                    Impossible de charger les projets : {error.message}. Veuillez réessayer plus tard.
                  </ShadAlertDescription>
              </Alert>
            )}
            {!isLoading && !error && projects.length === 0 && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucun projet trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter un Projet" pour en créer un nouveau.
                </p>
              </div>
            )}
            {!isLoading && !error && projects.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icône</TableHead>
                    <TableHead className="w-[25%]">Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Couleur</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="text-center">
                        {project.iconName ? renderIcon(project.iconName, { className: "h-5 w-5 mx-auto", color: project.color || undefined }) : <Feather className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />}
                      </TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{project.description || '-'}</TableCell>
                      <TableCell>
                        {project.color ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: project.color }} />
                            <span className="text-xs hidden md:inline">{project.color}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier le projet</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteProject(project)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer le projet</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Total de projets : {projects.length}
            </p>
          </CardFooter>
        </Card>

        <ProjectForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialProject={editingProject}
          allProjects={projects}
        />

        {projectToDelete && (
          <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce projet ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le projet "{projectToDelete.name}" sera supprimé définitivement.
                  Les tâches associées à ce projet perdront leur assignation de projet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirmed}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
    </TooltipProvider>
  );
}
