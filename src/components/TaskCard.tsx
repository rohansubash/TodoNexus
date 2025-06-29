
import { useState } from 'react';
import { Calendar, Clock, Users, MoreVertical, Edit, Trash2, Share2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  sharedWith: string[];
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export function TaskCard({ task, onUpdate, onEdit, onDelete, onShare }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0 && task.status !== 'completed';
  const isDueToday = daysUntilDue === 0;

  const handleStatusChange = () => {
    const statusOrder = ['pending', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onUpdate({ status: statusOrder[nextIndex] as Task['status'] });
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
        task.status === 'completed' && "opacity-75",
        isOverdue && "border-red-200 bg-red-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={cn(
              "font-semibold text-gray-900 mb-2",
              task.status === 'completed' && "line-through text-gray-500"
            )}>
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {task.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge 
                variant="outline" 
                className={priorityColors[task.priority]}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
              <Badge 
                variant="secondary" 
                className={statusColors[task.status]}
              >
                {task.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "opacity-0 transition-opacity duration-200",
                  isHovered && "opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleStatusChange}>
                <Check className="h-4 w-4 mr-2" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span className={cn(
                isOverdue && "text-red-600 font-medium",
                isDueToday && "text-orange-600 font-medium"
              )}>
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
            
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            
            {isDueToday && !isOverdue && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                Due Today
              </Badge>
            )}
          </div>

          {task.sharedWith.length > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>Shared with {task.sharedWith.length} user{task.sharedWith.length > 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-400">
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
            
            <Button
              size="sm"
              variant={task.status === 'completed' ? 'secondary' : 'default'}
              onClick={handleStatusChange}
              className="text-xs"
            >
              {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
