import React, { useState } from 'react';
import { ArrowLeft, Check, Zap, Building2, Rocket, Shield, BarChart3, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckoutModal } from './CheckoutModal';

interface ProPlanPageProps {
  onBack: () => void;
}

export const ProPlanPage: React.FC<ProPlanPageProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [showCheckout, setShowCheckout] = useState(false);

  const price = billingCycle === 'MONTHLY' ? 49 : 39;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-xs">{t.backToFeed}</span>
      </button>

      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          {t.proPlan} <span className="text-amber-400">{t.forCompanies}</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          {t.proPlanDesc}
        </p>

        <div className="flex items-center justify-center gap-4 pt-8">
           <span className={`text-sm font-bold ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-slate-500'}`}>{t.billingMonthly}</span>
           <button 
            onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
            className="w-12 h-6 bg-slate-800 rounded-full relative p-1"
           >
             <div className={`w-4 h-4 bg-purple-500 rounded-full transition-all ${billingCycle === 'YEARLY' ? 'ml-6' : 'ml-0'}`}></div>
           </button>
           <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${billingCycle === 'YEARLY' ? 'text-white' : 'text-slate-500'}`}>{t.billingYearly}</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{t.saveYearly}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard icon={<Shield className="text-purple-400" />} title="Private Workspace" desc="Internal ideas remain visible only to your verified employees." />
            <FeatureCard icon={<Users className="text-cyan-400" />} title="Team Collaboration" desc="Group contributors into departments for targeted brainstorming." />
            <FeatureCard icon={<BarChart3 className="text-emerald-400" />} title="Advanced Analytics" desc="Track innovation velocity and engagement across departments." />
            <FeatureCard icon={<Rocket className="text-rose-400" />} title="Branded Content" desc="Public ideas carry your company's identity and legacy." />
          </div>
          
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-white font-bold mb-4">{t.proBenefits.length} Reasons to Upgrade:</h3>
            <ul className="space-y-3">
              {t.proBenefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" /></div>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center text-center space-y-8">
            <div className="bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
               <Building2 size={32} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.company}</h3>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-bold text-white">${price}</span>
                <span className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">/ user / month</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">* billed {billingCycle.toLowerCase()}</p>
            </div>
            
            <button 
              onClick={() => setShowCheckout(true)}
              className="w-full bg-white text-slate-950 hover:bg-slate-200 py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Zap size={20} fill="currentColor" />
              {t.getPro}
            </button>
            
            <p className="text-slate-500 text-xs">Secure checkout powered by Stripe & Google Pay</p>
          </div>
        </div>
      </div>

      {showCheckout && <CheckoutModal cycle={billingCycle} onClose={() => setShowCheckout(false)} />}
    </div>
  );
};

const FeatureCard: React.FC<{icon: any, title: string, desc: string}> = ({ icon, title, desc }) => (
  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
     <div className="mb-3">{icon}</div>
     <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
     <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
  </div>
);