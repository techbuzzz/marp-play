'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Mouse,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  BookOpen,
  Sparkles,
  MoreVertical,
  Share2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { MarkdownEditor } from '@/components/markdown-editor'
import { SlideViewer } from '@/components/slide-viewer'
import { SlideNavigator } from '@/components/slide-navigator'
import { SpeakerNotes } from '@/components/speaker-notes'
import { ControlPanel } from '@/components/control-panel'
import { ShareModal } from '@/components/share-modal'
import { McpModal } from '@/components/mcp-modal'
import { usePresentation } from '@/hooks/use-presentation'
import { ANIMATION_PRESETS } from '@/lib/animation-presets'
import { toast } from 'sonner'

function HomeInner() {
  const searchParams = useSearchParams()
  const sharedId = searchParams.get('s')
  const isSharedView = Boolean(sharedId)

  const {
    markdown,
    setMarkdown,
    currentSlide,
    previousSlide,
    totalSlides,
    getCurrentSlide,
    getPreviousSlide,
    navigate,
    theme,
    setTheme,
    css,
    isPlaying,
    togglePlay,
    playInterval,
    setPlayInterval,
    isRendering,
    clickToAdvance,
    setClickToAdvance,
    handleSlideClick,
    animationPreset,
    setAnimationPreset,
    isAnimating,
    getAnimations,
  } = usePresentation()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  // Editor is collapsed by default for shared viewers
  const [showEditor, setShowEditor] = useState(!isSharedView)
  const [isExporting, setIsExporting] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [mcpModalOpen, setMcpModalOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isLoadingShared, setIsLoadingShared] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const currentSlideData = getCurrentSlide()
  const previousSlideData = getPreviousSlide()

  // Get effective animations for the current slide
  const currentAnims = getAnimations(currentSlide - 1)
  const prevAnims = previousSlide ? getAnimations(previousSlide - 1) : { animIn: '', animOut: '' }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load shared presentation if ?s=<id> is present
  useEffect(() => {
    if (!sharedId) return
    let cancelled = false
    ;(async () => {
      setIsLoadingShared(true)
      try {
        const res = await fetch(`/api/internal/play/${sharedId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Not found' }))
          toast.error(data.error || 'Shared presentation not found')
          return
        }
        const data = await res.json()
        if (!cancelled && data.markdown) {
          setMarkdown(data.markdown)
          toast.success('Shared presentation loaded', { duration: 2000 })
        }
      } catch {
        if (!cancelled) toast.error('Failed to load shared presentation')
      } finally {
        if (!cancelled) setIsLoadingShared(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMounted) return

      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          navigate('next')
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigate('prev')
          break
        case 'Home':
          e.preventDefault()
          navigate('first')
          break
        case 'End':
          e.preventDefault()
          navigate('last')
          break
        case 'f':
          if (totalSlides > 0) {
            e.preventDefault()
            handleFullscreen()
          }
          break
        case 'Escape':
          if (showEditor === false && !isFullscreen) {
            setShowEditor(true)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, totalSlides, isMounted, isFullscreen, showEditor])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [isFullscreen])

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  // Reset shared URL when markdown changes (unless we are in shared view)
  useEffect(() => {
    if (!isSharedView && sharedUrl) {
      setSharedUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown])

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        return true
      } catch {
        return false
      }
    }
  }, [])

  const handleShareLink = async () => {
    if (!markdown.trim() || totalSlides === 0) {
      toast.error('No presentation to share')
      return
    }

    // Open the modal immediately with a loading state
    setShareModalOpen(true)
    setIsSharing(true)

    try {
      // Same-origin UI endpoint: no Bearer token needed. Bot/MCP clients must
      // hit /api/v1/play with an API key instead.
      const response = await fetch('/api/internal/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, title: 'Shared Presentation' }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errData.error || `Server error: ${response.status}`)
      }
      const data = await response.json()
      if (data.playUrl) {
        setSharedUrl(data.playUrl)
        // Auto-copy in the background for convenience
        await copyToClipboard(data.playUrl)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create share link'
      console.error('Share error:', error)
      toast.error(msg)
      setShareModalOpen(false)
      setSharedUrl(null)
    } finally {
      setIsSharing(false)
      setShowMobileMenu(false)
    }
  }

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          await elem.requestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      setIsFullscreen((prev) => !prev)
    }
  }

  const handleExportPdf = async () => {
    if (!markdown.trim() || totalSlides === 0) {
      toast.error('No presentation to export')
      return
    }

    setIsExporting(true)
    toast.info('Generating PDF... This may take a moment.')

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(err.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF exported successfully!')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to export PDF'
      console.error('PDF export error:', error)
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }

  const handleLoadExample = async () => {
    try {
      const response = await fetch('/api/markdown?file=all-features.md')
      if (!response.ok) throw new Error('Failed to load example')
      const data = await response.json()
      if (data.content) {
        setMarkdown(data.content)
        setShowEditor(true)
        toast.success('Example loaded \u2014 All Features Demo')
      }
    } catch (error) {
      console.error('Error loading example:', error)
      toast.error('Failed to load example')
    }
  }

  if (!isMounted) {
    return null
  }

  // Animation selector component for fullscreen mode
  const AnimationSelector = ({ compact = false }: { compact?: boolean }) => (
    <div
      className={`flex items-center gap-1 sm:gap-1.5 ${
        compact
          ? 'px-2 py-1 bg-white/5 rounded-lg border border-white/10'
          : 'px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-lg border border-border'
      }`}
    >
      <Sparkles
        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${compact ? 'text-gray-400' : 'text-muted-foreground'}`}
      />
      <Select value={animationPreset} onValueChange={setAnimationPreset}>
        <SelectTrigger
          className={`w-24 sm:w-28 h-7 sm:h-8 text-xs sm:text-sm ${
            compact ? 'text-white border-white/30' : 'border-border'
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANIMATION_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-1.5">
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  // Fullscreen mode (unchanged layout with its own controls)
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col z-50">
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="gap-1.5 text-white hover:bg-white/20 transition-all text-xs sm:text-sm"
          >
            <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Exit Fullscreen (F)</span>
            <span className="sm:hidden">Exit</span>
          </Button>
        </div>

        {clickToAdvance && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs border border-emerald-400/30">
              <Mouse className="h-3 w-3" />
              <span className="hidden sm:inline">Click to advance</span>
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-hidden"
          onClick={clickToAdvance ? handleSlideClick : undefined}
          style={clickToAdvance ? { cursor: 'pointer' } : undefined}
        >
          <SlideViewer
            slide={currentSlideData ?? null}
            previousSlide={previousSlideData}
            theme={theme}
            css={css}
            animateIn={currentAnims.animIn}
            animateOut={prevAnims.animOut}
            isAnimating={isAnimating}
          />
        </div>

        <div className="bg-gradient-to-t from-black to-slate-900 border-t border-white/10 p-2 sm:p-4 flex items-center justify-between text-white gap-2">
          <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
            {currentSlide} / {totalSlides}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AnimationSelector compact />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <Mouse className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">Click</span>
              <Switch
                checked={clickToAdvance}
                onCheckedChange={(checked) => {
                  setClickToAdvance(checked)
                  if (checked && isPlaying) togglePlay()
                }}
                className="scale-75"
              />
            </div>

            {!clickToAdvance && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                <Button
                  variant={isPlaying ? 'default' : 'ghost'}
                  size="sm"
                  onClick={togglePlay}
                  disabled={totalSlides === 0}
                  className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 text-xs sm:text-sm transition-all ${
                    isPlaying
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                <Select
                  value={playInterval.toString()}
                  onValueChange={(val) => setPlayInterval(parseInt(val))}
                >
                  <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm text-white border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10].map((v) => (
                      <SelectItem key={v} value={v.toString()}>
                        {v}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <SlideNavigator
            currentSlide={currentSlide}
            totalSlides={totalSlides}
            onPrevious={() => navigate('prev')}
            onNext={() => navigate('next')}
            onFirst={() => navigate('first')}
            onLast={() => navigate('last')}
            compact
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="top-bar-gradient border-b border-border p-2 sm:p-3 md:p-4">
        {/* Row 1: Title + actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              <span className="sm:hidden">MP</span>
              <span className="hidden sm:inline">Marp Player</span>
            </h1>

            {!isSharedView && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadExample}
                className="gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                title="Load example presentation"
              >
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Example</span>
              </Button>
            )}

            {!isSharedView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMcpModalOpen(true)}
                className="gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm shrink-0 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border-violet-200/60 dark:border-violet-800/50 hover:from-violet-100 hover:to-blue-100 dark:hover:from-violet-900/40 dark:hover:to-blue-900/40"
                title="MCP & API integration"
              >
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-violet-600 dark:text-violet-400" />
                <span className="hidden sm:inline">MCP</span>
              </Button>
            )}

            {isSharedView && isLoadingShared && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md text-xs text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading…</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop buttons: PDF, Share, Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={totalSlides === 0 || isExporting}
              className="hidden sm:flex gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              title="Export to PDF"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              ) : (
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
              <span className="hidden md:inline">PDF</span>
            </Button>

            {/* Share button - hidden for shared viewers */}
            {!isSharedView && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLink}
                disabled={totalSlides === 0 || isSharing}
                className="hidden sm:flex gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                title="Share presentation link"
              >
                {isSharing ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
                <span className="hidden md:inline">Share</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              disabled={totalSlides === 0}
              className="hidden sm:flex gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              title="Fullscreen (F)"
            >
              <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden lg:inline">Fullscreen</span>
            </Button>

            {/* Toggle Editor (mobile + tablet) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditor(!showEditor)}
              className="md:hidden gap-1 h-7 px-2 text-xs"
            >
              {showEditor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="hidden xs:inline">Editor</span>
            </Button>

            {/* Mobile "more" menu */}
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="h-7 w-7 p-0"
                title="More actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>

              {showMobileMenu && (
                <div className="absolute right-0 top-9 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                  {!isSharedView && (
                    <button
                      onClick={() => {
                        setMcpModalOpen(true)
                        setShowMobileMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Zap className="h-3.5 w-3.5 text-violet-500" />
                      MCP &amp; API
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleExportPdf()
                      setShowMobileMenu(false)
                    }}
                    disabled={totalSlides === 0 || isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export PDF
                  </button>
                  {!isSharedView && (
                    <button
                      onClick={handleShareLink}
                      disabled={totalSlides === 0 || isSharing}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSharing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      Share Link
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleFullscreen()
                      setShowMobileMenu(false)
                    }}
                    disabled={totalSlides === 0}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Fullscreen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Slide navigation */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <SlideNavigator
            currentSlide={currentSlide}
            totalSlides={totalSlides}
            onPrevious={() => navigate('prev')}
            onNext={() => navigate('next')}
            onFirst={() => navigate('first')}
            onLast={() => navigate('last')}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4">
        {showEditor && (
          <div className="md:w-1/3 flex flex-col gap-2 sm:gap-3 section-modern rounded-xl overflow-hidden shadow-md h-[30vh] md:h-auto">
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor value={markdown} onChange={setMarkdown} />
            </div>
          </div>
        )}

        {/* Main presentation column */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-h-0">
          {/* Slide viewer */}
          <div className="flex-1 section-modern rounded-xl overflow-hidden shadow-md min-h-0">
            <div className="flex-1 h-full bg-white dark:bg-slate-950 rounded-lg border border-border/50 relative min-h-[200px]">
              {isRendering && (
                <div className="absolute top-2 right-2 z-10 px-2 sm:px-3 py-1 bg-blue-500/90 text-white text-[10px] sm:text-xs rounded-full animate-pulse">
                  Rendering...
                </div>
              )}
              {clickToAdvance && totalSlides > 0 && (
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] sm:text-xs border border-emerald-200 dark:border-emerald-800">
                  <Mouse className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Click slide
                </div>
              )}
              <SlideViewer
                slide={currentSlideData ?? null}
                previousSlide={previousSlideData}
                theme={theme}
                css={css}
                onClick={handleSlideClick}
                clickable={clickToAdvance}
                animateIn={currentAnims.animIn}
                animateOut={prevAnims.animOut}
                isAnimating={isAnimating}
              />
            </div>
          </div>

          {/* Control panel: theme → animation → click → play */}
          <ControlPanel
            theme={theme}
            setTheme={setTheme}
            animationPreset={animationPreset}
            setAnimationPreset={setAnimationPreset}
            clickToAdvance={clickToAdvance}
            setClickToAdvance={setClickToAdvance}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            playInterval={playInterval}
            setPlayInterval={setPlayInterval}
            totalSlides={totalSlides}
          />

          <SpeakerNotes notes={currentSlideData?.notes ?? ''} />
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={sharedUrl}
        isLoading={isSharing}
      />
      <McpModal open={mcpModalOpen} onOpenChange={setMcpModalOpen} />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
