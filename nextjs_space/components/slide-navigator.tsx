'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlideNavigatorProps {
  currentSlide: number
  totalSlides: number
  onPrevious: () => void
  onNext: () => void
  onFirst: () => void
  onLast: () => void
  compact?: boolean
}

export function SlideNavigator({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  compact,
}: SlideNavigatorProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
      {!compact && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFirst}
          disabled={currentSlide === 1}
          title="First slide (Home)"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={currentSlide === 1}
        title="Previous slide"
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>

      <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-muted rounded-md text-xs sm:text-sm font-medium whitespace-nowrap">
        {currentSlide} / {totalSlides}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={currentSlide === totalSlides}
        title="Next slide"
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      {!compact && (
        <Button
          variant="outline"
          size="icon"
          onClick={onLast}
          disabled={currentSlide === totalSlides}
          title="Last slide (End)"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  )
}
