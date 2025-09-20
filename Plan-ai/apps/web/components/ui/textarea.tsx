import { cn } from '@/lib/utils'
import * as React from 'react'
import TextareaAutosize from 'react-textarea-autosize'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        spellCheck={false}
        data-dashlane-disabled-on-field="true"
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export interface AutoResizeTextareaProps
  extends React.ComponentPropsWithoutRef<typeof TextareaAutosize> {}

const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <TextareaAutosize
      className={cn(
        'flex w-full bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-auto',
        className,
      )}
      spellCheck={false}
      data-dashlane-disabled-on-field="true"
      ref={ref}
      {...props}
    />
  )
})
AutoResizeTextarea.displayName = 'AutoResizeTextarea'

export { Textarea, AutoResizeTextarea }
