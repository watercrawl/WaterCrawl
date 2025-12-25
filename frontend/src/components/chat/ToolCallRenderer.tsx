import React from 'react';

import CompactToolCall from './CompactToolCall';
import ThinkTool from './ThinkTool';
import TodoList from './TodoList';

import type { ToolCallUIState } from '../../types/conversation';

interface ToolCallRendererProps {
  toolCall: ToolCallUIState;
  isParallel?: boolean;
}

/**
 * ToolCallRenderer - Handles rendering of different tool call types
 * - write_todos: Renders TodoList component using input.todos
 * - think: Renders ThinkTool component showing only output (reflection)
 * - Other tools: Renders CompactToolCall component
 */
const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({ toolCall, isParallel = false }) => {
  // Special handling for think tool
  if (toolCall.name === 'think') {
    return <ThinkTool toolCall={toolCall} />;
  }

  // Special handling for write_todos tool
  if (toolCall.name === 'write_todos') {
    // Extract todos from input (input contains the current state)
    let todos: Array<{ content: string; status: string }> | null = null;
    
    if (toolCall.input && typeof toolCall.input === 'object' && 'todos' in toolCall.input) {
      const inputTodos = (toolCall.input as { todos?: Array<{ content: string; status: string }> }).todos;
      if (Array.isArray(inputTodos)) {
        todos = inputTodos;
      }
    }
    
    // If input is a string, try to parse it as JSON
    if (!todos && typeof toolCall.input === 'string') {
      try {
        const parsed = JSON.parse(toolCall.input);
        if (parsed && typeof parsed === 'object' && 'todos' in parsed && Array.isArray(parsed.todos)) {
          todos = parsed.todos;
        }
      } catch (_e) {
        // Not valid JSON, ignore
      }
    }
    
    if (todos && todos.length > 0) {
      return (
        <TodoList
          todos={todos.map(todo => ({
            content: todo.content || '',
            status: (todo.status || 'pending') as 'pending' | 'in_progress' | 'completed'
          }))}
        />
      );
    }
  }
  
  // Default rendering for other tool calls
  return (
    <CompactToolCall
      toolCall={toolCall}
      isParallel={isParallel}
    />
  );
};

export default ToolCallRenderer;
