'use client'
import { generatePlanSchema } from '@/app/api/tasks/generate/schema'
import { Button } from '@/components/ui/button'
import { useDebouncedCallback } from '@/hooks/use-debounce'
import { db } from '@/lib/db'
import { getTimeOfDay } from '@/lib/utils'
import { getDeviceType } from '@/lib/utils'
import { experimental_useObject as useObject } from 'ai/react'
import { differenceInMinutes, setHours, setMinutes } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, BrainCog, Lightbulb, Paperclip, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Icons } from '../icons'
import { Card } from '../ui/card'
import { AutoResizeTextarea } from '../ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

export function PlanInput() {
  const { object, isLoading, error, submit } = useObject({
    api: '/api/tasks/generate',
    schema: generatePlanSchema,
  })
  const today = new Date()

  const plan = useLiveQuery(async () => {
    return db.getPlan(today)
  })

  const [inputValue, setInputValue] = useState(plan?.content ?? '')

  const debouncedUpdate = useDebouncedCallback(async (content: string) => {
    await db.updatePlan(today, content)
  }, 500)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    debouncedUpdate(newValue)
  }

  useEffect(() => {
    if (plan?.content !== undefined) {
      setInputValue(plan.content)
    }
  }, [plan?.content])

  const handleGenerateTasks = () => {
    try {
      if (!plan?.content) {
        throw new Error('Please enter a plan first')
      }
      const now = new Date()
      const endOfWorkDay = setHours(setMinutes(now, 0), 18)
      const timeLeft = differenceInMinutes(endOfWorkDay, now)
      const availablePomodoros = Math.floor(timeLeft / 25)

      submit({
        content: plan.content,
        currentTime: now.toISOString(),
        endOfWorkDay: endOfWorkDay.toISOString(),
        timeLeft,
        availablePomodoros,
        context: {
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend: [0, 6].includes(now.getDay()),
          timeOfDay: getTimeOfDay(now),
          deviceType: getDeviceType(),
          preferredWorkingHours: {
            start: 6,
            end: 18,
          },
        },
      })
      // await db.tasks.bulkAdd(tasks)
    } catch (error) {
      console.error(error)
      toast.error((error as Error).message)
    }
  }

  const tasks = useMemo(
    () =>
      object?.tasks?.filter(
        (task): task is { content: string; duration: number; tags: string[] } =>
          task !== undefined && !!task?.content,
      ) ?? [],
    [object?.tasks],
  )

  const backlog = useMemo(
    () =>
      object?.backlog?.filter(
        (task): task is { content: string; duration: number; tags: string[] } =>
          task !== undefined && !!task?.content,
      ) ?? [],
    [object?.backlog],
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-6">
        What do you want to get done today?
      </h1>

      <div className="relative mb-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="text-red-500 bg-red-500/10 border-t border-x border-red-500/20 rounded-t-xl px-3 pt-2 -mb-2 pb-4 text-sm font-medium h-10"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {error.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative z-10 bg-card p-0 border border-border focus-within:border-primary rounded-xl">
          <AutoResizeTextarea
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask Sidejot a question..."
            className="overflow-auto pb-1.5 text-sm placeholder:text-gray-500 resize-none"
          />

          <div className="flex items-center justify-between gap-2 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent cursor-not-allowed"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-neutral-800"
              onClick={handleGenerateTasks}
              disabled={isLoading}
            >
              {isLoading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {object?.reasoning && <Reasoning reasoning={object.reasoning} />}

      {tasks.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-2">Today</h2>
          <TaskList tasks={tasks} />
        </div>
      )}
      {backlog.length > 0 && (
        <div className="mt-4 opacity-50">
          <h2 className="text-lg font-medium mb-2">Backlog</h2>
          <TaskList tasks={backlog} />
        </div>
      )}

      {object?.notes && <Notes notes={object.notes} />}

      {!tasks.length && <Suggestions />}
    </div>
  )
}

const TaskList = ({
  tasks,
}: {
  tasks: {
    content: string
    duration: number
    tags: string[]
  }[]
}) => {
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task, i) => (
        <div key={i} className="bg-neutral-800 p-2 rounded-lg">
          <h3 className="text-sm font-medium">{task!.content}</h3>
          <p className="text-xs text-muted-foreground">
            {task.duration} minutes
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {task!.tags?.map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-0.5 text-xs rounded-full bg-neutral-700 text-neutral-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const Reasoning = ({ reasoning }: { reasoning: string }) => {
  return (
    <div className="flex gap-4 items-start mt-4">
      <BrainCog className="size-6 min-w-6 mt-3.5 text-muted-foreground" />
      <Card className="text-sm flex-1">{reasoning}</Card>
    </div>
  )
}

const Notes = ({ notes }: { notes: string }) => {
  return (
    <div className="flex gap-4 items-start mt-4">
      <Lightbulb className="size-6 min-w-6 mt-3.5 text-muted-foreground" />
      <Card className="text-sm flex-1">{notes}</Card>
    </div>
  )
}

const Suggestions = () => {
  const [suggestions] = useState<string[]>([
    'Clean my room',
    'Write a blog post',
    'Learn something new',
  ])

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          variant="ghost"
          className="text-xs p-2 rounded-full h-6"
        >
          <Sparkles className="h-3 w-3" />
          {suggestion}
        </Button>
      ))}
    </div>
  )
}
