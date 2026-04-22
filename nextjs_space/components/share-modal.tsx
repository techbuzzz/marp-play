'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Copy, ExternalLink, Share2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string | null
  isLoading?: boolean
}

export function ShareModal({ open, onOpenChange, shareUrl, isLoading }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-select URL in input when modal opens
  useEffect(() => {
    if (open && shareUrl && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.select()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [open, shareUrl])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied!', { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      inputRef.current?.select()
      document.execCommand('copy')
      setCopied(true)
      toast.success('Link copied!', { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpen = () => {
    if (shareUrl) window.open(shareUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              {isLoading ? (
                <Share2 className="h-5 w-5 text-white animate-pulse" />
              ) : (
                <Sparkles className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isLoading ? 'Creating link…' : 'Your presentation is shared!'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-0.5">
                {isLoading
                  ? 'Generating a shareable URL'
                  : 'Copy the link below and send it to your audience.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* URL field */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={shareUrl || ''}
                readOnly
                placeholder={isLoading ? 'Please wait…' : ''}
                className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 truncate"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!shareUrl}
                className="shrink-0 h-9 gap-1.5"
                title="Copy link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden sm:inline text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="text-[11px] sm:text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg px-3 py-2">
            <span className="font-medium text-blue-700 dark:text-blue-300">Tip:</span>{' '}
            Viewers will see the presentation with the editor collapsed and won&apos;t be able
            to reshare it. Link stays active for 30 days.
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={handleCopy}
              disabled={!shareUrl}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-1.5 h-9"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </>
              )}
            </Button>
            <Button
              onClick={handleOpen}
              disabled={!shareUrl}
              variant="outline"
              className="flex-1 gap-1.5 h-9"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
