'use client'
import { db } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '../ui/card'
import { TaskItem } from './task-item'

export function TaskList() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? []

  if (tasks.length === 0) {
    return <Card>No tasks yet. Update your context to generate tasks.</Card>
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
