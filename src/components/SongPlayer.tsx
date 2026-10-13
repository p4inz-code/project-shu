import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Music,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { SongContent } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

interface SongPlayerProps {
  section: {
    eyebrow: string;
    title: string;
    subtitle: string;
    song: SongContent;
  };
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({
  section,
  reducedMotion,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const { song } = section;
  const audioSrc = `/api/media/audio/${encodeURIComponent(song.fileStem)}`;

  const handleTogglePlay = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setAudioError(null);
    setIsLoadingAudio(true);
    try {
      await audio.play();
      setIsPlaying(true);
      setIsLoadingAudio(false);
      const rect = e.currentTarget.getBoundingClientRect();
      onSpawnHeart(
        rect.left + rect.width / 2 - 30,
        rect.top - 12,
        'Playing our song ♪',
      );
    } catch {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setAudioError(
        'Audio file has not been placed in private-content/audio/ yet, or could not be loaded. Drop our-song.mp3 into private-content/audio/ tomorrow.',
      );
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = Number(e.target.value);
    setVolume(nextVol);
    setIsMuted(nextVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = nextVol;
      audioRef.current.muted = nextVol === 0;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const jumpToTimeLabel = (timeLabel: string) => {
    const parts = timeLabel.split(':').map(Number);
    if (parts.length !== 2) return;
    const secs = parts[0] * 60 + parts[1];
    setCurrentTime(secs);
    if (audioRef.current) {
      audioRef.current.currentTime = secs;
    }
  };

  return (
    <section
      id="song-section"
      ref={ref}
      className="story-section theme-burgundy"
      aria-labelledby="song-heading"
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="vertical-scene-rail" aria-hidden="true">
          05 / SOUNDTRACK SCORE
        </div>

        <div className="scene-top-header" aria-hidden="true">
          <span>SCENE 05 // {section.eyebrow}</span>
          <span>ORIGINAL SCORE CUE • MANUAL PLAYBACK</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'end',
            marginBottom: '2rem',
          }}
        >
          <div>
            <span className="eyebrow-tag">{section.eyebrow}</span>
            <h2
              id="song-heading"
              className="editorial-title"
              style={{ marginBottom: 0 }}
            >
              {section.title}
            </h2>
          </div>
          <p style={{ color: 'rgba(246, 241, 234, 0.8)', margin: 0 }}>
            {section.subtitle}
          </p>
        </div>

        <div className="music-player-card">
          {/* Vinyl Pressing Stage */}
          <div>
            <div
              className={`vinyl-disc ${
                isPlaying && !reducedMotion ? 'spinning' : ''
              }`}
              aria-hidden="true"
            >
              <div className="vinyl-center-hole" />
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.16em',
                color: 'var(--color-gold-warm)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className={`soundtrack-eq-bars ${
                  isPlaying && !reducedMotion ? 'active' : ''
                }`}
                aria-hidden="true"
              >
                <span className="soundtrack-eq-bar" />
                <span className="soundtrack-eq-bar" />
                <span className="soundtrack-eq-bar" />
                <span className="soundtrack-eq-bar" />
              </span>
              <span>
                {isPlaying
                  ? 'Now Playing for Shu'
                  : isLoadingAudio
                    ? 'Loading Score...'
                    : 'Cue Ready • 33⅓ RPM'}
              </span>
            </div>
          </div>

          {/* Score Console & Transport Controls */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.16em',
                color: 'var(--color-gold-warm)',
                marginBottom: '0.4rem',
              }}
            >
              <Music size={13} />
              <span>PRIVATE SOUNDTRACK SLOT // CUE 01</span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.65rem, 3vw, 2.15rem)',
                margin: '0 0 0.25rem',
                color: 'var(--color-cream)',
              }}
            >
              {song.title}
            </h3>

            <p
              style={{
                margin: '0 0 0.85rem',
                fontSize: '0.9rem',
                color: 'rgba(246, 241, 234, 0.72)',
              }}
            >
              {song.artist}
            </p>

            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--color-blush-soft)',
                fontStyle: 'italic',
                marginBottom: '1rem',
                borderLeft: '2px solid var(--color-cherry)',
                paddingLeft: '0.85rem',
              }}
            >
              {song.dedicationNote}
            </p>

            {/* Hidden HTML5 Audio Element */}
            <audio
              ref={audioRef}
              src={audioSrc}
              preload="metadata"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) {
                  setDuration(d);
                }
                setAudioError(null);
              }}
              onTimeUpdate={(e) => {
                setCurrentTime(e.currentTarget.currentTime);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              onError={() => {
                setIsPlaying(false);
                setIsLoadingAudio(false);
                setAudioError(
                  'Song file not found yet in private-content/audio/. Place our-song.mp3 in private-content/audio/ and rebuild.',
                );
              }}
            />

            {audioError && (
              <div
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  background: 'rgba(214, 195, 165, 0.1)',
                  border: '1px solid rgba(214, 195, 165, 0.38)',
                  color: 'var(--color-cream)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <AlertCircle
                  size={18}
                  style={{ flexShrink: 0, color: 'var(--color-gold-warm)' }}
                />
                <span>{audioError}</span>
              </div>
            )}

            {/* Play + Timecode Scrubber Row */}
            <div className="audio-controls-row">
              <button
                type="button"
                className="play-toggle-btn"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause song' : 'Play song'}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    letterSpacing: '0.08em',
                    color: 'rgba(246, 241, 234, 0.78)',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  className="seek-slider"
                  aria-label="Seek song position"
                  min={0}
                  max={Math.max(1, duration)}
                  step={0.1}
                  value={Math.min(currentTime, duration)}
                  onChange={handleSeek}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentTime(0);
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                  }
                }}
                aria-label="Restart song from beginning"
                style={{
                  background: 'rgba(246, 241, 234, 0.06)',
                  border: '1px solid rgba(214, 195, 165, 0.25)',
                  color: 'var(--color-cream)',
                  borderRadius: '4px',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Volume Control Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-gold-warm)',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '0.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                aria-label="Audio volume"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '120px',
                  minHeight: '44px',
                  accentColor: 'var(--color-gold-warm)',
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'rgba(246, 241, 234, 0.68)',
                }}
              >
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Timestamp Scene Cue Cards */}
        <div
          style={{
            marginTop: '1.35rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {song.lyricMoments.map((moment, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => jumpToTimeLabel(moment.timeLabel)}
              style={{
                textAlign: 'left',
                padding: '0.95rem 1.1rem',
                borderRadius: '4px',
                background: 'rgba(8, 6, 8, 0.55)',
                border: '1px solid rgba(214, 195, 165, 0.2)',
                borderLeft: '2px solid var(--color-gold-warm)',
                color: 'var(--color-cream)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold-warm)',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                CUE 0{idx + 1} // JUMP TO {moment.timeLabel}
              </div>
              <div style={{ fontSize: '0.86rem', opacity: 0.9 }}>
                {moment.line}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
