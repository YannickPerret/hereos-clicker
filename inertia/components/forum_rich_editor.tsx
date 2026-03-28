import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCsrfToken } from '~/lib/csrf'

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
  const { t } = useTranslation('forum')
  const editorRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const uploadImage = async (file: File) => {
    if (disabled || uploadingImage) {
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    setUploadingImage(true)

    try {
      const response = await fetch('/forum/uploads/image', {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed')
      }

      exec('insertHTML', `<img src="${data.url}" alt="${file.name.replace(/"/g, '&quot;')}">`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t('imageUploadError'))
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
          disabled={disabled || uploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-cyber-purple/20 px-2 py-1 text-[10px] font-bold uppercase text-cyber-purple transition hover:bg-cyber-purple/10 disabled:opacity-40"
        >
          {uploadingImage ? t('imageUploading') : t('imageButton')}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void uploadImage(file)
            }
          }}
        />
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
          className={`${minHeightClassName} px-4 py-3 text-sm leading-7 text-white focus:outline-none [&_blockquote]:border-l [&_blockquote]:border-cyber-orange/35 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:mt-3 [&_img]:max-h-80 [&_img]:rounded-lg [&_img]:border [&_img]:border-cyber-blue/20 [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-white/5 [&_pre]:p-3 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5`}
        />
      </div>
    </div>
  )
}
