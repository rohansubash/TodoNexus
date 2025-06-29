import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, User, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from '@/components/TaskCard';
import { TaskFilters } from '@/components/TaskFilters';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { ShareTaskModal } from '@/components/ShareTaskModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, Task } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, shareTask } = useTasks();
  const navigate = useNavigate();
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dueDate: 'all'
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.dueDate !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        
        switch (filters.dueDate) {
          case 'today':
            return task.due_date === todayStr;
          case 'overdue':
            return new Date(task.due_date) < today && task.status !== 'completed';
          case 'upcoming':
            return new Date(task.due_date) > today;
          default:
            return true;
        }
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filters]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      navigate('/auth');
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await createTask(taskData);
    setShowCreateModal(false);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
  };

  const handleEditTask = async (updates: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, updates);
      setShowEditModal(false);
      setSelectedTask(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleShareTask = async (emails: string[]) => {
    if (selectedTask) {
      for (const email of emails) {
        await shareTask(selectedTask.id, email, 'view');
      }
      setShowShareModal(false);
      setSelectedTask(null);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => {
      const today = new Date();
      return t.due_date && new Date(t.due_date) < today && t.status !== 'completed';
    }).length;

    return { total, completed, pending, inProgress, overdue };
  };

  if (authLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const stats = getTaskStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TodoNexus
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Dashboard
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('') || user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <TaskFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={{
                id: task.id,
                title: task.title,
                description: task.description || '',
                dueDate: task.due_date || '',
                priority: task.priority,
                status: task.status,
                sharedWith: task.task_shares?.map(share => share.profiles.email) || [],
                createdAt: task.created_at.split('T')[0]
              }}
              onUpdate={(updates) => handleUpdateTask(task.id, {
                ...updates,
                due_date: updates.dueDate,
              })}
              onEdit={() => {
                setSelectedTask(task);
                setShowEditModal(true);
              }}
              onDelete={() => handleDeleteTask(task.id)}
              onShare={() => {
                setSelectedTask(task);
                setShowShareModal(true);
              }}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filters.status !== 'all' || filters.priority !== 'all' || filters.dueDate !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'
              }
            </p>
            {!searchQuery && filters.status === 'all' && filters.priority === 'all' && filters.dueDate === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
      />

      {selectedTask && (
        <>
          <ShareTaskModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSelectedTask(null);
            }}
            task={{
              id: selectedTask.id,
              title: selectedTask.title,
              description: selectedTask.description || '',
              dueDate: selectedTask.due_date || '',
              priority: selectedTask.priority,
              status: selectedTask.status,
              sharedWith: selectedTask.task_shares?.map(share => share.profiles.email) || [],
              createdAt: selectedTask.created_at.split('T')[0]
            }}
            onShare={handleShareTask}
          />

          <EditTaskModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTask(null);
            }}
            task={{
              title: selectedTask.title,
              description: selectedTask.description || '',
              due_date: selectedTask.due_date || '',
              priority: selectedTask.priority,
              status: selectedTask.status
            }}
            onSubmit={handleEditTask}
          />
        </>
      )}
    </div>
  );
};

export default Index;
