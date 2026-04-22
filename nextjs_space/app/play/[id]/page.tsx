'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2, AlertCircle, Home, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlideData {
  html: string
  notes: string
  animateIn: string
  animateOut: string
}

interface PresentationData {
  title: string
  markdown: string
  slideCount: number
  views: number
}

export default function PlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === 'true'
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [slides, setSlides] = useState<SlideData[]>([])
  const [css, setCss] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch presentation data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // Fetch from internal API (no auth needed for play page)
        const res = await fetch(`/api/internal/play/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Not found' }))
          setError(data.error || 'Presentation not found')
          return
        }
        const data = await res.json()
        setPresentation(data)

        // Render markdown
        const renderRes = await fetch('/api/render-marp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: data.markdown }),
        })
        if (renderRes.ok) {
          const renderData = await renderRes.json()
          setSlides(renderData.slides || [])
          setCss(renderData.css || '')
        }
      } catch {
        setError('Failed to load presentation')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const navigate = useCallback((direction: 'next' | 'prev' | 'first' | 'last') => {
    setCurrentSlide(prev => {
      const total = slides.length
      if (total === 0) return 0
      switch (direction) {
        case 'next': return Math.min(prev + 1, total - 1)
        case 'prev': return Math.max(prev - 1, 0)
        case 'first': return 0
        case 'last': return total - 1
        default: return prev
      }
    })
  }, [slides.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault()
            exitFullscreen()
          }
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, isFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const currentSlideData = slides[currentSlide]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Presentation Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
            <Home className="h-4 w-4" /> Go to Marp Player
          </a>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? 'bg-black' : 'bg-gray-950 min-h-screen'}`}>
      {/* Top bar - hidden in embed mode with fullscreen */}
      {!isEmbed && !isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">
              <Home className="h-4 w-4" />
            </a>
            <h1 className="text-sm font-medium text-white truncate max-w-[300px]">
              {presentation?.title}
            </h1>
            <span className="text-xs text-gray-500">
              {slides.length} slides
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white h-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slide viewer */}
      <div
        className={`flex-1 flex items-center justify-center relative ${isFullscreen ? 'h-screen' : ''}`}
        onClick={() => navigate('next')}
        style={{ cursor: 'pointer' }}
      >
        {currentSlideData && (
          <div className="w-full h-full flex items-center justify-center p-2">
            <div
              className="relative w-full overflow-hidden"
              style={{ maxWidth: '1280px', aspectRatio: '16/9' }}
            >
              {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
              <div
                className="w-full h-full [&_.marpit]:w-full [&_.marpit]:h-full [&_.marpit>svg]:w-full [&_.marpit>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: currentSlideData.html }}
              />
            </div>
          </div>
        )}

        {/* Fullscreen controls overlay */}
        {isFullscreen && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); navigate('prev') }}
                disabled={currentSlide === 0}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-white/80 text-sm min-w-[60px] text-center">
                {currentSlide + 1} / {slides.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); navigate('next') }}
                disabled={currentSlide === slides.length - 1}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); exitFullscreen() }}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom navigation - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('prev')}
            disabled={currentSlide === 0}
            className="text-gray-400 hover:text-white h-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-gray-300 text-sm min-w-[60px] text-center">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('next')}
            disabled={currentSlide === slides.length - 1}
            className="text-gray-400 hover:text-white h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white h-8"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
