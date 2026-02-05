
import { Idea, IdeaType } from './types';

export const MOCK_IDEAS: Idea[] = [
  {
    id: '101',
    type: IdeaType.PROBLEM,
    title: 'Opacity of Fuel Market',
    description: 'Drivers lose time and money trying to balance low prices with trust in fuel quality. Daily volatility makes static apps useless. We need transparency on price, quality, and location in real-time.',
    author: 'UrbanDriver',
    authorId: 'seed_u3',
    votes: 842,
    // Fix: Added missing views property
    views: 2450,
    tags: ['logistics', 'consumer-rights', 'automotive'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '102',
    type: IdeaType.SOLUTION,
    title: 'SafeFuel: The Waze of Fuels',
    description: 'A crowdsourced platform where users earn Echoes for validating prices and quality via OBD-II dongles. Uses predictive AI to suggest when to fill up based on oil market trends.',
    author: 'DevInnovator',
    authorId: 'dev_102',
    votes: 1250,
    // Fix: Added missing views property
    views: 5600,
    tags: ['iot', 'ai', 'fintech', 'logistics'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '1',
    type: IdeaType.PROBLEM,
    title: 'Urban Plastic Waste',
    description: 'Cities are overwhelmed with single-use plastics that are not being recycled efficiently due to contamination.',
    author: 'EcoWarrior',
    authorId: 'eco_1',
    votes: 124,
    // Fix: Added missing views property
    views: 890,
    tags: ['environment', 'waste', 'urban'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 10000000).toISOString(),
  },
  {
    id: '2',
    type: IdeaType.SOLUTION,
    title: 'Gamified Recycling Kiosks',
    description: 'Smart kiosks that use computer vision to sort plastic types and reward users with crypto tokens or transit credit.',
    author: 'TechGuru',
    authorId: 'tech_2',
    votes: 89,
    // Fix: Added missing views property
    views: 450,
    tags: ['ai', 'crypto', 'recycling'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 5000000).toISOString(),
  },
  {
    id: '3',
    type: IdeaType.PROBLEM,
    title: 'Loneliness in Remote Work',
    description: 'Remote workers feel disconnected from colleagues and lack the serendipitous social interactions of an office.',
    author: 'SarahRemote',
    authorId: 'sarah_3',
    votes: 56,
    // Fix: Added missing views property
    views: 320,
    tags: ['work', 'mental-health', 'social'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 2000000).toISOString(),
  },
  {
    id: '4',
    type: IdeaType.SOLUTION,
    title: 'Virtual Coffee Break VR',
    description: 'A lightweight VR space that sits in the system tray and allows instant, spatial audio voice chats in a virtual cafe.',
    author: 'VRDev',
    authorId: 'vr_4',
    votes: 32,
    // Fix: Added missing views property
    views: 180,
    tags: ['vr', 'social', 'software'],
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 100000).toISOString(),
  }
];

export const APP_NAME = "Pandora Box";
