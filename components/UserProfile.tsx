
import React, { useEffect, useState } from 'react';
import { Idea, Contribution, User, UserProgress, InteractionType, AnalyticsEvent, UserSettings, Language, UserRole } from '../types';
import { backend } from '../services/backend';
import { IdeaCard } from './IdeaCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
// Fix: Added missing ChevronRight and ensured all used icons are imported from lucide-react.
import { 
  User as UserIcon, Award, FileText, Lightbulb, TrendingUp, ArrowLeft, 
  ExternalLink, Video, Music, ShoppingBag, Edit2, Check, Globe, 
  Camera, Upload, Save, Trophy, Loader2, BarChart2, PieChart,
  Eye, MessageCircle, Heart, Settings, ShieldCheck, LogOut, Languages, Building2, Zap,
  ChevronRight
} from 'lucide-react';

interface UserProfileProps {
  username: string;
  onBack: () => void;
  onIdeaClick: (idea: Idea) => void;
  onNavigateToUser: (username: string) => void;
  onNavigateToPro?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ username, onBack, onIdeaClick, onNavigateToUser, onNavigateToPro }) => {
  const { t, language: currentLang, setLanguage } = useLanguage();
  const { user: currentUser, logout } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'settings'>('content');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsEvent[]>([]);
  
  const [userSettings, setUserSettings] = useState<UserSettings>({ emailNotificationsEnabled: true });
  const [settingsStatus, setSettingsStatus] = useState('');

  const [editData, setEditData] = useState({
    bio: '',
    website: '',
    avatar: '',
    coverImage: '',
    preferredLanguage: 'pt' as Language
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadUserContent();
  }, [username]);

  const loadUserContent = async () => {
    setLoading(true);
    const u = await backend.getUserByUsername(username);
    if (u) {
      setProfileUser(u);
      setEditData({
        bio: u.bio || '',
        website: u.website || '',
        avatar: u.avatar || '',
        coverImage: u.coverImage || '',
        preferredLanguage: u.preferredLanguage || 'pt'
      });
      
      const [userIdeas, userContribs] = await Promise.all([
        backend.getIdeasByUser(username),
        backend.getContributionsByUser(username)
      ]);
      setIdeas(userIdeas);
      setContributions(userContribs);

      if (currentUser && currentUser.id === u.id) {
        const [prog, analytics, settings] = await Promise.all([
          backend.getProgress(u.id, u.name),
          backend.getAnalyticsForUser(u.name),
          backend.getUserSettings(u.id)
        ]);
        setProgress(prog);
        setAnalyticsData(analytics);
        setUserSettings(settings);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profileUser) return;
    setSaving(true);
    try {
      await backend.updateUserProfile(profileUser.id, editData);
      setProfileUser({ ...profileUser, ...editData });
      if (currentUser?.id === profileUser.id) {
        setLanguage(editData.preferredLanguage);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!profileUser) return;
    setSaving(true);
    await backend.updateUserSettings(profileUser.id, userSettings);
    setSaving(false);
    setSettingsStatus(t.settingsSaved);
    setTimeout(() => setSettingsStatus(''), 3000);
  };

  const handleLogout = () => {
    logout();
    onBack();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;
    
    setSaving(true);
    try {
      const path = `users/${profileUser.id}/${type}_${Date.now()}`;
      const url = await backend.uploadFile(path, file);
      setEditData({ ...editData, [type]: url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setSaving(false);
    }
  };

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;
  const totalEchoes = ideas.reduce((acc, curr) => acc + curr.votes, 0);
  const totalViews = ideas.reduce((acc, curr) => acc + (curr.views || 0), 0);

  const prepareChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayEvents = analyticsData.filter(e => e.timestamp.startsWith(date));
      return {
        date,
        views: dayEvents.filter(e => e.type === InteractionType.VIEW).length,
        interactions: dayEvents.filter(e => e.type !== InteractionType.VIEW).length
      };
    });
  };

  const prepareInteractionBreakdown = () => {
    return [
      { name: t.echoes, value: analyticsData.filter(e => e.type === InteractionType.ECHO).length },
      { name: t.discussionTab.split(' ')[0], value: analyticsData.filter(e => e.type === InteractionType.COMMENT).length },
      { name: t.favorites, value: analyticsData.filter(e => e.type === InteractionType.FAVORITE).length }
    ];
  };

  if (loading && !profileUser) {
    return (
      <div className="py-24 md:py-32 flex flex-col items-center justify-center text-slate-500 animate-pulse px-4 text-center">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-sm font-medium">Consulting the Network for @{username}...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-24 md:py-32 text-center text-slate-500 flex flex-col items-center px-4">
        <div className="bg-slate-800 p-6 rounded-full mb-6 text-slate-600">
           <UserIcon className="w-12 h-12 md:w-16 h-16" />
        </div>
        <p className="text-xl font-bold text-white mb-2">User not found</p>
        <p className="text-sm">This persona does not exist in this reality.</p>
        <button onClick={onBack} className="mt-8 text-purple-400 font-bold hover:underline">Return to Feed</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in px-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">{t.backToFeed}</span>
        </button>
        {isOwnProfile && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-rose-400 hover:text-rose-300 font-bold text-sm uppercase tracking-widest transition-all"
          >
            <LogOut size={18} />
            <span>{t.signOut}</span>
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-[24px] md:rounded-[32px] border border-slate-700 mb-8 overflow-hidden relative shadow-2xl">
        <div className="h-40 md:h-64 w-full relative bg-slate-900">
          {(editData.coverImage || profileUser.coverImage) ? (
            <img 
                src={editData.coverImage || profileUser.coverImage} 
                className="w-full h-full object-cover opacity-60 transition-opacity duration-500" 
                alt="Profile Cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900"></div>
          )}
          
          {isEditing && (
            <label className="absolute bottom-4 right-4 bg-slate-950/80 p-2.5 rounded-full cursor-pointer hover:bg-slate-900 transition-colors border border-slate-700 shadow-xl">
               <Camera size={18} className="text-white" />
               <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'coverImage')} />
            </label>
          )}
        </div>

        <div className="px-6 md:px-12 pb-8 md:pb-10 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 -mt-12 md:-mt-20 mb-6 md:mb-8">
            <div className="relative group">
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-600 p-1 shadow-2xl relative z-10">
                    <div className="w-full h-full bg-slate-900 rounded-[14px] md:rounded-[22px] flex items-center justify-center overflow-hidden">
                        {(editData.avatar || profileUser.avatar) ? (
                            <img src={editData.avatar || profileUser.avatar} className="w-full h-full object-cover" alt={profileUser.name} />
                        ) : (
                            <UserIcon className="text-slate-600 w-8 h-8 md:w-14 md:h-14" />
                        )}
                    </div>
                </div>
                {isEditing && (
                    <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-2xl md:rounded-3xl cursor-pointer">
                        <Upload className="text-white w-6 h-6 md:w-8 md:h-8" />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
                    </label>
                )}
            </div>

            <div className="flex-grow flex flex-col md:flex-row items-center md:items-center justify-between gap-4 w-full">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                        @{profileUser.name}
                        {totalEchoes > 500 && <Trophy size={18} className="text-amber-400" />}
                    </h1>
                </div>
                
                <div className="flex items-center justify-center gap-3 w-full md:w-auto">
                    {isOwnProfile && (
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={saving}
                            className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${isEditing ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-white text-slate-950'}`}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                            <span className="text-sm">{isEditing ? t.saveProfile : t.editProfile}</span>
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {isEditing ? (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bio</label>
                            <textarea 
                                value={editData.bio} 
                                onChange={e => setEditData({...editData, bio: e.target.value})} 
                                placeholder={t.bioPlaceholder}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 resize-none h-24 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t.preferredLanguage}</label>
                            <div className="relative">
                              <Languages size={14} className="absolute left-3 top-3 text-slate-500" />
                              <select 
                                value={editData.preferredLanguage}
                                onChange={e => setEditData({...editData, preferredLanguage: e.target.value as Language})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                              >
                                <option value="en">{t.en}</option>
                                <option value="pt">{t.pt}</option>
                                <option value="es">{t.es}</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Website</label>
                            <input 
                              type="text"
                              value={editData.website}
                              onChange={e => setEditData({...editData, website: e.target.value})}
                              placeholder={t.websitePlaceholder}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-base md:text-lg leading-relaxed text-center md:text-left">
                            {profileUser.bio || "This creative mind is still composing their introduction to the Pandora network."}
                        </p>
                        {profileUser.website && (
                          <div className="flex justify-center md:justify-start">
                            <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1.5 transition-colors">
                              <ExternalLink size={14} />
                              {profileUser.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {/* Organization CTA for Individuals */}
                {isOwnProfile && profileUser.role === UserRole.INDIVIDUAL && (
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group/org" onClick={onNavigateToPro}>
                    <div className="flex items-center gap-3 mb-3">
                       <Building2 className="text-amber-500" size={20} />
                       <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{t.upgradeToOrg}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{t.upgradeToOrgDesc}</p>
                    <div className="flex items-center gap-2 text-white font-bold text-xs group-hover/org:translate-x-1 transition-transform">
                      {t.getPro} <ChevronRight size={14} />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center md:items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.echoes}</span>
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-purple-400" />
                            <span className="text-xl font-bold text-white">{totalEchoes}</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center md:items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.views}</span>
                        <div className="flex items-center gap-2">
                            <Lightbulb size={16} className="text-cyan-400" />
                            <span className="text-xl font-bold text-white">{totalViews}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 md:gap-8 border-b border-slate-800 mb-8 px-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button 
          onClick={() => setActiveTab('content')}
          className={`pb-4 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'content' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
        >
          {t.myIdeasTab}
          {activeTab === 'content' && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-t-full"></div>}
        </button>
        {isOwnProfile && (
          <>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'analytics' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <BarChart2 size={16} />
              {t.analyticsTab}
              {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-400 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-4 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Settings size={16} />
              {t.settings}
              {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400 rounded-t-full"></div>}
            </button>
          </>
        )}
      </div>

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 animate-fade-in">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <Award className="text-purple-400 w-5 h-5 md:w-6 md:h-6" /> 
              {t.ideasLabel}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {ideas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onClick={onIdeaClick} onUserClick={onNavigateToUser} />
              ))}
              {ideas.length === 0 && <p className="text-slate-500 italic py-10 text-sm text-center col-span-full">{t.noIdeas}</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && isOwnProfile && (
        <div className="max-w-2xl animate-fade-in space-y-8">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl">
             <div className="flex items-center gap-3 mb-8">
               <ShieldCheck className="text-emerald-400" size={24} />
               <h3 className="text-xl font-bold text-white">{t.settings}</h3>
             </div>
             
             <div className="space-y-6">
               <div className="flex items-start justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                 <div className="space-y-1">
                   <h4 className="font-bold text-white">{t.emailNotifications}</h4>
                   <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{t.emailNotificationsDesc}</p>
                 </div>
                 <button 
                  onClick={() => setUserSettings({...userSettings, emailNotificationsEnabled: !userSettings.emailNotificationsEnabled})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${userSettings.emailNotificationsEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userSettings.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>

               <div className="pt-4 flex items-center gap-4">
                 <button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                 >
                   {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {t.saveSettings}
                 </button>
                 {settingsStatus && (
                   <span className="text-sm text-emerald-400 font-bold animate-fade-in flex items-center gap-2">
                     <Check size={16} /> {settingsStatus}
                   </span>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && isOwnProfile && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
               <h3 className="text-base md:text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <TrendingUp size={18} className="text-cyan-400" /> {t.reachVsEngagement}
               </h3>
               <div className="h-[250px] md:h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={prepareChartData()}>
                     <defs>
                       <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorInter" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 8}} tickFormatter={(val) => val.split('-').slice(2).join('')} />
                     <YAxis stroke="#64748b" tick={{fontSize: 8}} />
                     <RechartsTooltip 
                       contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px'}}
                       labelStyle={{color: '#94a3b8'}}
                     />
                     <Area name={t.views} type="monotone" dataKey="views" stroke="#22d3ee" fillOpacity={1} fill="url(#colorViews)" />
                     <Area name={t.interactions} type="monotone" dataKey="interactions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorInter)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
               <h3 className="text-base md:text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <PieChart size={18} className="text-purple-400" /> {t.interactionBreakdown}
               </h3>
               <div className="h-[250px] md:h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={prepareInteractionBreakdown()}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 8}} />
                     <YAxis stroke="#64748b" tick={{fontSize: 8}} />
                     <RechartsTooltip 
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                       contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px'}}
                     />
                     <Bar name={t.interactions} dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
