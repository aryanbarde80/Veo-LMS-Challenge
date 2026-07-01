import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, PictureInPicture2
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  initialSeconds?: number;
  onProgress?: () => void;
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({
  videoUrl, lessonId, courseId, initialSeconds = 0, onProgress
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialSeconds);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Initialise: seek to resume point ──────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      setDuration(v.duration);
      if (initialSeconds > 0 && initialSeconds < v.duration - 2) {
        v.currentTime = initialSeconds;
      }
      setLoading(false);
    };
    v.addEventListener('loadedmetadata', onMeta);
    if (v.readyState >= 1) onMeta();
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, [videoUrl, initialSeconds]);

  // ── Time update ───────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onBuffer = () => {
      if (v.buffered.length > 0) {
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('progress', onBuffer);
    v.addEventListener('waiting', () => setLoading(true));
    v.addEventListener('canplay', () => setLoading(false));
    v.addEventListener('play', () => setPlaying(true));
    v.addEventListener('pause', () => setPlaying(false));
    v.addEventListener('ended', () => { setPlaying(false); saveProgress(true).catch(() => {}); });
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('progress', onBuffer);
    };
  }, []);

  // ── Save progress every 10s while playing ────────────────────────────────
  const saveProgress = useCallback(async (forceComplete = false) => {
    const v = videoRef.current;
    if (!v) return;
    const pct = duration > 0 ? v.currentTime / duration : 0;
    const isCompleted = forceComplete || pct >= 0.9;
    if (isCompleted && completedRef.current) return; // already saved as complete
    if (isCompleted) completedRef.current = true;
    try {
      await api.post('/enrollments/progress', {
        lessonId, courseId,
        watchedSeconds: Math.floor(v.currentTime),
        isCompleted,
      });
      if (onProgress) onProgress();
    } catch { /* silent */ }
  }, [duration, lessonId, courseId, onProgress]);

  useEffect(() => {
    if (!playing) return;
    saveTimer.current = setInterval(() => saveProgress(), 10_000);
    return () => clearInterval(saveTimer.current);
  }, [playing, saveProgress]);

  // ── Control hide timer ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [playing]);

  useEffect(() => {
    if (!playing) setShowControls(true);
    else resetHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [playing, resetHideTimer]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // only handle when player is focused / visible
      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 5); break;
        case 'ArrowLeft':  e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); break;
        case 'ArrowUp':    e.preventDefault(); setVolume(p => { const nv = Math.min(1, p + 0.1); v.volume = nv; return nv; }); break;
        case 'ArrowDown':  e.preventDefault(); setVolume(p => { const nv = Math.max(0, p - 0.1); v.volume = nv; return nv; }); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFullscreen(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = async () => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) await c.requestFullscreen();
    else await document.exitFullscreen();
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* not supported */ }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
    setCurrentTime(v.currentTime);
  };

  const setSpeedAndClose = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-xl overflow-hidden select-none',
        fullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video w-full'
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={(e) => { if (e.target === videoRef.current || (e.target as HTMLElement).closest('.video-overlay')) togglePlay(); }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        preload="metadata"
        playsInline
        onVolumeChange={() => {
          const v = videoRef.current;
          if (v) setMuted(v.muted);
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Centre play/pause flash */}
      <div className="video-overlay absolute inset-0" />

      {/* Controls overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        <div className="relative p-3 sm:p-4 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/bar"
            onClick={seek}
          >
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
            {/* Played */}
            <div
              className="absolute inset-y-0 left-0 bg-[#6C47FF] rounded-full pointer-events-none transition-all"
              style={{ width: `${percent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${percent}% - 7px)` }}
            />
          </div>

          {/* Bottom controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="text-white hover:text-[#6C47FF] transition-colors"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Skip -10 / +10 */}
            <button
              onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="text-white/70 hover:text-white transition-colors hidden sm:block"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10); }}
              className="text-white/70 hover:text-white transition-colors hidden sm:block"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={toggleMute} className="text-white hover:text-[#6C47FF] transition-colors">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = videoRef.current;
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (v) { v.volume = val; v.muted = val === 0; }
                }}
                className="w-16 hidden sm:block accent-[#6C47FF] cursor-pointer"
              />
            </div>

            {/* Time */}
            <span className="text-white/80 text-xs font-mono">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Speed */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white/70 hover:text-white text-xs font-medium px-1.5 py-0.5 rounded border border-white/20 hover:border-white/40 transition-colors"
              >
                {speed}×
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden shadow-xl z-10 min-w-[70px]">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeedAndClose(s)}
                      className={cn(
                        'w-full px-4 py-2 text-xs text-left hover:bg-[#6C47FF]/20 transition-colors',
                        speed === s ? 'text-[#6C47FF] font-semibold' : 'text-white'
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings / PiP */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePiP(); }}
              className="text-white/70 hover:text-white transition-colors hidden sm:block"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="text-white hover:text-[#6C47FF] transition-colors"
            >
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
