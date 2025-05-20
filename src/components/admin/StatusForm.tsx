
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Status } from '@/types/status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, Palette, Feather, ListOrdered, CheckSquare, ImagePlus } from 'lucide-react';
import { renderIcon } from '@/lib/utils';
import { IconPicker } from '@/components/admin/IconPicker';

interface StatusFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (statusData: Omit<Status, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialStatus?: Status | null;
  allStatuses?: Status[];
}

const defaultStatusValues: Omit<Status, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  value: '',
  order: 0,
  color: '#808080',
  iconName: '',
  isCompletionStatus: false,
};

export function StatusForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialStatus,
  allStatuses = [],
}: StatusFormProps) {
  const [formData, setFormData] = useState(defaultStatusValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valueManuallyEdited, setValueManuallyEdited] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStatus) {
        setFormData({
          name: initialStatus.name,
          value: initialStatus.value || initialStatus.name.toLowerCase().replace(/\s+/g, '-').trim(),
          order: initialStatus.order || 0,
          color: initialStatus.color || '#808080',
          iconName: initialStatus.iconName || '',
          isCompletionStatus: initialStatus.isCompletionStatus || false,
        });
        setValueManuallyEdited(!!initialStatus.value);
      } else {
        setFormData(defaultStatusValues);
        setValueManuallyEdited(false);
      }
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [initialStatus, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === 'name') {
      const newName = value;
      let newValueSlug = formData.value;
      if (!valueManuallyEdited || !formData.value.trim()) {
        newValueSlug = newName.toLowerCase().replace(/\s+/g, '-').trim();
      }
      setFormData((prev) => ({
        ...prev,
        name: newName,
        value: newValueSlug,
      }));
    } else if (name === 'value') {
      setValueManuallyEdited(true);
      setFormData((prev) => ({
        ...prev,
        value: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value),
      }));
    }
  };

  const handleIconSelected = (iconName: string) => {
    setFormData(prev => ({ ...prev, iconName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = formData.name.trim();
    let finalValue = formData.value.trim();

    if (!finalName) {
      toast({
        title: 'Validation échouée',
        description: 'Le nom du statut est requis.',
        variant: 'destructive',
      });
      return;
    }
    if (!finalValue) {
      finalValue = finalName.toLowerCase().replace(/\s+/g, '-').trim();
      if (!finalValue) {
         toast({
            title: 'Validation échouée',
            description: 'La valeur technique du statut est requise (ou sera auto-générée à partir du nom).',
            variant: 'destructive',
        });
        return;
      }
    }

    const isDuplicateName = allStatuses.some(
      (s) =>
        s.name.toLowerCase() === finalName.toLowerCase() &&
        (!initialStatus || s.id !== initialStatus.id)
    );
    const isDuplicateValue = allStatuses.some(
      (s) =>
        s.value.toLowerCase() === finalValue.toLowerCase() &&
        (!initialStatus || s.id !== initialStatus.id)
    );

    if (isDuplicateName) {
      toast({
        title: 'Nom de statut dupliqué',
        description: `Un statut nommé "${finalName}" existe déjà. Veuillez choisir un nom différent.`,
        variant: 'destructive',
      });
      return;
    }
    if (isDuplicateValue) {
      toast({
        title: 'Valeur de statut dupliquée',
        description: `Un statut avec la valeur technique "${finalValue}" existe déjà. Veuillez choisir une valeur différente.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, name: finalName, value: finalValue });
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
            <DialogTitle>{initialStatus ? 'Modifier le statut' : 'Ajouter un nouveau statut'}</DialogTitle>
            <DialogDescription>
              {initialStatus ? 'Modifiez les détails du statut.' : 'Remplissez les informations pour le nouveau statut.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nom (Affichage)</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required ref={nameInputRef} />
            </div>
            <div>
              <Label htmlFor="value">Valeur (Technique, ex: 'a-faire', 'en-cours')</Label>
              <Input id="value" name="value" value={formData.value} onChange={handleChange} className="mt-1" placeholder="auto-généré si vide"/>
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
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox id="isCompletionStatus" name="isCompletionStatus" checked={formData.isCompletionStatus} onCheckedChange={(checked) => setFormData(prev => ({...prev, isCompletionStatus: Boolean(checked)}))} />
              <Label htmlFor="isCompletionStatus" className="flex items-center font-normal cursor-pointer">
                <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                Ce statut marque une tâche comme "terminée"
              </Label>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialStatus ? 'Sauvegarder' : 'Créer'}
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
