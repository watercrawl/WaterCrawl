import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { 
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

import { useDirection } from '../../contexts/DirectionContext';

interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TodoListProps {
  todos: Todo[];
}

/**
 * TodoList component - Displays a list of todos with their status
 * Used for write_todos tool calls
 * Expandable: shows summary when collapsed, full list when expanded
 */
const TodoList: React.FC<TodoListProps> = ({ todos }) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: Todo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-3.5 w-3.5 text-success" />;
      case 'in_progress':
        return <PlayIcon className="h-3.5 w-3.5 text-primary" />;
      case 'pending':
        return <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Todo['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success/5';
      case 'in_progress':
        return 'bg-primary/5';
      case 'pending':
        return 'bg-muted/20';
      default:
        return 'bg-muted/20';
    }
  };

  if (!todos || todos.length === 0) {
    return null;
  }

  // Calculate stats
  const completedCount = todos.filter(todo => todo.status === 'completed').length;
  const totalCount = todos.length;
  const inProgressCount = todos.filter(todo => todo.status === 'in_progress').length;
  const pendingCount = todos.filter(todo => todo.status === 'pending').length;

  return (
    <div className="py-1.5 px-3">
      <div className={`rounded-lg border border-border/40 bg-card overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Collapsed Summary View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-muted/30 transition-colors text-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {t('chat.todos')}
          </span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} {t('chat.todosCompleted')}
          </span>
          {inProgressCount > 0 && (
            <span className="text-xs text-primary">
              {isRTL ? '•' : '•'} {inProgressCount} {t('chat.todosInProgress')} {isRTL ? '•' : ''}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {isRTL ? '•' : '•'} {pendingCount} {t('chat.todosPending')} {isRTL ? '•' : ''}
            </span>
          )}
        </button>

        {/* Expanded List View */}
        {isExpanded && (
          <div className="divide-y divide-border/30 border-t border-border/30">
            {todos.map((todo, index) => (
              <div
                key={index}
                className={`px-2.5 py-1.5 flex items-center gap-2 transition-colors ${getStatusColor(todo.status)} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(todo.status)}
                </div>
                <span className={`text-xs text-foreground flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {todo.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
