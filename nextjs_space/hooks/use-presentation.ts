'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Presentation, Slide } from '@/lib/markdown-parser'
import { ANIMATION_PRESETS, AnimationPreset } from '@/lib/animation-presets'

export function usePresentation() {
  const [markdown, setMarkdown] = useState('')
  const [presentation, setPresentation] = useState<Presentation>({ slides: [] })
  const [currentSlide, setCurrentSlide] = useState(1)
  const [previousSlide, setPreviousSlide] = useState<number | null>(null)
  const [theme, setTheme] = useState('modern')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playInterval, setPlayInterval] = useState(3)
  const [isRendering, setIsRendering] = useState(false)
  const [clickToAdvance, setClickToAdvance] = useState(false)
  const [animationPreset, setAnimationPreset] = useState<string>('none')
  const [isAnimating, setIsAnimating] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const activePreset = ANIMATION_PRESETS.find(p => p.id === animationPreset) || ANIMATION_PRESETS[0]

  // Render markdown via Marp API with debounce
  useEffect(() => {
    if (!markdown.trim()) {
      setPresentation({ slides: [] })
      setCurrentSlide(1)
      setPreviousSlide(null)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      abortRef.current = new AbortController()

      setIsRendering(true)
      try {
        const response = await fetch('/api/render-marp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown }),
          signal: abortRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Render failed')
        }

        const data = await response.json()
        
        const slides: Slide[] = (data.slides || []).map((s: { html: string; notes: string; animateIn?: string; animateOut?: string }) => ({
          content: '',
          notes: s.notes || '',
          html: s.html || '',
          animateIn: s.animateIn || '',
          animateOut: s.animateOut || '',
        }))

        setPresentation({ slides, css: data.css || '' })
        setCurrentSlide(prev => {
          if (prev > slides.length) return 1
          return prev
        })
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Marp rendering error:', error)
      } finally {
        setIsRendering(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [markdown])

  const getCurrentSlide = useCallback(() => {
    if (presentation?.slides?.[currentSlide - 1]) {
      return presentation.slides[currentSlide - 1]
    }
    return null
  }, [presentation, currentSlide])

  const getPreviousSlide = useCallback(() => {
    if (previousSlide !== null && presentation?.slides?.[previousSlide - 1]) {
      return presentation.slides[previousSlide - 1]
    }
    return null
  }, [presentation, previousSlide])

  // Get the effective animation for a slide (per-slide directive overrides preset)
  const getAnimations = useCallback((slideIndex: number) => {
    const slide = presentation?.slides?.[slideIndex]
    const isCustomMode = animationPreset === 'custom'
    const preset = activePreset

    let animIn = preset.animateIn || ''
    let animOut = preset.animateOut || ''

    // Per-slide directives override in 'custom' mode or any mode
    if (slide?.animateIn) animIn = slide.animateIn
    if (slide?.animateOut) animOut = slide.animateOut

    // In 'none' mode and no per-slide directives, no animation
    if (animationPreset === 'none' && !slide?.animateIn && !slide?.animateOut) {
      return { animIn: '', animOut: '' }
    }

    return { animIn, animOut }
  }, [presentation, animationPreset, activePreset])

  const navigateWithAnimation = useCallback(
    (action: 'next' | 'prev' | 'first' | 'last' | 'jump', slideNumber?: number) => {
      const totalSlides = presentation?.slides?.length ?? 0
      if (totalSlides === 0) return

      let newSlide = currentSlide
      switch (action) {
        case 'next':
          newSlide = Math.min(currentSlide + 1, totalSlides)
          break
        case 'prev':
          newSlide = Math.max(currentSlide - 1, 1)
          break
        case 'first':
          newSlide = 1
          break
        case 'last':
          newSlide = totalSlides
          break
        case 'jump':
          if (slideNumber && slideNumber >= 1 && slideNumber <= totalSlides) {
            newSlide = slideNumber
          }
          break
      }

      if (newSlide === currentSlide) return

      // Track previous slide for exit animation
      setPreviousSlide(currentSlide)
      setCurrentSlide(newSlide)
      setIsAnimating(true)

      // Clear animation state after animation duration
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
      animationTimerRef.current = setTimeout(() => {
        setIsAnimating(false)
        setPreviousSlide(null)
      }, 600) // animation duration
    },
    [currentSlide, presentation?.slides?.length]
  )

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || clickToAdvance || presentation?.slides?.length === 0) {
      return
    }

    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const totalSlides = presentation?.slides?.length ?? 0
        if (prev >= totalSlides) {
          setIsPlaying(false)
          return prev
        }
        setPreviousSlide(prev)
        setIsAnimating(true)
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
        animationTimerRef.current = setTimeout(() => {
          setIsAnimating(false)
          setPreviousSlide(null)
        }, 600)
        return prev + 1
      })
    }, playInterval * 1000)

    return () => clearInterval(interval)
  }, [isPlaying, playInterval, presentation?.slides?.length, clickToAdvance])

  const togglePlay = useCallback(() => {
    const totalSlides = presentation?.slides?.length ?? 0
    if (totalSlides === 0) return
    setIsPlaying(prev => !prev)
  }, [presentation?.slides?.length])

  const handleSlideClick = useCallback(() => {
    if (!clickToAdvance) return
    const totalSlides = presentation?.slides?.length ?? 0
    if (totalSlides === 0) return

    setPreviousSlide(currentSlide)
    setIsAnimating(true)
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false)
      setPreviousSlide(null)
    }, 600)

    setCurrentSlide(prev => {
      if (prev >= totalSlides) return 1
      return prev + 1
    })
  }, [clickToAdvance, presentation?.slides?.length, currentSlide])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
    }
  }, [])

  return {
    markdown,
    setMarkdown,
    presentation,
    currentSlide,
    previousSlide,
    totalSlides: presentation?.slides?.length ?? 0,
    getCurrentSlide,
    getPreviousSlide,
    navigate: navigateWithAnimation,
    theme,
    setTheme,
    css: presentation?.css || '',
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
  }
}
