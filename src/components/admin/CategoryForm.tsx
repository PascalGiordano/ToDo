
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Category } from '@/types/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Feather, ListOrdered, ImagePlus } from 'lucide-react';
import { renderIcon } from '@/lib/utils';
import { IconPicker } from '@/components/admin/IconPicker';

interface CategoryFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialCategory?: Category | null;
  allCategories?: Category[];
}

const defaultCategoryValues: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  order: 0,
  color: '#808080', // Default to a neutral grey
  iconName: '',
};

export function CategoryForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialCategory,
  allCategories = [],
}: CategoryFormProps) {
  const [formData, setFormData] = useState(defaultCategoryValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setFormData({
          name: initialCategory.name,
          description: initialCategory.description || '',
          order: initialCategory.order || 0,
          color: initialCategory.color || '#808080',
          iconName: initialCategory.iconName || '',
        });
      } else {
        setFormData(defaultCategoryValues);
      }
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [initialCategory, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleIconSelected = (iconName: string) => {
    setFormData(prev => ({ ...prev, iconName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation échouée',
        description: 'Le nom de la catégorie est requis.',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = allCategories.some(
      (cat) =>
        cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!initialCategory || cat.id !== initialCategory.id)
    );

    if (isDuplicate) {
      toast({
        title: 'Nom de catégorie dupliqué',
        description: `Une catégorie nommée "${formData.name.trim()}" existe déjà. Veuillez choisir un nom différent.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isSubmitting) onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{initialCategory ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}</DialogTitle>
            <DialogDescription>
              {initialCategory ? 'Modifiez les détails de la catégorie.' : 'Remplissez les informations pour la nouvelle catégorie.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required ref={nameInputRef} />
            </div>
            <div>
              <Label htmlFor="description">Description (Optionnel)</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order" className="flex items-center"><ListOrdered className="mr-1 h-4 w-4 text-muted-foreground"/>Ordre</Label>
                <Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="color" className="flex items-center"><Palette className="mr-1 h-4 w-4 text-muted-foreground"/>Couleur</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input id="color" name="color" type="color" value={formData.color} onChange={handleChange} className="w-10 h-10 p-1 cursor-pointer" />
                  <Input type="text" value={formData.color} onChange={handleChange} name="color" placeholder="#RRGGBB" className="flex-1 h-10"/>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="iconNameButton" className="flex items-center mb-1"><Feather className="mr-1 h-4 w-4 text-muted-foreground"/>Icône</Label>
              <Button
                id="iconNameButton"
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
                onClick={() => setIsIconPickerOpen(true)}
              >
                {formData.iconName ? (
                  <span className="flex items-center gap-2">
                    {renderIcon(formData.iconName, { className: "h-5 w-5", color: formData.color })}
                    {formData.iconName}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ImagePlus className="h-5 w-5"/> Choisir une icône...
                  </span>
                )}
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialCategory ? 'Sauvegarder' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <IconPicker
        isOpen={isIconPickerOpen}
        onOpenChange={setIsIconPickerOpen}
        onIconSelect={handleIconSelected}
        currentIcon={formData.iconName}
      />
    </>
  );
}
