import React, { useState, useEffect } from 'react';
import { 
    Send, Mail, Users, FileText, Download, Loader2, CheckCircle, 
    AlertTriangle, Sparkles, Calendar, Plus, Trash2, Edit2
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { storageService } from '../../../services/storageService';
import { newsletterService } from '../../../services/newsletterService';
import { format } from 'date-fns';

export const NewsletterDashboard: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [recentBulletins, setRecentBulletins] = useState<any[]>([]);
    const [selectedBulletin, setSelectedBulletin] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Simulated data - in a real app, this would be stored in Supabase
            setRecipients([
                { id: '1', name: 'Strategic Command', email: 'strat-com@gov.in', status: 'active' },
                { id: '2', name: 'Intelligence Bureau', email: 'intel-ops@gov.in', status: 'active' },
                { id: '3', name: 'Cyber Defense', email: 'cyber-brief@gov.in', status: 'active' }
            ]);

            const bulletins = await storageService.getNewsItems();
            setRecentBulletins(bulletins.slice(0, 5));
        } catch (e: any) {
            addToast('Failed to load newsletter data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReport = async () => {
        if (!selectedBulletin) {
            addToast('Please select a bulletin to send', 'error');
            return;
        }
        const bulletin = recentBulletins.find(b => b.id === selectedBulletin);
        if (!bulletin) return;

        setSending(true);
        try {
            addToast('Formatting newsletter and preparing dispatch...', 'info');
            const activeRecipients = recipients.filter(r => r.status === 'active');
            const result = await newsletterService.sendNewsletter(bulletin, activeRecipients);
            
            if (result.success) {
                addToast(`Newsletter dispatched to ${activeRecipients.length} recipients!`, 'success');
            } else {
                addToast('Some emails failed to send. Check logs.', 'warning');
            }
        } catch (e: any) {
            addToast(e.message || 'Dispatch failed', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Intelligence Newsletter
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Automated Dissemination Dashboard
                    </p>
                </div>
                <Button onClick={handleSendReport} disabled={sending || !selectedBulletin} className="!bg-maroon-600 hover:!bg-maroon-500 !text-white !text-[11px] !font-black !px-8 shadow-xl shadow-maroon-900/20">
                    {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    Dispatch Daily Report
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content: Bulletin Selection */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card variant="glass" className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300">
                                Select Bulletin to Disseminate
                            </label>
                            <span className="text-[10px] font-bold text-maroon-500 uppercase tracking-widest">
                                {recentBulletins.length} Recent Archives
                            </span>
                        </div>
                        <div className="space-y-3">
                            {recentBulletins.map(item => {
                                const titleBlock = item.blocks.find((b: any) => b.type === 'title');
                                const active = selectedBulletin === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedBulletin(item.id)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                            active 
                                            ? 'bg-maroon-500/5 border-maroon-500 shadow-lg shadow-maroon-500/10' 
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl border transition-colors ${active ? 'bg-maroon-600 text-white border-maroon-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600 group-hover:bg-maroon-50'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {titleBlock?.value || 'Untitled Brief'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')} · {item.status.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        {active && <CheckCircle size={20} className="text-maroon-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Preview Area */}
                    {selectedBulletin && (
                        <Card variant="glass" className="p-6 border-l-[6px] border-l-maroon-600 animate-slide-up">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="text-maroon-500" size={18} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Email Preview Generation</h3>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 dark:bg-black/20 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm">
                                    <Download size={24} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">PDF Report Ready for Attachment</p>
                                <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">ID: {selectedBulletin}</p>
                                <Button variant="ghost" className="mt-6 !text-[10px] !font-black !px-6">Preview Full Newsletter Template</Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Recipients */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card variant="glass" className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Users size={14} className="text-maroon-500" /> Stakeholders
                            </label>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-all">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recipients.map(r => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                                            {r.name.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{r.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">{r.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 hover:text-maroon-600 text-slate-400 transition-colors"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-relaxed">
                                Reports are dispatched using the primary SMTP relay. Ensure verified sender identity in Settings.
                            </p>
                        </div>
                    </Card>

                    <Card variant="glass" className="p-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-5 block">
                            Dispatch Logs
                        </label>
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">Report Dispatched</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">April 27, 2026 · 3 Recipients</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
