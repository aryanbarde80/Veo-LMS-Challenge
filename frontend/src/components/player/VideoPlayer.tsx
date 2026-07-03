import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
  RotateCcw, RotateCw, PictureInPicture2, Loader2,
} from 'lucide-react';
import { api, BASE_URL } from '../../lib/api';

interface VideoPlayerProps {
  lessonId: string;
  courseId: string;
  initialSeconds?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  title?: string;
}

function formatTime(t: number) {
  if (!isFinite(t) || t < 0) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({ lessonId, courseId, initialSeconds = 0, onProgress, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seeked, setSeeked] = useState(false);

  // Fetch a short-lived signed token, then build the stream URL. A plain <video>
  // tag can't send an Authorization header, so access is gated by this token
  // instead (see api/src/routes/videos.ts).
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setSrc(null);
    api
      .get(`/videos/lesson/${lessonId}/token`)
      .then(({ data }) => {
        if (cancelled) return;
        setSrc(`${BASE_URL}/videos/stream/${lessonId}?token=${encodeURIComponent(data.token)}`);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.response?.data?.error || 'Unable to load video');
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const saveProgress = useCallback(
    async (seconds: number, completed: boolean) => {
      try {
        await api.post('/enrollments/progress', {
          lessonId,
          courseId,
          watchedSeconds: Math.floor(seconds),
          isCompleted: completed,
        });
        onProgress?.(seconds, completed);
      } catch {
        // non-critical - progress saving shouldn't interrupt playback
      }
    },
    [lessonId, courseId, onProgress]
  );

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), v.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
    setCurrentTime(v.currentTime);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleSpeedChange = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      // PiP unsupported in this browser - fail silently
    }
  };

  // Video element event wiring
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    const onLoadedMeta = () => {
      setDuration(v.duration || 0);
      setIsLoading(false);
      if (initialSeconds > 0 && !seeked) {
        v.currentTime = Math.min(initialSeconds, Math.max(v.duration - 2, 0));
        setSeeked(true);
      }
    };
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onProgressEv = () => {
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => {
      setIsPlaying(true);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      saveTimerRef.current = setInterval(() => {
        const t = v.currentTime;
        const dur = v.duration || 1;
        const completed = t / dur > 0.9;
        saveProgress(t, completed);
        if (completed) setIsCompleted(true);
      }, 10000);
    };
    const onPause = () => {
      setIsPlaying(false);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
    const onEnded = () => {
      setIsCompleted(true);
      saveProgress(v.duration || 0, true);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onError = () => setLoadError('Video failed to load. Please try again.');

    v.addEventListener('loadedmetadata', onLoadedMeta);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('progress', onProgressEv);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('error', onError);

    return () => {
      v.removeEventListener('loadedmetadata', onLoadedMeta);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('progress', onProgressEv);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('error', onError);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (v.currentTime > 5) saveProgress(v.currentTime, isCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          skip(5);
          break;
        case 'arrowleft':
          skip(-5);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  }, [isPlaying]);

  if (loadError) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl flex items-center justify-center">
        <p className="text-sm text-red-400 px-4 text-center">{loadError}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group aspect-video w-full"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {src && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full"
          onClick={togglePlay}
          playsInline
          preload="metadata"
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {!isLoading && !isPlaying && src && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-[#6C47FF] flex items-center justify-center">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {isCompleted && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 text-white text-xs font-semibold rounded-full">
          ✓ Completed
        </div>
      )}

      {title && (
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/85 to-transparent transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Seek bar */}
        <div className="relative w-full h-1.5 mb-3 group/seek">
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div
            className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
            style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[#6C47FF] rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-[#6C47FF] transition-colors">
            {isPlaying ? <Pause className="w-5 h-5" fill="white" /> : <Play className="w-5 h-5" fill="white" />}
          </button>
          <button onClick={() => skip(-10)} className="text-white hover:text-[#6C47FF] transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => skip(10)} className="text-white hover:text-[#6C47FF] transition-colors">
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} className="text-white hover:text-[#6C47FF] transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-0 group-hover/vol:w-16 transition-all accent-[#6C47FF] h-1"
            />
          </div>

          <span className="text-xs text-white/80 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2 py-1 text-white text-xs hover:text-[#6C47FF] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg overflow-hidden shadow-xl z-10">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-[#242438] ${speed === s ? 'text-[#6C47FF]' : 'text-white'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={togglePiP} className="text-white hover:text-[#6C47FF] transition-colors" title="Picture-in-picture">
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          <button onClick={toggleFullscreen} className="text-white hover:text-[#6C47FF] transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
