
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@/types/user';
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
import { Loader2, Image as ImageIcon, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialUser?: User | null;
}

const defaultUserValues: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  phone: '',
  mobile: '',
  avatarUrl: '',
  initials: '',
};

export function UserForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialUser,
}: UserFormProps) {
  const [formData, setFormData] = useState(defaultUserValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const avatarUrlInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isOpen) {
      if (initialUser) {
        const initials = initialUser.initials || getInitials(initialUser.name);
        setFormData({
          name: initialUser.name,
          email: initialUser.email,
          phone: initialUser.phone || '',
          mobile: initialUser.mobile || '',
          avatarUrl: initialUser.avatarUrl || '',
          initials: initials,
        });
         setTimeout(() => nameInputRef.current?.focus(), 0);
      } else {
        setFormData(defaultUserValues);
        setTimeout(() => avatarUrlInputRef.current?.focus(), 0);
      }
    }
  }, [initialUser, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === "name") {
        setFormData(prev => ({ ...prev, name: value, initials: getInitials(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Validation échouée',
        description: 'Le nom et l\'email de l\'utilisateur sont requis.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({...formData, initials: formData.initials || getInitials(formData.name)});
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialUser ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur'}</DialogTitle>
          <DialogDescription>
            {initialUser ? 'Modifiez les détails de l\'utilisateur.' : 'Remplissez les informations pour le nouvel utilisateur.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatarUrl || undefined} alt={formData.name} data-ai-hint="person face" />
              <AvatarFallback className="text-3xl">{formData.initials || <UserCircle className="h-10 w-10"/>}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <Label htmlFor="avatarUrl" className="flex items-center"><ImageIcon className="mr-1 h-4 w-4 text-muted-foreground"/>URL de l'avatar</Label>
                <Input id="avatarUrl" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className="mt-1" placeholder="https://..." ref={avatarUrlInputRef}/>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required ref={nameInputRef}/>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone (Fixe)</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="mobile">Téléphone (Mobile)</Label>
              <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1" />
            </div>
          </div>
           <div>
            <Label htmlFor="initials">Initiales</Label>
            <Input id="initials" name="initials" value={formData.initials} onChange={handleChange} className="mt-1" placeholder="auto-générées"/>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialUser ? 'Sauvegarder' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    