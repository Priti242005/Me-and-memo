import { useEffect, useMemo, useRef, useState } from 'react';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function cleanTitle(name) {
  return String(name || 'Original audio')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

export default function InlineMusicPlayer({
  audioUrl,
  title,
  subtitle = 'Original audio',
  autoPlay = false,
  hoverToPlay = false,
  iconOnly = false,
  className = '',
  compact = false,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const resolvedTitle = useMemo(() => cleanTitle(title), [title]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleTime = () => {
      const nextDuration = audio.duration || 0;
      if (nextDuration) {
        setDuration(nextDuration);
        setProgress(audio.currentTime / nextDuration);
      }
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => {
      setPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay]);

  function playAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {});
  }

  function pauseAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playAudio();
    else pauseAudio();
  }

  if (!audioUrl) return null;

  if (iconOnly) {
    return (
      <div
        className={`inline-music-icon-wrap ${className}`.trim()}
        onMouseEnter={() => {
          if (hoverToPlay) playAudio();
        }}
        onMouseLeave={() => {
          if (hoverToPlay) pauseAudio();
        }}
      >
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          type="button"
          className={`inline-music-icon ${playing ? 'is-playing' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
          aria-label={playing ? 'Pause music' : 'Play music'}
          title={resolvedTitle || subtitle}
          >
            <span className="inline-music-icon-note" aria-hidden>
              {playing ? 'II' : 'M'}
            </span>
          </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-music ${compact ? 'is-compact' : ''} ${className}`.trim()}
      onMouseEnter={() => {
        if (hoverToPlay) playAudio();
      }}
      onMouseLeave={() => {
        if (hoverToPlay) pauseAudio();
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        className={`inline-music-toggle ${playing ? 'is-playing' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          togglePlayback();
        }}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        {playing ? 'II' : '>'}
      </button>

      <button
        type="button"
        className="inline-music-body"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayback();
        }}
      >
        <div className="inline-music-top">
          <div className="inline-music-copy">
            <div className="inline-music-label-row">
              <span className="inline-music-label">Music</span>
              <span className={`inline-music-eq ${playing ? 'is-playing' : ''}`} aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </div>
            <div className="inline-music-title">{resolvedTitle}</div>
            <div className="inline-music-subtitle">{subtitle}</div>
          </div>
          <div className="inline-music-time">
            {formatTime((duration || 0) * progress)} / {formatTime(duration)}
          </div>
        </div>

        <div className="inline-music-progress-track" aria-hidden>
          <span className="inline-music-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </button>
    </div>
  );
}
