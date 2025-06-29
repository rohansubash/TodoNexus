
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Plus, Users } from 'lucide-react';

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

interface ShareTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onShare: (emails: string[]) => void;
}

export function ShareTaskModal({ isOpen, onClose, task, onShare }: ShareTaskModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      setError('This email is already added');
      return;
    }
    
    if (task.sharedWith.includes(trimmedEmail)) {
      setError('Task is already shared with this user');
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmailInput('');
    setError('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleSubmit = () => {
    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }
    
    onShare(emails);
    handleClose();
  };

  const handleClose = () => {
    setEmailInput('');
    setEmails([]);
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <Users className="h-5 w-5 mr-2" />
            Share Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          </div>

          {task.sharedWith.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currently shared with:</Label>
              <div className="flex flex-wrap gap-2">
                {task.sharedWith.map((email) => (
                  <Badge key={email} variant="secondary" className="text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Add collaborators by email:</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address..."
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError('');
                }}
                onKeyPress={handleKeyPress}
                className={error ? 'border-red-500' : ''}
              />
              <Button onClick={addEmail} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Will be shared with:</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="default" className="text-xs flex items-center gap-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={emails.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Share Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
