
import type { Task, Subtask, ChecklistItem, TaskPriority, TaskStatus } from '@/types/task';

let taskIdCounter = 1;
let subtaskIdCounter = 1;
let checklistIdCounter = 1;

const createTask = (
  name: string,
  content: string,
  category: string,
  priority: TaskPriority,
  status: TaskStatus,
  tags: string[],
  attachments: string[],
  subtasks: Subtask[],
  checklist: ChecklistItem[]
): Task => {
  const now = new Date();
  return {
    id: `task-${taskIdCounter++}`,
    name,
    content,
    category,
    priority,
    status,
    tags,
    attachments,
    subtasks,
    checklist,
    createdAt: now,
    updatedAt: now,
  };
};

const createSubtask = (name: string, priority: TaskPriority, status: TaskStatus, checklist: ChecklistItem[]): Subtask => {
  return {
    id: `subtask-${subtaskIdCounter++}`,
    name,
    priority,
    status,
    checklist,
  };
};

const createChecklistItem = (text: string, completed: boolean): ChecklistItem => {
  return {
    id: `checklist-${checklistIdCounter++}`,
    text,
    completed,
  };
};

export const mockTasks: Task[] = [
  createTask(
    'Design new homepage layout',
    'Create a modern and responsive design for the homepage, focusing on user engagement and conversion. Consider A/B testing elements.',
    'Design',
    'High',
    'In Progress',
    ['ui', 'ux', 'responsive', 'web design'],
    ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
    [
      createSubtask('Wireframing', 'High', 'Done', [
        createChecklistItem('Define key sections', true),
        createChecklistItem('Sketch mobile layout', true),
        createChecklistItem('Sketch desktop layout', true),
      ]),
      createSubtask('Visual Mockups', 'High', 'In Progress', [
        createChecklistItem('Select color palette', true),
        createChecklistItem('Design hero section', false),
        createChecklistItem('Design feature showcase', false),
      ]),
    ],
    [
      createChecklistItem('Review competitor websites', true),
      createChecklistItem('Gather design assets', true),
      createChecklistItem('Finalize typography choices', false),
    ]
  ),
  createTask(
    'Develop API for user authentication',
    'Implement secure API endpoints for user registration, login, and password reset. Use JWT for token-based authentication.',
    'Development',
    'High',
    'To Do',
    ['api', 'backend', 'security', 'jwt'],
    [],
    [
      createSubtask('Setup database schema', 'High', 'To Do', []),
      createSubtask('Implement registration endpoint', 'High', 'To Do', []),
      createSubtask('Implement login endpoint', 'Medium', 'To Do', []),
    ],
    [
      createChecklistItem('Research OAuth2 best practices', false),
      createChecklistItem('Choose hashing algorithm for passwords', false),
    ]
  ),
  createTask(
    'Plan Q3 Marketing Campaign',
    'Outline the strategy, channels, budget, and KPIs for the upcoming Q3 marketing campaign. Focus on social media and content marketing.',
    'Marketing',
    'Medium',
    'To Do',
    ['strategy', 'social media', 'content', 'budgeting'],
    ['https://placehold.co/600x400.png'],
    [],
    [
      createChecklistItem('Define target audience', false),
      createChecklistItem('Set campaign goals', false),
      createChecklistItem('Allocate budget across channels', false),
      createChecklistItem('Create content calendar', false),
    ]
  ),
  createTask(
    'Client Onboarding Call',
    'Conduct an onboarding call with the new client "Innovatech Solutions" to discuss project scope, timelines, and expectations.',
    'Client Management',
    'High',
    'Done',
    ['client communication', 'meeting', 'project kickoff'],
    [],
    [],
    [
      createChecklistItem('Prepare agenda', true),
      createChecklistItem('Send meeting invite', true),
      createChecklistItem('Follow up with meeting notes', true),
    ]
  ),
];
