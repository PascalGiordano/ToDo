'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { renderIcon, cn } from '@/lib/utils'; // renderIcon uses createLucideIconPrimitive now
import { icons as lucideIconManifest } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const kebabToPascalCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

interface IconPickerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onIconSelect: (iconName: string) => void; // Expects PascalCase name
  currentIcon?: string; // PascalCase name
}

export function IconPicker({ isOpen, onOpenChange, onIconSelect, currentIcon }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIconVisual, setSelectedIconVisual] = useState(currentIcon);

  useEffect(() => {
    setSelectedIconVisual(currentIcon);
    if (isOpen) {
      setSearchTerm(''); 
    }
  }, [currentIcon, isOpen]);

  const iconPascalNames = useMemo(() => {
    if (!lucideIconManifest || typeof lucideIconManifest !== 'object' || Object.keys(lucideIconManifest).length === 0) {
      console.error("CRITICAL: lucideIconManifest is not available, empty, or not an object. IconPicker will be empty.");
      return [];
    }
    try {
      return Object.keys(lucideIconManifest).map(kebabToPascalCase).sort();
    } catch (e) {
      console.error("CRITICAL: Error processing lucideIconManifest keys:", e);
      return [];
    }
  }, []);

  const filteredIcons = useMemo(() => {
    if (!searchTerm.trim()) return iconPascalNames;
    return iconPascalNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, iconPascalNames]); 

  const handleIconClick = (pascalIconName: string) => {
    setSelectedIconVisual(pascalIconName);
    onIconSelect(pascalIconName); // Return PascalCase name
    onOpenChange(false);
  };
  
  const iconCount = iconPascalNames.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choisir une Icône</DialogTitle>
          <DialogDescription>
            Recherchez et sélectionnez une icône. 
            {iconCount > 0 ? `${iconCount} icônes disponibles.` : "Aucune icône trouvée ou erreur lors du chargement."}
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          placeholder={iconCount > 0 ? `Rechercher parmi ${iconCount} icônes (ex: Home, Check, User)...` : "Recherche d'icônes..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
          disabled={iconCount === 0}
        />
        <ScrollArea className="flex-grow border rounded-md">
          {iconCount === 0 ? (
             <p className="text-center text-muted-foreground p-4">
              {lucideIconManifest ? "Aucune icône trouvée." : "Impossible de charger le manifeste des icônes."}
            </p>
          ) : filteredIcons.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">
              {searchTerm.trim() ? `Aucune icône trouvée pour "${searchTerm}"` : "Aucune icône disponible."}
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-x-1 gap-y-2 p-2">
              {filteredIcons.map(pascalName => {
                // Use the robust renderIcon to display the preview
                const iconElement = renderIcon(pascalName, { size: 24, strokeWidth: 1.5, className: "mb-0.5 text-foreground/80" } as LucideProps);
                
                return (
                  <Button
                    key={pascalName}
                    variant={selectedIconVisual === pascalName ? 'secondary' : 'ghost'}
                    className="flex flex-col items-center justify-center h-auto p-1 aspect-square hover:bg-accent/50"
                    onClick={() => handleIconClick(pascalName)}
                    title={pascalName}
                  >
                    <div className="h-8 w-8 flex items-center justify-center">
                      {iconElement || <span className="text-xs text-destructive">?</span>}
                    </div>
                    <span className="text-[10px] truncate w-full text-center text-muted-foreground mt-0.5">{pascalName}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}