import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types';

export interface TaskMutationResult {
  success: boolean;
  error?: string;
}

export function useTasks() {
  const { householdId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdId)
        .order('deadline', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadTasks();
    const handleFocus = () => loadTasks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTasks]);

  const addTask = async (task: Omit<Task, 'id' | 'household_id' | 'completed'>): Promise<TaskMutationResult> => {
    if (!householdId) return { success: false, error: 'No se encontró un hogar activo.' };
    try {
      const insertPayload = {
        title: task.title,
        deadline: task.deadline,
        ...(task.due_time ? { due_time: task.due_time } : {}),
        household_id: householdId,
        completed: false
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      if (data) setTasks(currentTasks => [data, ...currentTasks]);
      return { success: true };
    } catch (error) {
      console.error('Error adding task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar el por hacer.'
      };
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const downloadICS = (task: Task) => {
    const dateIso = task.deadline.replace(/-/g, '');
    const timeIso = task.due_time?.replace(':', '').slice(0, 4);
    const dtStart = timeIso
      ? `DTSTART:${dateIso}T${timeIso}00`
      : `DTSTART;VALUE=DATE:${dateIso}`;
    const dtEnd = timeIso
      ? `DTEND:${dateIso}T${timeIso}00`
      : `DTEND;VALUE=DATE:${dateIso}`;
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nuestra Cuenta//Recordatorios//ES',
      'BEGIN:VEVENT',
      `UID:${task.id}@nuestracuenta.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtStart,
      dtEnd,
      `SUMMARY:${task.title}`,
      `DESCRIPTION:Recordatorio de Nuestra Cuenta\\nGenerado de forma automática.`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${task.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { tasks, addTask, toggleTask, deleteTask, downloadICS, isLoading };
}
