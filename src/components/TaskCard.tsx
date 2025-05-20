
'use client';

import React from 'react';
import type { Task, TaskPriority, TaskStatus, ChecklistItem, ActionItem } from '@/types/task';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit3, Trash2, MoreVertical, CalendarDays, Tag as TagIcon, ListChecks, Paperclip, ChevronDown, ChevronUp, UserCheck, Briefcase, Users, UserCircle, Feather, AlertTriangle, Shield, Activity, CornerDownRight } from 'lucide-react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { ChecklistItemDisplay } from './ChecklistItemDisplay'; // Will be updated to show actions
import { SubtaskItemDisplay } from './SubtaskItemDisplay';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { cn, renderIcon } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useProjects } from '@/hooks/useProjects';
import { useStatuses } from '@/hooks/useStatuses';
import { usePriorities } from '@/hooks/usePriorities';
import { useTags } from '@/hooks/useTags';
import { useUsers } from '@/hooks/useUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Checkbox } from './ui/checkbox';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdatePriority: (taskId: string, priority: TaskPriority) => void;
  onToggleTaskChecklistItem: (taskId: string, itemId: string) => void;
  onToggleSubtaskChecklistItem: (taskId: string, subtaskId: string, itemId: string) => void;
  // Action related callbacks for display only (no direct interaction from card)
  // We will display actions, but not interact with them from the card itself for now.
}

const priorityIconMapping: Record<TaskPriority, React.ElementType> = { High: AlertTriangle, Medium: Shield, Low: Feather };

const ActionItemCardDisplay = ({ action }: { action: ActionItem }) => (
  <div className="flex items-center space-x-2 py-0.5 pl-10 group">
    <CornerDownRight className="h-3 w-3 text-muted-foreground mr-1" />
    <Checkbox id={`action-card-${action.id}`} checked={action.completed} disabled className="h-3 w-3" />
    <label
      htmlFor={`action-card-${action.id}`}
      className={cn("text-xs leading-none flex-grow", action.completed && "line-through text-muted-foreground")}
    >
      {action.text}
    </label>
  </div>
);

const ChecklistItemCardDisplay = ({ item, onToggle, taskId }: { item: ChecklistItem, onToggle: (itemId: string) => void, taskId: string }) => (
  <div className="py-1">
    <div className="flex items-center space-x-2 group">
      <Checkbox
        id={`checklist-card-${taskId}-${item.id}`}
        checked={item.completed}
        onCheckedChange={() => onToggle(item.id)}
        aria-labelledby={`checklist-card-label-${taskId}-${item.id}`}
      />
      <label
        id={`checklist-card-label-${taskId}-${item.id}`}
        htmlFor={`checklist-card-${taskId}-${item.id}`}
        className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow", item.completed && "line-through text-muted-foreground")}
      >
        {item.text}
      </label>
    </div>
    {item.actions && item.actions.length > 0 && (
      <div className="mt-0.5 space-y-0.5">
        {item.actions.map(action => <ActionItemCardDisplay key={action.id} action={action} />)}
      </div>
    )}
  </div>
);

