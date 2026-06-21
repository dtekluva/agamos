// Single source of truth for every event type: labels, copy, default theme,
// suggested gift categories. Drives the creation flow, the public page, and the
// landing-page "supported events" section.

export type EventKey = 'wedding' | 'anniversary' | 'baby_shower' | 'birthday' | 'memorial'
export type Surface = 'registry' | 'memorial'

export interface EventConfig {
  key: EventKey
  label: string
  emoji: string
  blurb: string
  surface: Surface
  defaultTheme: string
  // form
  nameOneLabel: string
  nameTwoLabel: string | null // null = hide second name
  organiserLabel: string | null // null = hide organiser field
  dateLabel: string
  extraField: 'years_celebrated' | 'turning_age' | null
  storyToggleLabel: string
  timelineToggleLabel: string
  registryToggleLabel: string
  // public page copy
  heroKicker: (r: any) => string
  storyHeading: string
  timelineEyebrow: string
  timelineHeading: string
  galleryHeading: string
  registryEyebrow: string
  registryHeading: string
  registrySub: string
  contributeCta: string
  suggestedCategories: string[]
}

const CONFIG: Record<EventKey, EventConfig> = {
  wedding: {
    key: 'wedding', label: 'Wedding', emoji: '💍',
    blurb: 'Build a shared gift list and let guests fund your big day.',
    surface: 'registry', defaultTheme: 'blush',
    nameOneLabel: 'Your name', nameTwoLabel: 'Partner’s name', organiserLabel: null,
    dateLabel: 'Wedding date', extraField: null,
    storyToggleLabel: 'Our story', timelineToggleLabel: 'How we met', registryToggleLabel: 'Gift registry',
    heroKicker: () => 'We’re getting married',
    storyHeading: 'How we got here',
    timelineEyebrow: 'How we met', timelineHeading: 'Our journey',
    galleryHeading: 'Us, lately',
    registryEyebrow: 'Our wish list', registryHeading: 'Give a gift they’ll cherish',
    registrySub: 'Buy a gift outright or chip in any amount toward a goal. Every contribution means the world.',
    contributeCta: 'Contribute a little',
    suggestedCategories: ['experience', 'home', 'honeymoon', 'cash', 'charity', 'other'],
  },
  anniversary: {
    key: 'anniversary', label: 'Anniversary', emoji: '🥂',
    blurb: 'Celebrate the years together with a shared gift list.',
    surface: 'registry', defaultTheme: 'eternal',
    nameOneLabel: 'Your name', nameTwoLabel: 'Partner’s name', organiserLabel: null,
    dateLabel: 'Anniversary date', extraField: 'years_celebrated',
    storyToggleLabel: 'Our story', timelineToggleLabel: 'Through the years', registryToggleLabel: 'Gift registry',
    heroKicker: (r) => r?.years_celebrated ? `Celebrating ${r.years_celebrated} wonderful years` : 'Celebrating our anniversary',
    storyHeading: 'Our journey together',
    timelineEyebrow: 'Through the years', timelineHeading: 'Our story so far',
    galleryHeading: 'Moments we treasure',
    registryEyebrow: 'Our wish list', registryHeading: 'A gift to mark the moment',
    registrySub: 'Help us celebrate — buy a gift or chip in toward something we’ll cherish.',
    contributeCta: 'Contribute a little',
    suggestedCategories: ['experience', 'home', 'cash', 'charity', 'other'],
  },
  baby_shower: {
    key: 'baby_shower', label: 'Baby shower', emoji: '🍼',
    blurb: 'A wish list for the little one on the way.',
    surface: 'registry', defaultTheme: 'nursery',
    nameOneLabel: 'Parent’s name', nameTwoLabel: 'Co-parent’s name (optional)', organiserLabel: 'Hosted by (optional)',
    dateLabel: 'Due date', extraField: null,
    storyToggleLabel: 'Our story', timelineToggleLabel: 'The journey', registryToggleLabel: 'Gift registry',
    heroKicker: () => 'A little one is on the way',
    storyHeading: 'The journey to parenthood',
    timelineEyebrow: 'The journey', timelineHeading: 'The road to baby',
    galleryHeading: 'Bump & beyond',
    registryEyebrow: 'Our wish list', registryHeading: 'Help us welcome baby',
    registrySub: 'Pick something from our list or chip in toward a goal for the little one.',
    contributeCta: 'Gift the baby',
    suggestedCategories: ['nursery', 'baby_essentials', 'education', 'cash', 'charity', 'other'],
  },
  birthday: {
    key: 'birthday', label: 'Birthday', emoji: '🎉',
    blurb: 'Celebrate another year with a gift list or cash goals.',
    surface: 'registry', defaultTheme: 'confetti',
    nameOneLabel: 'Celebrant’s name', nameTwoLabel: null, organiserLabel: 'Hosted by (optional)',
    dateLabel: 'Birthday', extraField: 'turning_age',
    storyToggleLabel: 'About me', timelineToggleLabel: 'Milestones', registryToggleLabel: 'Gift registry',
    heroKicker: (r) => r?.turning_age ? `Turning ${r.turning_age}!` : 'It’s a birthday!',
    storyHeading: 'A little about me',
    timelineEyebrow: 'Milestones', timelineHeading: 'The journey so far',
    galleryHeading: 'Good times',
    registryEyebrow: 'My wish list', registryHeading: 'Make my day',
    registrySub: 'Grab a gift or chip in toward something special — thank you!',
    contributeCta: 'Send a gift',
    suggestedCategories: ['experience', 'party', 'cash', 'charity', 'other'],
  },
  memorial: {
    key: 'memorial', label: 'Memorial', emoji: '🕊️',
    blurb: 'Honour a life and support the family with contributions and tributes.',
    surface: 'memorial', defaultTheme: 'memorial',
    nameOneLabel: 'In loving memory of', nameTwoLabel: null, organiserLabel: 'Organised by / the family',
    dateLabel: 'Service date', extraField: null,
    storyToggleLabel: 'Their life', timelineToggleLabel: 'A life well lived', registryToggleLabel: 'Memorial fund',
    heroKicker: () => 'In loving memory',
    storyHeading: 'Remembering them',
    timelineEyebrow: 'Their life', timelineHeading: 'A life well lived',
    galleryHeading: 'Cherished moments',
    registryEyebrow: 'Stand with the family', registryHeading: 'Support the family',
    registrySub: 'Contribute toward funeral arrangements and stand with the family in this time.',
    contributeCta: 'Make a contribution',
    suggestedCategories: ['memorial_fund', 'charity', 'cash', 'other'],
  },
}

export const EVENT_LIST: EventConfig[] = Object.values(CONFIG)

export function getEvent(key?: string): EventConfig {
  return (key && CONFIG[key as EventKey]) || CONFIG.wedding
}
