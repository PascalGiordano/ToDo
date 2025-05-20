
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Task, Subtask, ChecklistItem, TaskPriority, TaskStatus, ActionItem } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Paperclip, Image as ImageIconLucide, Tag as TagIcon, ListChecks as ListChecksIcon, Loader2, Briefcase, Users, ChevronDown, CalendarIcon, CalendarDays, UserCircle, Filter, FilterX } from 'lucide-react';
import { AICategorization, SuggestedItemsDisplay } from './AICategorization';
import type { SuggestTaskCategoriesOutput } from '@/ai/flows/suggest-task-categories';
import { ChecklistItemDisplay } from './ChecklistItemDisplay';
import { SubtaskItemDisplay } from './SubtaskItemDisplay';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import { useTags } from '@/hooks/useTags';
import type { Tag as TagType } from '@/types/tag';
import { usePriorities } from '@/hooks/usePriorities';
import type { Priority } from '@/types/priority';
import { useStatuses } from '@/hooks/useStatuses';
import type { Status } from '@/types/status';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/project';
import { useUsers } from '@/hooks/useUsers';
import type { User as UserType } from '@/types/user';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, renderIcon, getInitials } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NO_SELECTION_VALUE = "__NO_SELECTION__";

interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  onAddSubtask?: (taskId: string, subtaskData: Omit<Subtask, 'id' | 'checklist'>) => Promise<Subtask | undefined>;
  onUpdateSubtask?: (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => Promise<void>;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
  onAddChecklistItem?: (parentId: string, itemText: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<ChecklistItem | undefined>;
  onToggleChecklistItem?: (parentId: string, itemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<void>;
  onDeleteChecklistItem?: (parentId: string, itemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<void>;
  onAddActionToChecklistItem?: (parentId: string, checklistItemId: string, actionText: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<ActionItem | undefined>;
  onToggleActionItem?: (parentId: string, checklistItemId: string, actionItemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<void>;
  onDeleteActionItem?: (parentId: string, checklistItemId: string, actionItemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => Promise<void>;
}

const defaultTaskValues: Partial<Task> = {
  name: '',
  content: '',
  category: '',
  priority: 'Medium' as TaskPriority, 
  status: 'To Do' as TaskStatus,   
  tags: [],
  attachments: [],
  subtasks: [],
  checklist: [],
  projectId: '',
  projectName: '',
  assignedUserIds: [],
  assignedUserNames: [],
  dueDate: undefined,
};

export function TaskForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialTask,
  onAddSubtask: propOnAddSubtask,
  onUpdateSubtask: propOnUpdateSubtask,
  onDeleteSubtask: propOnDeleteSubtask,
  onAddChecklistItem: propOnAddChecklistItem,
  onToggleChecklistItem: propOnToggleChecklistItem,
  onDeleteChecklistItem: propOnDeleteChecklistItem,
  onAddActionToChecklistItem: propOnAddAction,
  onToggleActionItem: propOnToggleAction,
  onDeleteActionItem: propOnDeleteAction,
}: TaskFormProps) {
  const [taskData, setTaskData] = useState<Partial<Task>>(defaultTaskValues);
  const [newTag, setNewTag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [suggestedAICategories, setSuggestedAICategories] = useState<string[]>([]);
  const [suggestedAITags, setSuggestedAITags] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { categories, addCategory: addCategoryHook, isLoading: isLoadingCategories } = useCategories();
  const { tags: existingTags, addTag: addTagHook, isLoading: isLoadingTags } = useTags();
  const { priorities, isLoading: isLoadingPriorities } = usePriorities();
  const { statuses, isLoading: isLoadingStatuses } = useStatuses();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { users, isLoading: isLoadingUsers, error: errorUsers } = useUsers();

  const generateTempId = (prefix: string) => `temp-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  useEffect(() => {
    if (!isOpen) return;

    let baseValues = { ...defaultTaskValues };

    if (initialTask) {
      let dueDate = initialTask.dueDate;
      if (dueDate && typeof (dueDate as Timestamp)?.toDate === 'function') {
        dueDate = (dueDate as Timestamp).toDate();
      }
      const currentId = initialTask.id || generateTempId('task');

      setTaskData({
        ...baseValues,
        ...initialTask,
        id: currentId, 
        dueDate: dueDate instanceof Date && isValid(dueDate) ? dueDate : undefined,
        priority: initialTask.priority || baseValues.priority,
        status: initialTask.status || baseValues.status,
        tags: [...(initialTask.tags || [])],
        attachments: [...(initialTask.attachments || [])],
        subtasks: initialTask.subtasks ? initialTask.subtasks.map(st => ({...st, id: st.id || generateTempId('st'), checklist: (st.checklist || []).map(ci => ({...ci, id: ci.id || generateTempId('stcl'), actions: (ci.actions || []).map(ac => ({...ac, id: ac.id || generateTempId('stac')}))}))})) : [],
        checklist: initialTask.checklist ? initialTask.checklist.map(ci => ({...ci, id: ci.id || generateTempId('cl'), actions: (ci.actions || []).map(ac => ({...ac, id: ac.id || generateTempId('ac')}))})) : [],
        projectId: initialTask.projectId || '',
        projectName: initialTask.projectName || '',
        assignedUserIds: initialTask.assignedUserIds || [],
        assignedUserNames: initialTask.assignedUserNames || [],
       });
    } else {
      let newPriority = baseValues.priority as TaskPriority;
      if (!isLoadingPriorities && priorities.length > 0) {
        const defaultPrio = priorities.find(p => p.order === 0) || priorities.sort((a,b) => a.order - b.order)[0];
        if (defaultPrio) newPriority = defaultPrio.name as TaskPriority;
      } else if (isLoadingPriorities) {
        // Keep default or wait for loading
        newPriority = baseValues.priority as TaskPriority;
      }

      let newStatus = baseValues.status as TaskStatus;
      if (!isLoadingStatuses && statuses.length > 0) {
        const defaultStat = statuses.find(s => s.order === 0) || statuses.sort((a,b) => a.order - b.order)[0];
        if (defaultStat) newStatus = defaultStat.name as TaskStatus;
      } else if (isLoadingStatuses) {
        newStatus = baseValues.status as TaskStatus;
      }
      
      setTaskData({
        ...baseValues, 
        id: generateTempId('task'),
        priority: newPriority,
        status: newStatus,
      });
    }
    setSuggestedAICategories([]);
    setSuggestedAITags([]);
  }, [initialTask, isOpen, priorities, statuses, isLoadingPriorities, isLoadingStatuses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Task, value: string) => {
    const actualValue = value === NO_SELECTION_VALUE ? "" : value;
    setTaskData(prev => ({ ...prev, [name]: actualValue }));
  };
  
  const handleProjectSelectChange = (value: string) => {
    if (value === NO_SELECTION_VALUE) {
        setTaskData(prev => ({ ...prev, projectId: '', projectName: '' }));
    } else {
        const selectedProject = projects.find(p => p.id === value);
        setTaskData(prev => ({ ...prev, projectId: value, projectName: selectedProject ? selectedProject.name : '' }));
    }
  };

  const handleUserSelectChange = (user: UserType, checked: boolean) => {
    setTaskData(prev => {
      const currentIds = prev.assignedUserIds || [];
      const currentNames = prev.assignedUserNames || [];
      if (checked) {
        return { ...prev, assignedUserIds: [...currentIds, user.id], assignedUserNames: [...currentNames, user.name] };
      } else {
        return { ...prev, assignedUserIds: currentIds.filter(id => id !== user.id), assignedUserNames: currentNames.filter(name => name !== user.name) };
      }
    });
  };

  const handleDateChange = (date: Date | undefined) => setTaskData(prev => ({ ...prev, dueDate: date }));
  
  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newTag.trim()).trim();
    if (tag && !taskData.tags?.includes(tag)) {
      setTaskData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
      if (!tagToAdd) setNewTag(''); 
    }
  };

  const handleRemoveTag = (tagToRemove: string) => setTaskData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) }));

  const handleAddChecklistItemToTask = async () => {
    if (newChecklistItem.trim() && taskData.id) {
      const tempId = generateTempId('cl');
      const newItem: ChecklistItem = { id: tempId, text: newChecklistItem.trim(), completed: false, actions: [] };
      if (propOnAddChecklistItem && initialTask?.id) { 
        const savedItem = await propOnAddChecklistItem(taskData.id, newItem.text, 'task');
        if (savedItem) setTaskData(prev => ({ ...prev, checklist: [...(prev.checklist || []).filter(ci => ci.id !== tempId), savedItem]}));
      } else { 
        setTaskData(prev => ({ ...prev, checklist: [...(prev.checklist || []), newItem]}));
      }
      setNewChecklistItem('');
    }
  };
  const handleToggleChecklistItemOnTask = async (itemId: string) => {
    if (propOnToggleChecklistItem && taskData.id && initialTask?.id) await propOnToggleChecklistItem(taskData.id, itemId, 'task');
    setTaskData(prev => ({ ...prev, checklist: prev.checklist?.map(item => item.id === itemId ? {...item, completed: !item.completed} : item)}));
  };
  const handleDeleteChecklistItemFromTask = async (itemId: string) => {
    if(propOnDeleteChecklistItem && taskData.id && initialTask?.id) await propOnDeleteChecklistItem(taskData.id, itemId, 'task');
    setTaskData(prev => ({ ...prev, checklist: prev.checklist?.filter(item => item.id !== itemId)}));
  };

  const handleAddSubtaskLocal = async () => {
    if (newSubtaskName.trim() && taskData.id) {
      const defaultPriorityFromList = priorities.find(p => p.order === 0) || priorities[0] || {name: 'Medium'};
      const defaultStatusFromList = statuses.find(s => s.order === 0) || statuses[0] || {name: 'To Do'};
      const tempId = generateTempId('st');
      const tempSubtask: Subtask = { 
        id: tempId, name: newSubtaskName.trim(), 
        priority: (defaultPriorityFromList?.name as TaskPriority) || defaultTaskValues.priority as TaskPriority, 
        status: (defaultStatusFromList?.name as TaskStatus) || defaultTaskValues.status as TaskStatus, 
        checklist: [] 
      };
      if (propOnAddSubtask && initialTask?.id) { 
        const savedSubtask = await propOnAddSubtask(taskData.id, {name: tempSubtask.name, priority: tempSubtask.priority, status: tempSubtask.status});
        if(savedSubtask) setTaskData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []).filter(st => st.id !== tempId), savedSubtask]}));
      } else { 
         setTaskData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), tempSubtask]}));
      }
      setNewSubtaskName('');
    }
  };
  const handleUpdateSubtaskLocal = async (subtaskId: string, updates: Partial<Pick<Subtask, 'name' | 'priority' | 'status'>>) => {
    if(propOnUpdateSubtask && taskData.id && initialTask?.id) await propOnUpdateSubtask(taskData.id, subtaskId, updates);
    setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, ...updates} : st)}));
  };
  const handleDeleteSubtaskLocal = async (subtaskId: string) => {
    if(propOnDeleteSubtask && taskData.id && initialTask?.id) await propOnDeleteSubtask(taskData.id, subtaskId);
    setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.filter(st => st.id !== subtaskId)}));
  };

  const handleAddChecklistItemToSubtask = async (subtaskId: string, text: string) => {
    const tempId = generateTempId('stcl');
    const newItem: ChecklistItem = { id: tempId, text, completed: false, actions: [] };
    if(propOnAddChecklistItem && taskData.id && initialTask?.id) { 
      const savedItem = await propOnAddChecklistItem(taskData.id, text, 'subtask', subtaskId);
      if (savedItem) setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: [...(st.checklist || []).filter(ci => ci.id !==tempId), savedItem]} : st)}));
    } else {  
      setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: [...(st.checklist || []), newItem]} : st)}));
    }
  };
  const handleToggleChecklistItemOnSubtask = async (subtaskId: string, itemId: string) => {
    if(propOnToggleChecklistItem && taskData.id && initialTask?.id) await propOnToggleChecklistItem(taskData.id, itemId, 'subtask', subtaskId);
    setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.map(ci => ci.id === itemId ? {...ci, completed: !ci.completed} : ci)} : st)}));
  };
  const handleDeleteChecklistItemFromSubtask = async (subtaskId: string, itemId: string) => {
    if(propOnDeleteChecklistItem && taskData.id && initialTask?.id) await propOnDeleteChecklistItem(taskData.id, itemId, 'subtask', subtaskId);
    setTaskData(prev => ({ ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.filter(ci => ci.id !== itemId)} : st)}));
  };

  const handleAddAction = async (checklistItemId: string, actionText: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const tempId = generateTempId(parentType === 'task' ? 'ac' : 'stac');
    const newAction: ActionItem = { id: tempId, text: actionText, completed: false };
    if (propOnAddAction && taskData.id && initialTask?.id) { 
      const savedAction = await propOnAddAction(taskData.id, checklistItemId, actionText, parentType, subtaskId);
      if (savedAction) { 
        setTaskData(prev => {
          if (parentType === 'task') {
            return { ...prev, checklist: prev.checklist?.map(ci => ci.id === checklistItemId ? {...ci, actions: [...(ci.actions || []).filter(a => a.id !== tempId), savedAction]} : ci)};
          } else if (parentType === 'subtask' && subtaskId) {
            return { ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.map(ci => ci.id === checklistItemId ? {...ci, actions: [...(ci.actions || []).filter(a => a.id !== tempId), savedAction]} : ci)} : st)};
          }
          return prev;
        });
      }
    } else { 
      setTaskData(prev => {
          if (parentType === 'task') {
            return { ...prev, checklist: prev.checklist?.map(ci => ci.id === checklistItemId ? {...ci, actions: [...(ci.actions || []), newAction]} : ci)};
          } else if (parentType === 'subtask' && subtaskId) {
            return { ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.map(ci => ci.id === checklistItemId ? {...ci, actions: [...(ci.actions || []), newAction]} : ci)} : st)};
          }
          return prev;
        });
    }
  };
  const handleToggleAction = async (checklistItemId: string, actionId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    if (propOnToggleAction && taskData.id && initialTask?.id) await propOnToggleAction(taskData.id, checklistItemId, actionId, parentType, subtaskId);
    setTaskData(prev => {
        if (parentType === 'task') {
          return { ...prev, checklist: prev.checklist?.map(ci => ci.id === checklistItemId ? {...ci, actions: (ci.actions || []).map(a => a.id === actionId ? {...a, completed: !a.completed} : a)} : ci)};
        } else if (parentType === 'subtask' && subtaskId) {
          return { ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.map(ci => ci.id === checklistItemId ? {...ci, actions: (ci.actions || []).map(a => a.id === actionId ? {...a, completed: !a.completed} : a)} : ci)} : st)};
        }
        return prev;
      });
  };
  const handleDeleteAction = async (checklistItemId: string, actionId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    if (propOnDeleteAction && taskData.id && initialTask?.id) await propOnDeleteAction(taskData.id, checklistItemId, actionId, parentType, subtaskId);
    setTaskData(prev => {
        if (parentType === 'task') {
          return { ...prev, checklist: prev.checklist?.map(ci => ci.id === checklistItemId ? {...ci, actions: (ci.actions || []).filter(a => a.id !== actionId)} : ci)};
        } else if (parentType === 'subtask' && subtaskId) {
          return { ...prev, subtasks: prev.subtasks?.map(st => st.id === subtaskId ? {...st, checklist: st.checklist.map(ci => ci.id === checklistItemId ? {...ci, actions: (ci.actions || []).filter(a => a.id !== actionId)} : ci)} : st)};
        }
        return prev;
      });
  };

  const handleAddAttachment = () => {
    const placeholderUrl = `https://placehold.co/300x200.png`;
    setTaskData(prev => ({ ...prev, attachments: [...(prev.attachments || []), placeholderUrl] }));
    toast({ title: "Pièce jointe ajoutée", description: "Une image de remplacement a été ajoutée."});
  };
  const handleRemoveAttachment = (urlToRemove: string) => setTaskData(prev => ({ ...prev, attachments: prev.attachments?.filter(url => url !== urlToRemove) }));
  
  const handleAISuggestions = (suggestions: SuggestTaskCategoriesOutput) => {
    setSuggestedAICategories(suggestions.suggestedCategories);
    setSuggestedAITags(suggestions.suggestedTags);
  };

  const handleSelectAISuggestedCategory = async (categoryName: string) => {
    const existingCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!existingCategory) {
      try {
        await addCategoryHook({ 
          name: categoryName, 
          order: categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0, 
          color: '#808080', // Default grey color
          iconName: 'Tag', // Default icon
          description: 'Catégorie suggérée par IA'
        });
        toast({ title: 'Catégorie créée', description: `La catégorie "${categoryName}" a été créée automatiquement.`});
      } catch (error) {
        toast({ title: 'Erreur de création', description: `Impossible de créer la catégorie "${categoryName}".`, variant: 'destructive'});
        return; // Stop if creation fails
      }
    }
    handleSelectChange('category', categoryName);
    setSuggestedAICategories([]); 
  };

  const handleAddAISuggestedTag = async (tagName: string) => {
    const existing = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (!existing) {
      try {
        await addTagHook({ 
          name: tagName, 
          color: '#808080', // Default grey color
          iconName: 'Tag' // Default icon
        });
        toast({ title: 'Tag créé', description: `Le tag "${tagName}" a été créé automatiquement.`});
      } catch (error) {
        toast({ title: 'Erreur de création', description: `Impossible de créer le tag "${tagName}".`, variant: 'destructive'});
        // Continue to add to task optimistically even if DB creation fails for some reason
      }
    }
    if (!taskData.tags?.map(t => t.toLowerCase()).includes(tagName.toLowerCase())) {
      setTaskData(prev => ({ ...prev, tags: [...(prev.tags || []), tagName] }));
    }
    setSuggestedAITags(prev => prev.filter(t => t.toLowerCase() !== tagName.toLowerCase()));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.name?.trim()) {
      toast({ title: "Erreur de validation", description: "Le nom de la tâche est requis.", variant: "destructive" });
      return;
    }
    const taskToSubmit: Partial<Task> = {
      ...taskData,
      id: initialTask?.id || taskData.id, 
      priority: taskData.priority || defaultTaskValues.priority as TaskPriority,
      status: taskData.status || defaultTaskValues.status as TaskStatus,
    };
    onSubmit(taskToSubmit);
    onOpenChange(false);
  };

  if (!isOpen) return null;

  const renderSelectTrigger = (
    placeholderText: string, 
    currentValue?: string, 
    collection?: Array<{id?: string; name: string; iconName?: string; color?: string; value?: string}>, 
    isLoading?: boolean,
    valueIsId: boolean = false 
  ) => {
     if (isLoading) return <Button variant="outline" className="w-full justify-start mt-1 h-10" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</Button>;
    const selectedItem = currentValue && currentValue !== NO_SELECTION_VALUE ? (valueIsId ? collection?.find(item => item.id === currentValue) : collection?.find(item => item.name === currentValue)) : undefined;
    
    if (isLoading && !collection?.length) { // Still loading and no items yet
        return <Button variant="outline" className="w-full justify-start mt-1 h-10" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</Button>;
    }
    if (!isLoading && !collection?.length && !selectedItem) { // Loaded but collection is empty
         return (
            <SelectTrigger className="mt-1 h-10">
                <SelectValue placeholder={placeholderText}>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4"/><span>{placeholderText} (Aucun)</span>
                </div>
                </SelectValue>
            </SelectTrigger>
         );
    }

    return (
      <SelectTrigger className="mt-1 h-10">
        <SelectValue placeholder={placeholderText}>
          {selectedItem ? (<div className="flex items-center gap-2">{selectedItem.iconName && renderIcon(selectedItem.iconName, {className: "h-4 w-4", color: selectedItem.color || 'inherit'})}<span>{selectedItem.name}</span></div>) : 
          (<div className="flex items-center gap-2 text-muted-foreground"><Filter className="h-4 w-4"/><span>{placeholderText}</span></div>)
          }
        </SelectValue>
      </SelectTrigger>
    );
  };

  const renderSelectItem = (item: {id?: string; name: string; iconName?: string; color?: string; value?: string}, valueIsId: boolean = false, isNoSelectionItem: boolean = false, placeholderText?: string) => { 
    const itemValue = isNoSelectionItem ? NO_SELECTION_VALUE : (valueIsId ? (item.id || item.name) : item.name); 
    return <SelectItem key={itemValue || 'no-selection-item'} value={itemValue!}><div className="flex items-center gap-2">{!isNoSelectionItem && item.iconName && renderIcon(item.iconName, {className: "h-4 w-4", color: item.color || 'inherit'})}<span>{isNoSelectionItem && placeholderText ? placeholderText : item.name}</span></div></SelectItem>;
  }

  const selectedUsersDetails = (taskData.assignedUserIds || []).map(userId => users.find(u => u.id === userId)).filter(user => user !== undefined) as UserType[];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] max-h-[90vh]">
        <DialogHeader><DialogTitle className="text-2xl">{initialTask ? 'Modifier la tâche' : 'Ajouter une nouvelle tâche'}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-200px)] p-1 pr-6">
        <TooltipProvider>
          <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <Card><CardHeader><CardTitle className="text-lg">Informations de base</CardTitle></CardHeader><CardContent className="space-y-4">
              <div><Label htmlFor="name">Nom de la tâche</Label><Input id="name" name="name" value={taskData.name || ''} onChange={handleChange} required className="mt-1" /></div>
              <div><Label htmlFor="content">Description / Contenu</Label><Textarea id="content" name="content" value={taskData.content || ''} onChange={handleChange} className="mt-1" rows={3} /></div>
            </CardContent></Card>
            <AICategorization taskName={taskData.name || ''} taskContent={taskData.content || ''} onSuggestions={handleAISuggestions} />
            <Card><CardHeader><CardTitle className="text-lg">Détails</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><Label htmlFor="category">Catégorie</Label><Select name="category" value={taskData.category || NO_SELECTION_VALUE} onValueChange={(value) => handleSelectChange('category', value)}>{renderSelectTrigger("Sélectionner une catégorie", taskData.category || NO_SELECTION_VALUE, categories as Category[], isLoadingCategories)}<SelectContent>{renderSelectItem({name: "Aucune catégorie", iconName:"FilterX"}, false, true, "Aucune catégorie")}{categories.map(cat => renderSelectItem(cat as Category))}</SelectContent></Select>{suggestedAICategories.length > 0 && (<SuggestedItemsDisplay items={suggestedAICategories} title="Suggérées (IA)" onItemClick={handleSelectAISuggestedCategory} variant="outline" />)}</div>
              <div><Label htmlFor="priority">Priorité</Label><Select name="priority" value={taskData.priority || ''} onValueChange={(value) => handleSelectChange('priority', value as TaskPriority)}>{renderSelectTrigger("Sélectionner la priorité", taskData.priority, priorities as Priority[], isLoadingPriorities)}<SelectContent>{priorities.map(p => renderSelectItem(p as Priority))}</SelectContent></Select></div>
              <div><Label htmlFor="status">Statut</Label><Select name="status" value={taskData.status || ''} onValueChange={(value) => handleSelectChange('status', value as TaskStatus)}>{renderSelectTrigger("Sélectionner le statut", taskData.status, statuses as Status[], isLoadingStatuses)}<SelectContent>{statuses.map(s => renderSelectItem(s as Status))}</SelectContent></Select></div>
              <div className="md:col-span-1"><Label htmlFor="project" className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Projet</Label><Select name="projectId" value={taskData.projectId || NO_SELECTION_VALUE} onValueChange={handleProjectSelectChange}>{renderSelectTrigger("Sélectionner un projet", taskData.projectId || NO_SELECTION_VALUE, projects as Project[], isLoadingProjects, true)}<SelectContent>{renderSelectItem({name: "Aucun projet", iconName: "FilterX"}, true, true, "Aucun projet")}{projects.map(proj => renderSelectItem(proj as Project, true))}</SelectContent></Select></div>
              <div className="md:col-span-2 lg:col-span-1"><Label htmlFor="dueDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Date d'échéance</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1 h-10", !taskData.dueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{taskData.dueDate ? format(taskData.dueDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={taskData.dueDate} onSelect={handleDateChange} initialFocus locale={fr} /></PopoverContent></Popover></div>
              <div className="md:col-span-2 lg:col-span-full"><Label htmlFor="assignUsers" className="flex items-center mb-1"><Users className="mr-2 h-4 w-4 text-muted-foreground" />Assigner à</Label>{isLoadingUsers ? (<div className="flex items-center justify-center h-10 mt-1 border rounded-md bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>) : errorUsers ? (<p className="mt-1 text-sm text-destructive">Erreur chargement utilisateurs.</p>) : (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between mt-1 h-10"><span className="truncate max-w-[calc(100%-40px)]">{selectedUsersDetails.length > 0 ? selectedUsersDetails.map(u => u.name).join(', ') : "Sélectionner des utilisateurs..."}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]"><DropdownMenuLabel>Utilisateurs disponibles</DropdownMenuLabel><DropdownMenuSeparator /><ScrollArea className="max-h-40">{users.length === 0 && <DropdownMenuItem disabled>Aucun utilisateur trouvé</DropdownMenuItem>}{users.map((user: UserType) => (<DropdownMenuCheckboxItem key={user.id} checked={(taskData.assignedUserIds || []).includes(user.id)} onCheckedChange={(checked) => handleUserSelectChange(user, Boolean(checked))} onSelect={(e) => e.preventDefault()}><div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={user.avatarUrl || undefined} alt={user.name} data-ai-hint="person face"/><AvatarFallback className="text-xs">{user.initials || <UserCircle className="h-4 w-4"/>}</AvatarFallback></Avatar>{user.name}</div></DropdownMenuCheckboxItem>))}</ScrollArea></DropdownMenuContent></DropdownMenu>)}{selectedUsersDetails.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5">{selectedUsersDetails.map(user => (<Tooltip key={user.id}><TooltipTrigger asChild><Avatar className="h-7 w-7 text-xs border-2 border-background"><AvatarImage src={user.avatarUrl || undefined} alt={user.name} data-ai-hint="person face" /><AvatarFallback className="text-xs">{user.initials || <UserCircle className="h-4 w-4"/>}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{user.name}</p></TooltipContent></Tooltip>))}</div>)}</div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg flex items-center"><TagIcon className="mr-2 h-5 w-5 text-primary"/>Tags</CardTitle></CardHeader><CardContent>
              <div className="flex items-center space-x-2"><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ajouter un tag" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} /><Button type="button" onClick={() => handleAddTag()} variant="outline">Ajouter tag</Button></div>
              {taskData.tags && taskData.tags.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">{taskData.tags.map(tag => (<Badge key={tag} variant="secondary" className="text-sm">{tag}<button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-destructive-foreground hover:text-destructive">&times;</button></Badge>))}</div>)}
              {suggestedAITags.length > 0 && (<SuggestedItemsDisplay items={suggestedAITags} title="Suggérés (IA)" onItemClick={handleAddAISuggestedTag} variant="outline"/>)}
              {!isLoadingTags && existingTags.length > 0 && (<SuggestedItemsDisplay items={existingTags.map(t => t.name).filter(name => !(taskData.tags || []).includes(name))} title="Tags existants" onItemClick={(tagName) => handleAddTag(tagName)} variant="outline"/>)}
              {(!taskData.tags || taskData.tags.length === 0) && !isLoadingTags && existingTags.length === 0 && (!suggestedAITags || suggestedAITags.length === 0) && (<p className="mt-2 text-sm text-muted-foreground">Aucun tag.</p>)}
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg flex items-center"><ListChecksIcon className="mr-2 h-5 w-5 text-primary"/>Checklist principale</CardTitle></CardHeader><CardContent>
              {taskData.checklist && taskData.checklist.length > 0 ? (taskData.checklist.map(item => (<ChecklistItemDisplay key={item.id} item={item} onToggle={() => handleToggleChecklistItemOnTask(item.id)} onDelete={() => handleDeleteChecklistItemFromTask(item.id)} isEditable={true} onAddAction={(ciId, text) => handleAddAction(ciId, text, 'task')} onToggleAction={(ciId, acId) => handleToggleAction(ciId, acId, 'task')} onDeleteAction={(ciId, acId) => handleDeleteAction(ciId, acId, 'task')}/>))) : (<p className="mb-2 text-sm text-muted-foreground">Aucun élément.</p>)}
              <div className="flex items-center space-x-2 mt-3"><Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Ajouter un élément" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItemToTask())}/><Button type="button" onClick={handleAddChecklistItemToTask} variant="outline"><PlusCircle className="h-4 w-4 mr-1" /> Ajouter</Button></div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg">Sous-tâches</CardTitle></CardHeader><CardContent>
              {taskData.subtasks && taskData.subtasks.length > 0 ? (taskData.subtasks.map(subtask => (<SubtaskItemDisplay key={subtask.id} subtask={subtask} taskId={taskData.id || 'new-task'} onToggleChecklistItem={(stId, itemId) => handleToggleChecklistItemOnSubtask(stId, itemId)} onAddChecklistItem={(stId, text) => handleAddChecklistItemToSubtask(stId, text)} onDeleteChecklistItem={(stId, itemId) => handleDeleteChecklistItemFromSubtask(stId, itemId)} onUpdateSubtask={handleUpdateSubtaskLocal} onDeleteSubtask={handleDeleteSubtaskLocal} isEditable={true} onAddActionToSubtaskChecklistItem={(stId, ciId, text) => handleAddAction(ciId, text, 'subtask', stId)} onToggleSubtaskActionItem={(stId, ciId, acId) => handleToggleAction(ciId, acId, 'subtask', stId)} onDeleteSubtaskActionItem={(stId, ciId, acId) => handleDeleteAction(ciId, acId, 'subtask', stId)}/>))) : (<p className="mb-2 text-sm text-muted-foreground">Aucune sous-tâche.</p>)}
              <div className="flex items-center space-x-2 mt-3"><Input value={newSubtaskName} onChange={(e) => setNewSubtaskName(e.target.value)} placeholder="Nom de la nouvelle sous-tâche" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtaskLocal())}/><Button type="button" onClick={handleAddSubtaskLocal} variant="outline"><PlusCircle className="h-4 w-4 mr-1" /> Ajouter sous-tâche</Button></div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary"/>Pièces jointes</CardTitle></CardHeader><CardContent>
              <Button type="button" onClick={handleAddAttachment} variant="outline" className="mb-3"><ImageIconLucide className="h-4 w-4 mr-1" /> Ajouter une pièce jointe</Button>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{taskData.attachments?.map(url => (<div key={url} className="relative group"><Image src={url} alt="Pièce jointe" width={150} height={100} className="rounded object-cover aspect-[3/2]" data-ai-hint="photo image" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveAttachment(url)}><Trash2 className="h-3 w-3" /></Button></div>))}</div>
              {(!taskData.attachments || taskData.attachments.length === 0) && <p className="text-sm text-muted-foreground">Aucune pièce jointe.</p>}
            </CardContent></Card>
          </form>
          </TooltipProvider>
        </ScrollArea>
        <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose><Button type="submit" onClick={handleSubmit}>{initialTask ? 'Sauvegarder les modifications' : 'Créer la tâche'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
