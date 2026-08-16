import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, ShieldCheck, RefreshCw } from 'lucide-react';
import { storageService } from '../services/storageService';

interface HLSVideoPlayerProps {
  src: string;
  fallbackUrl?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

const isImageExtension = (url: string) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg') ||
    clean.includes('images.unsplash.com')
  );
};

export const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  src,
  fallbackUrl,
  poster,
  title,
  autoPlay = false,
  className = '',
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [qualities, setQualities] = useState<{ id: number; height: number; name: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isHlsMode, setIsHlsMode] = useState<boolean>(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  // Resolve authorized URL if key needs access token
  useEffect(() => {
    let isMounted = true;
    const resolveSource = async () => {
      if (!src || !src.trim() || isImageExtension(src)) {
        if (isMounted) setResolvedSrc('');
        return;
      }
      if (src.startsWith('http://') || src.startsWith('https://') || src.includes('access_token=') || src.includes('token=')) {
        if (isMounted) setResolvedSrc(src.trim());
      } else {
        const authUrl = await storageService.getAuthorizedMediaUrl(src.trim());
        if (isMounted) setResolvedSrc(authUrl && !isImageExtension(authUrl) ? authUrl : '');
      }
    };
    resolveSource();
    return () => {
      isMounted = false;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!resolvedSrc || !resolvedSrc.trim() || isImageExtension(resolvedSrc)) {
      setIsLoading(false);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
      }
      return;
    }

    setHasError(null);
    setIsLoading(true);

    const lowerSrc = resolvedSrc.toLowerCase();
    const isHlsStream =
      lowerSrc.includes('.m3u8') ||
      resolvedSrc.includes('key=hls') ||
      resolvedSrc.includes('/api/video/stream?key=hls') ||
      resolvedSrc.includes('master.m3u8') ||
      resolvedSrc.includes('720p.m3u8');

    if (isHlsStream && Hls.isSupported()) {
      setIsHlsMode(true);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.loadSource(resolvedSrc);

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        setIsLoading(true);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setHasError(null);
        const parsedLevels = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height,
          name: `${lvl.height || '720'}p`,
        }));
        setQualities(parsedLevels);

        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        if (data.details?.totalduration && isFinite(data.details.totalduration) && data.details.totalduration > 0) {
          setDuration(data.details.totalduration);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('[HLS.js Fatal Error]', data.type, data.details);

          // If HLS fails and we have a fallback URL, switch to direct HTML5 video
          if (fallbackUrl && fallbackUrl !== resolvedSrc && !isImageExtension(fallbackUrl)) {
            hls.destroy();
            hlsRef.current = null;
            setIsHlsMode(false);
            const resolvedFallback = storageService.getStorageUrl(fallbackUrl);
            if (resolvedFallback && !isImageExtension(resolvedFallback)) {
              video.src = resolvedFallback;
              video.load();
              video.play().catch(() => {});
              setIsLoading(false);
              return;
            }
          }

          // If it was attempted as HLS but is a direct video, switch smoothly to direct HTML5 video
          if (!lowerSrc.includes('.m3u8')) {
            hls.destroy();
            hlsRef.current = null;
            setIsHlsMode(false);
            if (video.src !== resolvedSrc) {
              video.src = resolvedSrc;
              video.load();
            }
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              setHasError('Unable to load video stream.');
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
    } else if (isHlsStream && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      setIsHlsMode(true);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = resolvedSrc;
      video.load();
    } else {
      // Standard Direct Video Playback (MP4, WebM, direct stream URL)
      setIsHlsMode(false);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video.src !== resolvedSrc) {
        video.src = resolvedSrc;
        video.load();
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedSrc, fallbackUrl, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime || 0;
    const dur = video.duration;

    setCurrentTime(cur);

    if (isFinite(dur) && dur > 0) {
      setDuration(dur);
      setProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));
    } else if (duration > 0) {
      setProgress(Math.min(100, Math.max(0, (cur / duration) * 100)));
    }
  };

  const handleDurationChange = () => {
    const video = videoRef.current;
    if (video && isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const targetPct = parseFloat(e.target.value);
    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : duration;

    if (isFinite(dur) && dur > 0) {
      const newTime = (targetPct / 100) * dur;
      video.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(targetPct);
    }
  };

  const changeQuality = (qualityId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
      setCurrentQuality(qualityId);
      setShowQualityMenu(false);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      video.requestFullscreen().catch(() => {});
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata"
        onLoadedMetadata={() => {
          setIsLoading(false);
          if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
            setDuration(videoRef.current.duration);
          }
        }}
        onDurationChange={handleDurationChange}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={() => {
          setIsLoading(false);
          const video = videoRef.current;
          if (!video || !video.src || video.src === window.location.href) {
            return;
          }
          if (fallbackUrl && fallbackUrl.trim() && !isImageExtension(fallbackUrl)) {
            const fallbackSrc = storageService.getStorageUrl(fallbackUrl);
            if (fallbackSrc && !isImageExtension(fallbackSrc) && video.src !== fallbackSrc) {
              video.src = fallbackSrc;
              video.load();
              return;
            }
          }
          if (resolvedSrc && resolvedSrc.trim() && !isImageExtension(resolvedSrc)) {
            setHasError('Unable to load video stream.');
          }
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Top Security Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-[11px] font-medium text-emerald-400 opacity-90 transition-opacity">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>{isHlsMode ? 'HLS Stream' : 'Secure Video'}</span>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs text-white z-20">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-2" />
          <span className="text-xs font-medium text-slate-300">Loading video stream...</span>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center z-20 space-y-3">
          <p className="text-sm text-rose-400 font-medium">{hasError}</p>
          <button
            onClick={() => {
              setHasError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition cursor-pointer"
          >
            Retry Loading Stream
          </button>
        </div>
      )}

      {/* Custom Control Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 space-y-2">
        {/* Progress Bar */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
          />
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-white"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-slate-300 hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-slate-300 font-mono text-[11px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 relative">
            {/* Quality Selector */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-semibold transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>{currentQuality === -1 ? 'Auto' : qualities.find((q) => q.id === currentQuality)?.name || 'Auto'}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 w-28 text-xs z-30">
                    <button
                      onClick={() => changeQuality(-1)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-purple-600/30 font-medium ${
                        currentQuality === -1 ? 'text-purple-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      Auto
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => changeQuality(q.id)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-purple-600/30 font-medium ${
                          currentQuality === q.id ? 'text-purple-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-slate-300 hover:text-white"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
