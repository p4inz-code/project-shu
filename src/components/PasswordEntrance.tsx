import React, { useState } from 'react';
import { Eye, EyeOff, Heart, KeyRound, LockOpen, Sparkles } from 'lucide-react';

interface PasswordEntranceProps {
  passwordHint?: string;
  onAuthenticated: () => void;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

export const PasswordEntrance: React.FC<PasswordEntranceProps> = ({
  passwordHint,
  onAuthenticated,
  onSpawnHeart,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [sealWhisper, setSealWhisper] = useState<string | null>(null);

  const triggerErrorShake = () => {
    setShakeError(false);
    window.setTimeout(() => setShakeError(true), 10);
    window.setTimeout(() => setShakeError(false), 460);
  };

  const handleSealTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawnHeart(
      rect.left + rect.width / 2,
      Math.max(48, rect.top - 12),
      'Sealed for Shu',
    );
    setSealWhisper('Sealed by Atharva — only Shu holds the key.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMessage('Write the secret phrase on the seal first, Shu.');
      triggerErrorShake();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });

      const data = (await response.json()) as {
        authenticated?: boolean;
        error?: string;
      };

      if (!response.ok || !data.authenticated) {
        setErrorMessage(
          data.error ||
            'That wasn’t quite the secret phrase, Shu. Take a slow breath and try again.',
        );
        triggerErrorShake();
        setSubmitting(false);
        return;
      }

      onSpawnHeart(
        window.innerWidth / 2,
        Math.max(80, window.innerHeight / 2 - 90),
        'Welcome inside, Shu ♥',
      );
      setUnlocking(true);
      setTimeout(() => {
        onAuthenticated();
      }, 480);
    } catch {
      setErrorMessage(
        'Could not reach the lock service right now. Please try again in a moment.',
      );
      triggerErrorShake();
      setSubmitting(false);
    }
  };

  return (
    <main className="entrance-screen" aria-labelledby="entrance-heading">
      {/* Subtle Cinema Orbital Ring */}
      <div className="entrance-orbit-ring" aria-hidden="true" />

      {/* Top Cinema Frame Metadata Bar */}
      <div className="title-seq-topbar title-stage-1" aria-hidden="true">
        <span>REEL 01 // PRIVATE EDITION</span>
        <span className="hide-mobile">FOR YASHVI POKAR (SHU)</span>
        <span>DIRECTED BY ATHARVA PATIL</span>
      </div>

      {/* Centerpiece Cinematic Title Sequence Stage */}
      <div className="title-seq-center-stage">
        <div
          className="title-seq-monumental-backdrop title-stage-2"
          aria-hidden="true"
        >
          <span className="title-seq-script-accent">A little world,</span>
          <div className="title-seq-giant-word">SHU</div>
        </div>

        <button
          type="button"
          className="wax-seal-crest title-stage-2"
          onClick={handleSealTap}
          aria-label="Interactive wax seal stamped A heart S"
          title="Tap the wax seal"
        >
          <span>A ♥ S</span>
        </button>

        {sealWhisper && (
          <p
            style={{
              margin: '-0.25rem 0 0.75rem',
              fontSize: '0.84rem',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--color-gold-warm)',
            }}
          >
            {sealWhisper}
          </p>
        )}

        <span className="eyebrow-tag title-stage-3">
          PRIVATE KEEPSAKE • FOR YASHVI POKAR
        </span>

        <h1 id="entrance-heading" className="editorial-title title-stage-3">
          For Shu, With All My Heart
        </h1>

        <p className="entrance-subtitle title-stage-3">
          Atharva tucked a small world inside this private reel just for you.
          Enter your key below to break the wax seal.
        </p>

        {/* Architectural Threshold Console */}
        <div
          className={`entrance-card title-stage-4 ${
            unlocking ? 'unlocking' : ''
          } ${shakeError ? 'shake-error' : ''}`}
          role="region"
          aria-label="Private Keepsake Entrance"
        >
          <svg
            className="entrance-envelope-flap"
            viewBox="0 0 660 70"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 0,0 L 330,62 L 660,0"
              fill="none"
              stroke="rgba(214, 195, 165, 0.35)"
              strokeWidth="1"
            />
          </svg>

          <form className="password-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="shu-password-input" className="password-label">
              <span>00 // Secret Phrase for Shu</span>
              <span style={{ opacity: 0.72 }}>THRESHOLD KEY • ATHARVA</span>
            </label>

            <div className="threshold-action-deck">
              <div className="password-input-wrap">
                <input
                  id="shu-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-input"
                  placeholder="Enter your secret phrase..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={
                    errorMessage ? 'password-error-msg' : undefined
                  }
                  disabled={submitting || unlocking}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button
                type="submit"
                className="primary-seal-btn"
                disabled={submitting || unlocking}
              >
                {unlocking ? (
                  <>
                    <Sparkles size={16} />
                    <span>Opening Reel...</span>
                  </>
                ) : submitting ? (
                  <>
                    <KeyRound size={16} />
                    <span>Verifying Key...</span>
                  </>
                ) : (
                  <>
                    <LockOpen size={16} />
                    <span>Break the Seal &amp; Enter</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div
                id="password-error-msg"
                role="alert"
                className="error-banner"
              >
                {errorMessage}
              </div>
            )}
          </form>

          {passwordHint && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <button
                type="button"
                className="hint-toggle-btn"
                onClick={() => setShowHint((prev) => !prev)}
                aria-expanded={showHint}
              >
                {showHint ? 'Hide gentle clue' : 'Need a gentle clue, Shu?'}
              </button>
              {showHint && (
                <div className="hint-box" role="note">
                  <Heart
                    size={13}
                    style={{
                      display: 'inline',
                      verticalAlign: '-2px',
                      marginRight: '6px',
                    }}
                  />
                  <span>{passwordHint}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cinema Frame Metadata Bar */}
      <div className="title-seq-bottombar" aria-hidden="true">
        <span>FRAME 00:00:00:01</span>
        <span className="hide-mobile">ENCRYPTED PRIVATE SESSION • HTTPONLY</span>
        <span>SOUND ON CUE • MMXXVI</span>
      </div>
    </main>
  );
};
