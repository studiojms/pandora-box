import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Mail, Lock, User as UserIcon, LogIn, Loader2, Chrome } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { closeAuthModal, login, signup, socialLogin } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signin') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await socialLogin('google');
    } catch (err) {
      setError("Social login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{mode === 'signin' ? t.signIn : t.signUp}</h2>
              <p className="text-slate-400 text-sm mt-1">{t.loginSubtitle}</p>
            </div>
            <button onClick={closeAuthModal} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <button 
              onClick={handleGoogle}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-center space-x-3 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Chrome size={20} />}
              <span>{t.continueWithGoogle}</span>
            </button>

            <div className="flex items-center space-x-4 py-2">
              <div className="h-px flex-grow bg-slate-800"></div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">or</span>
              <div className="h-px flex-grow bg-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text"
                    required
                    placeholder={t.nameLabel}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="email"
                  required
                  placeholder={t.emailLabel}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="password"
                  required
                  placeholder={t.passwordLabel}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              {error && <p className="text-rose-400 text-sm bg-rose-950/30 p-2 rounded text-center">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                <span>{mode === 'signin' ? t.signIn : t.createAccount}</span>
              </button>
            </form>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-slate-400 hover:text-purple-400 transition-colors text-sm font-medium"
            >
              {mode === 'signin' ? t.noAccount : t.hasAccount} <span className="text-purple-500 font-bold underline underline-offset-4">{mode === 'signin' ? t.signUp : t.signIn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};