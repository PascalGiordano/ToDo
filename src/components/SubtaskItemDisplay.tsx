
'use client';

import type { Subtask as SubtaskType, TaskPriority, TaskStatus, ActionItem } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChecklistItemDisplay } from './ChecklistItemDisplay';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlusCircle, Trash2, Edit3 } from 'lucide-react';
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { usePriorities } from '@/hooks/usePriorities';
import { useStatuses } from '@/hooks/useStatuses';


interface SubtaskItemDisplayProps {
  subtask: SubtaskType;
  taskId: string; // Main task ID
  onToggleChecklistItem: (subtaskId: string, itemId: string) => void;
  onAddChecklistItem: (subtaskId: string, text: string) => void;
  onDeleteChecklistItem: (subtaskId: string, itemId: string) => void;
  onUpdateSubtask: (subtaskId: string, updates: Partial<Pick<SubtaskType, 'name' | 'priority' | 'status'>>) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  isEditable?: boolean;
  // Action related props for checklist items within subtasks
  onAddActionToSubtaskChecklistItem?: (subtaskId: string, checklistItemId: string, actionText: string) => void;
  onToggleSubtaskActionItem?: (subtaskId: string, checklistItemId: string, actionId: string) => void;
  onDeleteSubtaskActionItem?: (subtaskId: string, checklistItemId: string, actionId: string) => void;
}


export function SubtaskItemDisplay({
  subtask,
  taskId,
  onToggleChecklistItem,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onUpdateSubtask,
  onDeleteSubtask,
  isEditable = false,
  onAddActionToSubtaskChecklistItem,
  onToggleSubtaskActionItem,
  onDeleteSubtaskActionItem,
}: SubtaskItemDisplayProps) {
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(subtask.name);

  const { priorities: allPriorities } = usePriorities();
  const { statuses: allStatuses } = useStatuses();

  const handleAddChecklistItemToSubtask = () => {
    if (newChecklistItemText.trim()) {
      onAddChecklistItem(subtask.id, newChecklistItemText.trim());
      setNewChecklistItemText('');
    }
  };

  const handleNameUpdate = () => {
    if (editingName.trim() !== subtask.name && editingName.trim() !== '') {
      onUpdateSubtask(subtask.id, { name: editingName.trim() });
    } else if (editingName.trim() === '') {
        setEditingName(subtask.name); // Revert if empty
    }
    setIsEditingName(false);
  };

  const getPriorityColor = (priorityName: TaskPriority) => {
    return allPriorities.find(p => p.name === priorityName)?.color || 'hsl(var(--muted-foreground))';
  }

  const getStatusColor = (statusName: TaskStatus) => {
    return allStatuses.find(s => s.name === statusName)?.color || 'hsl(var(--muted-foreground))';
  }

  return (
    <Card className="mb-3 bg-secondary/50 shadow-sm">
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          {isEditingName && isEditable ? (
            <div className="flex items-center gap-2 flex-grow">
              <Input 
                value={editingName} 
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameUpdate}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameUpdate(); if (e.key === 'Escape') { setEditingName(subtask.name); setIsEditingName(false);}}}
                className="h-8 text-base"
                autoFocus
              />
            </div>
          ) : (
            <CardTitle 
              className={cn("text-base font-semibold", isEditable && "cursor-pointer hover:text-primary")}
              onClick={() => isEditable && setIsEditingName(true)}
            >
              {subtask.name}
              {isEditable && <Edit3 className="inline ml-2 h-3 w-3 text-muted-foreground opacity-0 group-hover/cardtitle:opacity-100 transition-opacity" />}
            </CardTitle>
          )}
          {isEditable && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteSubtask(subtask.id)} aria-label="Supprimer la sous-tâche">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        <div className="flex space-x-2 mt-1">
          {isEditable ? (
            <>
              <Select
                value={subtask.priority}
                onValueChange={(value: TaskPriority) => onUpdateSubtask(subtask.id, { priority: value })}
              >
                <SelectTrigger 
                  className={cn(
                    "h-7 text-xs rounded-full border-none focus:ring-1 focus:ring-offset-1",
                    "text-white w-[90px] px-2.5 py-0" 
                  )}
                   style={{ backgroundColor: getPriorityColor(subtask.priority), borderColor: getPriorityColor(subtask.priority) }}
                >
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  {allPriorities.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={subtask.status}
                onValueChange={(value: TaskStatus) => onUpdateSubtask(subtask.id, { status: value })}
              >
                <SelectTrigger 
                  className={cn(
                    "h-7 text-xs rounded-full border-none focus:ring-1 focus:ring-offset-1",
                    "text-white w-[110px] px-2.5 py-0"
                  )}
                   style={{ backgroundColor: getStatusColor(subtask.status), borderColor: getStatusColor(subtask.status) }}
                >
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Badge variant="secondary" style={{ backgroundColor: getPriorityColor(subtask.priority), color: 'white' }}>{subtask.priority}</Badge>
              <Badge variant="secondary" style={{ backgroundColor: getStatusColor(subtask.status), color: 'white' }}>{subtask.status}</Badge>
            </>
          )}
        </div>
      </CardHeader>
      {(subtask.checklist.length > 0 || isEditable) && (
        <CardContent className="p-3 pt-0">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Checklist de la sous-tâche</h4>
          {subtask.checklist.map(item => (
            <ChecklistItemDisplay
              key={item.id}
              item={item}
              onToggle={(itemId) => onToggleChecklistItem(subtask.id, itemId)}
              onDelete={isEditable ? (itemId) => onDeleteChecklistItem(subtask.id, itemId) : undefined}
              isEditable={isEditable}
              onAddAction={isEditable && onAddActionToSubtaskChecklistItem ? (checklistItemId, actionText) => onAddActionToSubtaskChecklistItem(subtask.id, checklistItemId, actionText) : undefined}
              onToggleAction={isEditable && onToggleSubtaskActionItem ? (checklistItemId, actionId) => onToggleSubtaskActionItem(subtask.id, checklistItemId, actionId) : undefined}
              onDeleteAction={isEditable && onDeleteSubtaskActionItem ? (checklistItemId, actionId) => onDeleteSubtaskActionItem(subtask.id, checklistItemId, actionId) : undefined}
            />
          ))}
           {isEditable && (
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="text"
                placeholder="Ajouter un élément à la checklist"
                value={newChecklistItemText}
                onChange={(e) => setNewChecklistItemText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItemToSubtask()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAddChecklistItemToSubtask} className="h-8">
                <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
