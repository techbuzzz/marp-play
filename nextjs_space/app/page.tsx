'use client'

import { useEffect, useState } from 'react'
import { Maximize2, Minimize2, Play, Pause, Mouse, ChevronDown, ChevronUp, Download, Loader2, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { MarkdownEditor } from '@/components/markdown-editor'
import { SlideViewer } from '@/components/slide-viewer'
import { SlideNavigator } from '@/components/slide-navigator'
import { ThemeSelector } from '@/components/theme-selector'
import { SpeakerNotes } from '@/components/speaker-notes'
import { usePresentation } from '@/hooks/use-presentation'
import { ANIMATION_PRESETS } from '@/lib/animation-presets'
import { toast } from 'sonner'

export default function Home() {
  const {
    markdown,
    setMarkdown,
    presentation,
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
  const [showEditor, setShowEditor] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const currentSlideData = getCurrentSlide()
  const previousSlideData = getPreviousSlide()

  // Get effective animations for the current slide
  const currentAnims = getAnimations(currentSlide - 1)
  // For outgoing slide, use its own animateOut directive or preset
  const prevAnims = previousSlide ? getAnimations(previousSlide - 1) : { animIn: '', animOut: '' }

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      setIsFullscreen(prev => !prev)
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
    } catch (error: any) {
      console.error('PDF export error:', error)
      toast.error(error.message || 'Failed to export PDF')
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

  // Animation selector component (reused in normal + fullscreen)
  const AnimationSelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 sm:gap-1.5 ${compact ? 'px-2 py-1 bg-white/5 rounded-lg border border-white/10' : 'px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-lg border border-border'}`}>
      <Sparkles className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${compact ? 'text-gray-400' : 'text-muted-foreground'}`} />
      <Select value={animationPreset} onValueChange={setAnimationPreset}>
        <SelectTrigger className={`w-24 sm:w-28 h-7 sm:h-8 text-xs sm:text-sm ${compact ? 'text-white border-white/30' : 'border-border'}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANIMATION_PRESETS.map(p => (
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

  // Fullscreen mode
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

        <div className="flex-1 overflow-hidden" onClick={clickToAdvance ? handleSlideClick : undefined} style={clickToAdvance ? { cursor: 'pointer' } : undefined}>
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
                  className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 text-xs sm:text-sm transition-all ${isPlaying ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-white hover:bg-white/20'}`}
                >
                  {isPlaying ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                <Select value={playInterval.toString()} onValueChange={(val) => setPlayInterval(parseInt(val))}>
                  <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm text-white border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10].map(v => (
                      <SelectItem key={v} value={v.toString()}>{v}s</SelectItem>
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
        {/* Row 1: Title + main actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              Marp Player
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
              className="gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              title="Load example presentation"
            >
              <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Example</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Animation selector */}
            <AnimationSelector />

            {/* Click to advance toggle */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 rounded-lg border border-border">
              <Mouse className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden md:inline text-xs text-muted-foreground">Click</span>
              <Switch
                checked={clickToAdvance}
                onCheckedChange={(checked) => {
                  setClickToAdvance(checked)
                  if (checked && isPlaying) togglePlay()
                }}
                className="scale-75 sm:scale-90"
              />
            </div>

            {/* Autoplay controls */}
            {!clickToAdvance && (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <Button
                  variant={isPlaying ? 'default' : 'outline'}
                  size="sm"
                  onClick={togglePlay}
                  disabled={totalSlides === 0}
                  className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 text-xs sm:text-sm transition-all ${isPlaying ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                >
                  {isPlaying ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                  <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                <Select value={playInterval.toString()} onValueChange={(val) => setPlayInterval(parseInt(val))}>
                  <SelectTrigger className="w-14 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm border-blue-200/50 dark:border-blue-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10].map(v => (
                      <SelectItem key={v} value={v.toString()}>{v}s</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* PDF Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={totalSlides === 0 || isExporting}
              className="gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              title="Export to PDF"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              ) : (
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>

            {/* Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              disabled={totalSlides === 0}
              className="gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              title="Fullscreen (F)"
            >
              <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden md:inline">Fullscreen</span>
            </Button>

            {/* Toggle Editor (mobile) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditor(!showEditor)}
              className="md:hidden gap-1 h-7 sm:h-8 px-2 text-xs"
            >
              {showEditor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Editor
            </Button>
          </div>
        </div>

        {/* Row 2: Navigation + theme */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
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

        <div className="flex-1 flex flex-col gap-2 sm:gap-3 section-modern rounded-xl overflow-hidden shadow-md min-h-0">
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950 rounded-lg border border-border/50 relative min-h-[200px]">
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
          <SpeakerNotes notes={currentSlideData?.notes ?? ''} />
        </div>
      </div>
    </div>
  )
}
