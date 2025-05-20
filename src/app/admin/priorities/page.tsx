
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ShieldAlert, Edit, Trash2, AlertTriangle, Palette, Feather, ListOrdered, ArrowUp, ArrowDown, Code2, Search } from 'lucide-react';
import { usePriorities } from '@/hooks/usePriorities';
import type { Priority } from '@/types/priority';
import { PriorityForm } from '@/components/admin/PriorityForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminPrioritiesPage() {
  const { priorities, addPriority, updatePriority, deletePriority, updatePriorityOrder, isLoading, error } = usePriorities();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [priorityToDelete, setPriorityToDelete] = useState<Priority | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenNewPriorityForm = () => {
    setEditingPriority(null);
    setIsFormOpen(true);
  };

  const handleEditPriority = (priority: Priority) => {
    setEditingPriority(priority);
    setIsFormOpen(true);
  };

  const confirmDeletePriority = (priority: Priority) => {
    setPriorityToDelete(priority);
  };

  const handleDeleteConfirmed = async () => {
    if (priorityToDelete) {
      await deletePriority(priorityToDelete.id);
      setPriorityToDelete(null);
    }
  };

  const handleFormSubmit = async (priorityData: Omit<Priority, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPriority) {
      await updatePriority(editingPriority.id, priorityData);
    } else {
      const newOrder = priorities.length > 0 ? Math.max(...priorities.map(p => p.order)) + 1 : 0;
      await addPriority({ ...priorityData, order: priorityData.order !== undefined ? priorityData.order : newOrder });
    }
  };

  const handleMovePriority = async (priorityId: string, direction: 'up' | 'down') => {
    const currentPriority = priorities.find(p => p.id === priorityId);
    if (!currentPriority) return;

    const currentOrder = currentPriority.order;
    let targetPriority: Priority | undefined;

    if (direction === 'up') {
      targetPriority = priorities
        .filter(p => p.order < currentOrder)
        .sort((a, b) => b.order - a.order)[0];
    } else {
      targetPriority = priorities
        .filter(p => p.order > currentOrder)
        .sort((a, b) => a.order - b.order)[0];
    }

    if (!targetPriority) return;

    // Create a map of current id to new order based on the swap
    const newOrdersMap = new Map<string, number>();
    newOrdersMap.set(priorityId, targetPriority.order);
    newOrdersMap.set(targetPriority.id, currentOrder);

    // For all other priorities, keep their original order
    priorities.forEach(p => {
      if (p.id !== priorityId && p.id !== targetPriority!.id) {
        newOrdersMap.set(p.id, p.order);
      }
    });
    
    // Convert the map to an array and sort by the new temporary orders
    const tempOrderedPriorities = Array.from(newOrdersMap.entries())
      .map(([id, order]) => ({ id, order, original: priorities.find(p=>p.id === id)! }))
      .sort((a, b) => a.order - b.order);

    // Re-assign sequential order values
    const prioritiesToUpdate = tempOrderedPriorities.map((p, index) => ({
      id: p.id,
      order: index,
    }));

    await updatePriorityOrder(prioritiesToUpdate);
  };
  
  const filteredPriorities = priorities.filter(priority => 
    priority.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (priority.value && priority.value.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.order - b.order);


  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">Gestion des Priorités</CardTitle>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search"
                            placeholder="Rechercher priorité..."
                            className="pl-8 w-full h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenNewPriorityForm} className="h-10">
                        <PlusCircle className="mr-2 h-5 w-5" /> Ajouter une Priorité
                    </Button>
                </div>
            </div>
            <CardDescription>Définissez, modifiez et organisez les niveaux de priorité pour les tâches.</CardDescription>
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
                  <AlertTitle>Erreur de chargement</AlertTitle>
                  <AlertDescription>
                    Impossible de charger les priorités : {error.message}. Veuillez réessayer plus tard.
                  </AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && priorities.length > 0 && filteredPriorities.length === 0 && searchTerm && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucune priorité ne correspond à "{searchTerm}"</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés ou ajoutez une nouvelle priorité.
                </p>
              </div>
            )}
            {!isLoading && !error && priorities.length === 0 && !searchTerm && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucune priorité trouvée</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter une Priorité" pour en créer une nouvelle.
                </p>
              </div>
            )}
            {!isLoading && !error && filteredPriorities.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icône</TableHead>
                    <TableHead className="w-[30%]">Nom</TableHead>
                    <TableHead className="w-[20%]">
                      <div className="flex items-center gap-1">
                        <Code2 className="h-4 w-4" /> Valeur
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Couleur</TableHead>
                    <TableHead className="w-[80px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ListOrdered className="h-4 w-4" /> Ordre
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPriorities.map((priority) => (
                    <TableRow key={priority.id}>
                      <TableCell className="text-center">
                        {priority.iconName ? renderIcon(priority.iconName, { className: "h-5 w-5 mx-auto", color: priority.color || undefined }) : <Feather className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />}
                      </TableCell>
                      <TableCell className="font-medium">{priority.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{priority.value}</TableCell>
                      <TableCell>
                        {priority.color ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: priority.color }} />
                            <span className="text-xs hidden md:inline">{priority.color}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{priority.order}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMovePriority(priority.id, 'up')} disabled={priority.order === 0} aria-label="Monter">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Monter la priorité</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMovePriority(priority.id, 'down')} disabled={priority.order === filteredPriorities.reduce((max, p) => Math.max(max, p.order), 0)} aria-label="Descendre">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descendre la priorité</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditPriority(priority)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier la priorité</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeletePriority(priority)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer la priorité</p>
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
              Total de priorités : {filteredPriorities.length} sur {priorities.length}
            </p>
          </CardFooter>
        </Card>

        <PriorityForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialPriority={editingPriority}
          allPriorities={priorities}
        />

        {priorityToDelete && (
          <AlertDialog open={!!priorityToDelete} onOpenChange={() => setPriorityToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette priorité ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La priorité "{priorityToDelete.name}" sera supprimée définitivement.
                  Cela pourrait affecter les tâches existantes utilisant cette priorité.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPriorityToDelete(null)}>Annuler</AlertDialogCancel>
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

    