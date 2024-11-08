import { PlanInput } from '@/components/app/plan-input'
import { TaskList } from '@/components/app/task-list'

export default function AppPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <PlanInput />
      <div className="space-y-2">
        <h2 className="text-xl">Tasks</h2>
        <TaskList />
      </div>
    </div>
  )
}
