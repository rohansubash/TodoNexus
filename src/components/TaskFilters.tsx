
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Filters {
  status: string;
  priority: string;
  dueDate: string;
}

interface TaskFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ status: 'all', priority: 'all', dueDate: 'all' });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => updateFilter('status', 'all')}
          className={filters.status === 'all' ? 'bg-blue-50' : ''}
        >
          All Status
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('status', 'pending')}
          className={filters.status === 'pending' ? 'bg-blue-50' : ''}
        >
          Pending
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('status', 'in-progress')}
          className={filters.status === 'in-progress' ? 'bg-blue-50' : ''}
        >
          In Progress
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('status', 'completed')}
          className={filters.status === 'completed' ? 'bg-blue-50' : ''}
        >
          Completed
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => updateFilter('priority', 'all')}
          className={filters.priority === 'all' ? 'bg-blue-50' : ''}
        >
          All Priorities
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('priority', 'high')}
          className={filters.priority === 'high' ? 'bg-blue-50' : ''}
        >
          High Priority
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('priority', 'medium')}
          className={filters.priority === 'medium' ? 'bg-blue-50' : ''}
        >
          Medium Priority
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('priority', 'low')}
          className={filters.priority === 'low' ? 'bg-blue-50' : ''}
        >
          Low Priority
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Due Date
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => updateFilter('dueDate', 'all')}
          className={filters.dueDate === 'all' ? 'bg-blue-50' : ''}
        >
          All Dates
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('dueDate', 'today')}
          className={filters.dueDate === 'today' ? 'bg-blue-50' : ''}
        >
          Due Today
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('dueDate', 'overdue')}
          className={filters.dueDate === 'overdue' ? 'bg-blue-50' : ''}
        >
          Overdue
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateFilter('dueDate', 'upcoming')}
          className={filters.dueDate === 'upcoming' ? 'bg-blue-50' : ''}
        >
          Upcoming
        </DropdownMenuItem>
        
        {activeFiltersCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearFilters} className="text-red-600">
              Clear All Filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