export function TaskCard({
  task, onEdit, onDelete, onUpdateStatus, onUpdatePriority,
  onToggleTaskChecklistItem, onToggleSubtaskChecklistItem,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  const { categories } = useCategories();
  const { projects } = useProjects();
  const { statuses: allStatuses } = useStatuses();
  const { priorities: allPriorities } = usePriorities();
  const { tags: allTags } = useTags();
  const { users } = useUsers();

  const taskCategory = task.category ? categories.find(c => c.name === task.category) : undefined;
  const taskProject = task.projectId ? projects.find(p => p.id === task.projectId) : undefined;
  const taskStatusDetails = task.status ? allStatuses.find(s => s.name === task.status) : undefined;
  const taskPriorityDetails = task.priority ? allPriorities.find(p => p.name === task.priority) : undefined;

  useEffect(() => {
    const update = () => {
      const dateToFormat = task.updatedAt || task.createdAt;
      if (dateToFormat && isValid(new Date(dateToFormat as any))) {
        setTimeAgo(formatDistanceToNow(new Date(dateToFormat as any), { addSuffix: true, locale: fr }));
      } else { setTimeAgo("date inconnue"); }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [task.updatedAt, task.createdAt]);

  const totalChecklistItems = task.checklist.length + task.subtasks.reduce((acc, st) => acc + st.checklist.length, 0);
  const completedChecklistItems = task.checklist.filter(i => i.completed).length + task.subtasks.reduce((acc, st) => acc + st.checklist.filter(i => i.completed).length, 0);
  const checklistProgress = totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0; 

  const defaultStatusProgress: Record<TaskStatus, number> = { 'To Do': 10, 'In Progress': 50, 'Done': 100 };
  const displayProgress = totalChecklistItems > 0 ? checklistProgress : (taskStatusDetails?.isCompletionStatus ? 100 : defaultStatusProgress[task.status as TaskStatus] || 0);
  
  const StatusIcon = taskStatusDetails?.iconName ? renderIcon(taskStatusDetails.iconName) : (taskStatusDetails?.isCompletionStatus ? UserCheck : Activity);
  const PriorityIcon = taskPriorityDetails?.iconName ? renderIcon(taskPriorityDetails.iconName) : (priorityIconMapping[task.priority] || Shield);
  
  const assignedUsersDetails = (task.assignedUserIds || []).map(userId => users.find(u => u.id === userId)).filter(user => user !== undefined) as NonNullable<typeof users[0]>[];
  const cardBorderColor = taskPriorityDetails?.color || taskCategory?.color || 'hsl(var(--border))';

  return (
    <TooltipProvider>
    <Card className={cn("mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4")} style={{borderLeftColor: cardBorderColor}}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold leading-tight">{task.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}><Edit3 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. La tâche "{task.name}" sera supprimée définitivement.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 items-center">
          <span>Mis à jour {timeAgo}</span>
          {taskCategory && (<span className="inline-flex items-center">· {renderIcon(taskCategory.iconName, {className:"h-3 w-3 mr-0.5 opacity-70", color: taskCategory.color || 'inherit'})} {taskCategory.name}</span>)}
          {taskProject && (<span className="inline-flex items-center">· {renderIcon(taskProject.iconName, {className:"h-3 w-3 mr-0.5 opacity-70", color: taskProject.color || 'inherit'})} {taskProject.name}</span>)}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {task.content && <p className="text-sm text-foreground/80 line-clamp-2">{task.content}</p>}
        <div className="flex flex-wrap gap-2 items-center">
          <DropdownMenu><DropdownMenuTrigger asChild>
            <Badge variant="outline" className={cn("cursor-pointer flex items-center gap-1")} style={taskPriorityDetails?.color ? { borderColor: taskPriorityDetails.color, backgroundColor: `${taskPriorityDetails.color}20`, color: taskPriorityDetails.color } : {}}>
              {React.isValidElement(PriorityIcon) ? React.cloneElement(PriorityIcon as React.ReactElement, {className: "h-3 w-3"}) : <Shield className="h-3 w-3"/>} {task.priority}
            </Badge></DropdownMenuTrigger>
            <DropdownMenuContent>{allPriorities.map(p => (<DropdownMenuItem key={p.id} onClick={() => onUpdatePriority(task.id, p.name as TaskPriority)}>{p.iconName && renderIcon(p.iconName, {className:"mr-2 h-4 w-4", color: p.color || 'inherit'})} Définir sur {p.name}</DropdownMenuItem>))}</DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild>
            <Badge variant="outline" className={cn("cursor-pointer flex items-center gap-1")} style={taskStatusDetails?.color ? { borderColor: taskStatusDetails.color, backgroundColor: `${taskStatusDetails.color}20`, color: taskStatusDetails.color } : {}}>
               {React.isValidElement(StatusIcon) ? React.cloneElement(StatusIcon as React.ReactElement, {className: "h-3 w-3"}) : <Activity className="h-3 w-3"/>} {task.status}
            </Badge></DropdownMenuTrigger>
            <DropdownMenuContent>{allStatuses.map(s => (<DropdownMenuItem key={s.id} onClick={() => onUpdateStatus(task.id, s.name as TaskStatus)}>{s.iconName && renderIcon(s.iconName, {className:"mr-2 h-4 w-4", color: s.color || 'inherit'})} Définir sur {s.name}</DropdownMenuItem>))}</DropdownMenuContent>
          </DropdownMenu>
          {task.dueDate && isValid(task.dueDate as Date) && (<Badge variant="outline" className="border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(task.dueDate as Date, "PP", { locale: fr })}</Badge>)}
        </div>
        {task.tags.length > 0 && (<div className="flex flex-wrap gap-1 items-center mt-1"><TagIcon className="h-4 w-4 text-muted-foreground mr-1" />{task.tags.slice(0, 3).map(tagName => { const tagDetails = allTags.find(t => t.name === tagName); return (<Badge key={tagName} variant="secondary" className="font-normal flex items-center gap-1" style={tagDetails?.color ? { backgroundColor: tagDetails.color, color: 'white' } : {}}>{tagDetails?.iconName && renderIcon(tagDetails.iconName, {className: "h-3 w-3"})}{tagName}</Badge>);})}{task.tags.length > 3 && <Badge variant="outline" className="ml-1">+{task.tags.length - 3}</Badge>}</div>)}
        {assignedUsersDetails.length > 0 && (<div className="flex flex-wrap gap-1 items-center mt-2"><Users className="h-4 w-4 text-muted-foreground mr-1" />{assignedUsersDetails.slice(0, 3).map(user => (<Tooltip key={user.id}><TooltipTrigger asChild><Avatar className="h-6 w-6 text-xs border-2 border-background shadow-sm"><AvatarImage src={user.avatarUrl || `https://placehold.co/24x24.png?text=${user.initials}`} alt={user.name} data-ai-hint="person face" /><AvatarFallback className="text-xs">{user.initials || <UserCircle className="h-4 w-4"/>}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{user.name}</p></TooltipContent></Tooltip>))}{assignedUsersDetails.length > 3 && (<Tooltip><TooltipTrigger asChild><Avatar className="h-6 w-6 text-xs border-2 border-background shadow-sm"><AvatarFallback className="text-xs bg-muted-foreground/20">+{assignedUsersDetails.length - 3}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{assignedUsersDetails.slice(3).map(u => u.name).join(', ')} et autres.</p></TooltipContent></Tooltip>)}</div>)}
        <div className="pt-1">
          <Progress value={displayProgress} className="h-2 w-full" indicatorClassName={cn(taskStatusDetails?.isCompletionStatus ? 'bg-green-500' : 'bg-primary', taskStatusDetails?.color && !taskStatusDetails?.isCompletionStatus && 'opacity-70')} style={taskStatusDetails?.color && !taskStatusDetails?.isCompletionStatus ? { '--custom-progress-indicator-color': taskStatusDetails.color } as React.CSSProperties : {}} />
          {totalChecklistItems > 0 && (<p className="text-xs text-muted-foreground mt-1">{completedChecklistItems} sur {totalChecklistItems} éléments terminés</p>)}
        </div>
        {isExpanded && (
          <div className="space-y-4 pt-2">
            {task.checklist.length > 0 && (<div><h4 className="font-medium text-sm mb-1 flex items-center"><ListChecks className="mr-2 h-4 w-4 text-primary" />Checklist Principale</h4>{task.checklist.map(item => (<ChecklistItemCardDisplay key={item.id} item={item} taskId={task.id} onToggle={(itemId) => onToggleTaskChecklistItem(task.id, itemId)} />))}</div>)}
            {task.subtasks.length > 0 && (<div><h4 className="font-medium text-sm mb-2">Sous-tâches ({task.subtasks.length})</h4>{task.subtasks.map(subtask => (<SubtaskItemDisplay key={subtask.id} subtask={subtask} taskId={task.id} onToggleChecklistItem={(subtaskId, itemId) => onToggleSubtaskChecklistItem(task.id, subtaskId, itemId)} onAddChecklistItem={() => {}} onDeleteChecklistItem={() => {}} onUpdateSubtask={() => {}} onDeleteSubtask={() => {}} isEditable={false} />))}</div>)}
            {task.attachments.length > 0 && (<div><h4 className="font-medium text-sm mb-2 flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary"/>Pièces jointes</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{task.attachments.map(url => (<div key={url} className="relative aspect-video rounded overflow-hidden shadow-sm"><Image src={url} alt="Pièce jointe" layout="fill" objectFit="cover" data-ai-hint="photo image" /></div>))}</div></div>)}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0"><Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-primary hover:text-primary/80 px-0">{isExpanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}{isExpanded ? 'Afficher moins de détails' : 'Afficher plus de détails'}</Button></CardFooter>
    </Card>
    </TooltipProvider>
  );
}
