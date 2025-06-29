
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
  task_shares?: {
    permission: 'view' | 'edit';
    shared_with_user_id: string;
    profiles: {
      email: string;
      full_name: string | null;
    };
  }[];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      // Fetch owned tasks
      const { data: ownedTasks, error: ownedError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:user_id (full_name, email),
          task_shares (
            permission,
            shared_with_user_id,
            profiles:shared_with_user_id (email, full_name)
          )
        `)
        .eq('user_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch shared tasks
      const { data: sharedTasks, error: sharedError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:user_id (full_name, email),
          task_shares!inner (
            permission,
            shared_with_user_id,
            profiles:shared_with_user_id (email, full_name)
          )
        `)
        .eq('task_shares.shared_with_user_id', user.id);

      if (sharedError) throw sharedError;

      // Type-safe mapping to ensure proper types
      const allTasks = [
        ...(ownedTasks || []).map(task => ({
          ...task,
          priority: task.priority as 'low' | 'medium' | 'high',
          status: task.status as 'pending' | 'in-progress' | 'completed'
        })),
        ...(sharedTasks || []).map(task => ({
          ...task,
          priority: task.priority as 'low' | 'medium' | 'high',
          status: task.status as 'pending' | 'in-progress' | 'completed'
        }))
      ];
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task created successfully"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const shareTask = async (taskId: string, email: string, permission: 'view' | 'edit' = 'view') => {
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "User not found with this email address",
          variant: "destructive"
        });
        return;
      }

      // Create task share
      const { error } = await supabase
        .from('task_shares')
        .insert([{
          task_id: taskId,
          shared_by_user_id: user?.id,
          shared_with_user_id: profile.id,
          permission
        }]);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Success",
        description: `Task shared with ${email}`
      });
    } catch (error) {
      console.error('Error sharing task:', error);
      toast({
        title: "Error",
        description: "Failed to share task",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();

      // Set up real-time subscriptions
      const tasksSubscription = supabase
        .channel('tasks-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks' },
          () => fetchTasks()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'task_shares' },
          () => fetchTasks()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(tasksSubscription);
      };
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    shareTask,
    refreshTasks: fetchTasks
  };
}
