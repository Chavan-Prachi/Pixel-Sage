'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/lib/db'
import { Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Settings({
  setIsOpen,
}: {
  setIsOpen: (open: boolean) => void
}) {
  const [startHour, setStartHour] = useState('6')
  const [endHour, setEndHour] = useState('18')

  useEffect(() => {
    async function loadPreferences() {
      const today = new Date()
      const plan = await db.getPlan(today)
      if (plan?.preferences?.workingHours) {
        setStartHour(plan.preferences.workingHours.start.toString())
        setEndHour(plan.preferences.workingHours.end.toString())
      }
    }
    loadPreferences()
  }, [])

  const handleSave = async () => {
    const today = new Date()
    const plan = await db.getOrCreatePlan(today)
    await db.plans.update(plan.id!, {
      preferences: {
        workingHours: {
          start: Number.parseInt(startHour),
          end: Number.parseInt(endHour),
        },
      },
    })
    setIsOpen(false)
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="startHour" className="text-right">
          Start Hour
        </Label>
        <Input
          id="startHour"
          type="number"
          min="0"
          max="23"
          value={startHour}
          onChange={(e) => setStartHour(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endHour" className="text-right">
          End Hour
        </Label>
        <Input
          id="endHour"
          type="number"
          min="0"
          max="23"
          value={endHour}
          onChange={(e) => setEndHour(e.target.value)}
          className="col-span-3"
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
