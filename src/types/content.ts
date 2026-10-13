export interface StoryChapter {
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  pullQuote?: string;
  marginNote?: string;
  theme: 'midnight' | 'burgundy' | 'parchment' | 'velvet';
  secretPrompt?: {
    triggerLabel: string;
    revealedNote: string;
  };
}

export interface MemoryItem {
  id: string;
  /**
   * Filename or stem inside `private-content/photos/` (or `private-content/video/` when mediaType === 'video').
   * Example: "memory-01" will automatically match memory-01.jpg, memory-01.png, memory-01.webp, or memory-01.svg.
   */
  fileStem: string;
  /**
   * Optional media type ('image' default, or 'video' for motion keepsakes).
   */
  mediaType?: 'image' | 'video';
  /**
   * Optional poster image stem in `private-content/photos/` when `mediaType === 'video'`.
   */
  posterStem?: string;
  title: string;
  dateLabel: string;
  locationLabel?: string;
  caption: string;
  behindTheMoment: string;
  handwrittenNote: string;
  aspect: 'portrait' | 'landscape' | 'square' | 'wide';
  frameStyle: 'polaroid' | 'editorial' | 'scrapbook-tape' | 'film-strip';
  rotationDeg: number;
  isPlaceholder: boolean;
}

export interface ReplaceablePortraitSlot {
  /** Stable slot identifier, e.g., "portrait-01" or "final-photo" */
  id: string;
  /** File stem in `private-content/photos/`, e.g., "portrait-01" or "final-photo" */
  fileStem: string;
  title: string;
  caption: string;
  aspect: 'portrait' | 'landscape' | 'square';
  isPlaceholder: boolean;
}

export interface ReplaceableFilmSlot {
  /** Stable slot identifier, e.g., "film-01" */
  id: string;
  /** File stem in `private-content/video/` (or `private-content/photos/` when in poster placeholder mode) */
  fileStem: string;
  /** Poster stem in `private-content/photos/`, e.g., "film-01" */
  posterStem: string;
  /** Set to 'video' once `private-content/video/film-01.mp4` (or `.webm`) is placed in `private-content/video/` */
  mediaType: 'image' | 'video';
  title: string;
  dateLabel: string;
  caption: string;
  isPlaceholder: boolean;
}

export interface PersonalLetterContent {
  isPlaceholderDraft: boolean;
  placeholderNotice: string;
  envelopeTitle: string;
  envelopeSubtitle: string;
  waxSealInitials: string;
  dateLine: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signature: string;
  postscript: string;
}

export interface SongContent {
  /**
   * Filename or stem inside `private-content/audio/`.
   * Example: "our-song" matches our-song.mp3, our-song.m4a, our-song.ogg, or our-song.wav.
   */
  fileStem: string;
  title: string;
  artist: string;
  dedicationNote: string;
  isPlaceholderAudio: boolean;
  placeholderInstructions: string;
  lyricMoments: {
    timeLabel: string;
    line: string;
  }[];
}

export interface ConstellationStar {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  qualityTitle: string;
  affectionateNote: string;
}

export interface FinalChapterContent {
  isPlaceholderDraft: boolean;
  eyebrow: string;
  headline: string;
  paragraphs: string[];
  whisperLine: string;
  signatureLine: string;
  keptPromises: string[];
  /** Optional replaceable closing keepsake photo (`final-photo`) */
  finalPhoto?: ReplaceablePortraitSlot;
}

export interface ShuExperienceContent {
  meta: {
    recipientName: string;
    recipientNickname: string;
    senderName: string;
    editionLabel: string;
    contentStatusBanner: string;
  };
  hero: {
    eyebrow: string;
    greeting: string;
    subtitle: string;
    openingNote: string;
    scrollInvitation: string;
    /** Optional replaceable opening portrait (`portrait-01`) */
    portrait?: ReplaceablePortraitSlot;
  };
  chapters: StoryChapter[];
  memoriesIntro: {
    eyebrow: string;
    title: string;
    subtitle: string;
    placeholderNotice: string;
    /** Optional replaceable short film / motion keepsake (`film-01`) */
    featuredFilm?: ReplaceableFilmSlot;
  };
  memories: MemoryItem[];
  songSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    song: SongContent;
  };
  constellationSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    completionSecretTitle: string;
    completionSecretBody: string;
    stars: ConstellationStar[];
  };
  letterSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    letter: PersonalLetterContent;
  };
  ending: FinalChapterContent;
}
