import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Search, Loader2, Sparkles, Send, Download,
    Newspaper, TrendingUp, BarChart3, Zap, CheckCircle, PlusCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/storageService';
import { aiNewsService, AiArticle } from '../../services/aiNewsService';

// Implementation using real AI services
import { format } from 'date-fns';

export const AdminAiGenerator: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedState, setSelectedState] = useState('National');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [articles, setArticles] = useState<any[]>([]);
    const [aiProcessed, setAiProcessed] = useState(false);

    const STATES = [
        'National', 'Delhi', 'Mumbai', 'Bengaluru', 'Chennai',
        'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'
    ];

    const handleFetchNews = async () => {
        if (!selectedState) { addToast('Please select a state', 'error'); return; }
        setLoading(true);
        try {
            addToast(`Searching for intelligence on ${selectedState}...`, 'info');
            const data = await aiNewsService.fetchNews(selectedState, selectedDate);
            setArticles(data);
            setAiProcessed(false);
            addToast(`Intelligence gathered: ${data.length} sources found.`, 'success');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAiProcess = async () => {
        if (articles.length === 0) return;
        setProcessing(true);
        try {
            addToast('Analyzing intelligence with Gemini AI...', 'info');
            const processed = await aiNewsService.processWithAi(articles, selectedState, selectedDate);
            setArticles(processed);
            setAiProcessed(true);
            addToast('AI Analysis complete. Items ranked by strategic impact.', 'success');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendToApprovals = async (article: any) => {
        try {
            setProcessing(true);
            const newsItem = {
                id: `osint-ai-${Date.now()}`,
                templateId: 'tpl-1764398847255',
                status: 'pending_approval' as const,
                author: `${article.source} | AI Gatherer`,
                createdAt: new Date().toISOString(),
                publishedAt: article.publishedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                severity: 'info' as const,
                tags: ['OSINT', selectedState],
                meta: {
                    source: 'osint_feed',
                    externalLink: article.url
                },
                blocks: [
                    { blockId: 'b1', type: 'title', value: article.title },
                    { blockId: 'b5', type: 'excerpt', value: article.summary },
                    { blockId: 'b6', type: 'markdown', value: article.summary }
                ]
            };
            
            await storageService.saveNewsItem(newsItem);
            addToast('Intelligence sent to OSINT approval table.', 'success');
        } catch (e: any) {
            addToast('Failed to send for approval', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-slide-up">
                <div className="flex items-center gap-5">
                    <Link to="/admin/dashboard" className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-maroon-500 transition-all shadow-sm">
                        <ChevronLeft size={20} className="stroke-[3px]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                            AI Intel Gatherer
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Autonomous OSINT & AI Processing Pipeline</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Parameters */}
            <Card variant="glass" className="p-8 mb-8 border-l-[6px] border-l-purple-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Region</label>
                        <select 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temporal Window</label>
                        <input 
                            type="date"
                            min="2025-12-01"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleFetchNews} disabled={loading} className="flex-1 !bg-slate-900 dark:!bg-white !text-white dark:!text-slate-900 !text-[11px] !font-black !h-12 !rounded-xl">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                            Gather Intel
                        </Button>
                        {articles.length > 0 && (
                            <Button onClick={handleAiProcess} disabled={processing} className="flex-1 !bg-purple-600 hover:!bg-purple-500 !text-white !text-[11px] !font-black !h-12 !rounded-xl shadow-lg shadow-purple-900/20">
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                AI Process
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Results */}
            {articles.length > 0 ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <Newspaper className="text-maroon-500" size={24} />
                            Gathered Intelligence ({articles.length})
                        </h2>
                        {aiProcessed && (
                            <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={12} /> AI Ranked & Summarized
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {articles.map((article, i) => (
                            <Card key={article.id} variant="glass" className="p-6 group hover:border-purple-500/30 transition-all">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/5">
                                                {article.source}
                                            </span>
                                            <span className="px-2.5 py-1 bg-maroon-500/10 rounded text-[9px] font-black text-maroon-600 dark:text-maroon-400 uppercase tracking-widest border border-maroon-500/20">
                                                {article.category}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-purple-500 transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                                            {article.summary}
                                        </p>
                                    </div>
                                    <div className="flex md:flex-col gap-3 justify-center">
                                        <Button 
                                            onClick={() => handleSendToApprovals(article)} 
                                            className="!bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400 !border-emerald-500/20 !text-[10px] !font-black !px-6 hover:!bg-emerald-600 hover:!text-white transition-all"
                                            disabled={processing}
                                        >
                                            <Send size={14} /> Send to Approval
                                        </Button>
                                        <a href={article.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all">
                                            <Zap size={14} /> View Source
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                        <Newspaper size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">No intelligence gathered yet</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-2 font-bold uppercase tracking-widest">Select parameters and initiate gather protocol</p>
                </div>
            )}
        </div>
    );
};
