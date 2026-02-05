
import React, { useState, useEffect } from 'react';
import { Idea, IdeaType } from '../types';
import { Heart, Eye, Lock, Building2, Play, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { backend } from '../services/backend';
import { useAuth } from '../contexts/AuthContext';

interface IdeaCardProps {
  idea: Idea;
  onClick: (idea: Idea) => void;
  onUserClick?: (username: string) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onClick, onUserClick }) => {
  const { t } = useLanguage();
  const { user, openAuthModal } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const isProblem = idea.type === IdeaType.PROBLEM;
  const isDraft = idea.status === 'DRAFT';

  useEffect(() => {
    if (user) {
      backend.isFavorite(user.id, idea.id).then(setIsFav);
    }
    if (idea.companyId && idea.isPublicCompanyIdea) {
      backend.getCompany(idea.companyId).then(c => setCompanyName(c?.name || null));
    }
  }, [idea.id, user, idea.companyId, idea.isPublicCompanyIdea]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    const newStatus = await backend.toggleFavorite(user.id, idea.id, idea.author);
    setIsFav(newStatus);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick) onUserClick(idea.author);
  };

  const firstImage = idea.media?.find(m => m.type === 'IMAGE')?.url;
  const firstVideo = idea.media?.find(m => m.type === 'VIDEO')?.url;

  return (
    <div 
      onClick={() => onClick(idea)}
      className={`
        cursor-pointer group relative overflow-hidden rounded-[24px] border transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1.5
        bg-slate-800/80 backdrop-blur-sm h-full flex flex-col border-slate-700/50
        ${isProblem ? 'hover:border-rose-500/50' : 'hover:border-cyan-500/50'}
      `}
    >
      {/* Thumbnail Header */}
      <div className="relative h-40 w-full bg-slate-900 overflow-hidden border-b border-slate-700/30">
        {firstImage ? (
          <img src={firstImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Preview" />
        ) : firstVideo ? (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <Play size={32} className="text-purple-500/40" />
          </div>
        ) : (
          <div className={`w-full h-full opacity-10 flex items-center justify-center ${isProblem ? 'bg-rose-500' : 'bg-cyan-500'}`}>
            <span className="text-4xl font-black">{idea.title.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
           <span className={`
              text-[9px] font-bold px-2 py-0.5 rounded-lg border tracking-wider uppercase backdrop-blur-md
              ${isProblem ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'}
            `}>
              {isProblem ? t.problems : t.solutions}
            </span>
        </div>

        <button 
          onClick={toggleFav}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all hover:bg-slate-700/50 ${isFav ? 'text-rose-500 scale-110' : 'text-slate-300/60'}`}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-6 relative z-10 flex flex-col h-full">
        <div className="flex gap-2 mb-3">
          {isDraft && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-900 bg-amber-950/30 text-amber-400 flex items-center gap-1 uppercase">
              <Lock size={8} /> {t.statusDraft}
            </span>
          )}
          {idea.companyId && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-purple-900 bg-purple-950/30 text-purple-400 flex items-center gap-1 uppercase">
              <Building2 size={8} /> {t.company}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-white transition-colors leading-tight line-clamp-2">
          {idea.title}
        </h3>
        
        <p className="text-slate-400 text-xs mb-6 line-clamp-2 leading-relaxed">
          {idea.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between text-slate-500 text-xs border-t border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1 transition-colors ${isProblem ? 'group-hover:text-rose-400' : 'group-hover:text-cyan-400'}`}>
              <Activity size={14} />
              <span className="font-bold">{idea.votes}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-60">
              <Eye size={14} />
              <span>{idea.views || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
              {companyName ? (
                <div className="flex items-center gap-1 text-purple-400 font-bold text-[10px]">
                  <Building2 size={10} />
                  <span>{companyName}</span>
                </div>
              ) : (
                <button 
                  onClick={handleUserClick}
                  className="flex items-center space-x-2 hover:text-white transition-colors group/author"
                >
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                      <span className="text-[8px] text-white">{idea.author.substring(0,1).toUpperCase()}</span>
                    </div>
                    <span className="text-[10px]">@{idea.author}</span>
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
