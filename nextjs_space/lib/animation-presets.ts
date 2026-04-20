// Available animations from animate.css
export const AVAILABLE_ANIMATIONS = {
  // Fade
  fadeIn: 'fadeIn',
  fadeOut: 'fadeOut',
  fadeInLeft: 'fadeInLeft',
  fadeInRight: 'fadeInRight',
  fadeInUp: 'fadeInUp',
  fadeInDown: 'fadeInDown',
  fadeOutLeft: 'fadeOutLeft',
  fadeOutRight: 'fadeOutRight',
  fadeOutUp: 'fadeOutUp',
  fadeOutDown: 'fadeOutDown',
  // Bounce
  bounceIn: 'bounceIn',
  bounceOut: 'bounceOut',
  bounceInLeft: 'bounceInLeft',
  bounceInRight: 'bounceInRight',
  bounceInUp: 'bounceInUp',
  bounceInDown: 'bounceInDown',
  bounceOutLeft: 'bounceOutLeft',
  bounceOutRight: 'bounceOutRight',
  bounceOutUp: 'bounceOutUp',
  bounceOutDown: 'bounceOutDown',
  // Slide
  slideInLeft: 'slideInLeft',
  slideInRight: 'slideInRight',
  slideInUp: 'slideInUp',
  slideInDown: 'slideInDown',
  slideOutLeft: 'slideOutLeft',
  slideOutRight: 'slideOutRight',
  slideOutUp: 'slideOutUp',
  slideOutDown: 'slideOutDown',
  // Rotate
  rotateIn: 'rotateIn',
  rotateOut: 'rotateOut',
  // Flip
  flipInX: 'flipInX',
  flipInY: 'flipInY',
  flipOutX: 'flipOutX',
  flipOutY: 'flipOutY',
  // Special
  lightSpeedIn: 'lightSpeedIn',
  lightSpeedOut: 'lightSpeedOut',
  rollIn: 'rollIn',
  rollOut: 'rollOut',
} as const

export type AnimationName = keyof typeof AVAILABLE_ANIMATIONS | ''

export interface AnimationPreset {
  id: string
  label: string
  icon: string
  animateIn: string
  animateOut: string
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'none',
    label: 'None',
    icon: '⏹',
    animateIn: '',
    animateOut: '',
  },
  {
    id: 'fade',
    label: 'Fade',
    icon: '🌫',
    animateIn: 'fadeIn',
    animateOut: 'fadeOut',
  },
  {
    id: 'bounce',
    label: 'Bounce',
    icon: '🏀',
    animateIn: 'bounceInLeft',
    animateOut: 'bounceOutRight',
  },
  {
    id: 'slide',
    label: 'Slide',
    icon: '➡️',
    animateIn: 'slideInRight',
    animateOut: 'slideOutLeft',
  },
  {
    id: 'flip',
    label: 'Flip',
    icon: '🔄',
    animateIn: 'flipInY',
    animateOut: 'flipOutY',
  },
  {
    id: 'custom',
    label: 'Per-slide',
    icon: '✨',
    animateIn: '',
    animateOut: '',
  },
]

// Extract animation directives from slide notes/comments
// Supports: <!-- _animateIn: fadeInLeft --> <!-- _animateOut: fadeOutRight -->
export function parseSlideAnimations(html: string, notes: string): {
  animateIn?: string
  animateOut?: string
} {
  const result: { animateIn?: string; animateOut?: string } = {}
  const combined = html + ' ' + notes

  // Match <!-- _animateIn: X -->
  const inMatch = combined.match(/<!--\s*_animateIn:\s*(\w+)\s*-->/i)
  if (inMatch && inMatch[1] in AVAILABLE_ANIMATIONS) {
    result.animateIn = inMatch[1]
  }

  // Match <!-- _animateOut: X -->
  const outMatch = combined.match(/<!--\s*_animateOut:\s*(\w+)\s*-->/i)
  if (outMatch && outMatch[1] in AVAILABLE_ANIMATIONS) {
    result.animateOut = outMatch[1]
  }

  return result
}
