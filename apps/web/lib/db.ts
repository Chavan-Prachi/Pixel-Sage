'use server'

import { createClient } from '@libsql/client/web'

const { NEXT_PUBLIC_TURSO_DATABASE_URL, NEXT_PUBLIC_TURSO_AUTH_TOKEN } =
  process.env
if (!NEXT_PUBLIC_TURSO_DATABASE_URL || !NEXT_PUBLIC_TURSO_AUTH_TOKEN) {
  throw new Error(
    'NEXT_PUBLIC_TURSO_DATABASE_URL and NEXT_PUBLIC_TURSO_AUTH_TOKEN must be set',
  )
}
const client = createClient({
  url: NEXT_PUBLIC_TURSO_DATABASE_URL,
  authToken: NEXT_PUBLIC_TURSO_AUTH_TOKEN,
})

initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error)
})

export async function initializeDatabase() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      `CREATE TABLE IF NOT EXISTS pomodoros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )`,
    ],
    'write',
  )
}

export async function addTask(description: string) {
  const result = await client.execute({
    sql: 'INSERT INTO tasks (description, status) VALUES (?, ?)',
    args: [description, 'pending'],
  })
  return result.lastInsertRowid
}

export async function getTasks() {
  const result = await client.execute(
    'SELECT * FROM tasks ORDER BY created_at DESC',
  )
  return result.rows
}

export async function updateTaskStatus(taskId: number, status: string) {
  await client.execute({
    sql: 'UPDATE tasks SET status = ? WHERE id = ?',
    args: [status, taskId],
  })
}

export async function addPomodoro(taskId: number) {
  await client.execute({
    sql: 'INSERT INTO pomodoros (task_id, status) VALUES (?, ?)',
    args: [taskId, 'in_progress'],
  })
}

export async function updatePomodoroStatus(taskId: number, status: string) {
  await client.execute({
    sql: "UPDATE pomodoros SET status = ? WHERE task_id = ? AND status = 'in_progress'",
    args: [status, taskId],
  })
}
