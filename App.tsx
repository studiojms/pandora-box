import React, { useState, useEffect } from 'react';
import {
  Idea,
  ViewState,
  IdeaType,
  Language,
  SortOption,
  UserProgress,
  Notification,
  UserRole,
  RelationType,
} from './types';
import { IdeaCard } from './components/IdeaCard';
import { IdeaDetail } from './components/IdeaDetail';
import { CreateIdeaModal } from './components/CreateIdeaModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { ProPlanPage } from './components/ProPlanPage';
import { CompanyDashboard } from './components/CompanyDashboard';
import { backend } from './services/backend';
import {
  Box,
  Plus,
  Search,
  Layers,
  Globe,
  Heart,
  LogOut,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Trophy,
  CloudOff,
  RefreshCw,
  Bell,
  User as UserIcon,
  Zap,
  LayoutDashboard,
  Languages,
  Building2,
  Rocket,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}

function PandoraBoxApp() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, openAuthModal, isAuthModalOpen } = useAuth();
  const isOnline = useOnlineStatus();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [favorites, setFavorites] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ type: 'FEED' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [relatedToIdea, setRelatedToIdea] = useState<Idea | null>(null);
  const [filter, setFilter] = useState<'ALL' | IdeaType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('RECENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    loadIdeas();
    if (user) {
      backend.getProgress(user.id, user.name).then(setProgress);
      const unsub = backend.getNotifications(user.id, setNotifications);
      return () => {
        unsub.then((f) => f && typeof f === 'function' && f());
      };
    } else {
      setProgress(null);
      setNotifications([]);
    }
  }, [user, sortBy, view]);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      let data = await backend.getIdeas(sortBy, user?.id);
      if (data.length === 0 && !searchTerm) {
        await backend.seedData();
        data = await backend.getIdeas(sortBy, user?.id);
      }
      setIdeas(data);
      if (user) {
        const favs = await backend.getFavorites(user.id);
        setFavorites(favs);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Data load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaClick = async (idea: Idea) => {
    await backend.incrementView(idea.id, idea.author, user?.id);
    setView({ type: 'IDEA_DETAIL', ideaId: idea.id });
  };

  const handleNavigateToUser = (username: string) => {
    setView({ type: 'PROFILE', username });
    setShowNotifs(false);
  };

  const handleCreateRequest = (parentIdea?: Idea) => {
    if (!user) {
      openAuthModal();
    } else {
      setRelatedToIdea(parentIdea || null);
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateSubmit = async (newIdeaData: any) => {
    const created = await backend.createIdea({ ...newIdeaData, authorId: user?.id || '' });

    // If there is a parent idea, create a connection (Edge)
    if (relatedToIdea) {
      const relType: RelationType = relatedToIdea.type === IdeaType.PROBLEM ? 'RESOLVES' : 'RELATES_TO';
      await backend.createEdge(created.id, relatedToIdea.id, relType);
    }

    setIdeas([created, ...ideas]);
    setIsCreateModalOpen(false);
    setRelatedToIdea(null);
    if (user) backend.getProgress(user.id, user.name).then(setProgress);
    setView({ type: 'IDEA_DETAIL', ideaId: created.id });
  };

  const handleUpdateIdea = (updated: Idea) => {
    setIdeas(ideas.map((i) => (i.id === updated.id ? updated : i)));
    if (user) backend.getFavorites(user.id).then(setFavorites);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredIdeas = (view.type === 'FAVORITES' ? favorites : ideas).filter((idea) => {
    const matchesFilter = filter === 'ALL' || idea.type === filter;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      idea.title.toLowerCase().includes(lowerSearch) ||
      idea.description.toLowerCase().includes(lowerSearch) ||
      idea.author.toLowerCase().includes(lowerSearch) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(lowerSearch));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <nav className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div
            onClick={() => setView({ type: 'FEED' })}
            className="flex items-center space-x-2 md:space-x-3 cursor-pointer group"
          >
            <div className="bg-purple-600 p-1.5 md:p-2.5 rounded-lg md:rounded-xl group-hover:bg-purple-500 transition-colors shadow-lg">
              <Box className="text-white w-5 h-5 md:w-[26px] md:h-[26px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">{t.appName}</span>
              <span className="text-[8px] md:text-[10px] text-slate-400 tracking-widest uppercase mt-1 hidden xs:block">
                The Idea Network
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {(user?.role === UserRole.INDIVIDUAL || !user) && (
              <button
                onClick={() => setView({ type: 'PRO_PLAN' })}
                className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-amber-400 font-bold text-xs uppercase tracking-widest transition-colors mr-2 px-3 py-1.5"
              >
                <Building2 size={16} />
                {t.forTeams}
              </button>
            )}

            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                <Languages size={18} />
                <span className="text-xs font-bold uppercase">{language}</span>
              </button>
              <div className="absolute right-0 top-full pt-2 hidden group-hover:block animate-fade-in z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl min-w-[120px]">
                  {(['en', 'pt', 'es'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-800 transition-colors ${language === l ? 'text-purple-400' : 'text-slate-400'}`}
                    >
                      {t[l]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {user?.role === UserRole.COMPANY_ADMIN && (
              <button
                onClick={() => setView({ type: 'COMPANY_DASHBOARD' })}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold hover:bg-cyan-500/20 transition-all"
              >
                <LayoutDashboard size={14} />
                {t.companyDashboard}
              </button>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`p-2 rounded-full transition-all relative ${showNotifs ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0f172a]"></span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                      <h3 className="font-bold text-sm">{t.notifications}</h3>
                      <button
                        onClick={() => backend.markAllNotificationsRead(user.id)}
                        className="text-[10px] font-bold text-purple-400 hover:underline"
                      >
                        {t.markAllRead}
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 && (
                        <p className="p-8 text-center text-slate-500 text-xs italic">{t.noNotifications}</p>
                      )}
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            backend.markNotificationRead(n.id);
                            setView({ type: 'IDEA_DETAIL', ideaId: n.ideaId });
                            setShowNotifs(false);
                          }}
                          className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-purple-900/5' : ''}`}
                        >
                          <p className="text-xs text-slate-300 leading-snug">
                            <span className="font-bold text-white">@{n.fromUserName}</span> {t.notifContributorAdded}{' '}
                            <span className="font-bold text-purple-400">"{n.ideaTitle}"</span>
                          </p>
                          <span className="text-[10px] text-slate-600 mt-2 block">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (!user) openAuthModal();
                else setView({ type: 'FAVORITES' });
              }}
              className={`p-2 rounded-full transition-all ${view.type === 'FAVORITES' ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white'}`}
              title={t.favorites}
            >
              <Heart size={20} fill={view.type === 'FAVORITES' ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => handleCreateRequest()}
              className="bg-white text-slate-950 hover:bg-slate-200 p-2 md:px-5 md:py-2.5 rounded-full text-sm font-bold transition-all flex items-center space-x-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{t.contribute}</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-2 md:space-x-3 pl-2 border-l border-slate-800">
                <button onClick={() => handleNavigateToUser(user.name)}>
                  <img
                    src={user.avatar}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-purple-500 hover:scale-110 transition-transform"
                    alt={user.name}
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="text-slate-200 hover:text-white font-bold text-sm px-3 md:px-4"
              >
                {t.signIn}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 pt-6 md:pt-10 pb-20 max-w-7xl">
        {(view.type === 'FEED' || view.type === 'FAVORITES') && (
          <div className="space-y-8 md:space-y-12 animate-fade-in">
            <div className="text-center py-6 md:py-12 space-y-4 md:space-y-6">
              <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-cyan-400 tracking-tight leading-tight">
                {view.type === 'FAVORITES' ? t.favorites : t.tagline}
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-xl leading-relaxed px-4">
                {view.type === 'FAVORITES' ? '' : t.subTagline}
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 md:mt-10">
                <div className="relative w-full max-w-xl group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-cyan-500 rounded-2xl opacity-20 group-focus-within:opacity-50 blur transition duration-500"></div>
                  <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl">
                    <Search className="absolute left-4 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent py-3 md:py-4 pl-11 md:pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none text-base md:text-lg rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl w-full md:w-auto overflow-hidden">
                  <ArrowUpDown size={16} className="text-slate-500 ml-2 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs md:text-sm text-slate-300 font-bold focus:outline-none cursor-pointer hover:text-white pr-4 appearance-none w-full md:w-auto"
                  >
                    <option value="RECENT">{t.sortRecent}</option>
                    <option value="VOTES">{t.sortVotes}</option>
                    <option value="VIEWS">{t.sortViews}</option>
                  </select>
                </div>
              </div>
            </div>

            {view.type === 'FEED' && (user?.role === UserRole.INDIVIDUAL || !user) && (
              <div className="relative group mx-auto max-w-6xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-amber-500 to-cyan-500 rounded-[32px] opacity-10 blur-xl group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative bg-slate-900 border border-slate-800 rounded-[32px] p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center gap-8">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-5">
                    <Rocket size={320} />
                  </div>
                  <div className="flex-1 relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/30 uppercase tracking-widest">
                        Enterprise Innovation
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                      {t.teamsLandingHero}
                    </h2>
                    <p className="text-slate-400 text-sm md:text-lg max-w-xl leading-relaxed">{t.teamsLandingSub}</p>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <button
                      onClick={() => setView({ type: 'PRO_PLAN' })}
                      className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold text-sm md:text-base hover:scale-105 transition-transform shadow-2xl flex items-center gap-2"
                    >
                      <Rocket size={18} />
                      {t.getPro}
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Unlock Private Workspaces
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onClick={handleIdeaClick} onUserClick={handleNavigateToUser} />
              ))}
              {filteredIdeas.length === 0 && !loading && (
                <div className="col-span-full text-center py-16 md:py-24 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl mx-4">
                  <Layers size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg md:text-xl font-medium">
                    {view.type === 'FAVORITES' ? t.noFavorites : t.noIdeas}
                  </p>
                </div>
              )}
              {loading && (
                <div className="col-span-full text-center py-12 text-slate-500 animate-pulse">
                  Consulting the Oracle...
                </div>
              )}
            </div>
          </div>
        )}

        {view.type === 'IDEA_DETAIL' && (
          <IdeaDetail
            idea={ideas.find((i) => i.id === view.ideaId)!}
            onBack={() => setView({ type: 'FEED' })}
            onUpdateIdea={handleUpdateIdea}
            onNavigateTo={handleIdeaClick}
            onUserClick={handleNavigateToUser}
            onRelateRequest={handleCreateRequest}
          />
        )}

        {view.type === 'PROFILE' && (
          <UserProfile
            username={view.username}
            onBack={() => setView({ type: 'FEED' })}
            onIdeaClick={handleIdeaClick}
            onNavigateToUser={handleNavigateToUser}
            onNavigateToPro={() => setView({ type: 'PRO_PLAN' })}
          />
        )}

        {view.type === 'PRO_PLAN' && <ProPlanPage onBack={() => setView({ type: 'FEED' })} />}

        {view.type === 'COMPANY_DASHBOARD' && (
          <CompanyDashboard onBack={() => setView({ type: 'FEED' })} onIdeaClick={handleIdeaClick} />
        )}
      </main>

      {isCreateModalOpen && (
        <CreateIdeaModal
          onClose={() => {
            setIsCreateModalOpen(false);
            setRelatedToIdea(null);
          }}
          onSubmit={handleCreateSubmit}
          parentIdea={relatedToIdea}
        />
      )}
      {isAuthModalOpen && <AuthModal />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PandoraBoxApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
