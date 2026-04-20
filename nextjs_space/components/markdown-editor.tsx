'use client'

import { useState } from 'react'
import { FileUp, FileDown, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.md,.markdown,.txt'
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return

      setIsLoading(true)
      try {
        const text = await file.text()
        // If it's a .md file, load directly as markdown
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt')) {
          onChange(text)
          toast.success('Markdown file loaded')
        } else {
          // JSON format
          const data = JSON.parse(text)
          if (data.markdown) {
            onChange(data.markdown)
            toast.success('Presentation loaded')
          } else {
            toast.error('Invalid file format')
          }
        }
      } catch (error) {
        console.error('Error loading file:', error)
        toast.error('Failed to load file')
      } finally {
        setIsLoading(false)
      }
    }
    input.click()
  }

  const handleSaveFile = () => {
    try {
      const data = {
        markdown: value,
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Presentation saved')
    } catch (error) {
      console.error('Error saving file:', error)
      toast.error('Failed to save file')
    }
  }

  return (
    <div className="flex flex-col h-full gap-2 sm:gap-3">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadFile}
          disabled={isLoading}
          className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9"
        >
          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Load</span>
          <span className="sm:hidden">Load</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveFile}
          disabled={!value}
          className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9"
        >
          <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Save</span>
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Paste your Markdown here...\n\nSeparate slides with ---\n\nExample:\n---\nmarp: true\n---\n# Title\nContent here\n---\n# Slide 2"}
        className="flex-1 resize-none font-mono text-xs sm:text-sm"
      />
    </div>
  )
}
