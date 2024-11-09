import { NextResponse } from 'next/server'
import { openai } from '@/lib/ai'
import { generateText } from 'ai'
import { format } from 'date-fns'
import { diffWords } from 'diff'

async function getTitle(type: string, current: string) {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system:
      `Today is ${format(new Date(), 'MMMM d, yyyy')}. Your task is to write a brief summary of the current ${type}.`,
    prompt: `
# Current ${type}
${current}

Return a single, concise sentence summary of the current ${type} (max 5 words), nothing else.`,
  })
  return text.trim()
}

export async function POST(request: Request) {
  try {
    const { current, previous, type } = await request.json()

    // Skip AI call if there's no previous input to compare
    if (!previous || !current) {
      return NextResponse.json({ summary: await getTitle(type, current) })
    }

    if (previous === current) {
      return NextResponse.json({ summary: await getTitle(type, current) })
    }

    const diff = diffWords(previous, current)
    const added = diff.filter((part) => part.added).map((part) => part.value)
    const removed = diff.filter((part) => part.removed).map((part) => part.value)

    console.log(diff)

    if (!added.length && !removed.length) {
      return NextResponse.json({ summary: await getTitle(type, current) })
    }

    const prompt = `Based on the following diff, write a single sentence title for the current ${type}:

# Previous
${previous}

# Current
${current}

# Changes
${added.length > 0 ? `## Added\n${added.join('\n')}` : ''}
${removed.length > 0 ? `## Removed\n${removed.join('\n')}` : ''}

# Task
Return a single, concise sentence summary of the changes (max 5 words), nothing else. If no changes, return a single sentence summary (max 5 words) of the current ${type}.
`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system:
        `Today is ${format(new Date(), 'MMMM d, yyyy')}. Your task is to write a brief label for the current ${type}.`,
      prompt,
    })
    const summary = text.trim()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating diff:', error)
    return NextResponse.json({ summary: 'Initial' })
  }
}