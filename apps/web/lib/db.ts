import { startOfDay } from 'date-fns'
import Dexie, { type IndexableType, type Table } from 'dexie'
import { SessionManager } from './session-manager'

/**
 * Daily Plan - The core input for our AI task generation
 * We use a single text field to keep the UX simple and natural
 * This matches how people naturally think about their day
 */
export interface Plan {
  id?: number
  /**
   * Free-form text where users describe their intentions and goals for the day
   * We keep this as unstructured text to maintain a natural, journal-like experience
   * AI uses this to generate structured tasks while preserving context
   *
   * The content is carried over to the next day to help with continuity
   */
  content: string
  /** The date this plan belongs to */
  date: Date
  /** Used for conflict resolution in cross-device sync */
  lastUpdated: Date
}

export enum TaskStatus {
  /** The default status when a task is created */
  READY = 'ready',
  /** Current task is being worked on / break is in progress */
  WORK = 'work',
  /** The 25-min work session has ended, and now on 5-min break */
  BREAK = 'break',
  /** Both the work and the break pomodoro have been completed */
  DONE = 'done',
  /** Moved to another slot/day (with specific reschedule date) */
  RESCHEDULED = 'rescheduled',
  /** Intentionally removed from today's plan */
  REMOVED = 'removed',
}

/**
 * Task - AI-generated or user-created work items
 * Structured for Pomodoro-based time management
 * Includes fields needed for sync, analytics, and AI learning
 *
 * There can be multiple tasks with the same content
 * Because if a task is not finished in 25 minutes, the user can choose to continue it for their next pomodoro immediately
 */
export interface Task {
  id?: number
  /** Main task content */
  content: string
  /**
   * If the content is too long, AI generates a 3-4 word title
   * This helps with quick visual scanning of task lists
   */
  title?: string
  status: TaskStatus
  /** Links task to specific daily plan */
  date: Date
  /** For sorting tasks & sync conflict detection */
  createdAt: Date
  /** For sync conflict detection */
  updatedAt: Date
  /**
   * Manual + AI-driven sorting
   * Preserves user's intended workflow sequence
   */
  order: number
  /**
   * AI can suggest tags based on description & content
   * Enables filtered views and reporting later
   */
  tags?: string[]
}

export enum TimerType {
  WORK = 'work',
  BREAK = 'break',
}

export enum TimerEndType {
  COMPLETED = 'completed',
  INTERRUPTED = 'interrupted',
  ABANDONED = 'abandoned',
}

/** Timer - Tracks actual work & break periods */
export interface TimerSession {
  id?: number
  taskId: number
  type: TimerType
  startTime: Date
  endTime?: Date

  /**
   * Session length in minutes
   * 25 for work, 5 for break
   * Could be customized per user
   */
  duration: number

  /**
   * Tracks how the session ended
   * - 'completed': Full duration reached naturally
   * - 'interrupted': User stopped early
   * - 'abandoned': Session was never completed (detected via heartbeat)
   * - undefined: Session still in progress
   */
  endType?: TimerEndType

  /**
   * UUID for session ownership and coordination
   * Format: `${deviceId}:${tabId}`
   * Used to:
   * - Identify which tab/device started the session
   * - Handle session transfers between devices
   * - Manage completion rights
   */
  sessionId: string
  /** Timestamp of last heartbeat to detect abandoned sessions */
  lastHeartbeat: Date
}

// Define the database
export class SidejotDB extends Dexie {
  plans!: Table<Plan>
  tasks!: Table<Task>
  timerSessions!: Table<TimerSession>

  private sessionManager = SessionManager.getInstance()

  constructor() {
    super('sidejot')

    this.version(2).stores({
      plans: '++id, content, date, lastUpdated',
      tasks:
        '++id, content, title, status, date, order, createdAt, updatedAt, *tags',
      timerSessions:
        '++id, taskId, type, startTime, endTime, endType, sessionId, lastHeartbeat',
    })
  }

  async getOrCreatePlan(date: Date): Promise<Plan> {
    const normalizedDate = startOfDay(date)
    const plan = await this.getPlan(normalizedDate)
    if (!plan) {
      const previousPlan = await this.plans.orderBy('date').reverse().first()
      const newPlan: Plan = {
        content: previousPlan?.content ?? '',
        date: normalizedDate,
        lastUpdated: new Date(),
      }

      const id = await this.plans.add(newPlan)
      return { ...newPlan, id }
    }
    return plan
  }

  /** @readonly used in live queries */
  async getPlan(date: Date): Promise<Plan | null> {
    const normalizedDate = startOfDay(date)
    const plans = await this.plans
      .where('date')
      .equals(normalizedDate)
      .toArray()
    if (plans.length > 1) {
      console.warn('Multiple plans found for date', date, plans)
    }
    if (plans.length === 0) return null
    return plans[0]
  }

  async updatePlan(date: Date, content: string): Promise<void> {
    try {
      const plan = await this.getOrCreatePlan(date)
      await this.plans.update(plan.id, {
        content,
        lastUpdated: new Date(),
      })
    } catch (error) {
      console.error('Error updating plan', error)
    }
  }

  // Helper method to start a new pomodoro session
  async startTimerSession(
    taskId: number,
    type: TimerType,
  ): Promise<TimerSession> {
    await this.timerSessions
      .where('endTime')
      .equals(null as unknown as IndexableType)
      .modify({
        endTime: new Date(),
        endType: TimerEndType.ABANDONED,
      })

    const session: TimerSession = {
      taskId,
      startTime: new Date(),
      type,
      duration: type === TimerType.WORK ? 25 : 5,
      sessionId: this.sessionManager.sessionId,
      lastHeartbeat: new Date(),
    }

    const id = await this.timerSessions.add(session)
    return { ...session, id }
  }

  async completeTimerSession(
    sessionId: string,
    endType: TimerEndType,
  ): Promise<void> {
    await this.timerSessions.where('sessionId').equals(sessionId).modify({
      endTime: new Date(),
      endType,
    })
  }

  async updateHeartbeat(sessionId: string): Promise<void> {
    await this.timerSessions.where('sessionId').equals(sessionId).modify({
      lastHeartbeat: new Date(),
    })
  }

  async getActiveSession(): Promise<TimerSession | undefined> {
    return await this.timerSessions
      .where('endTime')
      .equals(null as unknown as IndexableType)
      .first()
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      await this.tasks.delete(taskId)
    } catch (error) {
      console.error('Error deleting task', error)
    }
  }
}

// Create a singleton instance
export const db = new SidejotDB()
