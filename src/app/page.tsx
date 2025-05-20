
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, ClipboardList, Filter, Loader2, ArrowDownUp } from 'lucide-react';
import { useTaskManager } from '@/hooks/useTaskManager';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStatuses } from '@/hooks/useStatuses';
import type { Status } from '@/types/status';
import { usePriorities } from '@/hooks/usePriorities';
import type { Priority } from '@/types/priority';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/project';
import { renderIcon } from '@/lib/utils';

type SortOption = 'updatedAt_desc' | 'createdAt_desc' | 'dueDate_asc' | 'priority_desc';

export default function HomePage() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addActionToChecklistItem,
    toggleActionItem,
    deleteActionItem,
    getTaskById,
    isTaskManagerInitialized,
  } = useTaskManager();
  
  const { statuses: allStatuses, isLoading: isLoadingStatuses } = useStatuses();
  const { priorities: allPriorities, isLoading: isLoadingPriorities } = usePriorities();
  const { projects: allProjects, isLoading: isLoadingProjects } = useProjects();

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt_desc');

  const handleOpenNewTaskForm = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId); 
    toast({ title: "Tâche supprimée", description: "La tâche a été supprimée avec succès." });
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status }); 
    toast({ title: "Statut mis à jour", description: `Le statut de la tâche est maintenant ${status}.` });
  };
  
  const handleUpdateTaskPriority = async (taskId: string, priority: TaskPriority) => {
    await updateTask(taskId, { priority }); 
    toast({ title: "Priorité mise à jour", description: `La priorité de la tâche est maintenant ${priority}.` });
  };

  const handleFormSubmit = async (taskData: Partial<Task>) => {
    if (editingTask && editingTask.id) {
      const { id, createdAt, updatedAt, ...updateData } = taskData;
      await updateTask(editingTask.id, updateData); 
      toast({ title: "Tâche mise à jour", description: "Votre tâche a été mise à jour avec succès." });
    } else {
      const newTaskData = taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
      await addTask(newTaskData); 
      toast({ title: "Tâche créée", description: "Une nouvelle tâche a été créée avec succès." });
    }
    setEditingTask(null);
  };
  
  const handleToggleTaskChecklistItem = async (taskId: string, itemId: string) => {
    await toggleChecklistItem(taskId, itemId, 'task');
  };

  const handleToggleSubtaskChecklistItem = async (taskId: string, subtaskId: string, itemId: string) => {
    const task = getTaskById(taskId); 
    if (task) {
      await toggleChecklistItem(taskId, itemId, 'subtask', subtaskId);
    }
  };

  const sortedAndFilteredTasks = useMemo(() => {
    const priorityOrderValue: Record<string, number> = {};
    if (allPriorities.length > 0) {
      allPriorities.forEach(p => {
        priorityOrderValue[p.name] = p.order;
      });
    }

    let processedTasks = tasks.filter(task => {
      const statusMatch = selectedStatusFilter === 'all' || task.status === selectedStatusFilter;
      const priorityMatch = selectedPriorityFilter === 'all' || task.priority === selectedPriorityFilter;
      const projectMatch = selectedProjectFilter === 'all' || task.projectId === selectedProjectFilter;
      return statusMatch && priorityMatch && projectMatch;
    });

    switch (sortOption) {
      case 'createdAt_desc':
        processedTasks.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
        break;
      case 'dueDate_asc':
        processedTasks.sort((a, b) => {
          if (!a.dueDate) return 1; 
          if (!b.dueDate) return -1; 
          return (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime();
        });
        break;
      case 'priority_desc':
        if (Object.keys(priorityOrderValue).length > 0) {
            processedTasks.sort((a, b) => (priorityOrderValue[a.priority] ?? Infinity) - (priorityOrderValue[b.priority] ?? Infinity));
        }
        break;
      case 'updatedAt_desc':
      default:
        processedTasks.sort((a, b) => (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime());
        break;
    }

    return processedTasks;
  }, [tasks, selectedStatusFilter, selectedPriorityFilter, selectedProjectFilter, sortOption, allPriorities]);

  const renderSelectTrigger = (
    placeholder: string, 
    value?: string, 
    collection?: Array<{id?: string; name: string; iconName?: string; color?: string}>, 
    isLoading?: boolean,
    isProjectFilter?: boolean 
  ) => {
    if (isLoading) {
      return (
        <Button variant="outline" className="w-full md:w-auto justify-start text-sm h-9" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </Button>
      );
    }
    
    if (value && value !== 'all') {
        const selectedItem = isProjectFilter 
            ? collection?.find(item => item.id === value) 
            : collection?.find(item => item.name === value); 

        if (selectedItem) {
            return (
                 <SelectTrigger className="w-full md:w-auto text-sm h-9">
                    <SelectValue placeholder={placeholder}>
                        <div className="flex items-center gap-2">
                        {selectedItem.iconName && renderIcon(selectedItem.iconName, {className: "h-4 w-4", color: selectedItem.color || 'inherit'})}
                        <span>{selectedItem.name}</span>
                        </div>
                    </SelectValue>
                 </SelectTrigger>
            );
        }
    }
     return (
        <SelectTrigger className="w-full md:w-auto text-sm h-9">
            <SelectValue placeholder={placeholder}>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>{placeholder}</span>
              </div>
            </SelectValue>
        </SelectTrigger>
     );
  };

  const renderSelectItem = (item: {id?:string; name: string; iconName?: string; color?: string}, isAllOption: boolean = false, allLabel: string = "Tous", valueKey: 'name' | 'id' = 'name') => {
    const itemValue = isAllOption ? 'all' : (valueKey === 'id' && item.id ? item.id : item.name);
    return (
      <SelectItem key={itemValue} value={itemValue!}>
        <div className="flex items-center gap-2">
          {!isAllOption && item.iconName && renderIcon(item.iconName, {className: "h-4 w-4", color: item.color || 'inherit'})}
          <span>{isAllOption ? allLabel : item.name}</span>
        </div>
      </SelectItem>
    );
  }

  const sortOptions: {value: SortOption, label: string}[] = [
    { value: 'updatedAt_desc', label: 'Date de MAJ (récente)' },
    { value: 'createdAt_desc', label: 'Date de création (récente)' },
    { value: 'dueDate_asc', label: 'Date d\'échéance (proche)' },
    { value: 'priority_desc', label: 'Priorité (haute à basse)' },
  ];


  if (!isTaskManagerInitialized || isLoadingPriorities) { // Added isLoadingPriorities to wait for priorityOrderValue
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-[150px] rounded-md" /> {/* Sort Skeleton */}
            <Skeleton className="h-9 w-[150px] rounded-md" /> 
            <Skeleton className="h-9 w-[150px] rounded-md" />
            <Skeleton className="h-9 w-[150px] rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" /> 
            <Skeleton className="h-9 w-9 rounded-md" /> 
            <Skeleton className="h-9 w-36 rounded-md" /> 
          </div>
        </div>
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-center md:text-left shrink-0">Mes Tâches</h1>
        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end w-full">
          {/* Sort Select */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full md:w-auto text-sm h-9">
              <ArrowDownUp className="mr-2 h-4 w-4 opacity-70" />
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        
          {/* Status Filter */}
          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            {renderSelectTrigger("Filtrer par statut", selectedStatusFilter, allStatuses, isLoadingStatuses)}
            <SelectContent>
              {renderSelectItem({name: 'all', iconName: 'Filter'}, true, "Tous les statuts")}
              {allStatuses.map(status => renderSelectItem(status))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
            {renderSelectTrigger("Filtrer par priorité", selectedPriorityFilter, allPriorities, isLoadingPriorities)}
            <SelectContent>
              {renderSelectItem({name: 'all', iconName: 'Filter'}, true, "Toutes les priorités")}
              {allPriorities.map(priority => renderSelectItem(priority))}
            </SelectContent>
          </Select>

          {/* Project Filter */}
          <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
            {renderSelectTrigger("Filtrer par projet", selectedProjectFilter, allProjects, isLoadingProjects, true)}
            <SelectContent>
              {renderSelectItem({name: 'all', iconName: 'Filter'}, true, "Tous les projets", 'id')}
              {allProjects.map(project => renderSelectItem(project, false, "", 'id'))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} aria-label="Vue grille" className="h-9 w-9">
                <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} aria-label="Vue liste" className="h-9 w-9">
                <List className="h-5 w-5" />
            </Button>
            <Button onClick={handleOpenNewTaskForm} className="shadow-md h-9 text-sm">
                <PlusCircle className="mr-2 h-5 w-5" /> Ajouter une tâche
            </Button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
          <ClipboardList className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Aucune tâche pour le moment !</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Votre liste de tâches est vide. Cliquez sur le bouton "Ajouter une tâche" pour créer votre première tâche.
          </p>
        </div>
      ) : sortedAndFilteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
          <Filter className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Aucune tâche ne correspond à vos filtres.</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Essayez d'ajuster les filtres de statut, de priorité ou de projet, ou ajoutez des tâches qui correspondent à vos critères.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {sortedAndFilteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onUpdateStatus={handleUpdateTaskStatus}
              onUpdatePriority={handleUpdateTaskPriority}
              onToggleTaskChecklistItem={handleToggleTaskChecklistItem}
              onToggleSubtaskChecklistItem={handleToggleSubtaskChecklistItem}
            />
          ))}
        </div>
      )}

      <TaskForm
        isOpen={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
        onAddSubtask={async (taskId, subtaskData) => {
            const currentTask = getTaskById(taskId);
            if(currentTask) return await addSubtask(currentTask.id, subtaskData);
            return undefined;
        }}
        onUpdateSubtask={async (taskId, subtaskId, updates) => {
            const currentTask = getTaskById(taskId);
            if(currentTask) await updateSubtask(currentTask.id, subtaskId, updates);
        }}
        onDeleteSubtask={async (taskId, subtaskId) => {
            const currentTask = getTaskById(taskId);
            if(currentTask) await deleteSubtask(currentTask.id, subtaskId);
        }}
        onAddChecklistItem={async (parentId, itemText, parentType, subtaskId) => {
            return await addChecklistItem(parentId, itemText, parentType, subtaskId);
        }}
        onToggleChecklistItem={async (parentId, itemId, parentType, subtaskId) => {
            await toggleChecklistItem(parentId, itemId, parentType, subtaskId);
        }}
        onDeleteChecklistItem={async (parentId, itemId, parentType, subtaskId) => {
            await deleteChecklistItem(parentId, itemId, parentType, subtaskId);
        }}
        onAddActionToChecklistItem={async (parentId, checklistItemId, actionText, parentType, subtaskId) => {
            return await addActionToChecklistItem(parentId, checklistItemId, actionText, parentType, subtaskId);
        }}
        onToggleActionItem={async (parentId, checklistItemId, actionItemId, parentType, subtaskId) => {
            await toggleActionItem(parentId, checklistItemId, actionItemId, parentType, subtaskId);
        }}
        onDeleteActionItem={async (parentId, checklistItemId, actionItemId, parentType, subtaskId) => {
           await deleteActionItem(parentId, checklistItemId, actionItemId, parentType, subtaskId);
        }}
      />
    </div>
  );
}

const CardSkeleton = () => (
  <div className="p-4 border rounded-lg shadow-sm space-y-3 bg-card">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);
    

    