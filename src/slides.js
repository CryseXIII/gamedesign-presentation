// Slide types: 'start' | 'toc' | 'chapter' | 'content'
// For chapter slides: { type: 'chapter', chapterNum, title }
// For content slides: { type: 'content', chapter, title, body: [...blocks] }
//   block types: 'text' | 'quote' | 'list' | 'comparison'

export const slides = [
  // ─── TABLE OF CONTENTS ─────────────────────────────────────────────────────
  {
    type: 'toc',
    title: 'Table of Contents',
    chapters: [
      { num: 1, title: 'What Is Game Design as Art?' },
      { num: 2, title: 'The FromSoftware Philosophy' },
      { num: 3, title: 'Dark Souls — A Case Study' },
      { num: 4, title: 'The Ubisoft Formula' },
      { num: 5, title: 'Design Clash — Direct Comparison' },
      { num: 6, title: 'Reception & Cultural Impact' },
      { num: 7, title: 'Conclusion' },
    ],
  },

  // ─── CHAPTER 1 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 1,
    title: 'What Is Game Design as Art?',
  },
  {
    type: 'content',
    chapter: 1,
    title: 'Defining the Question',
    body: [
      {
        type: 'text',
        text: 'Can a video game be a work of art? The question is no longer controversial — but what separates a game that is art from one that is merely a product?',
      },
      {
        type: 'list',
        items: [
          'Art communicates a vision beyond entertainment',
          'Art invites interpretation and provokes emotion',
          'Art is authored — it reflects deliberate choices',
          'Games are interactive — meaning is co-created with the player',
        ],
      },
    ],
  },
  {
    type: 'content',
    chapter: 1,
    title: 'The Medium-Specific Question',
    body: [
      {
        type: 'text',
        text: 'Unlike film or literature, games give the player agency. This makes game design itself the artistic act — not the story alone, but how systems, space, and challenge are shaped to produce feeling.',
      },
      {
        type: 'quote',
        text: '"A game is a series of interesting decisions."',
        attribution: '— Sid Meier',
      },
      {
        type: 'text',
        text: 'Design as art means those decisions carry weight — they say something about struggle, discovery, or the human condition.',
      },
    ],
  },

  // ─── CHAPTER 2 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 2,
    title: 'The FromSoftware Philosophy',
  },
  {
    type: 'content',
    chapter: 2,
    title: 'Hidetaka Miyazaki & Design Intent',
    body: [
      {
        type: 'text',
        text: 'Hidetaka Miyazaki, director of Dark Souls, built his design philosophy around a core conviction: difficulty should not punish — it should reward perseverance.',
      },
      {
        type: 'list',
        items: [
          'Player death is a teaching mechanism, not a failure state',
          'The world is authored, not generated — every detail is deliberate',
          'Lore is environmental and fragmentary — curiosity is the engine',
          'No handholding: trust the player to discover and adapt',
        ],
      },
    ],
  },
  {
    type: 'content',
    chapter: 2,
    title: 'Design as Language',
    body: [
      {
        type: 'text',
        text: 'In FromSoftware games, the environment speaks. Enemy placement, item positioning, and architectural design are a language. A corpse holding an item in a dangerous area communicates risk and reward simultaneously.',
      },
      {
        type: 'quote',
        text: '"I want players to feel a sense of achievement and elation when they overcome something difficult."',
        attribution: '— Hidetaka Miyazaki',
      },
    ],
  },

  // ─── CHAPTER 3 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 3,
    title: 'Dark Souls — A Case Study',
  },
  {
    type: 'content',
    chapter: 3,
    title: 'The Tutorial as Art',
    body: [
      {
        type: 'text',
        text: 'Dark Souls begins with a non-tutorial. The player wakes in an asylum with no explanation. The first enemy — the Asylum Demon — is unbeatable on first encounter. The player must flee, find a shortcut, and return stronger. This is a thesis statement about the entire game.',
      },
      {
        type: 'list',
        items: [
          'No UI tutorial popups',
          'The environment teaches through consequence',
          'Retreat is the correct first answer — not failure',
          'Victory is earned, not given',
        ],
      },
    ],
  },
  {
    type: 'content',
    chapter: 3,
    title: 'World Design — Interconnected Lordran',
    body: [
      {
        type: 'text',
        text: 'Lordran is a single continuous world with no loading screens between major areas. Every zone connects to every other — discovery of a new path that loops back to the beginning creates a sense of awe.',
      },
      {
        type: 'quote',
        text: '"The interconnected world is what I am most proud of in Dark Souls."',
        attribution: '— Hidetaka Miyazaki',
      },
      {
        type: 'text',
        text: 'This design communicates a theme: the world was once whole. Its decay is spatial — you read the fall of a civilization by walking through it.',
      },
    ],
  },
  {
    type: 'content',
    chapter: 3,
    title: 'Lore Through Environment',
    body: [
      {
        type: 'text',
        text: 'Dark Souls tells its story almost entirely through item descriptions, enemy design, and architecture. There are no cutscenes explaining the world. The player assembles meaning.',
      },
      {
        type: 'list',
        items: [
          'Item descriptions reference ancient events in fragments',
          'Boss designs tell stories (e.g. Sif the Wolf guards his dead master\'s grave)',
          'Enemy placement communicates history (hollowed knights once guarded treasures)',
          'The player IS the lore — an Undead whose purpose is debated in-universe',
        ],
      },
    ],
  },

  // ─── CHAPTER 4 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 4,
    title: 'The Ubisoft Formula',
  },
  {
    type: 'content',
    chapter: 4,
    title: 'Open World by Numbers',
    body: [
      {
        type: 'text',
        text: 'Ubisoft pioneered the modern open-world template — a vast map populated with icons representing tasks. This formula, first codified in Assassin\'s Creed II, defines franchises like Far Cry, Watch Dogs, and Ghost Recon.',
      },
      {
        type: 'list',
        items: [
          'Viewpoint towers that reveal map icons',
          'Collectibles counted in the hundreds',
          'Side quests and outposts as activity filler',
          'Skill trees unlocked through XP accumulation',
          'Narrative delivered via cutscenes, not environment',
        ],
      },
    ],
  },
  {
    type: 'content',
    chapter: 4,
    title: 'Design Intent vs. Design Product',
    body: [
      {
        type: 'text',
        text: 'The Ubisoft formula is not artistically bankrupt by default — Assassin\'s Creed Origins (2017) and Odyssey made genuine attempts at historical artistry. But the formula prioritises engagement loops over authored experience.',
      },
      {
        type: 'quote',
        text: '"We want players to feel like they could spend 200 hours in this world."',
        attribution: '— Ubisoft producer, Far Cry 5 GDC talk',
      },
      {
        type: 'text',
        text: 'The goal is retention, not revelation. The design serves business metrics, not artistic expression.',
      },
    ],
  },

  // ─── CHAPTER 5 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 5,
    title: 'Design Clash — Direct Comparison',
  },
  {
    type: 'content',
    chapter: 5,
    title: 'Player Guidance',
    body: [
      {
        type: 'comparison',
        left: {
          label: 'Dark Souls',
          points: [
            'No map markers',
            'No quest log',
            'Exploration is the reward',
            'Death teaches the path',
          ],
        },
        right: {
          label: 'Ubisoft Games',
          points: [
            'Dense map icons',
            'Quest tracker with objectives',
            'Waypoint navigation',
            'Tutorials for every mechanic',
          ],
        },
      },
    ],
  },
  {
    type: 'content',
    chapter: 5,
    title: 'Narrative Delivery',
    body: [
      {
        type: 'comparison',
        left: {
          label: 'Dark Souls',
          points: [
            'Environmental storytelling',
            'Fragmentary item lore',
            'Ambiguous — player interprets',
            'Story is personal, assembled',
          ],
        },
        right: {
          label: 'Ubisoft Games',
          points: [
            'Cinematic cutscenes',
            'Explicit voiced exposition',
            'Clear protagonist arc',
            'Story is consumed, not found',
          ],
        },
      },
    ],
  },
  {
    type: 'content',
    chapter: 5,
    title: 'Difficulty & Respect for the Player',
    body: [
      {
        type: 'comparison',
        left: {
          label: 'Dark Souls',
          points: [
            'No difficulty settings',
            'Player mastery is the progression',
            'Failure is expected and useful',
            'Skill gap as artistic statement',
          ],
        },
        right: {
          label: 'Ubisoft Games',
          points: [
            'Multiple difficulty settings',
            'Power level smooths progression',
            'Frustration is avoided by design',
            'Accessibility over challenge',
          ],
        },
      },
    ],
  },

  // ─── CHAPTER 6 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 6,
    title: 'Reception & Cultural Impact',
  },
  {
    type: 'content',
    chapter: 6,
    title: 'Dark Souls — Cultural Legacy',
    body: [
      {
        type: 'list',
        items: [
          '"Prepare to Die" entered gaming vernacular',
          'Spawned a genre: "Soulslike"',
          'Academic papers on game design reference it extensively',
          'Community analysis of lore rivals literary criticism',
          'Games like Hollow Knight, Blasphemous, Sekiro cite it directly',
        ],
      },
      {
        type: 'text',
        text: 'Dark Souls changed what players expect games to demand of them. It proved that a mass audience will accept — and seek — genuine difficulty when it is fair and meaningful.',
      },
    ],
  },
  {
    type: 'content',
    chapter: 6,
    title: 'Ubisoft — Commercial Success, Critical Saturation',
    body: [
      {
        type: 'text',
        text: 'Ubisoft\'s formula generated enormous commercial success and expanded the audience for open-world games. But critical reception has increasingly noted "Ubisoft fatigue" — the sense that their games feel interchangeable.',
      },
      {
        type: 'list',
        items: [
          'Critics coined "Ubisoft formula" as a pejorative by 2015',
          'Internal studios pushed back (Assassin\'s Creed Origins, Immortals)',
          'Ghost Recon Breakpoint was a commercial and critical failure (2019)',
          'Company announced design philosophy review post-Breakpoint',
        ],
      },
    ],
  },

  // ─── CHAPTER 7 ─────────────────────────────────────────────────────────────
  {
    type: 'chapter',
    chapterNum: 7,
    title: 'Conclusion',
  },
  {
    type: 'content',
    chapter: 7,
    title: 'What Makes Design Artistic?',
    body: [
      {
        type: 'text',
        text: 'Game design becomes art when it uses its medium\'s unique properties — interactivity, agency, consequence — to express something. Dark Souls uses death, space, and silence to speak about perseverance and decay. These are not accidents of production; they are authorial choices.',
      },
      {
        type: 'text',
        text: 'The Ubisoft formula is skilled engineering. It is not artistically void — but it prioritises experience delivery over artistic statement. The distinction matters.',
      },
    ],
  },
  {
    type: 'content',
    chapter: 7,
    title: 'Final Thesis',
    body: [
      {
        type: 'quote',
        text: '"Dark Souls does not tell you how to feel. It builds the conditions under which a feeling becomes inevitable. That is what art does."',
        attribution: '— Presentation conclusion',
      },
      {
        type: 'list',
        items: [
          'Art in games lives in design decisions, not just narrative',
          'Difficulty, pacing, and environment can be expressive tools',
          'Commercial design and artistic design are not mutually exclusive',
          'But they require different ambitions and different metrics of success',
        ],
      },
    ],
  },
]

// Helper: get slide index within all content slides (excluding chapter/toc)
export function getContentSlides() {
  return slides.filter((s) => s.type === 'content')
}

export function getTotalSteps() {
  return slides.length
}
