
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Activity, Edit, Trash2, AlertTriangle, Palette, Feather, ListOrdered, CheckSquare, ArrowUp, ArrowDown, Code2, Search } from 'lucide-react';
import { useStatuses } from '@/hooks/useStatuses';
import type { Status } from '@/types/status';
import { StatusForm } from '@/components/admin/StatusForm';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminStatusesPage() {
  const { statuses, addStatus, updateStatus, deleteStatus, updateStatusOrder, isLoading, error } = useStatuses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenNewStatusForm = () => {
    setEditingStatus(null);
    setIsFormOpen(true);
  };

  const handleEditStatus = (status: Status) => {
    setEditingStatus(status);
    setIsFormOpen(true);
  };

  const confirmDeleteStatus = (status: Status) => {
    setStatusToDelete(status);
  };

  const handleDeleteConfirmed = async () => {
    if (statusToDelete) {
      await deleteStatus(statusToDelete.id);
      setStatusToDelete(null);
    }
  };

  const handleFormSubmit = async (statusData: Omit<Status, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingStatus) {
      await updateStatus(editingStatus.id, statusData);
    } else {
      const newOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.order)) + 1 : 0;
      await addStatus({ ...statusData, order: statusData.order !== undefined ? statusData.order : newOrder });
    }
  };

  const handleMoveStatus = async (statusId: string, direction: 'up' | 'down') => {
    const currentStatus = statuses.find(s => s.id === statusId);
    if (!currentStatus) return;

    const currentOrder = currentStatus.order;
    let targetStatus: Status | undefined;

    if (direction === 'up') {
      targetStatus = statuses
        .filter(s => s.order < currentOrder)
        .sort((a, b) => b.order - a.order)[0];
    } else {
      targetStatus = statuses
        .filter(s => s.order > currentOrder)
        .sort((a, b) => a.order - b.order)[0];
    }

    if (!targetStatus) return;
    
    const newOrdersMap = new Map<string, number>();
    newOrdersMap.set(statusId, targetStatus.order);
    newOrdersMap.set(targetStatus.id, currentOrder);

    statuses.forEach(s => {
      if (s.id !== statusId && s.id !== targetStatus!.id) {
        newOrdersMap.set(s.id, s.order);
      }
    });
    
    const tempOrderedStatuses = Array.from(newOrdersMap.entries())
      .map(([id, order]) => ({ id, order, original: statuses.find(s=>s.id === id)! }))
      .sort((a, b) => a.order - b.order);

    const statusesToUpdate = tempOrderedStatuses.map((s, index) => ({
      id: s.id,
      order: index,
    }));

    await updateStatusOrder(statusesToUpdate);
  };
  
  const filteredStatuses = statuses.filter(status => 
    status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (status.value && status.value.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.order - b.order);

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">Gestion des Statuts</CardTitle>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search"
                            placeholder="Rechercher statut..."
                            className="pl-8 w-full h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenNewStatusForm} className="h-10">
                        <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un Statut
                    </Button>
                </div>
            </div>
            <CardDescription>Définissez, modifiez et organisez les différents statuts de progression des tâches.</CardDescription>
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
                    Impossible de charger les statuts : {error.message}. Veuillez réessayer plus tard.
                  </AlertDescription>
              </Alert>
            )}
             {!isLoading && !error && statuses.length > 0 && filteredStatuses.length === 0 && searchTerm && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucun statut ne correspond à "{searchTerm}"</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés ou ajoutez un nouveau statut.
                </p>
              </div>
            )}
            {!isLoading && !error && statuses.length === 0 && !searchTerm && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucun statut trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter un Statut" pour en créer un nouveau.
                </p>
              </div>
            )}
            {!isLoading && !error && filteredStatuses.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icône</TableHead>
                    <TableHead className="w-[25%]">Nom</TableHead>
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
                    <TableHead className="w-[100px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckSquare className="h-4 w-4" /> Terminé?
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="text-center">
                        {status.iconName ? renderIcon(status.iconName, { className: "h-5 w-5 mx-auto", color: status.color || undefined }) : <Feather className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />}
                      </TableCell>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{status.value}</TableCell>
                      <TableCell>
                        {status.color ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: status.color }} />
                            <span className="text-xs hidden md:inline">{status.color}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{status.order}</TableCell>
                      <TableCell className="text-center">
                        {status.isCompletionStatus ? 
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-primary-foreground">Oui</Badge> : 
                          <Badge variant="secondary">Non</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveStatus(status.id, 'up')} disabled={status.order === 0} aria-label="Monter">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Monter le statut</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveStatus(status.id, 'down')} disabled={status.order === filteredStatuses.reduce((max, s) => Math.max(max, s.order), 0)} aria-label="Descendre">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descendre le statut</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditStatus(status)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier le statut</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteStatus(status)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer le statut</p>
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
              Total de statuts : {filteredStatuses.length} sur {statuses.length}
            </p>
          </CardFooter>
        </Card>

        <StatusForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialStatus={editingStatus}
          allStatuses={statuses}
        />

        {statusToDelete && (
          <AlertDialog open={!!statusToDelete} onOpenChange={() => setStatusToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce statut ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le statut "{statusToDelete.name}" sera supprimé définitivement.
                  Cela pourrait affecter les tâches existantes utilisant ce statut.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStatusToDelete(null)}>Annuler</AlertDialogCancel>
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

    