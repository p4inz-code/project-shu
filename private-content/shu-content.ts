import type { ShuExperienceContent } from '../src/types/content';

/**
 * ============================================================================
 * PROJECT SHU — EDITABLE PERSONAL CONTENT MANIFEST
 * ============================================================================
 *
 * NOTE FOR ATHARVA:
 * This file (`private-content/shu-content.ts`) is only served AFTER password
 * authentication via `/api/content`. None of the text, captions, or letters
 * here are bundled into the public unauthenticated frontend.
 *
 * All sample narrative copy, memory captions, dates, and the personal letter
 * below are clearly marked as [PLACEHOLDER DRAFT FOR ATHARVA TO CUSTOMIZE]
 * so that no fabricated memories, dates, or words are misrepresented as final.
 *
 * HOW TO UPDATE TOMORROW:
 * 1. Replace or edit the text strings below with your own words and real dates.
 * 2. Drop your real photographs into `private-content/photos/` named:
 *    `memory-01.jpg` (or `.png` / `.webp`) through `memory-06.jpg`.
 * 3. Drop your song into `private-content/audio/our-song.mp3` (or `.m4a` / `.wav`).
 * 4. Run `npm run build` before deploying to Cloudflare Pages.
 * ============================================================================
 */
export const shuContent: ShuExperienceContent = {
  meta: {
    recipientName: 'Yashvi Pokar',
    recipientNickname: 'Shu',
    senderName: 'Atharva Patil',
    editionLabel: 'A Private Little World — Made for Shu',
    contentStatusBanner:
      'Sample Draft Mode: Photos, dates, and personal letter slots are ready for Atharva’s final files in private-content/.',
  },

  hero: {
    eyebrow: 'FOR YASHVI POKAR • MY SHU',
    greeting: 'Welcome to your little corner of the world, Shu.',
    subtitle:
      'Take a slow breath. Everything inside these pages was put together quietly, piece by piece, just for you.',
    openingNote:
      '[Draft Note — Atharva can personalize] Some people walk into your life and gently change the temperature of every room they are in. For me, Shu, that person is you.',
    scrollInvitation: 'Scroll gently — let it unfold at your own pace',
    portrait: {
      id: 'portrait-01',
      fileStem: 'portrait-01',
      title: '[Opening Portrait Slot — portrait-01]',
      caption:
        'Drop portrait-01.jpg (or .png/.webp) into private-content/photos/ for Shu’s opening portrait.',
      aspect: 'portrait',
      isPlaceholder: true,
    },
  },

  chapters: [
    {
      id: 'chapter-anticipation',
      eyebrow: 'CHAPTER I • THE QUIET BEGINNING',
      title: 'Before you even say a word, the day already feels lighter.',
      theme: 'midnight',
      paragraphs: [
        '[Draft Copy — Replaceable by Atharva] There is a specific kind of calm that happens right before I get to see you or hear your voice, Shu. Even when a week feels noisy or rushed, the thought of you slows everything down to the right speed.',
        '[Draft Copy — Replaceable by Atharva] I wanted to build a place that holds that feeling—a quiet space away from notifications and ordinary timelines, where you can simply see yourself the way I see you.',
      ],
      pullQuote: '“You make ordinary hours feel worth keeping.”',
      marginNote: 'Tap the wax stamp in the corner for a tucked-away note.',
      secretPrompt: {
        triggerLabel: 'Tucked margin note #1',
        revealedNote:
          '[Placeholder Secret Note — Atharva] Whenever I see your name pop up on my screen, I still catch myself smiling before I even read the message.',
      },
    },
    {
      id: 'chapter-affection',
      eyebrow: 'CHAPTER II • THE LITTLE THINGS YOU DO',
      title: 'The details you probably don’t even notice about yourself.',
      theme: 'parchment',
      paragraphs: [
        '[Draft Copy — Replaceable by Atharva] It is never just one grand thing with you, Yashvi. It is the way your expressions give you away before you speak, the warmth in how you care for the people around you, and how effortlessly you turn a small moment into my favorite part of the day.',
        '[Draft Copy — Replaceable by Atharva] Being around you never feels like putting on an act. With you, everything feels honest, easy, and deeply safe.',
      ],
      pullQuote: '“The best parts of my favorite days all have you in common.”',
      marginNote: 'A small reminder saved between the lines.',
      secretPrompt: {
        triggerLabel: 'Read between the lines',
        revealedNote:
          '[Placeholder Secret Note — Atharva] Even when you think you are just rambling about something small, I am genuinely happy just listening to the sound of your voice.',
      },
    },
    {
      id: 'chapter-appreciation',
      eyebrow: 'CHAPTER III • WHAT YOU MEAN TO ME',
      title: 'Thank you for being my favorite person to come home to.',
      theme: 'burgundy',
      paragraphs: [
        '[Draft Copy — Replaceable by Atharva] I don’t think I say it often enough: thank you for your patience, your laughter, your softness, and the way you understand what I mean even when I don’t find the cleanest words.',
        '[Draft Copy — Replaceable by Atharva] Knowing you—really knowing you, Shu—is something I never want to take for granted.',
      ],
      pullQuote: '“With you, Shu, even silence feels warm.”',
      marginNote: 'Press the glowing ember to open a quiet note.',
      secretPrompt: {
        triggerLabel: 'Open quiet reminder',
        revealedNote:
          '[Placeholder Secret Note — Atharva] You never have to be anything other than exactly who you are with me.',
      },
    },
  ],

  memoriesIntro: {
    eyebrow: 'CHAPTER IV • OUR KEEPSAKES',
    title: 'Moments I Keep Returning To',
    subtitle:
      'Click or tap any photograph to hold it up closer and read the note written on the back.',
    placeholderNotice:
      'PLACEHOLDER GALLERY READY FOR TOMORROW: Replace memory-01 through memory-06, portrait-01, film-01, and final-photo in private-content/ and update captions in private-content/shu-content.ts.',
    featuredFilm: {
      id: 'film-01',
      fileStem: 'film-01',
      posterStem: 'film-01',
      mediaType: 'image',
      title: '[Placeholder Short Film Reel — film-01]',
      dateLabel: '[Date Placeholder — Motion Keepsake]',
      caption:
        '[Placeholder Film Note — Atharva: Drop film-01.mp4 into private-content/video/ and set mediaType to "video" in private-content/shu-content.ts when ready.]',
      isPlaceholder: true,
    },
  },

  memories: [
    {
      id: 'memory-01',
      fileStem: 'memory-01',
      title: '[Placeholder Photo 01 — Add Memory Title]',
      dateLabel: '[Date Placeholder — e.g., Month Day, Year]',
      locationLabel: '[Location Placeholder — e.g., Our Favorite Spot]',
      caption:
        '[Placeholder Caption 01 — Atharva: Write a sentence or two about this photograph with Shu here.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 01 — Atharva: Add what you remember feeling in this exact moment, or an inside joke from this photo.]',
      handwrittenNote: 'Placeholder #01 — Ready for Atharva’s photo tomorrow',
      aspect: 'portrait',
      frameStyle: 'polaroid',
      rotationDeg: -2.2,
      isPlaceholder: true,
    },
    {
      id: 'memory-02',
      fileStem: 'memory-02',
      title: '[Placeholder Photo 02 — Candid Laugh]',
      dateLabel: '[Date Placeholder — Add Real Date]',
      locationLabel: '[Location Placeholder]',
      caption:
        '[Placeholder Caption 02 — Atharva: Describe one of your favorite candid smiles or laughs of Shu.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 02 — Atharva: Add the story behind this candid frame when you drop memory-02.jpg tomorrow.]',
      handwrittenNote: 'Placeholder #02 — Candid moment slot',
      aspect: 'landscape',
      frameStyle: 'scrapbook-tape',
      rotationDeg: 1.8,
      isPlaceholder: true,
    },
    {
      id: 'memory-03',
      fileStem: 'memory-03',
      title: '[Placeholder Photo 03 — Quiet Evening]',
      dateLabel: '[Date Placeholder — Add Real Date]',
      locationLabel: '[Location Placeholder]',
      caption:
        '[Placeholder Caption 03 — Atharva: A quiet evening, walk, or unhurried moment together.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 03 — Atharva: Write what made this evening stay in your memory.]',
      handwrittenNote: 'Placeholder #03 — Evening memory slot',
      aspect: 'square',
      frameStyle: 'editorial',
      rotationDeg: -1.1,
      isPlaceholder: true,
    },
    {
      id: 'memory-04',
      fileStem: 'memory-04',
      title: '[Placeholder Photo 04 — Just Shu]',
      dateLabel: '[Date Placeholder — Add Real Date]',
      locationLabel: '[Location Placeholder]',
      caption:
        '[Placeholder Caption 04 — Atharva: A portrait of Shu that you always find yourself looking back at.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 04 — Atharva: Share why this specific photo of Shu is so special to you.]',
      handwrittenNote: 'Placeholder #04 — Portrait keepsake slot',
      aspect: 'portrait',
      frameStyle: 'polaroid',
      rotationDeg: 2.4,
      isPlaceholder: true,
    },
    {
      id: 'memory-05',
      fileStem: 'memory-05',
      title: '[Placeholder Photo 05 — Little Adventure]',
      dateLabel: '[Date Placeholder — Add Real Date]',
      locationLabel: '[Location Placeholder]',
      caption:
        '[Placeholder Caption 05 — Atharva: A day out, a spontaneous plan, or a shared memory.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 05 — Atharva: Add the real details and timestamp from this day tomorrow.]',
      handwrittenNote: 'Placeholder #05 — Shared adventure slot',
      aspect: 'landscape',
      frameStyle: 'film-strip',
      rotationDeg: -1.6,
      isPlaceholder: true,
    },
    {
      id: 'memory-06',
      fileStem: 'memory-06',
      title: '[Placeholder Photo 06 — Favorite Us Moment]',
      dateLabel: '[Date Placeholder — Add Real Date]',
      locationLabel: '[Location Placeholder]',
      caption:
        '[Placeholder Caption 06 — Atharva: A favorite photo of the two of you together.]',
      behindTheMoment:
        '[Placeholder Back-of-Photo Story 06 — Atharva: Replace with your real memory note tomorrow.]',
      handwrittenNote: 'Placeholder #06 — Favorite together slot',
      aspect: 'portrait',
      frameStyle: 'scrapbook-tape',
      rotationDeg: 1.5,
      isPlaceholder: true,
    },
  ],

  songSection: {
    eyebrow: 'CHAPTER V • OUR SOUNDTRACK',
    title: 'A Song That Sounds Like Us',
    subtitle:
      'Press play whenever you are ready. Nothing plays automatically—this room waits for your cue.',
    song: {
      fileStem: 'our-song',
      title: '[Placeholder Track — Replace with Our Song Title]',
      artist: 'Curated by Atharva for Shu (Sample Nocturne Audio Included)',
      dedicationNote:
        '[Placeholder Audio Note — Atharva: Drop your real song file at private-content/audio/our-song.mp3 tomorrow and update this dedication note with why this song reminds you of Shu.]',
      isPlaceholderAudio: true,
      placeholderInstructions:
        'Currently playing a gentle warm acoustic-chime placeholder recorded for testing. Replace private-content/audio/our-song.mp3 (or .wav/.m4a) tomorrow.',
      lyricMoments: [
        {
          timeLabel: '0:00',
          line: '[Placeholder Note] A quiet opening chord, for the calm you bring into my life.',
        },
        {
          timeLabel: '0:08',
          line: '[Placeholder Note] Replace these lyric annotations in private-content/shu-content.ts with lines from your real song.',
        },
        {
          timeLabel: '0:16',
          line: '[Placeholder Note] For every drive, late call, and quiet moment together, Shu.',
        },
      ],
    },
  },

  constellationSection: {
    eyebrow: 'CHAPTER VI • LITTLE DISCOVERIES',
    title: 'Five Small Things I Adore About You',
    subtitle:
      'Touch or click each glowing star in the night sky to light up the constellation. When all five are lit, a final keepsake unlocks.',
    completionSecretTitle: 'All Five Stars Lit — A Secret Just for Shu',
    completionSecretBody:
      '[Placeholder Final Constellation Reveal — Atharva: Customize if desired] No matter how busy life gets, Shu, you will always have a quiet place with me where you are deeply cherished, listened to, and loved for who you are.',
    stars: [
      {
        id: 'star-warmth',
        label: 'I. Your Warmth',
        xPercent: 18,
        yPercent: 32,
        qualityTitle: 'The way you make people feel cared for',
        affectionateNote:
          '[Draft Note — Atharva] There is a gentleness in how you treat the people you love that makes everyone around you feel safe.',
      },
      {
        id: 'star-laugh',
        label: 'II. Your Laugh',
        xPercent: 36,
        yPercent: 64,
        qualityTitle: 'The laugh that catches you off guard',
        affectionateNote:
          '[Draft Note — Atharva] My favorite sound in any room is the genuine laugh you can’t hold back when something catches you by surprise.',
      },
      {
        id: 'star-eyes',
        label: 'III. Your Expressions',
        xPercent: 52,
        yPercent: 26,
        qualityTitle: 'How your eyes tell the whole story first',
        affectionateNote:
          '[Draft Note — Atharva] Long before you say what you are thinking, your face already says everything—and I adore every bit of it.',
      },
      {
        id: 'star-voice',
        label: 'IV. Your Presence',
        xPercent: 71,
        yPercent: 58,
        qualityTitle: 'How calm everything feels beside you',
        affectionateNote:
          '[Draft Note — Atharva] Even the simplest plan feels special when it means spending unhurried time with you, Shu.',
      },
      {
        id: 'star-heart',
        label: 'V. Simply You',
        xPercent: 84,
        yPercent: 30,
        qualityTitle: 'Being unapologetically, wonderfully Shu',
        affectionateNote:
          '[Draft Note — Atharva] Not a single version of my favorite days exists without you in it, Yashvi.',
      },
    ],
  },

  letterSection: {
    eyebrow: 'CHAPTER VII • IN INK & PAPER',
    title: 'A Personal Letter for Shu',
    subtitle:
      'Break the wax seal whenever you want to read it. You can let the words unfold line by line, or read the full page at once.',
    letter: {
      isPlaceholderDraft: true,
      placeholderNotice:
        'DOCUMENTED PLACEHOLDER FOR ATHARVA’S ACTUAL LETTER: Edit `letterSection.letter.paragraphs` in `private-content/shu-content.ts` with your real personal words before sharing with Shu.',
      envelopeTitle: 'For Yashvi Pokar (Shu)',
      envelopeSubtitle: 'Private — From Atharva Patil',
      waxSealInitials: 'A ♥ S',
      dateLine: '[Date Placeholder — To be filled by Atharva]',
      salutation: 'My dearest Shu,',
      paragraphs: [
        '[PLACEHOLDER LETTER PARAGRAPH 1 — FOR ATHARVA TO WRITE] This letter space is reserved for Atharva’s real, personal words to you, Yashvi. Tomorrow, Atharva will replace these placeholder paragraphs in `private-content/shu-content.ts` with the exact letter he wrote for you.',
        '[PLACEHOLDER LETTER PARAGRAPH 2 — FOR ATHARVA TO WRITE] Until those final paragraphs are pasted in, this layout preserves the quiet paper texture, ink typography, and line-by-line reading mode so you can experience how the letter will feel when you open it.',
        '[PLACEHOLDER LETTER PARAGRAPH 3 — FOR ATHARVA TO WRITE] Take your time exploring every corner of this little world—every section, photograph frame, and melody slot was crafted with you in mind.',
      ],
      closing: 'With all my affection,',
      signature: 'Atharva',
      postscript:
        'P.S. [Placeholder Postscript — Atharva can add a personal P.S. note here tomorrow.]',
    },
  },

  ending: {
    isPlaceholderDraft: true,
    eyebrow: 'FINALE • ALWAYS YOUR CORNER',
    headline: 'Whenever you want to remember how deeply you are appreciated, Shu—this little world is yours.',
    paragraphs: [
      '[Draft Ending Note — Replaceable by Atharva] There is no rush here, no expectations, and nothing you need to say back on cue. I just wanted you to have something made with care that reminds you how special you are to me, Yashvi.',
      '[Draft Ending Note — Replaceable by Atharva] Come back whenever you want to look through our photographs, play our song, or reread your letter.',
    ],
    whisperLine: 'Made with quiet care, specifically for Yashvi Pokar (Shu).',
    signatureLine: '— Atharva Patil',
    keptPromises: [
      'A quiet corner that always belongs to you',
      'Every photograph and memory kept safe just for us',
      'Always cheering for your happiness and peace of mind',
    ],
    finalPhoto: {
      id: 'final-photo',
      fileStem: 'final-photo',
      title: '[Closing Finale Keepsake — final-photo]',
      caption:
        '[Placeholder Finale Portrait — Atharva: Drop final-photo.jpg into private-content/photos/ for the closing keepsake frame.]',
      aspect: 'landscape',
      isPlaceholder: true,
    },
  },
};
