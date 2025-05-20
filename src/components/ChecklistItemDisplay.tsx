
'use client';

import type { ChecklistItem as ChecklistItemType, ActionItem as ActionItemType } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface ActionItemDisplayProps {
  action: ActionItemType;
  onToggle: () => void;
  onDelete?: () => void;
  isEditable?: boolean;
}

function ActionItemDisplay({ action, onToggle, onDelete, isEditable = false }: ActionItemDisplayProps) {
  return (
    <div className="flex items-center space-x-2 py-0.5 pl-4 group">
      <Checkbox
        id={`action-${action.id}`}
        checked={action.completed}
        onCheckedChange={onToggle}
        aria-labelledby={`action-label-${action.id}`}
        className="h-3 w-3"
      />
      <label
        id={`action-label-${action.id}`}
        htmlFor={`action-${action.id}`}
        className={cn(
          "text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow",
          action.completed && "line-through text-muted-foreground"
        )}
      >
        {action.text}
      </label>
      {isEditable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
          aria-label="Delete action item"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      )}
    </div>
  );
}

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  isEditable?: boolean;
  // Action related props
  onAddAction?: (checklistItemId: string, actionText: string) => void;
  onToggleAction?: (checklistItemId: string, actionId: string) => void;
  onDeleteAction?: (checklistItemId: string, actionId: string) => void;
}

export function ChecklistItemDisplay({ 
  item, 
  onToggle, 
  onDelete, 
  isEditable = false,
  onAddAction,
  onToggleAction,
  onDeleteAction
}: ChecklistItemProps) {
  const [newActionText, setNewActionText] = useState('');

  const handleAddAction = () => {
    if (newActionText.trim() && onAddAction) {
      onAddAction(item.id, newActionText.trim());
      setNewActionText('');
    }
  };

  return (
    <div className="py-1">
      <div className="flex items-center space-x-2 group">
        <Checkbox
          id={`checklist-${item.id}`}
          checked={item.completed}
          onCheckedChange={() => onToggle(item.id)}
          aria-labelledby={`checklist-label-${item.id}`}
        />
        <label
          id={`checklist-label-${item.id}`}
          htmlFor={`checklist-${item.id}`}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow",
            item.completed && "line-through text-muted-foreground"
          )}
        >
          {item.text}
        </label>
        {isEditable && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(item.id)}
            aria-label="Delete checklist item"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      
      {item.actions && item.actions.length > 0 && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-dashed pl-2 py-1">
          {item.actions.map(action => (
            <ActionItemDisplay
              key={action.id}
              action={action}
              onToggle={() => onToggleAction?.(item.id, action.id)}
              onDelete={isEditable && onDeleteAction ? () => onDeleteAction(item.id, action.id) : undefined}
              isEditable={isEditable}
            />
          ))}
        </div>
      )}

      {isEditable && onAddAction && (
        <div className="ml-6 mt-1 flex items-center space-x-1">
          <Input
            type="text"
            placeholder="Ajouter une action..."
            value={newActionText}
            onChange={(e) => setNewActionText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAction()}
            className="h-7 text-xs flex-grow"
          />
          <Button size="sm" onClick={handleAddAction} className="h-7 px-2 py-1 text-xs">
            <PlusCircle className="h-3 w-3 mr-1" /> Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
