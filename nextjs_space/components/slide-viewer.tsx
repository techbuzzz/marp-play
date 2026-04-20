'use client'

import { Slide } from '@/lib/markdown-parser'

interface SlideViewerProps {
  slide: Slide | null
  previousSlide?: Slide | null
  theme: string
  css?: string
  onClick?: () => void
  clickable?: boolean
  animateIn?: string
  animateOut?: string
  isAnimating?: boolean
}

export function SlideViewer({
  slide,
  previousSlide,
  theme,
  css,
  onClick,
  clickable,
  animateIn,
  animateOut,
  isAnimating,
}: SlideViewerProps) {
  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-muted-foreground">No slide to display</p>
      </div>
    )
  }

  const slideHtml = slide.html || ''
  const prevHtml = previousSlide?.html || ''
  const hasAnimation = (animateIn || animateOut) && isAnimating

  return (
    <div
      className={`slide-viewer overflow-hidden h-full w-full relative ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      {css && (
        <style dangerouslySetInnerHTML={{ __html: css }} />
      )}

      {/* Outgoing slide (exit animation) */}
      {hasAnimation && animateOut && prevHtml && (
        <div
          key={`prev-${prevHtml.substring(0, 50)}`}
          className={`marp-slide-wrapper absolute inset-0 z-10 animated ${animateOut}`}
          style={{ animationDuration: '0.5s' }}
          dangerouslySetInnerHTML={{ __html: prevHtml }}
        />
      )}

      {/* Current slide (enter animation) */}
      <div
        key={`slide-${slideHtml.substring(0, 50)}-${animateIn || 'none'}`}
        className={`marp-slide-wrapper ${hasAnimation && animateIn ? `animated ${animateIn}` : ''}`}
        style={hasAnimation && animateIn ? { animationDuration: '0.5s' } : undefined}
        dangerouslySetInnerHTML={{ __html: slideHtml }}
      />
    </div>
  )
}
