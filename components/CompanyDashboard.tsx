import React, { useState, useEffect } from 'react';
import { Company, Team, User, Idea, UserRole, UserPermissions } from '../types';
import { backend } from '../services/backend';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Building2, Users, PieChart, CreditCard, Plus, ArrowLeft, 
  Settings as SettingsIcon, Shield, ChevronRight, LayoutDashboard, 
  Target, TrendingUp, BarChart3, Lock
} from 'lucide-react';
import { IdeaCard } from './IdeaCard';

interface CompanyDashboardProps {
  onBack: () => void;
  onIdeaClick: (idea: Idea) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ onBack, onIdeaClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'ideas' | 'billing'>('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [companyIdeas, setCompanyIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    if (!user?.companyId) return;
    const [c, tList, iList] = await Promise.all([
      backend.getCompany(user.companyId),
      backend.getTeams(user.companyId),
      backend.getIdeas('RECENT', user.id)
    ]);
    setCompany(c);
    setTeams(tList);
    setCompanyIdeas(iList.filter(idea => idea.companyId === user.companyId));
    setLoading(false);
  };

  const handleAddTeam = async () => {
    const name = prompt(t.addTeam + ":");
    if (name && company) {
      await backend.addTeam(company.id, name);
      loadData();
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500">...</div>;
  if (!company) return <div className="p-20 text-center text-slate-500">{t.noAccount}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
               <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{company.plan}</span>
                <span className="text-slate-500 text-xs font-medium">Node #{company.id.substring(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
          <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={16} />} label={t.dashboardOverview} />
          <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16} />} label={t.teams} />
          <NavButton active={activeTab === 'ideas'} onClick={() => setActiveTab('ideas')} icon={<Target size={16} />} label={t.ideasLabel} />
          <NavButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={16} />} label={t.billing} />
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label={t.totalPrivateIdeas} value={companyIdeas.length} icon={<Lock className="text-purple-400" />} />
              <StatCard label={t.departmentsActive} value={company.departments.length} icon={<Shield className="text-cyan-400" />} />
              <StatCard label={t.activeTeams} value={teams.length} icon={<Users className="text-emerald-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-400" /> {t.orgAnalytics}
                  </h3>
                  <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                    <BarChart3 size={40} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">{t.orgAnalyticsDesc}</p>
                  </div>
               </div>

               <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Building2 size={20} className="text-cyan-400" /> {t.departmentLabel}s
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {company.departments.map(dept => (
                      <div key={dept} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 flex items-center justify-between group hover:border-cyan-500/50 transition-all cursor-pointer">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">{dept}</span>
                        <ChevronRight size={14} className="text-slate-600" />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">{t.manageTeams}</h3>
              <button onClick={handleAddTeam} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Plus size={18} /> {t.addTeam}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div key={team.id} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all group">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-purple-600/20 group-hover:text-purple-400 transition-all">
                        <Users size={20} />
                      </div>
                      <SettingsIcon size={18} className="text-slate-600 hover:text-white cursor-pointer" />
                   </div>
                   <h4 className="text-lg font-bold text-white mb-1">{team.name}</h4>
                   <p className="text-slate-500 text-sm mb-6">{team.memberIds.length} {t.membersCount}</p>
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold text-slate-500">M</div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-8">{t.internalIdeaPool}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companyIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onClick={() => onIdeaClick(idea)} />
              ))}
              {companyIdeas.length === 0 && <p className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">{t.internalIdeaPoolDesc}</p>}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="max-w-2xl mx-auto py-10">
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
               <div className="p-8 border-b border-slate-800 bg-slate-950/20">
                 <h3 className="text-xl font-bold text-white mb-2">{t.currentSubscription}</h3>
                 <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold text-2xl">Pandora Pro</span>
                    <span className="text-slate-500 font-medium uppercase text-xs">{company.billingCycle === 'MONTHLY' ? t.billingMonthly : t.billingYearly}</span>
                 </div>
               </div>
               <div className="p-8 space-y-6">
                 <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-slate-400" />
                      <span className="text-white font-medium">{t.paymentMethod}</span>
                   </div>
                   <span className="text-slate-400 text-sm">{t.visaEnding} 4242</span>
                 </div>
                 <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <PieChart size={20} className="text-slate-400" />
                      <span className="text-white font-medium">{t.nextInvoice}</span>
                   </div>
                   <span className="text-white font-bold">{t.nextInvoiceDate} - ${company.billingCycle === 'MONTHLY' ? '49.00' : '468.00'}</span>
                 </div>
                 <div className="pt-4">
                    <button className="text-rose-400 font-bold hover:underline text-sm uppercase tracking-widest">{t.cancelSubscription}</button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: any, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{label: string, value: number, icon: any}> = ({ label, value, icon }) => (
  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {icon}
    </div>
    <span className="text-4xl font-bold text-white">{value}</span>
  </div>
);