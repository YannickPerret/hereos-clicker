import { useEffect, useRef } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  minHeightClassName?: string
  disabled?: boolean
}

const TOOLBAR_ACTIONS = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: 'S', command: 'strikeThrough' },
  { label: '•', command: 'insertUnorderedList' },
  { label: '1.', command: 'insertOrderedList' },
  { label: '"', command: 'formatBlock', value: 'blockquote' },
  { label: '{}', command: 'formatBlock', value: 'pre' },
] as const

export default function ForumRichEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = 'min-h-32',
  disabled = false,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!editorRef.current || editorRef.current.innerHTML === value) {
      return
    }

    editorRef.current.innerHTML = value
  }, [value])

  const exec = (command: string, commandValue?: string) => {
    if (disabled) {
      return
    }

    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML || '')
  }

  const createLink = () => {
    if (disabled) {
      return
    }

    const url = window.prompt('URL')
    if (!url) {
      return
    }

    exec('createLink', url)
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-cyber-black/70">
      <div className="flex flex-wrap gap-2 border-b border-gray-800 px-3 py-2">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={disabled}
            onClick={() => exec(action.command, action.value)}
            className="rounded border border-cyber-blue/20 px-2 py-1 text-[10px] font-bold uppercase text-cyber-blue transition hover:bg-cyber-blue/10 disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={createLink}
          className="rounded border border-cyber-blue/20 px-2 py-1 text-[10px] font-bold uppercase text-cyber-blue transition hover:bg-cyber-blue/10 disabled:opacity-40"
        >
          Link
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            onChange('')
            if (editorRef.current) {
              editorRef.current.innerHTML = ''
            }
          }}
          className="rounded border border-cyber-red/20 px-2 py-1 text-[10px] font-bold uppercase text-cyber-red transition hover:bg-cyber-red/10 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div className="relative">
        {!value && (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-gray-500">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
          onPaste={(event) => {
            event.preventDefault()
            const text = event.clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          }}
          className={`${minHeightClassName} px-4 py-3 text-sm leading-7 text-white focus:outline-none [&_blockquote]:border-l [&_blockquote]:border-cyber-orange/35 [&_blockquote]:pl-3 [&_blockquote]:italic [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-white/5 [&_pre]:p-3 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5`}
        />
      </div>
    </div>
  )
}
