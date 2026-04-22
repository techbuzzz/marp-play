'use client'

import { useState } from 'react'
import { FileDown, Upload, FilePlus2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmNewOpen, setConfirmNewOpen] = useState(false)

  // Clear the editor to start a brand-new presentation.
  // If the editor already has content, we ask for confirmation to avoid
  // data loss — saving first is one click away via the Save button.
  const handleNew = () => {
    if (!value.trim()) {
      // Already empty — no-op, just give a subtle confirmation.
      toast.success('Editor is ready for a new presentation')
      return
    }
    setConfirmNewOpen(true)
  }

  const confirmNew = () => {
    onChange('')
    setConfirmNewOpen(false)
    toast.success('New presentation started')
  }

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
          onClick={handleNew}
          disabled={isLoading}
          className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9"
          aria-label="Start a new blank presentation"
        >
          <FilePlus2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>New</span>
        </Button>
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

      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new presentation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current Markdown will be cleared from the editor. This can&rsquo;t
              be undone. Use <strong>Save</strong> first if you want to keep a
              local copy, or <strong>Share</strong> if you already have a link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmNew}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard &amp; start new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
