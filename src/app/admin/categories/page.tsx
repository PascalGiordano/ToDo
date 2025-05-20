
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListChecks, Edit, Trash2, AlertTriangle, Palette, Feather, ArrowUp, ArrowDown, ListOrdered, Search } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import { CategoryForm } from '@/components/admin/CategoryForm';
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

export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, updateCategoryOrder, isLoading, error } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenNewCategoryForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirmed = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  const handleFormSubmit = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
    } else {
      const newOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0;
      await addCategory({ ...categoryData, order: categoryData.order !== undefined ? categoryData.order : newOrder });
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredCategories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    // Important: We need to operate on the original 'categories' array for reordering
    // logic if filteredCategories is a subset or reordered differently than 'order'.
    // For simplicity, this example assumes filteredCategories maintains relative order
    // or that reordering applies to the full set before re-filtering.
    // A more robust solution would re-fetch or re-apply filters after reordering.
    
    const currentCategoryOrder = categories.find(c=> c.id === categoryId)?.order;
    if(currentCategoryOrder === undefined) return;

    let targetCategory: Category | undefined;

    if (direction === 'up') {
      targetCategory = categories
        .filter(c => c.order < currentCategoryOrder)
        .sort((a,b) => b.order - a.order)[0];
    } else {
      targetCategory = categories
        .filter(c => c.order > currentCategoryOrder)
        .sort((a,b) => a.order - b.order)[0];
    }

    if (!targetCategory) return;

    const newOrders = categories.map(c => {
      if (c.id === categoryId) return { ...c, order: targetCategory!.order };
      if (c.id === targetCategory.id) return { ...c, order: currentCategoryOrder };
      return c;
    }).sort((a,b) => a.order - b.order) // Sort by new temp orders
      .map((c, index) => ({ id: c.id, order: index })); // Re-assign sequential order

    await updateCategoryOrder(newOrders);
  };
  
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => a.order - b.order);


  return (
    <TooltipProvider>
      <>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Gestion des Catégories</CardTitle>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Rechercher catégorie..."
                        className="pl-8 w-full h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleOpenNewCategoryForm} className="h-10">
                  <PlusCircle className="mr-2 h-5 w-5" /> Ajouter une Catégorie
                </Button>
              </div>
            </div>
            <CardDescription>Créez, modifiez, supprimez et organisez les catégories de tâches.</CardDescription>
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
                  Impossible de charger les catégories : {error.message}. Veuillez réessayer plus tard.
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && categories.length > 0 && filteredCategories.length === 0 && searchTerm && (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucune catégorie ne correspond à "{searchTerm}"</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés ou ajoutez une nouvelle catégorie.
                </p>
              </div>
            )}
            {!isLoading && !error && categories.length === 0 && !searchTerm &&(
              <div className="border border-dashed rounded-lg p-8 text-center">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-70" />
                <h3 className="text-xl font-semibold text-foreground">Aucune catégorie trouvée</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Ajouter une Catégorie" pour en créer une nouvelle.
                </p>
              </div>
            )}
            {!isLoading && !error && filteredCategories.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icône</TableHead>
                    <TableHead className="w-[25%]">Nom</TableHead>
                    <TableHead>Description</TableHead>
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
                  {filteredCategories.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-center">
                        {category.iconName ? renderIcon(category.iconName, { className: "h-5 w-5 mx-auto", color: category.color || undefined }) : <Feather className="h-5 w-5 mx-auto text-muted-foreground opacity-50" />}
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <span>{category.description || '-'}</span>
                            </TooltipTrigger>
                            {category.description && category.description.length > 50 && ( // Condition to show tooltip only if text is long
                                <TooltipContent side="top" align="start" className="max-w-xs break-words">
                                    <p>{category.description}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: category.color }} />
                            <span className="text-xs hidden md:inline">{category.color}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{category.order}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveCategory(category.id, 'up')} disabled={category.order === 0} aria-label="Monter">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Monter la catégorie</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveCategory(category.id, 'down')} disabled={category.order === filteredCategories.reduce((max, c) => Math.max(max, c.order), 0)} aria-label="Descendre">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descendre la catégorie</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)} aria-label="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier la catégorie</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => confirmDeleteCategory(category)} aria-label="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer la catégorie</p>
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
              Total de catégories : {filteredCategories.length} sur {categories.length}
            </p>
          </CardFooter>
        </Card>

        <CategoryForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialCategory={editingCategory}
          allCategories={categories}
        />

        {categoryToDelete && (
          <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette catégorie ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La catégorie "{categoryToDelete.name}" sera supprimée définitivement.
                  Les tâches associées à cette catégorie ne seront pas supprimées mais pourraient perdre leur assignation de catégorie.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Annuler</AlertDialogCancel>
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
