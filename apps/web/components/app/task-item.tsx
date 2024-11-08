'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Skeleton } from '@/components/ui/skeleton'
import type { Task } from '@/lib/db'
import { TimerType, db } from '@/lib/db'
import { PlayIcon } from 'lucide-react'
import { Trash2Icon } from 'lucide-react'
import { memo, useCallback } from 'react'

/**
 * A row in the task list, super concise
 * Will just show the content and a button to start the timer
 */
export const TaskItem = memo(function TaskItem({
  task,
}: {
  task: Task
}) {
  const handleDelete = useCallback(async () => {
    if (task.id) {
      await db.deleteTask(task.id)
    }
  }, [task.id])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card variant="glass" hover="lift">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {task.title && (
                <h3 className="font-medium text-sm truncate mb-0.5">
                  {task.title}
                </h3>
              )}
              <p className="text-sm text-muted-foreground line-clamp-1">
                {task.content}
              </p>
            </div>
            <TaskTimerItem task={task} />
          </div>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          <Trash2Icon className="mr-2 h-4 w-4" />
          Delete Task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
})

export const TaskItemSkeleton = memo(function TaskItemSkeleton() {
  return (
    <Card variant="glass" size="default">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  )
})

export const TaskTimerItem = memo(function TaskTimerItem({
  task,
}: { task: Task }) {
  const handleStartTimer = useCallback(async () => {
    await db.startTimerSession(task.id!, TimerType.WORK)
  }, [task.id])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-primary/10"
        onClick={handleStartTimer}
      >
        <PlayIcon className="h-4 w-4 text-primary" />
        <span className="sr-only">Start Timer</span>
      </Button>
    </div>
  )
})
