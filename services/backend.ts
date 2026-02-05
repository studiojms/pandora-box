import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  increment, 
  setDoc, 
  deleteDoc,
  Timestamp,
  writeBatch,
  limit,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { db, storage } from './firebase';
import { 
  Idea, IdeaType, Edge, RelationType, IdeaStatus, Comment, 
  Contribution, User, SortOption, UserProgress, InteractionType, 
  AnalyticsEvent, Notification, UserSettings, Company, Team, UserRole 
} from '../types';

export const backend = {
  
  // --- NOTIFICATIONS ---
  async getNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    // FIX: Removing combined orderBy with filter to avoid Index requirement.
    // Sorting happens in memory.
    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", userId),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Notification))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(notifs.slice(0, 20));
    });
  },

  async markNotificationRead(notifId: string) {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  },

  async markAllNotificationsRead(userId: string) {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  },

  // --- SETTINGS ---
  async getUserSettings(userId: string): Promise<UserSettings> {
    const docRef = doc(db, "userSettings", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as UserSettings;
    return { emailNotificationsEnabled: true }; // Default
  },

  async updateUserSettings(userId: string, settings: UserSettings) {
    await setDoc(doc(db, "userSettings", userId), settings);
  },

  // --- ANALYTICS ---
  async logInteraction(type: InteractionType, ideaId: string, ideaAuthor: string, userId?: string) {
    try {
      await addDoc(collection(db, "analytics"), {
        type,
        ideaId,
        ideaAuthor,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to log analytics", e);
    }
  },

  async getAnalyticsForUser(username: string): Promise<AnalyticsEvent[]> {
    // FIX: Client side sort to avoid index requirement
    const analyticsCol = collection(db, "analytics");
    const q = query(analyticsCol, where("ideaAuthor", "==", username));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getAnalyticsForCompany(companyId: string): Promise<AnalyticsEvent[]> {
    const q = query(collection(db, "ideas"), where("companyId", "==", companyId));
    const snap = await getDocs(q);
    const ideaIds = snap.docs.map(d => d.id);
    if (ideaIds.length === 0) return [];
    const qAnalytic = query(collection(db, "analytics"), where("ideaId", "in", ideaIds.slice(0, 10)));
    const snapAnalytic = await getDocs(qAnalytic);
    return snapAnalytic.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));
  },

  // --- AUTH & USER PROFILE ---
  async syncUserProfile(user: User): Promise<User> {
    const userRef = doc(db, "users", user.id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const newUser = {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: UserRole.INDIVIDUAL,
        lastLogin: Timestamp.now(),
        preferredLanguage: user.preferredLanguage || 'en'
      };
      await setDoc(userRef, newUser);
      return { id: user.id, ...newUser } as User;
    } else {
      await updateDoc(userRef, { lastLogin: Timestamp.now() });
      return { id: snap.id, ...snap.data() } as User;
    }
  },

  async updateUserProfile(userId: string, data: Partial<User>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data as any);
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("name", "==", username), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...data } as User;
  },

  async getProgress(userId: string, username: string): Promise<UserProgress> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const [ideasSnap, favsSnap, commentsSnap] = await Promise.all([
      getDocs(query(collection(db, "ideas"), where("author", "==", username), limit(1))),
      getDocs(query(collection(db, "favorites"), where("userId", "==", userId), limit(1))),
      getDocs(query(collection(db, "comments"), where("author", "==", username), limit(1)))
    ]);

    const profileCompleted = !!(userData?.bio && userData?.avatar);
    const ideaCreated = !ideasSnap.empty;
    const favoriteMarked = !favsSnap.empty;
    const commentAdded = !commentsSnap.empty;

    const tasks = [profileCompleted, ideaCreated, favoriteMarked, commentAdded];
    const completedCount = tasks.filter(Boolean).length;
    
    return {
      profileCompleted,
      ideaCreated,
      favoriteMarked,
      commentAdded,
      percentage: (completedCount / tasks.length) * 100
    };
  },

  async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  // --- COMPANY & BILLING ---
  async upgradeToPro(userId: string, companyName: string, cycle: 'MONTHLY' | 'YEARLY') {
    const company = {
      name: companyName,
      plan: 'PRO',
      billingCycle: cycle,
      departments: ["General", "R&D", "Marketing", "HR"],
      createdAt: new Date().toISOString()
    };
    const compRef = await addDoc(collection(db, "companies"), company);
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role: UserRole.COMPANY_ADMIN,
      companyId: compRef.id,
      permissions: {
        canSeeAnalytics: true,
        canManageBilling: true,
        departments: company.departments
      }
    });
    return { id: compRef.id, ...company };
  },

  async getCompany(id: string): Promise<Company | null> {
    const snap = await getDoc(doc(db, "companies", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Company : null;
  },

  async getTeams(companyId: string): Promise<Team[]> {
    const q = query(collection(db, "teams"), where("companyId", "==", companyId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  },

  async addTeam(companyId: string, name: string) {
    const team = { companyId, name, memberIds: [] };
    const docRef = await addDoc(collection(db, "teams"), team);
    return { id: docRef.id, ...team };
  },

  // --- SEEDING ---
  async seedData() {
    const ideasCol = collection(db, "ideas");
    const ideasSnapshot = await getDocs(ideasCol);
    if (!ideasSnapshot.empty) return;
    const seedUsers = [
      {
        id: 'seed_u1',
        name: 'EcoScientist',
        email: 'eco@pandora.network',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eco',
        role: UserRole.INDIVIDUAL
      },
      {
        id: 'seed_u2',
        name: 'NanotechLabs',
        email: 'nano@pandora.network',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nano',
        role: UserRole.INDIVIDUAL
      }
    ];
    for (const u of seedUsers) {
      await setDoc(doc(db, "users", u.id), u);
    }
    const seedIdeas = [
      { 
        type: IdeaType.PROBLEM, 
        title: 'Microplastic Infiltration in Tap Water', 
        description: 'Standard water treatment facilities are currently unable to filter out microplastics smaller than 5 micrometers.', 
        author: 'EcoScientist', 
        authorId: 'seed_u1',
        votes: 342, 
        views: 1205, 
        tags: ['environment', 'health', 'water'], 
        status: 'ACTIVE' as IdeaStatus, 
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        contributorIds: []
      }
    ];
    for (const idea of seedIdeas) {
      await addDoc(collection(db, "ideas"), idea);
    }
  },

  // --- IDEA METHODS ---
  async getIdeas(sortBy: SortOption = 'RECENT', userId?: string): Promise<Idea[]> {
    const ideasCol = collection(db, "ideas");
    let orderByField = "createdAt";
    if (sortBy === 'VOTES') orderByField = "votes";
    if (sortBy === 'VIEWS') orderByField = "views";
    const q = query(ideasCol, orderBy(orderByField, "desc"));
    const snapshot = await getDocs(q);
    const allIdeas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
    let userObj: User | null = null;
    if (userId) {
      const snap = await getDoc(doc(db, "users", userId));
      userObj = snap.exists() ? { id: snap.id, ...snap.data() } as User : null;
    }
    return allIdeas.filter(idea => {
      const isDraft = idea.status === 'DRAFT';
      const isCompanyIdea = !!idea.companyId;
      if (isDraft) {
        return idea.authorId === userId || (idea.contributorIds as string[] | undefined)?.includes(userId || '');
      }
      if (isCompanyIdea) {
        if (idea.isPublicCompanyIdea) return true;
        if (!userObj || userObj.companyId !== idea.companyId) return false;
        if (userObj.permissions?.departments && idea.department) {
          return userObj.permissions.departments.includes(idea.department);
        }
        return true;
      }
      return true;
    });
  },

  async getIdea(id: string): Promise<Idea | undefined> {
    const docRef = doc(db, "ideas", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Idea : undefined;
  },

  async createIdea(ideaData: Omit<Idea, 'id' | 'createdAt' | 'votes' | 'views' | 'status'>): Promise<Idea> {
    const newIdea = {
      ...ideaData,
      createdAt: new Date().toISOString(),
      votes: 0,
      views: 0,
      status: 'DRAFT' as IdeaStatus,
      contributorIds: []
    };
    const docRef = await addDoc(collection(db, "ideas"), newIdea);
    return { id: docRef.id, ...newIdea };
  },

  async publishIdea(id: string) {
    await updateDoc(doc(db, "ideas", id), { status: 'ACTIVE' });
  },

  async addContributor(ideaId: string, ideaTitle: string, fromUserName: string, targetUserId: string) {
    await updateDoc(doc(db, "ideas", ideaId), {
      contributorIds: arrayUnion(targetUserId)
    });
    await addDoc(collection(db, "notifications"), {
      userId: targetUserId,
      type: 'CONTRIBUTOR_ADDED',
      ideaId,
      ideaTitle,
      fromUserName,
      read: false,
      createdAt: new Date().toISOString()
    });
  },

  async incrementView(id: string, ideaAuthor: string, userId?: string) {
    const docRef = doc(db, "ideas", id);
    await updateDoc(docRef, { views: increment(1) });
    await this.logInteraction(InteractionType.VIEW, id, ideaAuthor, userId);
  },

  async getIdeasByUser(username: string): Promise<Idea[]> {
    // FIX: sort locally
    const ideasCol = collection(db, "ideas");
    const q = query(ideasCol, where("author", "==", username));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Idea))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async echoIdea(id: string, ideaAuthor: string, userId?: string): Promise<Idea | undefined> {
    const docRef = doc(db, "ideas", id);
    await updateDoc(docRef, { votes: increment(1) });
    await this.logInteraction(InteractionType.ECHO, id, ideaAuthor, userId);
    return await this.getIdea(id);
  },

  // --- SOCIAL ---
  async getComments(ideaId: string): Promise<Comment[]> {
    // FIX: sort locally to avoid index req
    const commentsCol = collection(db, "comments");
    const q = query(commentsCol, where("ideaId", "==", ideaId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Comment))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addComment(ideaId: string, author: string, text: string, ideaAuthor: string, userId?: string): Promise<Comment> {
    const comment = { ideaId, author, text, createdAt: new Date().toISOString(), reactions: {} };
    const docRef = await addDoc(collection(db, "comments"), comment);
    await this.logInteraction(InteractionType.COMMENT, ideaId, ideaAuthor, userId);
    return { id: docRef.id, ...comment };
  },

  async reactToComment(commentId: string, emoji: string, userId: string, isRemoving: boolean): Promise<void> {
    const docRef = doc(db, "comments", commentId);
    const fieldPath = `reactions.${emoji}`;
    await updateDoc(docRef, {
      [fieldPath]: isRemoving ? arrayRemove(userId) : arrayUnion(userId)
    });
  },

  async getConnections(ideaId: string): Promise<{ relatedIdea: Idea, edge: Edge }[]> {
    const edgesCol = collection(db, "edges");
    const qFrom = query(edgesCol, where("fromId", "==", ideaId));
    const qTo = query(edgesCol, where("toId", "==", ideaId));
    const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
    const allEdges = [...snapFrom.docs, ...snapTo.docs].map(d => ({ id: d.id, ...d.data() } as Edge));
    const connections = await Promise.all(allEdges.map(async (edge) => {
      const targetId = edge.fromId === ideaId ? edge.toId : edge.fromId;
      const relatedIdea = await this.getIdea(targetId);
      return relatedIdea ? { relatedIdea, edge } : null;
    }));
    return connections.filter(Boolean) as any;
  },

  async toggleFavorite(userId: string, ideaId: string, ideaAuthor: string): Promise<boolean> {
    const favId = `${userId}_${ideaId}`;
    const favRef = doc(db, "favorites", favId);
    const favSnap = await getDoc(favRef);
    if (favSnap.exists()) { 
      await deleteDoc(favRef); 
      return false; 
    }
    await setDoc(favRef, { userId, ideaId, createdAt: Timestamp.now() });
    await this.logInteraction(InteractionType.FAVORITE, ideaId, ideaAuthor, userId);
    return true;
  },

  async isFavorite(userId: string, ideaId: string): Promise<boolean> {
    const favId = `${userId}_${ideaId}`;
    const favRef = doc(db, "favorites", favId);
    const favSnap = await getDoc(favRef);
    return favSnap.exists();
  },

  async getFavorites(userId: string): Promise<Idea[]> {
    const favsCol = collection(db, "favorites");
    const q = query(favsCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const ideaIds = snapshot.docs.map(doc => doc.data().ideaId);
    const ideas = await Promise.all(ideaIds.map(id => this.getIdea(id)));
    return ideas.filter(Boolean) as Idea[];
  },

  async updateAnalysis(id: string, analysis: any): Promise<void> {
    const docRef = doc(db, "ideas", id);
    await updateDoc(docRef, { aiAnalysis: analysis, status: 'IN_FORGE' });
  },

  async getContributions(ideaId: string): Promise<Contribution[]> {
    const contribsCol = collection(db, "contributions");
    const q = query(contribsCol, where("ideaId", "==", ideaId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Contribution))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getContributionsByUser(username: string): Promise<Contribution[]> {
    const contribsCol = collection(db, "contributions");
    const q = query(contribsCol, where("author", "==", username));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Contribution))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addContribution(ideaId: string, contribution: Omit<Contribution, 'id' | 'createdAt'>): Promise<Contribution> {
    const newContrib = { ...contribution, ideaId, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, "contributions"), newContrib);
    return { id: docRef.id, ...newContrib };
  }
};