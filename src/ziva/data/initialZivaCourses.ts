import { ZivaCourse } from '../types';

export const INITIAL_ZIVA_COURSES: ZivaCourse[] = [
  {
    id: 'ziva-course-1',
    slug: 'confident-you',
    title: 'Confident You: Master Communication & Self-Belief',
    name: 'Confident You: Master Communication & Self-Belief',
    tagline: 'Transform your inner dialogue and express yourself with magnetic authority.',
    shortDescription: 'The flagship course to overcome self-doubt, command respect in every conversation, and project unshakeable confidence.',
    fullDescription: 'Discover the exact step-by-step framework to unlock your authentic voice. Designed by Meharr, a National Level Speaker with 75+ awards and 250+ stage appearances, this masterclass transforms stage fright, anxiety, and social doubt into effortless charisma.',
    category: 'Confidence',
    level: 'All Levels',
    price: 199,
    salePrice: 149,
    duration: '6 Hours (12 Lessons)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000',
    promoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    instructorName: 'Meharr',
    instructorTitle: 'National Level Speaker & Creative Expression Coach',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    isPublished: true,
    isFeatured: true,
    keyOutcomes: [
      'Overcome social anxiety & public speaking fear',
      'Craft a compelling signature vocal presence',
      'Master body language & non-verbal authority',
      'Express ideas clearly under pressure'
    ],
    sections: [
      {
        id: 'zsec-1',
        course_id: 'ziva-course-1',
        title: 'Section 1: The Psychology of Unshakeable Confidence',
        display_order: 0,
        lessons: [
          {
            id: 'zles-101',
            section_id: 'zsec-1',
            title: 'Welcome to Ziva: Unlocking Your Infinite Potential',
            subtitle: 'Setting your transformation goals and intention',
            display_order: 0,
            estimated_duration: 12,
            is_preview: true,
            is_locked: false,
            blocks: [
              {
                id: 'zbk-1',
                type: 'video',
                title: 'Introduction Video by Meharr',
                content: 'Welcome to Confident You! Watch this video to begin your journey.',
                media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                display_order: 0
              },
              {
                id: 'zbk-2',
                type: 'paragraph',
                title: 'Core Philosophy',
                content: 'Great communicators do not just talk—they transform rooms. Confidence is not a trait you are born with; it is a skill you cultivate through intentional practice.',
                display_order: 1
              }
            ]
          },
          {
            id: 'zles-102',
            section_id: 'zsec-1',
            title: 'Breaking the Fear Cycle: Rewiring Your Mindset',
            subtitle: 'How to dissolve anxiety before speaking',
            display_order: 1,
            estimated_duration: 18,
            is_preview: false,
            is_locked: false,
            blocks: [
              {
                id: 'zbk-3',
                type: 'paragraph',
                title: 'Mindset Shift Workbook',
                content: 'When your pulse quickens, shift from self-focus to audience-focus. Ask yourself: "How can I serve the room today?"',
                display_order: 0
              },
              {
                id: 'zbk-4',
                type: 'quiz',
                title: 'Check Your Understanding',
                content: 'What is the most effective psychological reset before speaking?',
                metadata: {
                  questions: [
                    {
                      question: 'What is the primary key to shifting away from performance anxiety?',
                      options: ['Memorizing every single word', 'Shifting focus from self to value for the audience', 'Avoiding eye contact', 'Speaking as fast as possible'],
                      correctAnswer: 1,
                      explanation: 'Shifting focus to serving your audience immediately neutralizes self-conscious fear.'
                    }
                  ]
                },
                display_order: 1
              }
            ]
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ziva-course-2',
    slug: 'karizmatic-you',
    title: 'Karizmatic You: Personality & Executive Presence',
    name: 'Karizmatic You: Personality & Executive Presence',
    tagline: 'Develop a high-impact personality that magnetizes opportunities.',
    shortDescription: 'Elevate your personal brand, master high-stakes networking, and project effortless warmth and authority.',
    fullDescription: 'Personality is the vehicle for your purpose. In Karizmatic You, Meharr provides a master guide to body language, tonal inflection, storytelling, and high-status presence in both personal and professional environments.',
    category: 'Personality Development',
    level: 'Intermediate',
    price: 249,
    salePrice: 189,
    duration: '8 Hours (16 Lessons)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    promoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    instructorName: 'Meharr',
    instructorTitle: 'National Level Speaker & Creative Expression Coach',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    isPublished: true,
    isFeatured: true,
    keyOutcomes: [
      'Master high-status body language & micro-expressions',
      'Build instant rapport with leaders & stakeholders',
      'Cultivate magnetic executive presence',
      'Command attention in virtual & in-person meetings'
    ],
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ziva-course-3',
    slug: 'expressive-you',
    title: 'Expressive You: High-Impact Public Speaking Mastery',
    name: 'Expressive You: High-Impact Public Speaking Mastery',
    tagline: 'Deliver keynote speeches that captivate, inspire, and convert.',
    shortDescription: 'Learn how to structure signature talks, weave powerful stories, and command stages of any size.',
    fullDescription: 'From stage positioning to emotional crescendo, learn the exact secrets used by top international speakers to leave lasting impressions and monetizing your speaking skills.',
    category: 'Public Speaking',
    level: 'Advanced',
    price: 299,
    salePrice: 229,
    duration: '10 Hours (20 Lessons)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=1000',
    promoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    instructorName: 'Meharr',
    instructorTitle: 'National Level Speaker & Creative Expression Coach',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    isPublished: true,
    isFeatured: true,
    keyOutcomes: [
      'Craft a compelling signature keynote talk',
      'Weave unforgettable stories & narrative arcs',
      'Structure high-converting webinar presentations',
      'Earn income through paid speaking engagements'
    ],
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
