'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SpeakerNotesProps {
  notes: string
}

export function SpeakerNotes({ notes }: SpeakerNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!notes) {
    return null
  }

  return (
    <div className="border-t border-border mt-4">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Speaker Notes
      </Button>
      {isExpanded && (
        <div className="p-4 bg-muted/50 text-sm text-foreground whitespace-pre-wrap">
          {notes}
        </div>
      )}
    </div>
  )
}
