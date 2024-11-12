'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TimePicker } from '@/components/ui/time-picker'
import { db } from '@/lib/db'
import { Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Settings({
  setIsOpen,
}: {
  setIsOpen: (open: boolean) => void
}) {
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  useEffect(() => {
    async function loadPreferences() {
      const today = new Date()
      const plan = await db.getPlan(today)
      if (plan?.preferences?.workingHours) {
        const start = plan.preferences.workingHours.start
        const end = plan.preferences.workingHours.end
        setStartTime(formatTime(start))
        setEndTime(formatTime(end))
      }
    }
    loadPreferences()
  }, [])

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const parseTime = (time: string) => {
    return Number.parseInt(time.split(':')[0])
  }

  const handleSave = async () => {
    const today = new Date()
    const plan = await db.getOrCreatePlan(today)
    await db.plans.update(plan.id!, {
      preferences: {
        workingHours: {
          start: parseTime(startTime),
          end: parseTime(endTime),
        },
      },
    })
    setIsOpen(false)
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Working Hours</Label>
        <TimePicker
          startTime={startTime}
          endTime={endTime}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />
      </div>
      <Button onClick={handleSave} className="ml-auto">
        Save changes
      </Button>
    </div>
  )
}

export function SettingsPopup() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 px-0">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Settings setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  )
}
