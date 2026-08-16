import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { zivaMediaService } from '../services/zivaMediaService';

export interface ZivaHLSVideoPlayerProps {
  src: string;
  fallbackUrl?: string;
  courseId?: string;
  lessonId?: string;
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

export const ZivaHLSVideoPlayer: React.FC<ZivaHLSVideoPlayerProps> = ({
  src,
  fallbackUrl,
  courseId,
  lessonId,
  poster,
  title,
  autoPlay = false,
  className = '',
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
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
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract courseId and lessonId from key if not explicitly passed
  const extractIdsFromKey = useCallback((key: string) => {
    let extractedCourseId = courseId;
    let extractedLessonId = lessonId;

    if (key && key.startsWith('ziva/')) {
      const parts = key.split('/');
      const coursesIdx = parts.indexOf('courses');
      if (coursesIdx !== -1 && parts.length > coursesIdx + 1 && !extractedCourseId) {
        extractedCourseId = parts[coursesIdx + 1];
      }
      const lessonsIdx = parts.indexOf('lessons');
      if (lessonsIdx !== -1 && parts.length > lessonsIdx + 1 && !extractedLessonId) {
        extractedLessonId = parts[lessonsIdx + 1];
      }
    }

    return {
      cId: extractedCourseId || 'general',
      lId: extractedLessonId || 'general',
    };
  }, [courseId, lessonId]);

  // Resolve source URL and authorize playback if needed
  useEffect(() => {
    let isMounted = true;

    const resolveSource = async () => {
      if (!src || !src.trim() || isImageExtension(src)) {
        if (isMounted) {
          setResolvedSrc('');
          setIsLoading(false);
        }
        return;
      }

      const trimmed = src.trim();

      // If already an authorized URL with token
      if (
        (trimmed.includes('/api/ziva/video/stream') || trimmed.includes('/api/video/stream')) &&
        trimmed.includes('token=')
      ) {
        if (isMounted) setResolvedSrc(trimmed);
        return;
      }

      if (
        (trimmed.includes('/api/ziva/media/file') || trimmed.includes('/api/media/file')) &&
        trimmed.includes('access_token=')
      ) {
        if (isMounted) setResolvedSrc(trimmed);
        return;
      }

      // Check if it's an R2 key or HLS manifest
      if (trimmed.startsWith('ziva/')) {
        const isHls = trimmed.includes('/hls/') || trimmed.endsWith('.m3u8');

        if (isHls) {
          try {
            const { cId, lId } = extractIdsFromKey(trimmed);
            const authStreamUrl = await zivaMediaService.getAuthorizedHlsStreamUrl({
              courseId: cId,
              lessonId: lId,
              manifestKey: trimmed,
            });
            if (isMounted) setResolvedSrc(authStreamUrl);
          } catch {
            // Fallback to media file endpoint
            const mediaUrl = await zivaMediaService.getMediaUrl(trimmed);
            if (isMounted) setResolvedSrc(mediaUrl);
          }
        } else {
          // General R2 video (raw MP4 or direct file)
          const mediaUrl = await zivaMediaService.getMediaUrl(trimmed);
          if (isMounted) setResolvedSrc(mediaUrl);
        }
      } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        // Standard external URL (e.g. Cloudinary or relative URL)
        if (isMounted) setResolvedSrc(trimmed);
      } else {
        // Unknown format, attempt token resolution
        const mediaUrl = await zivaMediaService.getMediaUrl(trimmed);
        if (isMounted) setResolvedSrc(mediaUrl);
      }
    };

    resolveSource();

    return () => {
      isMounted = false;
    };
  }, [src, extractIdsFromKey]);

  // Attach and configure Hls.js or HTML5 native video
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
      resolvedSrc.includes('/api/ziva/video/stream') ||
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
          height: lvl.height || 720,
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
          console.warn('[Ziva HLS.js Error]', data.type, data.details);

          // If HLS fails and we have a fallback URL
          if (fallbackUrl && fallbackUrl !== resolvedSrc && !isImageExtension(fallbackUrl)) {
            hls.destroy();
            hlsRef.current = null;
            setIsHlsMode(false);
            zivaMediaService.getMediaUrl(fallbackUrl).then((resolvedFallback) => {
              if (resolvedFallback && !isImageExtension(resolvedFallback) && videoRef.current) {
                videoRef.current.src = resolvedFallback;
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
                setIsLoading(false);
              }
            });
            return;
          }

          // If it was attempted as HLS but is a direct video, switch smoothly to HTML5 video
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
              console.warn('[Ziva HLS] Network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[Ziva HLS] Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              setHasError('Unable to load Ziva HLS video stream.');
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
    } else if (isHlsStream && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple / Safari HLS
      setIsHlsMode(true);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = resolvedSrc;
      video.load();
      if (autoPlay) {
        video.play().catch(() => setIsPlaying(false));
      }
    } else {
      // Standard Direct Video Playback (MP4, WebM, Cloudinary, etc.)
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

  const resetHideControlsTimeout = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetHideControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
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
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setHasError(null);
    setIsLoading(true);
    const current = resolvedSrc;
    setResolvedSrc('');
    setTimeout(() => {
      setResolvedSrc(current);
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideControlsTimeout}
      onMouseEnter={() => setControlsVisible(true)}
      className={`relative group aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-900 select-none ${className}`}
    >
      {/* Native HTML5 Video Element */}
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
            zivaMediaService.getMediaUrl(fallbackUrl).then((fallbackSrc) => {
              if (fallbackSrc && !isImageExtension(fallbackSrc) && video.src !== fallbackSrc) {
                video.src = fallbackSrc;
                video.load();
                return;
              }
            });
          }
          if (resolvedSrc && resolvedSrc.trim() && !isImageExtension(resolvedSrc)) {
            setHasError('Unable to load Ziva video stream.');
          }
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer bg-black"
      />

      {/* Top Header Overlay: Security Badge & Title */}
      <div
        className={`absolute top-0 inset-x-0 p-4 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-20 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>{isHlsMode ? 'Ziva R2 HLS Stream' : 'Ziva Secure Playback'}</span>
          </div>
        </div>

        {title && (
          <div className="text-xs font-serif font-bold text-white/90 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800 line-clamp-1 max-w-xs sm:max-w-md">
            {title}
          </div>
        )}
      </div>

      {/* Big Center Play/Pause Button on Hover / Paused state */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF2E93]/90 hover:bg-[#FF2E93] text-white flex items-center justify-center shadow-2xl transition-transform transform hover:scale-110 z-10 cursor-pointer border border-pink-400/40"
          title="Play"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
        </button>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white z-20">
          <RefreshCw className="w-9 h-9 animate-spin text-[#FF2E93] mb-3" />
          <span className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider">
            Loading Ziva Masterclass Stream...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-white p-6 text-center z-20 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-serif font-bold text-white">Playback Error</h4>
            <p className="text-xs text-gray-400 max-w-sm">{hasError}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-5 py-2 rounded-lg bg-[#FF2E93] hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg"
          >
            Retry Loading Stream
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 z-20 space-y-2.5 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress / Timeline Bar */}
        <div className="relative w-full flex items-center group/scrubber">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF2E93] hover:h-2 transition-all"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left: Play/Pause, Mute/Volume, Time Display */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-white cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <div className="flex items-center space-x-1 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-pink-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-amber-400 opacity-80 hover:opacity-100"
              />
            </div>

            <span className="text-amber-300 font-mono text-[11px] tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Quality Menu & Fullscreen */}
          <div className="flex items-center space-x-2 relative">
            {/* Quality Selector */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900/90 border border-gray-800 hover:border-amber-500/50 text-[11px] font-bold text-amber-300 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-pink-400" />
                  <span>
                    {currentQuality === -1
                      ? 'Auto'
                      : qualities.find((q) => q.id === currentQuality)?.name || 'Auto'}
                  </span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-9 right-0 bg-neutral-950 border border-amber-500/40 rounded-xl shadow-2xl py-1.5 w-32 text-xs z-30 divide-y divide-gray-900">
                    <button
                      onClick={() => changeQuality(-1)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-neutral-900 font-bold flex items-center justify-between cursor-pointer ${
                        currentQuality === -1 ? 'text-[#FF2E93]' : 'text-gray-300'
                      }`}
                    >
                      <span>Auto</span>
                      {currentQuality === -1 && <span className="text-[10px]">✓</span>}
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => changeQuality(q.id)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-neutral-900 font-bold flex items-center justify-between cursor-pointer ${
                          currentQuality === q.id ? 'text-[#FF2E93]' : 'text-gray-300'
                        }`}
                      >
                        <span>{q.name}</span>
                        {currentQuality === q.id && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
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
