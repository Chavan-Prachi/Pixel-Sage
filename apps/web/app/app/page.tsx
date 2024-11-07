'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  addPomodoro,
  addTask,
  getTasks,
  updatePomodoroStatus,
  updateTaskStatus,
} from '@/lib/db'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Clock, Pause, Play, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SidejotAI() {
  const [tasks, setTasks] = useState([])
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isBreak, setIsBreak] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
    document.body.classList.add('dark')
  }, [])

  useEffect(() => {
    let timer
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerEnd()
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  const fetchTasks = async () => {
    const fetchedTasks = await getTasks()
    setTasks(fetchedTasks)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (newTaskDescription.trim()) {
      await addTask(newTaskDescription)
      setNewTaskDescription('')
      await fetchTasks()
    }
  }

  const handleStartTask = async (taskId) => {
    setActiveTaskId(taskId)
    setTimeLeft(25 * 60)
    setIsBreak(false)
    setIsRunning(true)
    await addPomodoro(taskId)
  }

  const handleTimerEnd = () => {
    setIsRunning(false)
    toast({
      title: isBreak ? 'Break ended!' : 'Pomodoro completed!',
      description: "What's next?",
    })
    if (isBreak) {
      setIsBreak(false)
      setTimeLeft(25 * 60)
    } else {
      setIsBreak(true)
      setTimeLeft(5 * 60)
    }
  }

  const handleTaskCompletion = async (taskId, completed) => {
    setIsRunning(false)
    await updatePomodoroStatus(taskId, completed ? 'completed' : 'incomplete')
    if (completed) {
      await updateTaskStatus(taskId, 'completed')
      setActiveTaskId(null)
    } else {
      setTimeLeft(25 * 60)
      setIsBreak(false)
    }
    await fetchTasks()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-400">
          Sidejot AI
        </h1>
        <form onSubmit={handleAddTask} className="mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="What do you want to get done today?"
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Add Task
            </Button>
          </div>
        </form>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-400">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-between items-center mb-4 p-4 border border-gray-700 rounded-lg bg-gray-900"
                >
                  <span
                    className={`text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'}`}
                  >
                    {task.description}
                  </span>
                  <div className="flex items-center gap-2">
                    {activeTaskId === task.id && (
                      <>
                        <motion.span
                          key={timeLeft}
                          initial={{ scale: 1.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-xl font-bold text-purple-400"
                        >
                          {formatTime(timeLeft)}
                        </motion.span>
                        {isRunning ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsRunning(false)}
                          >
                            <Pause className="w-4 h-4 mr-1" /> Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsRunning(true)}
                          >
                            <Play className="w-4 h-4 mr-1" /> Resume
                          </Button>
                        )}
                        {!isBreak && timeLeft === 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleTaskCompletion(task.id, true)
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Done
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleTaskCompletion(task.id, false)
                              }
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Not Done
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {activeTaskId !== task.id &&
                      task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartTask(task.id)}
                          disabled={isRunning}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Clock className="w-4 h-4 mr-1" /> Start
                        </Button>
                      )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
