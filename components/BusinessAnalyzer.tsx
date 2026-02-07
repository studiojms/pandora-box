import React, { useState, useEffect, useRef } from 'react';
import { Idea, BusinessAnalysis } from '../types';
import { analyzeBusinessPotential } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap,
  Hammer,
  Users,
  Briefcase,
  Target,
  DollarSign,
  Activity,
  FileCode,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import mermaid from 'mermaid';

interface BusinessAnalyzerProps {
  idea: Idea;
  onAnalysisComplete: (analysis: BusinessAnalysis) => void;
}

export const BusinessAnalyzer: React.FC<BusinessAnalyzerProps> = ({ idea, onAnalysisComplete }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const analysis = idea.aiAnalysis;

  useEffect(() => {
    if (analysis?.mermaidDiagram && mermaidRef.current) {
      // Initialize mermaid with dark theme to match Pandora's UI
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        themeVariables: {
          primaryColor: '#8b5cf6',
          primaryTextColor: '#fff',
          primaryBorderColor: '#7c3aed',
          lineColor: '#475569',
          secondaryColor: '#0ea5e9',
          tertiaryColor: '#1e293b',
        },
      });

      const renderDiagram = async () => {
        try {
          // Clean the diagram string from potential AI markdown artifacts
          let code = analysis.mermaidDiagram
            .replace(/```mermaid/g, '')
            .replace(/```/g, '')
            .trim();

          // Ensure it has a valid starter if missing (common AI small error)
          if (!code.startsWith('graph') && !code.startsWith('flowchart') && !code.startsWith('sequenceDiagram')) {
            code = `graph TD\n${code}`;
          }

          const { svg } = await mermaid.render(`mermaid-${idea.id.replace(/[^a-zA-Z0-9]/g, '')}`, code);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('Mermaid Render Error:', err);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
              [Diagram Rendering Error] Check console for syntax details.
            </div>`;
          }
        }
      };

      renderDiagram();
    }
  }, [analysis?.mermaidDiagram, idea.id]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeBusinessPotential(idea, language);
      onAnalysisComplete(result);
    } catch (err) {
      setError('Failed to generate analysis. Check API Key or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="p-10 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 hover:border-purple-500/50 transition-colors group">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(147,51,234,0.3)]">
          <Hammer className="text-purple-500" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.forgeTitle}</h3>
        <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">{t.forgeDesc}</p>
        <button
          onClick={handleAnalyze}
          className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center mx-auto space-x-2"
        >
          <Zap size={20} />
          <span>{t.generatePlan}</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-6 bg-slate-900/50 rounded-2xl border border-slate-800">
        <Loader2 className="animate-spin text-purple-500" size={48} />
        <p className="text-slate-300 font-medium animate-pulse">{t.consulting}</p>
      </div>
    );
  }

  const chartData = analysis
    ? [
        { subject: t.viability, A: analysis.viabilityScore, fullMark: 100 },
        { subject: t.marketSize, A: analysis.marketSizeScore, fullMark: 100 },
        { subject: t.simplicity, A: 100 - analysis.complexityScore, fullMark: 100 },
        { subject: 'Veracity', A: analysis.veracityScore || 0, fullMark: 100 },
        { subject: t.scalability, A: (analysis.viabilityScore + analysis.marketSizeScore) / 2, fullMark: 100 },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 h-[350px] flex flex-col justify-center">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{t.metricsTitle}</h4>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Metrics" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs">{t.overallViability}</span>
              <span
                className={`text-4xl font-bold ${analysis!.viabilityScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                {analysis!.viabilityScore}
              </span>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-xl border-l-4 border-purple-500">
              <p className="text-sm text-slate-300 italic leading-relaxed">"{analysis!.summary}"</p>
            </div>
            {analysis?.veracityScore && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Scientific Plausibility</span>
                <span className="text-sm font-bold text-cyan-400">{analysis.veracityScore}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {analysis?.mermaidDiagram && (
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 overflow-hidden">
          <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <FileCode size={18} className="text-purple-400" /> Logical Flow Chart
          </h4>
          <div className="bg-slate-950/30 p-4 md:p-8 rounded-xl border border-slate-800 flex justify-center items-center overflow-x-auto">
            <div ref={mermaidRef} className="mermaid w-full flex justify-center">
              {/* SVG rendered here */}
              <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                <Loader2 size={14} className="animate-spin" /> Rendering Diagram...
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 italic text-center">
            * Flowogram visually generated by Gemini Pandora Oracle & Mermaid.js
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="text-blue-400" size={24} />
          {t.canvasTitle}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CanvasCard
            title={t.valueProp}
            content={analysis?.canvas.valueProposition}
            icon={<Target size={16} />}
            color="blue"
          />
          <CanvasCard
            title={t.customers}
            content={analysis?.canvas.customerSegments}
            icon={<Users size={16} />}
            color="emerald"
          />
          <CanvasCard
            title={t.revenue}
            content={analysis?.canvas.revenueStreams}
            icon={<DollarSign size={16} />}
            color="amber"
          />
          <CanvasCard
            title={t.costs}
            content={analysis?.canvas.costStructure}
            icon={<Shield size={16} />}
            color="rose"
          />
        </div>
      </div>
    </div>
  );
};

const CanvasCard: React.FC<{ title: string; content?: string; icon: any; color: string }> = ({
  title,
  content,
  icon,
  color,
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 border-blue-900/20 bg-blue-950/10',
    emerald: 'text-emerald-400 border-emerald-900/20 bg-emerald-950/10',
    amber: 'text-amber-400 border-amber-900/20 bg-amber-950/10',
    rose: 'text-rose-400 border-rose-900/20 bg-rose-950/10',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2 font-bold uppercase text-[9px] tracking-widest opacity-80">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-slate-300 text-xs leading-relaxed">{content || '...'}</p>
    </div>
  );
};
