'use client'

import { Play, Pause, Mouse, Sparkles, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ANIMATION_PRESETS } from '@/lib/animation-presets'

const THEMES = [
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

interface ControlPanelProps {
  theme: string
  setTheme: (theme: string) => void
  animationPreset: string
  setAnimationPreset: (preset: string) => void
  clickToAdvance: boolean
  setClickToAdvance: (value: boolean) => void
  isPlaying: boolean
  togglePlay: () => void
  playInterval: number
  setPlayInterval: (interval: number) => void
  totalSlides: number
}

export function ControlPanel({
  theme,
  setTheme,
  animationPreset,
  setAnimationPreset,
  clickToAdvance,
  setClickToAdvance,
  isPlaying,
  togglePlay,
  playInterval,
  setPlayInterval,
  totalSlides,
}: ControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-blue-950/40 border border-border rounded-xl shadow-sm">
      {/* 1. Theme */}
      <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/70 dark:bg-slate-950/60 rounded-lg border border-border/60 shadow-sm">
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-24 sm:w-28 h-7 sm:h-8 text-xs sm:text-sm border-0 shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Animation */}
      <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/70 dark:bg-slate-950/60 rounded-lg border border-border/60 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={animationPreset} onValueChange={setAnimationPreset}>
          <SelectTrigger className="w-24 sm:w-28 h-7 sm:h-8 text-xs sm:text-sm border-0 shadow-none focus:ring-0">
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

      {/* 3. Click mode */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/70 dark:bg-slate-950/60 rounded-lg border border-border/60 shadow-sm">
        <Mouse className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs sm:text-sm text-foreground font-medium">Click</span>
        <Switch
          checked={clickToAdvance}
          onCheckedChange={(checked) => {
            setClickToAdvance(checked)
            if (checked && isPlaying) togglePlay()
          }}
          className="scale-90"
        />
      </div>

      {/* 4. Play */}
      {!clickToAdvance && (
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="sm"
            onClick={togglePlay}
            disabled={totalSlides === 0}
            className={`h-7 sm:h-8 px-2 sm:px-3 gap-1 text-xs sm:text-sm transition-all ${
              isPlaying
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                : ''
            }`}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>
          <Select
            value={playInterval.toString()}
            onValueChange={(val) => setPlayInterval(parseInt(val))}
          >
            <SelectTrigger className="w-14 sm:w-[72px] h-7 sm:h-8 text-xs sm:text-sm bg-white/80 dark:bg-slate-950/60">
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
  )
}
