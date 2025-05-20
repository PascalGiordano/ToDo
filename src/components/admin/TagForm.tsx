
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Tag } from '@/types/tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Palette, Feather, ImagePlus } from 'lucide-react';
import { renderIcon } from '@/lib/utils';
import { IconPicker } from '@/components/admin/IconPicker';

interface TagFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialTag?: Tag | null;
  allTags?: Tag[];
}

const defaultTagValues: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  color: '#808080',
  iconName: '',
};

export function TagForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialTag,
  allTags = [],
}: TagFormProps) {
  const [formData, setFormData] = useState(defaultTagValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTag) {
        setFormData({
          name: initialTag.name,
          color: initialTag.color || '#808080',
          iconName: initialTag.iconName || '',
        });
      } else {
        setFormData(defaultTagValues);
      }
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [initialTag, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIconSelected = (iconName: string) => {
    setFormData(prev => ({ ...prev, iconName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation échouée',
        description: 'Le nom du tag est requis.',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = allTags.some(
      (tag) =>
        tag.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!initialTag || tag.id !== initialTag.id)
    );

    if (isDuplicate) {
      toast({
        title: 'Nom de tag dupliqué',
        description: `Un tag nommé "${formData.name.trim()}" existe déjà. Veuillez choisir un nom différent.`,
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
            <DialogTitle>{initialTag ? 'Modifier le tag' : 'Ajouter un nouveau tag'}</DialogTitle>
            <DialogDescription>
              {initialTag ? 'Modifiez les détails du tag.' : 'Remplissez les informations pour le nouveau tag.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required ref={nameInputRef} />
            </div>
            <div>
              <Label htmlFor="color" className="flex items-center"><Palette className="mr-1 h-4 w-4 text-muted-foreground"/>Couleur</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id="color" name="color" type="color" value={formData.color} onChange={handleChange} className="w-10 h-10 p-1 cursor-pointer" />
                <Input type="text" value={formData.color} onChange={handleChange} name="color" placeholder="#RRGGBB" className="flex-1 h-10"/>
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
                {initialTag ? 'Sauvegarder' : 'Créer'}
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
