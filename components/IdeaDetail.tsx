
import React, { useState, useEffect } from 'react';
import { Idea, IdeaType, BusinessAnalysis, Edge, Comment as IdeaComment, Contribution, IdeaMedia } from '../types';
import { BusinessAnalyzer } from './BusinessAnalyzer';
import { backend } from '../services/backend';
import { findBrainstormConnections } from '../services/geminiService';
import { 
  ArrowLeft, Sparkles, Activity, ArrowRight, GitMerge, Copy, Check, Smile, Globe, 
  Lock, Users, UserPlus, Loader2, Play, ChevronLeft, ChevronRight, Video, Image as ImageIcon, ExternalLink, Send, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface IdeaDetailProps {
  idea: Idea;
  onBack: () => void;
  onUpdateIdea: (updatedIdea: Idea) => void;
  onNavigateTo: (idea: Idea) => void;
  onUserClick?: (username: string) => void;
}

const EMOJI_OPTIONS = ['💡', '❤️', '🚀', '👏', '🔥'];

export const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea, onBack, onUpdateIdea, onNavigateTo, onUserClick }) => {
  const { t, language } = useLanguage();
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'discussion' | 'contributions'>('overview');
  const [connections, setConnections] = useState<{ relatedIdea: Idea, edge: Edge }[]>([]);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [newComment, setNewComment] = useState('');
  const [openEmojiPickerId, setOpenEmojiPickerId] = useState<string | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [contributorSearch, setContributorSearch] = useState('');
  const [addingContributor, setAddingContributor] = useState(false);
  const [contributorError, setContributorError] = useState('');

  useEffect(() => {
    if (!idea) return;
    window.scrollTo(0, 0);
    backend.getConnections(idea.id).then(setConnections);
    backend.getComments(idea.id).then(setComments);
    if (user) {
      backend.isFavorite(user.id, idea.id).then(setIsFav);
    } else {
      setIsFav(false);
    }
  }, [idea.id, user]);

  if (!idea) return null;

  const isOwner = user && idea.authorId === user.id;
  const isDraft = idea.status === 'DRAFT';

  const handlePublish = async () => {
    if (!isOwner) return;
    setPublishing(true);
    await backend.publishIdea(idea.id);
    onUpdateIdea({ ...idea, status: 'ACTIVE' });
    setPublishing(false);
  };

  const handleAddContributor = async () => {
    if (!contributorSearch.trim() || !user) return;
    setAddingContributor(true);
    setContributorError('');
    try {
      const cleanUsername = contributorSearch.replace('@', '').trim();
      const targetUser = await backend.getUserByUsername(cleanUsername);
      if (!targetUser) {
        setContributorError('User not found');
      } 
      // Fix: Explicitly cast contributorIds to string[] to avoid 'unknown' type errors for .length and .includes (Lines 357, 358 in user reporter's count).
      else if ((Array.isArray(idea.contributorIds) && (idea.contributorIds as string[]).length >= 0 && (idea.contributorIds as string[]).includes(targetUser.id)) || targetUser.id === idea.authorId) {
        setContributorError('User already a member');
      } else {
        await backend.addContributor(idea.id, idea.title, user.name, targetUser.id);
        onUpdateIdea({ ...idea, contributorIds: [...((idea.contributorIds as string[]) || []), targetUser.id] });
        setContributorSearch('');
      }
    } catch (err) {
      setContributorError('Failed to add');
    } finally {
      setAddingContributor(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/idea/${idea.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBrainstorm = async () => {
    setLoadingSuggestions(true);
    const suggestions = await findBrainstormConnections(idea, language);
    setAiSuggestions(suggestions);
    setLoadingSuggestions(false);
  };

  const handleAnalysisComplete = (analysis: BusinessAnalysis) => {
    const updated = { ...idea, aiAnalysis: analysis, status: 'IN_FORGE' as const };
    backend.updateAnalysis(idea.id, analysis);
    onUpdateIdea(updated);
  };

  const handleEcho = async () => {
    if (!user) { openAuthModal(); return; }
    const updated = await backend.echoIdea(idea.id, idea.author, user.id);
    if (updated) onUpdateIdea(updated);
  };

  const handlePostComment = async () => {
    if (!user) { openAuthModal(); return; }
    if (!newComment.trim()) return;
    const comment = await backend.addComment(idea.id, user.name, newComment, idea.author, user.id);
    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleReactToComment = async (commentId: string, emoji: string) => {
    if (!user) { openAuthModal(); return; }
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const reactions = comment.reactions || {};
    const userList = reactions[emoji] || [];
    const isRemoving = userList.includes(user.id);
    const updatedComments = comments.map(c => {
        if (c.id === commentId) {
            const newReactions = { ...reactions };
            if (isRemoving) newReactions[emoji] = userList.filter(id => id !== user.id);
            else newReactions[emoji] = [...userList, user.id];
            return { ...c, reactions: newReactions };
        }
        return c;
    });
    setComments(updatedComments);
    setOpenEmojiPickerId(null);
    await backend.reactToComment(commentId, emoji, user.id, isRemoving);
  };

  const isProblem = idea.type === IdeaType.PROBLEM;
  const borderColor = isProblem ? 'border-rose-500' : 'border-cyan-500';

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">{t.backToFeed}</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && isDraft && (
            <button 
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
              <span>{t.publishAction}</span>
            </button>
          )}
          <button onClick={handleShare} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-all">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span className="font-bold text-xs">{copied ? t.copied : t.share}</span>
          </button>
        </div>
      </div>

      {isDraft && (
        <div className="mb-6 bg-amber-950/20 border border-amber-900/50 p-4 rounded-2xl flex items-center gap-3 text-amber-400">
           <Lock size={20} className="flex-shrink-0" />
           <p className="text-sm font-medium">{t.draftMessage}</p>
        </div>
      )}

      <div className={`relative overflow-hidden rounded-3xl bg-slate-800/80 backdrop-blur border-l-4 md:border-l-8 ${borderColor} p-6 md:p-12 mb-8 shadow-2xl`}>
        <div className="flex items-center space-x-3 mb-4 md:mb-6">
            <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${isProblem ? 'bg-rose-950 text-rose-400 border border-rose-900' : 'bg-cyan-950 text-cyan-400 border border-cyan-900'}`}>
                {isProblem ? t.problems : t.solutions}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              <span className="text-slate-400">Views:</span> {idea.views || 0}
            </div>
            <span className="text-slate-500 text-sm">•</span>
            <span className="text-slate-400 text-xs md:text-sm">{new Date(idea.createdAt).toLocaleDateString()}</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight max-w-3xl">{idea.title}</h1>
        <p className="text-base md:text-xl text-slate-300 leading-relaxed mb-6 md:mb-8 max-w-3xl border-l-2 border-slate-600 pl-4 md:pl-6">{idea.description}</p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm text-slate-400 w-full">
            <button 
              onClick={() => onUserClick && onUserClick(idea.author)}
              className="flex items-center space-x-3 group/profile"
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow-lg group-hover/profile:scale-110 transition-transform ${isProblem ? 'bg-rose-400' : 'bg-cyan-400'}`}>
                    {idea.author.substring(0,1).toUpperCase()}
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-200 group-hover/profile:text-purple-400">@{idea.author}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-50">View Profile</span>
                </div>
            </button>
            
            {!isDraft && (
              <button onClick={handleEcho} className="w-full sm:w-auto flex items-center justify-center space-x-2 sm:ml-auto bg-slate-900/50 px-5 py-3 rounded-2xl border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition-all active:scale-95 shadow-lg group">
                  <Activity size={20} className={`transition-transform group-hover:scale-125 ${isProblem ? 'text-rose-400' : 'text-cyan-400'}`} />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="font-bold text-white text-lg">{idea.votes}</span>
                    <span className="uppercase text-[9px] font-bold tracking-widest opacity-60">{t.validations}</span>
                  </div>
              </button>
            )}
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar space-x-6 md:space-x-8 border-b border-slate-800 mb-8 px-2 whitespace-nowrap">
        {[{ id: 'overview', label: t.connectionsTab }, { id: 'business', label: t.businessTab }, { id: 'discussion', label: t.discussionTab }, { id: 'contributions', label: t.contributionsTab }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-1 text-xs md:text-sm font-bold tracking-wide transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.label}
              {activeTab === tab.id && <div className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full ${tab.id === 'business' ? 'bg-purple-500' : isProblem ? 'bg-rose-500' : 'bg-cyan-500'}`} />}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Media Hero Gallery */}
                    {idea.media && idea.media.length > 0 && (
                      <div className="space-y-4">
                        <MediaGallery media={idea.media} />
                      </div>
                    )}

                    {connections.length > 0 && (
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <GitMerge size={16} /> Connected Nodes
                            </h3>
                            <div className="space-y-4">
                                {connections.map((conn, idx) => (
                                    <div key={idx} onClick={() => onNavigateTo(conn.relatedIdea)} className={`flex items-center gap-4 p-4 rounded-xl border bg-slate-800/40 cursor-pointer transition-all hover:bg-slate-800`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${conn.relatedIdea.type === IdeaType.PROBLEM ? 'bg-rose-950/30 text-rose-400 border-rose-900' : 'bg-cyan-950/30 text-cyan-400 border-cyan-900'}`}>
                                                    {conn.relatedIdea.type}
                                                </span>
                                                <h4 className="text-white font-semibold text-xs md:text-sm line-clamp-1">{conn.relatedIdea.title}</h4>
                                            </div>
                                            <p className="text-slate-400 text-[10px] md:text-xs line-clamp-1">{conn.relatedIdea.description}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-600 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-900/50 rounded-2xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px]"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Sparkles className="text-amber-400" size={20}/>{t.aiSuggestions}</h3>
                            <button onClick={handleBrainstorm} disabled={loadingSuggestions} className="text-[10px] font-bold bg-slate-800 text-white px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center">
                                {loadingSuggestions ? t.thinking : t.generateNew}
                            </button>
                        </div>
                        <div className="space-y-3 relative z-10">
                          {aiSuggestions.map((s, i) => <div key={i} className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl text-slate-300 text-sm leading-relaxed">{s}</div>)}
                          {aiSuggestions.length === 0 && !loadingSuggestions && <p className="text-slate-500 italic text-center py-4 text-sm">{t.emptyBrainstorm}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                  {/* Contributor Section */}
                  <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users size={16} /> {t.contributors}
                    </h3>
                    {isOwner && (
                      <div className="space-y-3 mb-6">
                        <div className="relative">
                          <input 
                            type="text" 
                            value={contributorSearch}
                            onChange={e => setContributorSearch(e.target.value)}
                            placeholder={t.contributorPlaceholder}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                          />
                          <button 
                            onClick={handleAddContributor}
                            disabled={addingContributor}
                            className="absolute right-2 top-1.5 p-1 text-purple-400 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {addingContributor ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={18} />}
                          </button>
                        </div>
                        {contributorError && <p className="text-[10px] text-rose-400 font-bold">{contributorError}</p>}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => onUserClick && onUserClick(idea.author)}>
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idea.author.substring(0,1).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">@{idea.author}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/40 text-purple-400 rounded-full font-bold">Owner</span>
                      </div>
                      {/* Fix: Explicitly cast contributorIds to string[] and check length to avoid 'unknown' type errors (Lines 370 in user reporter's count). */}
                      {Array.isArray(idea.contributorIds) && (idea.contributorIds as string[]).length > 0 && (idea.contributorIds as string[]).map((id: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                            C
                          </div>
                          <span className="text-xs font-bold text-slate-400">Contributor</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
        )}
        {activeTab === 'business' && <BusinessAnalyzer idea={idea} onAnalysisComplete={handleAnalysisComplete} />}
        {activeTab === 'discussion' && (
            <div className="space-y-8 max-w-3xl">
                <div className="bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-800">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t.commentPlaceholder} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none mb-4 text-sm" />
                    <div className="flex justify-end">
                        <button onClick={handlePostComment} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            <Send size={16} /> {t.addComment}
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {comments && (comments as IdeaComment[]).length === 0 && <p className="text-center py-10 text-slate-600 text-sm italic">{t.noComments}</p>}
                    {comments.map(c => (
                        <div key={c.id} className="bg-slate-800/30 p-4 md:p-5 rounded-2xl border border-slate-700 relative group/comment">
                            <div className="flex justify-between items-center mb-2">
                                <button onClick={() => onUserClick && onUserClick(c.author)} className="text-xs font-bold text-purple-400 hover:underline">@{c.author}</button>
                                <span className="text-[9px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300 text-sm mb-4 leading-relaxed">{c.text}</p>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {c.reactions && Object.entries(c.reactions).map(([emoji, userIds]) => {
                                    if (userIds.length === 0) return null;
                                    const hasReacted = user && userIds.includes(user.id);
                                    return (
                                        <button 
                                            key={emoji}
                                            onClick={() => handleReactToComment(c.id, emoji)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                                                hasReacted 
                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}
                                        >
                                            <span>{emoji}</span>
                                            <span>{userIds.length}</span>
                                        </button>
                                    );
                                })}

                                <div className="relative">
                                    <button 
                                        onClick={() => setOpenEmojiPickerId(openEmojiPickerId === c.id ? null : c.id)}
                                        className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-all sm:opacity-0 sm:group-hover/comment:opacity-100"
                                        title={t.react}
                                    >
                                        <Smile size={18} />
                                    </button>

                                    {openEmojiPickerId === c.id && (
                                        <div className="absolute left-0 bottom-full mb-2 bg-slate-950 border border-slate-700 p-2 rounded-2xl shadow-2xl flex gap-1 animate-fade-in z-20">
                                            {EMOJI_OPTIONS.map(emoji => (
                                                <button 
                                                    key={emoji} 
                                                    onClick={() => handleReactToComment(c.id, emoji)}
                                                    className="p-1.5 hover:bg-slate-800 rounded-xl text-lg transition-transform active:scale-125"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {activeTab === 'contributions' && (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><FileText className="text-emerald-400" size={24} />{t.contributionsTab}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {contributions.map(ct => (
                        <div key={ct.id} className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col h-full group">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-emerald-400">
                                <span className="text-[9px] font-bold uppercase tracking-widest">{ct.type}</span>
                              </div>
                              <span className="text-[9px] text-slate-500">{new Date(ct.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-white font-bold text-sm mb-2 group-hover:text-emerald-400 transition-colors">{ct.title || 'Untitled'}</h4>
                            <p className="text-slate-400 text-xs mb-4 line-clamp-3 leading-relaxed">{ct.content}</p>
                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-700/50">
                               <button onClick={() => onUserClick && onUserClick(ct.author)} className="text-[9px] text-slate-500 hover:text-white transition-colors">@{ct.author}</button>
                               {ct.content.startsWith('http') && <a href={ct.content} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-white transition-all"><ExternalLink size={14} /></a>}
                            </div>
                        </div>
                    ))}
                    {contributions.length === 0 && <p className="col-span-full text-center py-10 text-slate-600 text-sm italic">{t.noContributions}</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const MediaGallery: React.FC<{ media: IdeaMedia[] }> = ({ media }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = media[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-[32px] overflow-hidden bg-slate-900 border border-slate-800 group shadow-2xl">
        {selected.type === 'IMAGE' ? (
          <img src={selected.url} className="w-full h-full object-contain" alt="Selected Media" />
        ) : (
          <video 
            src={selected.url} 
            className="w-full h-full object-contain" 
            controls 
            autoPlay 
            muted 
            loop 
          />
        )}
        
        {media.length > 1 && (
          <>
            <button 
              onClick={() => setSelectedIndex(prev => (prev === 0 ? media.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setSelectedIndex(prev => (prev === media.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {media.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedIndex === idx ? 'border-purple-500 scale-105 shadow-lg' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
            >
              {item.type === 'IMAGE' ? (
                <img src={item.url} className="w-full h-full object-cover" alt="Thumbnail" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-purple-400">
                  <Play size={16} fill="currentColor" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
