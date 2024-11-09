import { startOfDay } from 'date-fns'
import Dexie, { type Table } from 'dexie'
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

/** Chat history for AI interactions */
export interface ChatHistory<TInput = unknown, TOutput = unknown> {
  id?: number
  /** The user's input */
  input: TInput
  /** The AI's response */
  output: TOutput
  /** When this interaction happened */
  timestamp: Date
  /** Type of interaction (e.g., 'task-generation') */
  type: string
  /** AI-generated diff of the plan */
  title: string
  /** Optional metadata about the interaction */
  metadata?: Record<string, unknown>
}

// Define the database
export class SidejotDB extends Dexie {
  plans!: Table<Plan>
  tasks!: Table<Task>
  timerSessions!: Table<TimerSession>
  chatHistory!: Table<ChatHistory>

  private sessionManager = SessionManager.getInstance()

  constructor() {
    super('sidejot')

    this.version(3).stores({
      plans: '++id, content, date, lastUpdated',
      tasks:
        '++id, content, title, status, date, order, createdAt, updatedAt, *tags',
      timerSessions:
        '++id, taskId, type, startTime, endTime, endType, sessionId, lastHeartbeat',
      chatHistory: '++id, type, timestamp, title, input, output, metadata',
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
    // Abandon any ongoing sessions
    await this.timerSessions
      .filter((x) => !x.endTime)
      .modify((x) => {
        x.endTime = new Date()
        x.endType = TimerEndType.ABANDONED
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
    return await this.timerSessions.filter((x) => !x.endTime).first()
  }

  async getTask(taskId: number): Promise<Task | undefined> {
    return await this.tasks.get(taskId)
  }

  async getActiveTask(): Promise<Task | undefined> {
    return await this.tasks.filter((x) => x.status === TaskStatus.WORK).first()
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      await this.tasks.delete(taskId)
    } catch (error) {
      console.error('Error deleting task', error)
    }
  }

  async saveChatHistory<TInput, TOutput>(
    type: string,
    input: TInput,
    output: TOutput,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const date = new Date()
      const title = await this.getDiffSummaryAsTitle(type, input as string)
      await this.chatHistory.add({
        input,
        output,
        type,
        title,
        timestamp: date,
        metadata,
      })
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  async getDiffSummaryAsTitle(type: string, input: string): Promise<string> {
    try {
      // Get the most recent chat history entry
      const previousEntry = await this.chatHistory
        .where('type')
        .equals(type)
        .reverse()
        .first()

      // If no previous entry exists, return a basic title
      if (!previousEntry) {
        return `Initial ${type}`
      }

      // Call the diff API endpoint
      const response = await fetch('/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current: input,
          previous: previousEntry.input,
          type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate diff summary')
      }

      const { summary } = await response.json()
      return summary
    } catch (error) {
      console.error('Error generating diff summary:', error)
      return 'Updated plan' // Fallback title
    }
  }

  async getChatHistory<TInput, TOutput>(
    type: string,
    limit = 10,
  ): Promise<ChatHistory<TInput, TOutput>[]> {
    return (await this.chatHistory
      .where('type')
      .equals(type)
      .reverse()
      .limit(limit)
      .toArray()) as ChatHistory<TInput, TOutput>[]
  }
}

// Create a singleton instance
export const db = new SidejotDB()
