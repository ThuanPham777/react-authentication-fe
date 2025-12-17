/**
 * Kanban Settings Modal
 * Allows users to configure, create, rename, and delete columns
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type KanbanColumn } from '@/types/kanban-config.types';
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface KanbanSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  onAddColumn: (name: string, gmailLabel?: string) => Promise<any>;
  onUpdateColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  onDeleteColumn: (id: string) => Promise<void>;
  onReorderColumns: (columns: KanbanColumn[]) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  isSyncing?: boolean;
}

export function KanbanSettingsModal({
  open,
  onOpenChange,
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  onResetToDefault,
  isSyncing = false,
}: KanbanSettingsModalProps) {
  const [newColumnName, setNewColumnName] = useState('');
  const [newGmailLabel, setNewGmailLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAddColumn(
        newColumnName.trim(),
        newGmailLabel.trim() || undefined
      );
      setNewColumnName('');
      setNewGmailLabel('');
      showMessage('success', 'Column added successfully');
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add column';
      showMessage('error', errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteColumn = async (columnId: string, columnName: string) => {
    if (!confirm(`Are you sure you want to delete column "${columnName}"?`)) {
      return;
    }
    try {
      await onDeleteColumn(columnId);
      showMessage('success', 'Column deleted successfully');
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete column';
      showMessage('error', errorMsg);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleUpdateColumn = async (
    id: string,
    updates: Partial<KanbanColumn>
  ) => {
    try {
      await onUpdateColumn(id, updates);
      showMessage('success', 'Column updated successfully');
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update column';
      showMessage('error', errorMsg);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(dragIndex, 1);
    newColumns.splice(dropIndex, 0, removed);

    try {
      await onReorderColumns(newColumns);
      showMessage('success', 'Columns reordered successfully');
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to reorder columns';
      showMessage('error', errorMsg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Kanban Board Settings</DialogTitle>
        </DialogHeader>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? (
              <CheckCircle2 className='h-4 w-4' />
            ) : (
              <AlertCircle className='h-4 w-4' />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className='space-y-6'>
          {/* Add New Column */}
          <div className='space-y-3 p-4 border rounded-lg bg-muted/30'>
            <h3 className='font-semibold text-sm'>Add New Column</h3>
            <div className='grid grid-cols-12 gap-3'>
              <div className='col-span-5'>
                <Label
                  htmlFor='column-name'
                  className='text-xs'
                >
                  Column Name
                </Label>
                <Input
                  id='column-name'
                  placeholder='e.g., Urgent'
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
              </div>
              <div className='col-span-5'>
                <Label
                  htmlFor='gmail-label'
                  className='text-xs'
                >
                  Gmail Label (optional)
                </Label>
                <Input
                  id='gmail-label'
                  placeholder='e.g., URGENT'
                  value={newGmailLabel}
                  onChange={(e) => setNewGmailLabel(e.target.value)}
                />
              </div>
              <div className='col-span-2 flex items-end'>
                <Button
                  onClick={handleAddColumn}
                  className='w-full'
                  disabled={isAdding || isSyncing}
                >
                  <Plus className='h-4 w-4 mr-1' />
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Columns */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-sm'>Columns</h3>
              <Button
                variant='outline'
                size='sm'
                onClick={async () => {
                  if (
                    confirm(
                      'Reset all columns to default settings? This will remove all custom columns.'
                    )
                  ) {
                    try {
                      await onResetToDefault();
                      showMessage('success', 'Columns reset to default');
                    } catch (error: any) {
                      const errorMsg =
                        error?.response?.data?.message ||
                        error?.message ||
                        'Failed to reset columns';
                      showMessage('error', errorMsg);
                    }
                  }
                }}
              >
                Reset to Default
              </Button>
            </div>

            <div className='space-y-2'>
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className='flex items-center gap-2 p-3 border rounded-lg bg-card cursor-move hover:bg-accent/50 transition-colors'
                >
                  <GripVertical className='h-4 w-4 text-muted-foreground shrink-0' />

                  {editingId === column.id ? (
                    <>
                      <Input
                        value={column.name}
                        onChange={(e) =>
                          handleUpdateColumn(column.id, {
                            name: e.target.value,
                          })
                        }
                        className='flex-1'
                        autoFocus
                      />
                      <Input
                        value={column.gmailLabel || ''}
                        onChange={(e) =>
                          handleUpdateColumn(column.id, {
                            gmailLabel: e.target.value,
                          })
                        }
                        placeholder='Gmail label'
                        className='flex-1'
                      />
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setEditingId(null)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-sm truncate'>
                          {column.name}
                        </div>
                        {column.gmailLabel && (
                          <div className='text-xs text-muted-foreground truncate'>
                            Label: {column.gmailLabel}
                          </div>
                        )}
                      </div>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setEditingId(column.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() =>
                          handleDeleteColumn(column.id, column.name)
                        }
                        className='text-destructive hover:text-destructive'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className='text-xs text-muted-foreground space-y-1'>
            <p>• Drag columns to reorder them</p>
            <p>• Gmail labels will sync when you move cards between columns</p>
            <p>• Leave Gmail label empty if you don't want label syncing</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
