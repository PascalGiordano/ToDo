
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Tag as TagIconLucide, Edit, Trash2, AlertTriangle, Palette, Feather } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/types/tag';
import { TagForm } from '@/components/admin/TagForm';
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

export default function AdminTagsPage() {
  const { tags, addTag, updateTag, deleteTag, isLoading, error } = useTags();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const handleOpenNewTagForm = () => {
    setEditingTag(null);
    setIsFormOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  };

  const confirmDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const handleDeleteConfirmed = async () => {
    if (tagToDelete) {
      await deleteTag(tagToDelete.id);
      setTagToDelete(null);
    }
  };

  const handleFormSubmit = async (tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTag) {
      await updateTag(editingTag.id, tagData);
    } else {
      await addTag(tagData);
    }
  };

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TagIconLucide className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Gestion des Tags</CardTitle>
              </div>
              <Button onClick={handleOpenNewTagForm}>
                <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un Tag
              </Button>
            </div>
            <CardDescription>Créez, modifiez et supprimez les tags disponibles pour les tâches.</CardDescription>
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
                    Impossible de charger les tags : {error.message}. Veuillez réessayer plus tard.
                  </ShadAlertDescription>
              </Alert>
            )}
            {!isLoading && !error && tags.length === 0 && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <TagIconLucide className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucun tag trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter un Tag" pour en créer un nouveau.
                </p>
              </div>
            )}
            {!isLoading && !error && tags.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icône</TableHead>
                    <TableHead className="w-[40%]">Nom</TableHead>
                    <TableHead className="w-[100px]">Couleur</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="text-center">
                        {tag.iconName ? renderIcon(tag.iconName, { className: "h-5 w-5 mx-auto", color: tag.color || undefined }) : <Feather className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />}
                      </TableCell>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell>
                        {tag.color ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: tag.color }} />
                            <span className="text-xs hidden md:inline">{tag.color}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditTag(tag)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier le tag</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteTag(tag)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer le tag</p>
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
              Total de tags : {tags.length}
            </p>
          </CardFooter>
        </Card>

        <TagForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialTag={editingTag}
          allTags={tags}
        />

        {tagToDelete && (
          <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce tag ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le tag "{tagToDelete.name}" sera supprimé définitivement.
                  Ce tag sera retiré de toutes les tâches auxquelles il est actuellement associé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTagToDelete(null)}>Annuler</AlertDialogCancel>
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
