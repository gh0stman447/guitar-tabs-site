'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, RotateCw, X, Volume2, VolumeX } from 'lucide-react';
import { useIsTouch } from '@/hooks/useIsTouch';
import { reachGoal } from '@/lib/yandex-metrika';
import type { Tab } from '@/types';

interface AudioPlayerDialogProps {
  tab: Tab;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayerDialog({ tab, locale, open, onOpenChange }: AudioPlayerDialogProps) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isTouch = useIsTouch();
  const isSmallLandscape = isTouch && typeof window !== 'undefined' && window.innerHeight < 500;
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [bufferedTime, setBufferedTime] = useState(0);
  const shouldAutoPlayRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const wasPlayingBeforeDrag = useRef(false);

  // Yandex Metrika: listen audio
  useEffect(() => {
    if (open) {
      reachGoal('listen_preview', {
        tab_id: tab.id,
        title,
      });
      shouldAutoPlayRef.current = true;
    }
  }, [open, tab.id, title]);

  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
      hasLoadedRef.current = false;
      shouldAutoPlayRef.current = false;
      // Don't call setState directly in effect - let the audio events handle it
    }
  }, [open]);

  const handleLoadedMetadata = useCallback(() => {
    const t0 = performance.now();
    console.log('[AudioPlayer] handleLoadedMetadata at', new Date().toISOString());
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      console.log('[AudioPlayer] duration:', dur);
      if (isFinite(dur)) setDuration(dur);
      setIsLoading(false);
      if (shouldAutoPlayRef.current) {
        shouldAutoPlayRef.current = false;
        console.log('[AudioPlayer] auto-playing...');
        audioRef.current
          .play()
          .then(() => {
            console.log(
              '[AudioPlayer] play succeeded in',
              (performance.now() - t0).toFixed(0),
              'ms',
            );
            setIsPlaying(true);
          })
          .catch((e) => {
            if (e.name === 'AbortError') return;
            console.error('[AudioPlayer] play error:', e);
          });
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      // Update buffered time
      const buffered = audioRef.current.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        setBufferedTime(bufferedEnd);
      }
    }
  }, [isDragging]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const handleError = useCallback(() => {
    if (!audioRef.current) return;
    // Ignore error if no src (dialog not opened yet)
    if (!audioRef.current.src || audioRef.current.src === window.location.href) {
      return;
    }
    console.error('[AudioPlayer] Failed to load audio');
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          if (e.name === 'AbortError') {
            // User paused before play completed - reset state to allow retry
            setIsPlaying(false);
            setIsLoading(false);
            return;
          }
          console.error('[AudioPlayer] play error:', e);
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  }, [isPlaying]);

  const performSeek = useCallback(
    (newTime: number) => {
      if (!audioRef.current || !isFinite(newTime)) return;
      const clamped = Math.max(0, Math.min(newTime, duration));
      audioRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration],
  );

  const handleSeekClick = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !audioRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      performSeek(percent * duration);
    },
    [duration, performSeek],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      wasPlayingBeforeDrag.current = isPlaying;
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      handleSeekClick(e.clientX);
    },
    [isPlaying, handleSeekClick],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      wasPlayingBeforeDrag.current = isPlaying;
      if (audioRef.current && isPlaying) audioRef.current.pause();
      handleSeekClick(e.touches[0].clientX);
    },
    [isPlaying, handleSeekClick],
  );

  const skipBackward = useCallback(() => {
    if (!audioRef.current || duration === 0) return;
    const newTime = Math.max(0, audioRef.current.currentTime - 10);
    performSeek(newTime);
  }, [duration, performSeek]);

  const skipForward = useCallback(() => {
    if (!audioRef.current || duration === 0) return;
    const newTime = Math.min(duration, audioRef.current.currentTime + 10);
    performSeek(newTime);
  }, [duration, performSeek]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  }, []);

  // Global mouse/touch handlers for dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleSeekClick(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleSeekClick(e.touches[0].clientX);
    };
    const onEnd = () => {
      setIsDragging(false);
      if (wasPlayingBeforeDrag.current && audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
      wasPlayingBeforeDrag.current = false;
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [isDragging, handleSeekClick]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  // Load audio source when dialog opens
  useEffect(() => {
    const t0 = performance.now();
    console.log(
      '[AudioPlayer] useEffect open:',
      open,
      'hasLoadedRef:',
      hasLoadedRef.current,
      'audioRef:',
      !!audioRef.current,
    );
    if (open && audioRef.current && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      const src = `/api/tabs/${tab.id}/audio`;
      console.log('[AudioPlayer] loading:', src, 'at', new Date().toISOString());
      // preload=none + crossOrigin заставляет браузер использовать Range requests с самого начала
      audioRef.current.setAttribute('preload', 'none');
      audioRef.current.setAttribute('crossOrigin', 'anonymous');
      audioRef.current.src = src;
      audioRef.current.load();
      console.log(
        '[AudioPlayer] load() called, elapsed:',
        (performance.now() - t0).toFixed(0),
        'ms',
      );
    }
  }, [open, tab.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload='none'
        crossOrigin='anonymous'
      />

      <DialogContent
        className='max-w-md w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden flex flex-col'
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className='px-6 pt-4 pb-3 flex flex-row items-center justify-between shrink-0 gap-2 border-b border-border'>
          <DialogTitle className='text-base font-semibold flex-1 truncate'>{title}</DialogTitle>
          <button
            data-tooltip-id='audio-close'
            data-tooltip-content={locale === 'en' ? 'Close' : 'Закрыть'}
            onClick={() => onOpenChange(false)}
            className='rounded-full w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
          {!isTouch && <ReactTooltip id='audio-close' place='bottom' opacity={1} delayShow={350} />}
        </DialogHeader>

        <div
          className={`px-6 pb-5 pt-4 flex flex-col gap-5 flex-1 ${isSmallLandscape ? '' : 'min-h-100'}`}
        >
          {/* Album art / Visual placeholder - hidden on small landscape touch devices */}
          {!isSmallLandscape && (
            <div className='flex justify-center items-center flex-1 min-h-0'>
              <div
                className={`relative w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg ${
                  isDark
                    ? 'bg-linear-to-br from-amber-500/25 to-amber-600/25 border border-amber-500/30'
                    : 'bg-linear-to-br from-amber-50 to-amber-100 border border-amber-200'
                }`}
              >
                <Volume2
                  className={`h-12 w-12 ${isDark ? 'text-amber-400' : 'text-amber-600'} ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                />
                {/* Animated rings when playing */}
                {isPlaying && (
                  <>
                    <div
                      className={`absolute inset-0 rounded-2xl border-2 border-amber-500/30 animate-ping`}
                      style={{ animationDuration: '1.5s' }}
                    />
                    <div
                      className={`absolute inset-0 rounded-2xl border-2 border-amber-500/20 animate-ping`}
                      style={{ animationDuration: '2s', animationDelay: '0.5s' }}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className='flex flex-col gap-2'>
            <div
              ref={progressRef}
              className={`relative h-2 rounded-full cursor-pointer group ${
                isDark ? 'bg-zinc-700' : 'bg-zinc-200'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Buffered fill */}
              <div
                className={`absolute h-full rounded-full ${
                  isDark ? 'bg-zinc-600' : 'bg-zinc-300'
                } transition-all duration-200`}
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Progress fill */}
              <div
                className={`absolute h-full rounded-full bg-linear-to-r from-amber-500 to-amber-400 transition-all ${
                  isDragging ? '' : 'duration-100'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
              {/* Thumb */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-lg transform -translate-x-1/2 transition-opacity ${
                  isDragging || !isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Time display */}
            <div className='flex justify-between text-xs text-muted-foreground font-mono'>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls: mobile = space-between (buttons left, volume right), [640px+] = buttons center, volume right */}
          <div className='flex items-center justify-between sm:justify-center sm:gap-4 mt-auto pt-3 border-t border-border w-full relative'>
            {/* Skip buttons + Play - left on mobile, centered on desktop */}
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='ghost'
                className={`rounded-full w-9 h-9 p-0 shrink-0 ${
                  isTouch ? '' : 'hover:bg-amber-500/10 hover:text-amber-500 transition-colors'
                }`}
                onClick={skipBackward}
              >
                <RotateCcw className='h-4 w-4' />
              </Button>

              <Button
                size='sm'
                className={`rounded-full w-12 h-12 p-0 shrink-0 shadow-lg ${
                  isLoading ? 'animate-pulse' : ''
                }`}
                onClick={togglePlay}
              >
                {isLoading ? (
                  <span className='h-5 w-5 flex items-center justify-center'>
                    <span className='w-2 h-2 bg-current rounded-full animate-bounce' />
                  </span>
                ) : isPlaying ? (
                  <Pause className='h-6 w-6' />
                ) : (
                  <Play className='h-6 w-6 ml-0.5' />
                )}
              </Button>

              <Button
                size='sm'
                variant='ghost'
                className={`rounded-full w-9 h-9 p-0 shrink-0 ${
                  isTouch ? '' : 'hover:bg-amber-500/10 hover:text-amber-500 transition-colors'
                }`}
                onClick={skipForward}
              >
                <RotateCw className='h-4 w-4' />
              </Button>
            </div>

            {/* Volume - right on mobile and desktop */}
            <div className='flex items-center gap-2 md:ml-auto absolute right-0'>
              <Button
                size='sm'
                variant='ghost'
                className='rounded-full w-8 h-8 p-0 shrink-0 hover:bg-amber-500/10 hover:text-amber-500'
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className='h-3.5 w-3.5' />
                ) : (
                  <Volume2 className='h-3.5 w-3.5' />
                )}
              </Button>
              <input
                type='range'
                min='0'
                max='1'
                step='0.01'
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className='w-20 h-1 accent-amber-500 cursor-pointer'
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(isMuted ? 0 : volume) * 100}%, ${isDark ? '#3f3f46' : '#d4d4d8'} ${(isMuted ? 0 : volume) * 100}%, ${isDark ? '#3f3f46' : '#d4d4d8'} 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
