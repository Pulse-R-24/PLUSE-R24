import { LayoutTemplate, NewsItem } from './types';

export const STRATEGIC_CATEGORIES = [
  'Cyber crimes',
  'Traffic',
  'Travel disruption',
  'Climate disruption',
  'Weather disruption-Natural hazards',
  'Protest',
  'Riots',
  'VIP Movement',
  'Health hazards',
  'Political violence',
  'Planned events',
  'Government Development measures',
  'Diplomatic visits',
  'National events',
  'Festival processions',
  'Terrorism',
  'Global Events',
  'Power outage',
  'Water supply interruption'
];


export const MOCK_LAYOUTS: LayoutTemplate[] = [
  {
    templateId: "tpl-standard",
    name: "Standard Article",
    gridColumns: 12,
    blocks: [
      { id: "b1", type: "title", label: "Headline", grid: { colSpan: 12 } },
      { id: "b2", type: "image", label: "Hero Image", grid: { colSpan: 12 } },
      { id: "b3", type: "author", label: "Author", grid: { colSpan: 6 } },
      { id: "b4", type: "publishDate", label: "Publish Date", grid: { colSpan: 6 } },
      { id: "b5", type: "excerpt", label: "Summary", grid: { colSpan: 12 } },
      { id: "b6", type: "markdown", label: "Main Content", grid: { colSpan: 8 } },
      { id: "b7", type: "tags", label: "Tags", grid: { colSpan: 4 } },
      { id: "b8", type: "divider", label: "Footer Split", grid: { colSpan: 12 } }
    ]
  },
  {
    templateId: "tpl-visual",
    name: "Visual Story",
    gridColumns: 12,
    blocks: [
      { id: "vb1", type: "image", label: "Cover Image", grid: { colSpan: 12 } },
      { id: "vb2", type: "title", label: "Title Overlay", grid: { colSpan: 8 } },
      { id: "vb3", type: "markdown", label: "Intro", grid: { colSpan: 4 } },
      { id: "vb4", type: "divider", label: "Separator", grid: { colSpan: 12 } },
      { id: "vb5", type: "markdown", label: "Story Body", grid: { colSpan: 12 } }
    ]
  }
];

export const MOCK_NEWS_ITEMS: NewsItem[] = [
  {
    id: "news-001",
    templateId: "tpl-standard",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "published",
    author: "Jane Doe",
    tags: ["Cyber attacks", "Critical Infrastructure accident"],
    blocks: [
      { blockId: "b1", type: "title", value: "The Future of AI in Web Development" },
      { blockId: "b2", type: "image", value: { src: "https://picsum.photos/800/400?random=1", caption: "AI coding assistant" } },
      { blockId: "b3", type: "author", value: "Jane Doe" },
      { blockId: "b4", type: "publishDate", value: new Date(Date.now() - 86400000).toISOString() },
      { blockId: "b5", type: "excerpt", value: "How generative models are reshaping the landscape of frontend engineering." },
      { blockId: "b6", type: "markdown", value: "## A New Era\n\nArtificial Intelligence is no longer just a buzzword. From **code generation** to automated testing, it's everywhere.\n\n* Efficiency\n* Creativity\n* Speed\n\nDevelopers can now focus on architecture." },
      { blockId: "b7", type: "tags", value: ["Cyber attacks", "Critical Infrastructure accident"] }
    ]
  },
  {
    id: "news-002",
    templateId: "tpl-standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    status: "pending_approval",
    author: "John Smith",
    tags: ["Health Risk"],
    blocks: [
      { blockId: "b1", type: "title", value: "Top 10 Coffee Shops in Seattle" },
      { blockId: "b2", type: "image", value: { src: "https://picsum.photos/800/400?random=2", caption: "Latte Art" } },
      { blockId: "b5", type: "excerpt", value: "A curated list of the best brews in the Emerald City." },
      { blockId: "b6", type: "markdown", value: "If you love caffeine, you're in the right place..." },
      { blockId: "b7", type: "tags", value: ["Health Risk"] }
    ]
  },
  {
    id: "news-003",
    templateId: "tpl-visual",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: "published",
    author: "Visual Team",
    tags: ["Travel Risk", "Natural Hazards"],
    blocks: [
      { blockId: "vb1", type: "image", value: { src: "https://picsum.photos/1200/600?random=3", caption: "Mountain Peak" } },
      { blockId: "vb2", type: "title", value: "Alpine Adventures" },
      { blockId: "vb3", type: "markdown", value: "**Climbing higher** than ever before." },
      { blockId: "vb5", type: "markdown", value: "The air was thin, but the view was worth it. We started our journey at dawn..." },
      { blockId: "vb6", type: "tags", value: ["Travel Risk", "Natural Hazards"] }
    ]
  },
];

export const CITY_COORDINATES: Record<string, [number, number]> = {
  'delhi': [77.2090, 28.6139],
  'mumbai': [72.8777, 19.0760],
  'bengaluru': [77.5946, 12.9716],
  'chennai': [80.2707, 13.0827],
  'hyderabad': [78.4867, 17.3850],
  'kolkata': [88.3639, 22.5726],
  'pune': [73.8567, 18.5204],
  'ahmedabad': [72.5714, 23.0225],
  'national': [78.9629, 22.5937],
  'india': [78.9629, 22.5937]
};

export const TIER_1_CITIES = [
  'mumbai',
  'delhi',
  'bengaluru',
  'chennai',
  'kolkata',
  'hyderabad',
  'pune',
  'ahmedabad'
];

