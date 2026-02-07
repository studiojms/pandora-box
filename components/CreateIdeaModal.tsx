import React, { useState, useEffect } from 'react';
import { IdeaType, Idea, IdeaMedia } from '../types';
import {
  X,
  Lightbulb,
  AlertCircle,
  Sparkles,
  Mic,
  Camera,
  Loader2,
  Wand2,
  Trash2,
  Video,
  Plus,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { refineIdeaDraft, analyzePrototypeImage } from '../services/geminiService';

interface CreateIdeaModalProps {
  onClose: () => void;
  onSubmit: (idea: Omit<Idea, 'id' | 'votes' | 'createdAt' | 'status' | 'views'>) => void;
  parentIdea?: Idea | null;
}

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ onClose, onSubmit, parentIdea }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Set default type based on parent: if solving a problem, default to Solution.
  const [type, setType] = useState<IdeaType>(
    parentIdea?.type === IdeaType.PROBLEM ? IdeaType.SOLUTION : IdeaType.PROBLEM
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [mediaItems, setMediaItems] = useState<IdeaMedia[]>([]);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showMediaSection, setShowMediaSection] = useState(false);

  // Pro Fields
  const [postAs, setPostAs] = useState<'SELF' | 'TEAM' | 'COMPANY'>('SELF');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);

  const handleRefine = async () => {
    if (!description.trim()) return;
    setIsRefining(true);
    const result = await refineIdeaDraft(description, type, language);
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      setTags(result.tags.join(', '));
    }
    setIsRefining(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'IMAGE' | 'VIDEO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const newItem: IdeaMedia = { url: base64, type: fileType };
      setMediaItems((prev) => [...prev, newItem]);

      if (fileType === 'IMAGE' && mediaItems.filter((m) => m.type === 'IMAGE').length === 0) {
        setAnalyzingImage(true);
        const result = await analyzePrototypeImage(base64, language);
        if (result) {
          setTitle(result.title);
          setDescription(result.description);
        }
        setAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'pt' ? 'pt-BR' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => prev + ' ' + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const ideaData: any = {
      type,
      title,
      description,
      author: user?.name || 'Anonymous',
      authorId: user?.id || '',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      media: mediaItems,
    };

    if (user?.companyId && postAs !== 'SELF') {
      ideaData.companyId = user.companyId;
      ideaData.isPublicCompanyIdea = isPublic;
      ideaData.department = selectedDept;
      if (postAs === 'TEAM') {
        ideaData.teamId = selectedTeam;
      }
    }

    onSubmit(ideaData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-purple-400" size={24} /> {t.createModalTitle}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {parentIdea && (
            <div className="mb-6 p-4 bg-slate-800/40 border border-slate-700 rounded-2xl flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <LinkIcon size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">
                  {t.linkingTo}
                </span>
                <p className="text-white font-bold text-sm truncate">{parentIdea.title}</p>
              </div>
            </div>
          )}

          <form id="create-idea-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType(IdeaType.PROBLEM)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                  type === IdeaType.PROBLEM
                    ? 'bg-rose-950/30 border-rose-500 text-rose-400'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500'
                }`}
              >
                <AlertCircle size={28} />
                <span className="font-bold text-sm">{t.iHaveProblem}</span>
              </button>
              <button
                type="button"
                onClick={() => setType(IdeaType.SOLUTION)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                  type === IdeaType.SOLUTION
                    ? 'bg-cyan-950/30 border-cyan-500 text-cyan-400'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500'
                }`}
              >
                <Lightbulb size={28} />
                <span className="font-bold text-sm">{t.iHaveSolution}</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowMediaSection(!showMediaSection)}
                className="flex items-center justify-between w-full p-3 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-slate-400 group-hover:text-purple-400" size={18} />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Advertising Media {mediaItems.length > 0 ? `(${mediaItems.length})` : '(Optional)'}
                  </span>
                </div>
                {showMediaSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {(showMediaSection || mediaItems.length > 0) && (
                <div className="space-y-4 animate-fade-in p-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {mediaItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-black group"
                      >
                        {item.type === 'IMAGE' ? (
                          <img src={item.url} className="w-full h-full object-cover" alt="Media" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-purple-400">
                            <Video size={24} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-purple-500 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-slate-800/20">
                      <ImageIcon className="text-slate-500 group-hover:text-purple-400 mb-1" size={20} />
                      <span className="text-[8px] font-bold text-slate-500 group-hover:text-slate-300 uppercase">
                        Add Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'IMAGE')}
                      />
                    </label>
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center cursor-pointer group bg-slate-800/20">
                      <Video className="text-slate-500 group-hover:text-cyan-400 mb-1" size={20} />
                      <span className="text-[8px] font-bold text-slate-500 group-hover:text-slate-300 uppercase">
                        Add Video
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'VIDEO')}
                      />
                    </label>
                  </div>
                  {analyzingImage && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3 animate-pulse">
                      <Loader2 className="animate-spin text-purple-400" size={16} />
                      <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                        Oracle analyzing your visual concept...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.descLabel}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`p-1.5 rounded-lg border transition-all ${isListening ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRefine}
                    disabled={isRefining || !description.trim()}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/40 transition-all disabled:opacity-50"
                  >
                    {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    <span className="text-[10px] font-bold uppercase">Refine</span>
                  </button>
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === IdeaType.PROBLEM ? t.problemDescPlaceholder : t.solutionDescPlaceholder}
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {t.titleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === IdeaType.PROBLEM ? t.problemPlaceholder : t.solutionPlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {t.tagsLabel}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tech, eco, health"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
          <button
            type="submit"
            form="create-idea-form"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
          >
            {t.publish}
          </button>
        </div>
      </div>
    </div>
  );
};
