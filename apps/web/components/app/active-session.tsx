'use client'
import { TimerEndType, TimerType, db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { useLiveQuery } from 'dexie-react-hooks'
import { PauseIcon, PlayIcon, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'

export function ActiveSession() {
  const activeSession = useLiveQuery(() => db.getActiveSession())
  const task = useLiveQuery(
    () => db.getTask(activeSession?.taskId ?? 0),
    [activeSession?.taskId ?? 0],
  )
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!activeSession?.startTime) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeSession.startTime.getTime()
      const durationMs = activeSession.duration * 60 * 1000
      const newProgress = Math.min((elapsed / durationMs) * 100, 100)
      setProgress(newProgress)

      const remaining = Math.max(0, durationMs - elapsed)
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)

      if (elapsed >= durationMs) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession?.startTime, activeSession?.duration])

  if (!activeSession) return null

  const handleStop = async () => {
    await db.completeTimerSession(
      activeSession.sessionId,
      TimerEndType.INTERRUPTED,
    )
  }

  const isWork = activeSession.type === TimerType.WORK

  return (
    <div className="relative flex items-center gap-2 h-8 min-w-[140px] rounded-md border border-primary/20 bg-background px-2">
      {isWork ? (
        <PlayIcon className="h-3 w-3 text-primary animate-pulse" />
      ) : (
        <PauseIcon className="h-3 w-3 text-blue-500" />
      )}
      <span className="text-xs font-medium tabular-nums tracking-tight">
        {timeLeft}
      </span>
      {task?.content && (
        <span className="text-xs font-medium tabular-nums tracking-tight">
          {task.content}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-500"
        onClick={handleStop}
      >
        <Trash className="h-3 w-3" />
      </Button>
      <Progress
        value={progress}
        className={cn(
          'absolute bottom-0 left-0 right-0 h-0.5 rounded-none',
          isWork ? 'bg-primary/10' : 'bg-blue-500/10',
        )}
      />
    </div>
  )
}
