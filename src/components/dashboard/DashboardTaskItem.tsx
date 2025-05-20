
'use client';

import type { Task } from '@/types/task';
import { Card } from '@/components/ui/card'; // Removed CardContent as it's not used
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, renderIcon } from '@/lib/utils';
import { Calendar } from 'lucide-react'; // Removed unused icons
import { usePriorities } from '@/hooks/usePriorities';
import { useStatuses } from '@/hooks/useStatuses';

interface DashboardTaskItemProps {
  task: Task;
  // onEdit?: (task: Task) => void; // Future: open task form for editing
}

export function DashboardTaskItem({ task /*, onEdit */ }: DashboardTaskItemProps) {
  const { priorities: allPriorities } = usePriorities();
  const { statuses: allStatuses } = useStatuses();

  const priorityDetails = allPriorities.find(p => p.name === task.priority);
  const statusDetails = allStatuses.find(s => s.name === task.status);

  const dueDateFormatted = task.dueDate ? format(task.dueDate as Date, 'd MMM yy', { locale: fr }) : 'N/A';
  const isOverdue = task.dueDate && isPast(task.dueDate as Date) && !statusDetails?.isCompletionStatus;

  return (
    <Card 
      className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card/70 hover:bg-card"
      // onClick={onEdit ? () => onEdit(task) : undefined} 
      role="button" // Indicates interactivity
      tabIndex={0}  // Makes it focusable
      aria-label={`Voir détails de la tâche ${task.name}`}
      onKeyDown={(e) => {
        // if (e.key === 'Enter' || e.key === ' ') {
        //   if (onEdit) onEdit(task);
        // }
      }}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-semibold text-foreground truncate pr-2" title={task.name}>{task.name}</p>
        {priorityDetails && (
          <Badge 
            variant="outline" 
            className="text-xs shrink-0"
            style={priorityDetails.color ? { borderColor: priorityDetails.color, backgroundColor: `${priorityDetails.color}20`, color: priorityDetails.color } : {}}
          >
            {renderIcon(priorityDetails.iconName, { className: "h-3 w-3 mr-1"})}
            {priorityDetails.name}
          </Badge>
        )}
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
         {statusDetails && (
          <span className="flex items-center" style={statusDetails.color ? { color: statusDetails.color} : {}}>
            {renderIcon(statusDetails.iconName || (statusDetails.isCompletionStatus ? 'CheckCircle' : 'Activity'), { className: "h-3.5 w-3.5 mr-1"})}
            {statusDetails.name}
          </span>
        )}
        <span className={cn("flex items-center", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {dueDateFormatted}
        </span>
      </div>
    </Card>
  );
}

    
