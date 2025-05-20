
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useStatuses } from '@/hooks/useStatuses';
import { usePriorities } from '@/hooks/usePriorities';
import { useProjects } from '@/hooks/useProjects';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, ListChecks, CheckCircle2, AlertOctagon, Clock, Zap, AlertTriangle, Briefcase, Activity, CalendarClock, CalendarCheck, CalendarX, LineChart as LineChartIcon, PackageOpen } from 'lucide-react';
import { differenceInDays, isPast, isFuture, format, parseISO, startOfWeek, endOfWeek, isSameDay, addDays, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardTaskItem } from '@/components/dashboard/DashboardTaskItem';
import type { Task } from '@/types/task';

const COLORS_PIE = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const CHART_PRIMARY_COLOR = 'hsl(var(--primary))';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-background/90 border border-border rounded-lg shadow-xl text-sm backdrop-blur-sm">
        <p className="label font-semibold text-foreground mb-1">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center">
            <span style={{display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color || entry.fill, marginRight: '6px'}}></span>
            <span className="text-muted-foreground mr-1">{`${entry.name}:`}</span>
            <span className="font-medium text-foreground">{`${entry.value}`}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface EmptyChartStateProps {
  title: string;
  message: string;
  icon?: React.ElementType;
}

function EmptyChartState({ title, message, icon: IconComponent }: EmptyChartStateProps) {
  return (
    <Card className="shadow-lg col-span-1 flex flex-col justify-center items-center min-h-[300px] md:min-h-[388px] bg-card/80">
      <CardHeader className="pt-6 pb-2 text-center">
        <CardTitle className="text-lg flex flex-col items-center text-muted-foreground">
          {IconComponent && <IconComponent className="mb-2 h-8 w-8" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center justify-center flex-grow">
        <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { tasks, isTaskManagerInitialized } = useTaskManager();
  const { statuses: allStatuses, isLoading: isLoadingStatuses } = useStatuses();
  const { priorities: allPriorities, isLoading: isLoadingPriorities } = usePriorities();
  const { projects: allProjects, isLoading: isLoadingProjects } = useProjects();
  
  const isLoading = !isTaskManagerInitialized || isLoadingStatuses || isLoadingPriorities || isLoadingProjects;

  const dashboardData = useMemo(() => {
    if (isLoading || !tasks || !allStatuses || !allPriorities) return null;

    const now = new Date();
    const today = startOfToday();
    
    const startOfThisWeek = startOfWeek(now, { locale: fr });
    const endOfThisWeek = endOfWeek(now, { locale: fr });

    const completedStatusIds = allStatuses.filter(s => s.isCompletionStatus).map(s => s.id);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => {
        const statusDetail = allStatuses.find(s => s.name === t.status);
        return statusDetail?.isCompletionStatus || false;
    }).length;
    
    const nonCompletedTasks = tasks.filter(t => {
        const statusDetail = allStatuses.find(s => s.name === t.status);
        return !statusDetail?.isCompletionStatus;
    });

    const overdueTasks = nonCompletedTasks.filter(t => t.dueDate && isPast(t.dueDate as Date));

    const dueTodayTasks = nonCompletedTasks.filter(t => t.dueDate && isSameDay(t.dueDate as Date, today));
    
    const dueThisWeekTasks = nonCompletedTasks.filter(t => 
      t.dueDate && 
      isFuture(t.dueDate as Date) && 
      !isSameDay(t.dueDate as Date, today) &&
      (t.dueDate as Date) >= startOfThisWeek && 
      (t.dueDate as Date) <= endOfThisWeek
    );

    const activeTasks = totalTasks - completedTasks;
    
    const tasksCreatedLast7DaysData = Array(7).fill(null).map((_, i) => {
        const day = addDays(today, -6 + i);
        return {
            date: format(day, 'dd/MM', { locale: fr }),
            name: format(day, 'eee', { locale: fr }), 
            Créées: tasks.filter(t => t.createdAt && isSameDay(t.createdAt as Date, day)).length,
        };
    });

    return { 
      totalTasks, 
      completedTasks, 
      activeTasks,
      overdueTasksCount: overdueTasks.length,
      dueTodayTasksCount: dueTodayTasks.length,
      dueThisWeekTasksCount: dueThisWeekTasks.length,
      overdueTasksList: overdueTasks.sort((a,b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime()).slice(0, 5),
      dueSoonTasksList: [...dueTodayTasks, ...dueThisWeekTasks].sort((a,b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime()).slice(0,5),
      tasksCreatedLast7DaysData
    };
  }, [tasks, allStatuses, isLoading, allPriorities]);


  const tasksByStatusData = useMemo(() => {
    if (isLoading || !tasks || !allStatuses) return [];
    return allStatuses.map((status, index) => ({
      id: status.id,
      name: status.name,
      value: tasks.filter(task => task.status === status.name).length,
      fill: status.color || COLORS_PIE[index % COLORS_PIE.length],
      iconName: status.iconName,
    })).filter(s => s.value > 0).sort((a,b) => allStatuses.find(s => s.id === a.id)!.order - allStatuses.find(s => s.id === b.id)!.order);
  }, [tasks, allStatuses, isLoading]);

  const tasksByPriorityData = useMemo(() => {
    if (isLoading || !tasks || !allPriorities) return [];
    return allPriorities.map((priority, index) => ({
      id: priority.id,
      name: priority.name,
      value: tasks.filter(task => task.priority === priority.name).length,
      fill: priority.color || COLORS_PIE[index % COLORS_PIE.length],
      iconName: priority.iconName,
    })).filter(p => p.value > 0).sort((a,b) => allPriorities.find(p => p.id === a.id)!.order - allPriorities.find(p => p.id === b.id)!.order);
  }, [tasks, allPriorities, isLoading]);

  const tasksByProjectData = useMemo(() => {
    if (isLoading || !tasks || !allProjects) return [];
    return allProjects.map((project, index) => ({
      name: project.name,
      value: tasks.filter(task => task.projectId === project.id).length,
      fill: project.color || COLORS_PIE[index % COLORS_PIE.length],
      iconName: project.iconName,
    })).filter(p => p.value > 0);
  }, [tasks, allProjects, isLoading]);


  const kpis = dashboardData ? [
    { title: 'Tâches Totales', value: dashboardData.totalTasks, icon: ListChecks, color: 'text-primary', description: "Nombre total de tâches enregistrées." },
    { title: 'Tâches Terminées', value: dashboardData.completedTasks, icon: CheckCircle2, color: 'text-green-500', description: "Tâches marquées comme complétées." },
    { title: 'Tâches Actives', value: dashboardData.activeTasks, icon: Zap, color: 'text-blue-500', description: "Tâches non encore terminées." },
    { title: 'En Retard', value: dashboardData.overdueTasksCount, icon: CalendarX, color: 'text-red-500', description: "Tâches dont l'échéance est passée." },
    { title: 'Échéance Aujourd\'hui', value: dashboardData.dueTodayTasksCount, icon: CalendarClock, color: 'text-amber-500', description: "Tâches à terminer aujourd'hui." },
    { title: 'Échéance cette Semaine', value: dashboardData.dueThisWeekTasksCount, icon: CalendarCheck, color: 'text-sky-500', description: "Tâches à terminer cette semaine (hors aujourd'hui)." },
  ] : Array(6).fill({title: 'Calcul...', value: "...", icon: Clock, color: 'text-muted-foreground', description: 'Chargement des données...'});


  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!dashboardData || tasks.length === 0) {
    return (
        <div className="space-y-8">
            <header className="pb-4 border-b">
                <h1 className="text-4xl font-bold tracking-tight flex items-center">
                    <TrendingUp className="mr-3 h-10 w-10 text-primary" />
                    Tableau de Bord TaskFlow
                </h1>
                <p className="text-muted-foreground mt-1">Aperçu de vos activités et performances.</p>
            </header>
            <Card className="shadow-md col-span-full mt-6 flex flex-col items-center justify-center min-h-[400px] bg-card/90">
                <CardContent className="pt-6 text-center">
                    <TrendingUp className="mx-auto h-20 w-20 text-primary mb-6 opacity-70" />
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Le tableau de bord est vide</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Commencez par créer des tâches pour voir vos statistiques et graphiques s'afficher ici.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b">
        <h1 className="text-4xl font-bold tracking-tight flex items-center">
          <TrendingUp className="mr-3 h-10 w-10 text-primary" />
          Tableau de Bord TaskFlow
        </h1>
        <p className="text-muted-foreground mt-1">Aperçu de vos activités et performances.</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Indicateurs Clés</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/90 hover:bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi!.title}</CardTitle>
                {kpi!.icon && React.createElement(kpi!.icon, { className: `h-5 w-5 ${kpi!.color || 'text-muted-foreground'}` })}
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${kpi!.color || 'text-foreground'}`}>{kpi!.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{kpi!.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><CalendarX className="mr-2 h-5 w-5 text-red-500"/>Tâches en Retard ({dashboardData.overdueTasksList.length})</CardTitle>
                <CardDescription>{dashboardData.overdueTasksList.length > 0 ? `Les ${Math.min(dashboardData.overdueTasksList.length, 5)} tâches les plus anciennes en retard.` : "Aucune tâche en retard actuellement."}</CardDescription>
            </CardHeader>
            <CardContent>
                {dashboardData.overdueTasksList.length > 0 ? (
                    <div className="space-y-3">
                        {dashboardData.overdueTasksList.map(task => <DashboardTaskItem key={task.id} task={task} />)}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Bravo, aucune tâche en retard !</p>
                )}
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-amber-500"/>Échéances Proches ({dashboardData.dueSoonTasksList.length})</CardTitle>
                <CardDescription>{dashboardData.dueSoonTasksList.length > 0 ? `Les ${Math.min(dashboardData.dueSoonTasksList.length, 5)} prochaines tâches (aujourd'hui & cette semaine).` : "Aucune tâche avec une échéance proche."}</CardDescription>
            </CardHeader>
            <CardContent>
                 {dashboardData.dueSoonTasksList.length > 0 ? (
                    <div className="space-y-3">
                        {dashboardData.dueSoonTasksList.map(task => <DashboardTaskItem key={task.id} task={task} />)}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune tâche avec une échéance imminente.</p>
                )}
            </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Visualisations Détaillées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasksByStatusData.length > 0 ? (
            <Card className="shadow-lg col-span-1 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Tâches par Statut</CardTitle>
                <CardDescription>Répartition des tâches selon leur statut actuel.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={tasksByStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {tasksByStatusData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <EmptyChartState title="Tâches par Statut" message="Aucune tâche à afficher pour ce graphique." icon={Activity} />
          )}

          {tasksByPriorityData.length > 0 ? (
            <Card className="shadow-lg col-span-1 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-primary"/>Tâches par Priorité</CardTitle>
                <CardDescription>Distribution des tâches en fonction de leur priorité.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tasksByPriorityData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} interval={0} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Nombre de tâches" barSize={30}>
                       {tasksByPriorityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
             <EmptyChartState title="Tâches par Priorité" message="Aucune tâche à afficher pour ce graphique." icon={AlertTriangle} />
          )}
            
          {tasksByProjectData.length > 0 ? (
            <Card className="shadow-lg col-span-1 md:col-span-1 lg:col-span-1"> {/* Adjusted md and lg span */}
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Tâches par Projet</CardTitle>
                <CardDescription>Volume de tâches pour chaque projet.</CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                 <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tasksByProjectData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tâches" >
                         {tasksByProjectData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <EmptyChartState title="Tâches par Projet" message="Aucune tâche à afficher pour ce graphique." icon={Briefcase} />
          )}
        </div>
      </section>

       <section className="col-span-1 md:col-span-2 lg:col-span-3"> {/* Ensure this section spans full width on larger screens */}
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><LineChartIcon className="mr-2 h-5 w-5 text-primary"/>Tâches Créées Récemment</CardTitle>
                <CardDescription>Nombre de tâches créées par jour sur les 7 derniers jours.</CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
                {dashboardData.tasksCreatedLast7DaysData && dashboardData.tasksCreatedLast7DaysData.some(d => d.Créées > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.tasksCreatedLast7DaysData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="Créées" stroke={CHART_PRIMARY_COLOR} strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                     <EmptyChartState title="Tâches Créées Récemment" message="Aucune tâche créée ces 7 derniers jours." icon={LineChartIcon} />
                )}
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
