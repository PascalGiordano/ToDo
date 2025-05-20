
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, Subtask, ChecklistItem, TaskPriority, TaskStatus, ActionItem } from '@/types/task';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskManagerInitialized, setIsTaskManagerInitialized] = useState(false);
  const { toast } = useToast();
  
  const generateId = useCallback((prefix: string = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, []);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData: Task[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        tasksData.push({
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : undefined),
          projectId: data.projectId || null, 
          projectName: data.projectName || null, 
          assignedUserIds: data.assignedUserIds || [],
          assignedUserNames: data.assignedUserNames || [],
          subtasks: (data.subtasks || []).map((st: any) => ({
            ...st,
            id: st.id || generateId('subtask'), 
            priority: st.priority || 'Medium',
            status: st.status || 'To Do',
            checklist: (st.checklist || []).map((ci: any) => ({
              ...ci,
              id: ci.id || generateId('checklist'),
              actions: (ci.actions || []).map((ac: any) => ({
                ...ac,
                id: ac.id || generateId('action'),
              })),
            })),
          })),
          checklist: (data.checklist || []).map((ci: any) => ({
            ...ci,
            id: ci.id || generateId('checklist'),
            actions: (ci.actions || []).map((ac: any) => ({
              ...ac,
              id: ac.id || generateId('action'),
            })),
          }))
        } as Task);
      });
      setTasks(tasksData);
      if (!isTaskManagerInitialized) {
        setIsTaskManagerInitialized(true);
      }
    }, (error) => {
      console.error("Erreur de chargement des tâches depuis Firestore: ", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les tâches depuis la base de données.",
        variant: "destructive",
      });
      if (!isTaskManagerInitialized) {
        setIsTaskManagerInitialized(true);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, generateId]); // Removed isTaskManagerInitialized to prevent re-subscribing unnecessarily
  

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const finalChecklist = (taskData.checklist || []).map(item => ({
      ...item,
      id: item.id?.startsWith('temp-') ? generateId('cl') : item.id || generateId('cl'),
      actions: (item.actions || []).map(action => ({
        ...action,
        id: action.id?.startsWith('temp-') ? generateId('ac') : action.id || generateId('ac'),
      })),
    }));

    const finalSubtasks = (taskData.subtasks || []).map(subtask => ({
      ...subtask,
      id: subtask.id?.startsWith('temp-') ? generateId('st') : subtask.id || generateId('st'),
      priority: subtask.priority || 'Medium',
      status: subtask.status || 'To Do',
      checklist: (subtask.checklist || []).map(checklistItem => ({
        ...checklistItem,
        id: checklistItem.id?.startsWith('temp-') ? generateId('stcl') : checklistItem.id || generateId('stcl'),
        actions: (checklistItem.actions || []).map(action => ({
          ...action,
          id: action.id?.startsWith('temp-') ? generateId('stac') : action.id || generateId('stac'),
        })),
      })),
    }));

    const taskToSave: any = {
      name: taskData.name || 'Tâche sans titre',
      content: taskData.content || '',
      category: taskData.category || '',
      priority: (taskData.priority as TaskPriority) || 'Medium',
      status: (taskData.status as TaskStatus) || 'To Do',
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      attachments: Array.isArray(taskData.attachments) ? taskData.attachments : [],
      subtasks: finalSubtasks,
      checklist: finalChecklist,
      projectId: taskData.projectId || null,
      projectName: taskData.projectName || null, 
      assignedUserIds: Array.isArray(taskData.assignedUserIds) ? taskData.assignedUserIds : [],
      assignedUserNames: Array.isArray(taskData.assignedUserNames) ? taskData.assignedUserNames : [],
      dueDate: taskData.dueDate instanceof Date ? Timestamp.fromDate(taskData.dueDate) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
     
    delete taskToSave.id; 

    try {
      const docRef = await addDoc(collection(db, 'tasks'), taskToSave);
      return docRef.id;
    } catch (error) {
      console.error("Error adding task: ", error);
      toast({
        title: "Erreur d'ajout de tâche",
        description: "La tâche n'a pas pu être ajoutée. Vérifiez les logs pour plus de détails.",
        variant: "destructive",
      });
      throw error;
    }
  }, [generateId, toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const taskRef = doc(db, 'tasks', taskId);
    try {
      const dataToUpdate: any = { ...updates };
      
      if (updates.hasOwnProperty('priority')) dataToUpdate.priority = (updates.priority as TaskPriority) || 'Medium';
      if (updates.hasOwnProperty('status')) dataToUpdate.status = (updates.status as TaskStatus) || 'To Do';
      if (updates.hasOwnProperty('projectId')) dataToUpdate.projectId = updates.projectId || null;
      if (updates.hasOwnProperty('projectName')) dataToUpdate.projectName = updates.projectName || null;
      if (updates.hasOwnProperty('category')) dataToUpdate.category = updates.category || '';
      if (updates.hasOwnProperty('assignedUserIds')) dataToUpdate.assignedUserIds = Array.isArray(updates.assignedUserIds) ? updates.assignedUserIds : [];
      if (updates.hasOwnProperty('assignedUserNames')) dataToUpdate.assignedUserNames = Array.isArray(updates.assignedUserNames) ? updates.assignedUserNames : [];

      if (updates.dueDate instanceof Date) dataToUpdate.dueDate = Timestamp.fromDate(updates.dueDate);
      else if (updates.hasOwnProperty('dueDate') && (updates.dueDate === undefined || updates.dueDate === null)) dataToUpdate.dueDate = null; 

      if (dataToUpdate.subtasks) {
        dataToUpdate.subtasks = dataToUpdate.subtasks.map((st: Subtask) => ({
          ...st,
          id: st.id?.startsWith('temp-') ? generateId('st') : st.id || generateId('st'),
          priority: st.priority || 'Medium',
          status: st.status || 'To Do',
          checklist: (st.checklist || []).map((ci: ChecklistItem) => ({
            ...ci,
            id: ci.id?.startsWith('temp-') ? generateId('stcl') : ci.id || generateId('stcl'),
            actions: (ci.actions || []).map((ac: ActionItem) => ({
                ...ac,
                id: ac.id?.startsWith('temp-') ? generateId('stac') : ac.id || generateId('stac'),
            }))
          })),
        }));
      }
      if (dataToUpdate.checklist) {
        dataToUpdate.checklist = dataToUpdate.checklist.map((ci: ChecklistItem) => ({
          ...ci,
          id: ci.id?.startsWith('temp-') ? generateId('cl') : ci.id || generateId('cl'),
          actions: (ci.actions || []).map((ac: ActionItem) => ({
            ...ac,
            id: ac.id?.startsWith('temp-') ? generateId('ac') : ac.id || generateId('ac'),
          }))
        }));
      }
      
      await updateDoc(taskRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating task: ", error);
      toast({
        title: "Erreur de mise à jour de tâche",
        description: "La tâche n'a pas pu être mise à jour. Vérifiez les logs pour plus de détails.",
        variant: "destructive",
      });
      throw error; 
    }
  }, [toast, generateId]);

  const deleteTask = useCallback(async (taskId: string) => {
    const taskRef = doc(db, 'tasks', taskId);
    try {
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task: ", error);
      toast({
        title: "Erreur de suppression de tâche",
        description: "La tâche n'a pas pu être supprimée.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const addSubtask = useCallback(async (taskId: string, subtaskData: Omit<Subtask, 'id' | 'checklist'>) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      toast({ title: "Erreur", description: "Tâche parente non trouvée pour ajout de sous-tâche.", variant: "destructive"});
      return undefined;
    }
    const task = taskSnapshot.data() as Task;
    const newSubtask: Subtask = {
      name: subtaskData.name,
      priority: subtaskData.priority || 'Medium',
      status: subtaskData.status || 'To Do',
      id: generateId('st'),
      checklist: [], 
    };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    try {
      await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      return newSubtask; 
    } catch (error) {
       console.error("Error adding subtask:", error);
       toast({ title: "Erreur d'ajout de sous-tâche", description: "Impossible d'ajouter la sous-tâche.", variant: "destructive"});
       throw error;
    }
  }, [generateId, toast]);

  const updateSubtask = useCallback(async (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      toast({ title: "Erreur", description: "Tâche parente non trouvée pour mise à jour de sous-tâche.", variant: "destructive"});
      return;
    }
    const task = taskSnapshot.data() as Task;
    const updatedSubtasks = (task.subtasks || []).map(subtask =>
      subtask.id === subtaskId ? { 
        ...subtask, 
        ...updates,
        priority: updates.priority || subtask.priority || 'Medium',
        status: updates.status || subtask.status || 'To Do',
        checklist: (updates.checklist || subtask.checklist || []).map(ci => ({
            ...ci,
            id: ci.id?.startsWith('temp-') ? generateId('stcl') : ci.id || generateId('stcl'),
            actions: (ci.actions || []).map(ac => ({
                ...ac,
                id: ac.id?.startsWith('temp-') ? generateId('stac') : ac.id || generateId('stac'),
            }))
        }))
      } : subtask
    );
    try {
      await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
    } catch (error) {
       console.error("Error updating subtask:", error);
       toast({ title: "Erreur de mise à jour de sous-tâche", description: "Impossible de mettre à jour la sous-tâche.", variant: "destructive"});
       throw error;
    }
  }, [toast, generateId]);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        toast({ title: "Erreur", description: "Tâche parente non trouvée pour suppression de sous-tâche.", variant: "destructive"});
        return;
    }
    const task = taskSnapshot.data() as Task;
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    try {
      await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
    } catch (error) {
       console.error("Error deleting subtask:", error);
       toast({ title: "Erreur de suppression de sous-tâche", description: "Impossible de supprimer la sous-tâche.", variant: "destructive"});
       throw error;
    }
  }, [toast]);
  
  const addChecklistItem = useCallback(async (parentId: string, itemText: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', parentType === 'task' ? parentId : taskId); // taskId would be parentId for subtask context
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        toast({ title: "Erreur", description: "Élément parent non trouvé pour ajout de checklist.", variant: "destructive"});
        return undefined;
    }
    const task = taskSnapshot.data() as Task;
    const newItem: ChecklistItem = { id: generateId('cli'), text: itemText, completed: false, actions: [] };

    try {
      if (parentType === 'task') {
        const updatedChecklist = [...(task.checklist || []), newItem];
        await updateDoc(taskRef, { checklist: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
        const updatedSubtasks = (task.subtasks || []).map(st => 
          st.id === subtaskId ? { ...st, checklist: [...(st.checklist || []), newItem] } : st
        );
        await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
      return newItem;
    } catch (error) {
      console.error("Error adding checklist item:", error);
      toast({ title: "Erreur d'ajout d'élément de checklist", description: "Impossible d'ajouter l'élément.", variant: "destructive"});
      throw error;
    }
  }, [generateId, toast]);

  const toggleChecklistItem = useCallback(async (parentId: string, itemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', parentType === 'task' ? parentId : taskId);
    const taskSnapshot = await getDoc(taskRef);
     if (!taskSnapshot.exists()) {
        toast({ title: "Erreur", description: "Élément parent non trouvé pour basculement de checklist.", variant: "destructive"});
        return;
    }
    const task = taskSnapshot.data() as Task;
    
    try {
      if (parentType === 'task') {
        const updatedChecklist = (task.checklist || []).map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        await updateDoc(taskRef, { checklist: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
        const updatedSubtasks = (task.subtasks || []).map(st => 
          st.id === subtaskId 
            ? { ...st, checklist: (st.checklist || []).map(item => 
                item.id === itemId ? { ...item, completed: !item.completed } : item
              )} 
            : st
        );
        await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
    } catch (error) {
       console.error("Error toggling checklist item:", error);
       toast({ title: "Erreur de mise à jour de checklist", description: "Impossible de mettre à jour l'élément.", variant: "destructive"});
       throw error;
    }
  }, [toast]);
  
  const deleteChecklistItem = useCallback(async (parentId: string, itemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', parentType === 'task' ? parentId : taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        toast({ title: "Erreur", description: "Élément parent non trouvé pour suppression de checklist.", variant: "destructive"});
        return;
    }
    const task = taskSnapshot.data() as Task;

    try {
      if (parentType === 'task') {
        const updatedChecklist = (task.checklist || []).filter(item => item.id !== itemId);
        await updateDoc(taskRef, { checklist: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
        const updatedSubtasks = (task.subtasks || []).map(st => 
          st.id === subtaskId ? { ...st, checklist: (st.checklist || []).filter(item => item.id !== itemId) } : st
        );
        await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
    } catch (error) {
       console.error("Error deleting checklist item:", error);
       toast({ title: "Erreur de suppression de checklist", description: "Impossible de supprimer l'élément.", variant: "destructive"});
       throw error;
    }
  }, [toast]);

  // --- ActionItem Management ---
  const addActionToChecklistItem = useCallback(async (taskId: string, checklistItemId: string, actionText: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      toast({ title: "Erreur", description: "Tâche non trouvée.", variant: "destructive" });
      return undefined;
    }
    const task = taskSnapshot.data() as Task;
    const newAction: ActionItem = { id: generateId('act'), text: actionText, completed: false };

    let checklistToUpdate: ChecklistItem[] | undefined;
    let updatePath: string;

    if (parentType === 'task') {
      checklistToUpdate = task.checklist;
      updatePath = 'checklist';
    } else if (parentType === 'subtask' && subtaskId) {
      const subtask = (task.subtasks || []).find(st => st.id === subtaskId);
      if (!subtask) {
        toast({ title: "Erreur", description: "Sous-tâche non trouvée.", variant: "destructive" });
        return undefined;
      }
      checklistToUpdate = subtask.checklist;
      updatePath = `subtasks`; // We'll update the whole subtasks array
    } else {
      return undefined;
    }
    
    if (!checklistToUpdate) return undefined;

    const updatedChecklist = checklistToUpdate.map(ci => 
      ci.id === checklistItemId 
        ? { ...ci, actions: [...(ci.actions || []), newAction] }
        : ci
    );

    try {
      if (parentType === 'task') {
        await updateDoc(taskRef, { [updatePath]: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
         const updatedSubtasks = (task.subtasks || []).map(st => 
            st.id === subtaskId ? { ...st, checklist: updatedChecklist} : st
         );
         await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
      return newAction;
    } catch (error) {
      console.error("Error adding action item:", error);
      toast({ title: "Erreur d'ajout d'action", description: "Impossible d'ajouter l'action.", variant: "destructive" });
      throw error;
    }
  }, [generateId, toast]);

  const toggleActionItem = useCallback(async (taskId: string, checklistItemId: string, actionItemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      toast({ title: "Erreur", description: "Tâche non trouvée.", variant: "destructive" });
      return;
    }
    const task = taskSnapshot.data() as Task;

    let checklistToUpdate: ChecklistItem[] | undefined;
    let updatePath: string;

    if (parentType === 'task') {
      checklistToUpdate = task.checklist;
      updatePath = 'checklist';
    } else if (parentType === 'subtask' && subtaskId) {
      const subtask = (task.subtasks || []).find(st => st.id === subtaskId);
      if (!subtask) {
        toast({ title: "Erreur", description: "Sous-tâche non trouvée.", variant: "destructive" });
        return;
      }
      checklistToUpdate = subtask.checklist;
      updatePath = `subtasks`;
    } else { return; }

    if (!checklistToUpdate) return;

    const updatedChecklist = checklistToUpdate.map(ci => 
      ci.id === checklistItemId 
        ? { ...ci, actions: (ci.actions || []).map(ac => ac.id === actionItemId ? { ...ac, completed: !ac.completed } : ac) }
        : ci
    );
    
    try {
       if (parentType === 'task') {
        await updateDoc(taskRef, { [updatePath]: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
         const updatedSubtasks = (task.subtasks || []).map(st => 
            st.id === subtaskId ? { ...st, checklist: updatedChecklist} : st
         );
         await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
    } catch (error) {
      console.error("Error toggling action item:", error);
      toast({ title: "Erreur de mise à jour d'action", description: "Impossible de mettre à jour l'action.", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  const deleteActionItem = useCallback(async (taskId: string, checklistItemId: string, actionItemId: string, parentType: 'task' | 'subtask', subtaskId?: string) => {
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      toast({ title: "Erreur", description: "Tâche non trouvée.", variant: "destructive" });
      return;
    }
    const task = taskSnapshot.data() as Task;

    let checklistToUpdate: ChecklistItem[] | undefined;
    let updatePath: string;

    if (parentType === 'task') {
      checklistToUpdate = task.checklist;
      updatePath = 'checklist';
    } else if (parentType === 'subtask' && subtaskId) {
      const subtask = (task.subtasks || []).find(st => st.id === subtaskId);
      if (!subtask) {
        toast({ title: "Erreur", description: "Sous-tâche non trouvée.", variant: "destructive" });
        return;
      }
      checklistToUpdate = subtask.checklist;
      updatePath = `subtasks`;
    } else { return; }

    if (!checklistToUpdate) return;

    const updatedChecklist = checklistToUpdate.map(ci => 
      ci.id === checklistItemId 
        ? { ...ci, actions: (ci.actions || []).filter(ac => ac.id !== actionItemId) }
        : ci
    );

    try {
      if (parentType === 'task') {
        await updateDoc(taskRef, { [updatePath]: updatedChecklist, updatedAt: serverTimestamp() });
      } else if (parentType === 'subtask' && subtaskId) {
         const updatedSubtasks = (task.subtasks || []).map(st => 
            st.id === subtaskId ? { ...st, checklist: updatedChecklist} : st
         );
         await updateDoc(taskRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() });
      }
    } catch (error) {
      console.error("Error deleting action item:", error);
      toast({ title: "Erreur de suppression d'action", description: "Impossible de supprimer l'action.", variant: "destructive" });
      throw error;
    }
  }, [toast]);


  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  return {
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
  };
}
