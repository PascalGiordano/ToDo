
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, UsersIcon as UsersIconLucide, Edit, Trash2, AlertTriangle, UserCircle } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/types/user';
import { UserForm } from '@/components/admin/UserForm';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminUsersPage() {
  const { users, addUser, updateUser, deleteUser, isLoading, error } = useUsers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleOpenNewUserForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteConfirmed = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingUser) {
      await updateUser(editingUser.id, userData);
    } else {
      await addUser(userData);
    }
  };

  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UsersIconLucide className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Gestion des Utilisateurs</CardTitle>
              </div>
              <Button onClick={handleOpenNewUserForm}>
                <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un Utilisateur
              </Button>
            </div>
            <CardDescription>Gérez les utilisateurs de l'application.</CardDescription>
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
                    Impossible de charger les utilisateurs : {error.message}. Veuillez réessayer plus tard.
                  </AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && users.length === 0 && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <UsersIconLucide className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucun utilisateur trouvé</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter un Utilisateur" pour en créer un nouveau.
                </p>
              </div>
            )}
            {!isLoading && !error && users.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead className="w-[25%]">Nom</TableHead>
                    <TableHead className="w-[30%]">Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.initials}`} alt={user.name} data-ai-hint="person face" />
                          <AvatarFallback>{user.initials || <UserCircle className="h-5 w-5"/>}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.mobile || user.phone || '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier l'utilisateur</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteUser(user)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer l'utilisateur</p>
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
              Total d'utilisateurs : {users.length}
            </p>
          </CardFooter>
        </Card>

        <UserForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialUser={editingUser}
        />

        {userToDelete && (
          <AlertDialog open={!!userToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'utilisateur "{userToDelete.name}" sera supprimé définitivement.
                  Les tâches assignées à cet utilisateur perdront cette assignation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Annuler</AlertDialogCancel>
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

    