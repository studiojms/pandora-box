export enum IdeaType {
  PROBLEM = 'PROBLEM',
  SOLUTION = 'SOLUTION',
}

export type Language = 'en' | 'pt' | 'es';

export type IdeaStatus = 'DRAFT' | 'ACTIVE' | 'IN_FORGE';

export type RelationType = 'RESOLVES' | 'RELATES_TO' | 'IMPROVES';

export type SortOption = 'RECENT' | 'VOTES' | 'VIEWS';

export enum InteractionType {
  VIEW = 'VIEW',
  ECHO = 'ECHO',
  COMMENT = 'COMMENT',
  FAVORITE = 'FAVORITE',
  CONTRIBUTOR_ADDED = 'CONTRIBUTOR_ADDED',
}

export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  COMPANY_MEMBER = 'COMPANY_MEMBER',
}

export interface IdeaMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

export interface Idea {
  id: string;
  type: IdeaType;
  title: string;
  description: string;
  author: string;
  authorId: string;
  votes: number;
  views: number;
  tags: string[];
  status: IdeaStatus;
  createdAt: string;
  aiAnalysis?: BusinessAnalysis;
  contributorIds?: string[];
  companyId?: string;
  teamId?: string;
  department?: string;
  isPublicCompanyIdea?: boolean;
  media?: IdeaMedia[];
}

export interface BusinessAnalysis {
  viabilityScore: number;
  marketSizeScore: number;
  complexityScore: number;
  veracityScore?: number;
  summary: string;
  mermaidDiagram?: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  canvas: {
    valueProposition: string;
    customerSegments: string;
    revenueStreams: string;
    costStructure: string;
  };
  competitors: string[];
  suggestedTeam: string[];
}

export type ViewState =
  | { type: 'FEED' }
  | { type: 'IDEA_DETAIL'; ideaId: string }
  | { type: 'PROFILE'; username: string }
  | { type: 'FAVORITES' }
  | { type: 'PRO_PLAN' }
  | { type: 'COMPANY_DASHBOARD' };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  coverImage?: string;
  website?: string;
  role?: UserRole;
  companyId?: string;
  teamId?: string;
  permissions?: UserPermissions;
  preferredLanguage?: Language;
}

export interface UserPermissions {
  canSeeAnalytics: boolean;
  canManageBilling: boolean;
  departments: string[];
}

export interface Team {
  id: string;
  name: string;
  companyId: string;
  memberIds: string[];
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  plan: 'FREE' | 'PRO';
  billingCycle?: 'MONTHLY' | 'YEARLY';
  departments: string[];
}

export interface UserProgress {
  profileCompleted: boolean;
  ideaCreated: boolean;
  favoriteMarked: boolean;
  commentAdded: boolean;
  percentage: number;
}

export interface Edge {
  id: string;
  fromId: string;
  toId: string;
  type: RelationType;
  strength: number;
}

export interface Comment {
  id: string;
  ideaId: string;
  author: string;
  text: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
}

export type ContributionType = 'INFO' | 'DOC' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'LINK' | 'PRODUCT';

export interface Contribution {
  id: string;
  ideaId: string;
  author: string;
  type: ContributionType;
  content: string;
  title?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: InteractionType;
  ideaId: string;
  ideaAuthor: string;
  userId?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'CONTRIBUTOR_ADDED';
  ideaId: string;
  ideaTitle: string;
  fromUserName: string;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  emailNotificationsEnabled: boolean;
}
