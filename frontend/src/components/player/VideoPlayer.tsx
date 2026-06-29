import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';

interface VideoPlayerProps {
  videoId: string;
  lessonId: string;
  courseId: string;
  initialSeconds?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  title?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, lessonId, courseId, initialSeconds = 0, onProgress, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const saveProgress = useCallback(async (seconds: number, completed: boolean) => {
    try {
      await api.post('/enrollments/progress', {
        lessonId,
        courseId,
        watchedSeconds: Math.floor(seconds),
        isCompleted: completed,
      });
      onProgress?.(seconds, completed);
    } catch (err) {
      // Silently fail - not critical
    }
  }, [lessonId, courseId, onProgress]);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      if (!containerRef.current) return;
      const div = document.createElement('div');
      div.id = `yt-player-${lessonId}`;
      containerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div.id, {
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          start: Math.floor(initialSeconds),
        },
        events: {
          onReady: (e: any) => {
            setIsReady(true);
            if (initialSeconds > 0) {
              e.target.seekTo(initialSeconds, true);
            }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              const duration = playerRef.current?.getDuration() || 0;
              setIsCompleted(true);
              saveProgress(duration, true);
            }
            if (e.data === window.YT.PlayerState.PLAYING) {
              // Start save interval
              if (saveTimerRef.current) clearInterval(saveTimerRef.current);
              saveTimerRef.current = setInterval(async () => {
                const t = playerRef.current?.getCurrentTime() || 0;
                const dur = playerRef.current?.getDuration() || 1;
                const completed = t / dur > 0.9;
                await saveProgress(t, completed);
                if (completed && !isCompleted) setIsCompleted(true);
              }, 10000);
            } else {
              if (saveTimerRef.current) clearInterval(saveTimerRef.current);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (playerRef.current) {
        const t = playerRef.current.getCurrentTime?.() || 0;
        if (t > 5) saveProgress(t, isCompleted);
        playerRef.current.destroy?.();
      }
    };
  }, [videoId, lessonId]);

  const handleSpeedChange = (s: number) => {
    playerRef.current?.setPlaybackRate(s);
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="relative bg-black rounded-xl overflow-hidden group">
      {/* YouTube embed container */}
      <div className="aspect-video w-full" ref={containerRef} />

      {/* Speed control overlay */}
      <div className="absolute bottom-16 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 px-3 py-1.5 bg-black/80 text-white text-sm rounded-lg hover:bg-black/90"
          >
            <Settings className="w-3 h-3" />
            {speed}x
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg overflow-hidden shadow-xl">
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
      </div>

      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 text-white text-xs font-semibold rounded-full">
          ✓ Completed
        </div>
      )}
    </div>
  );
}
