import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Eye, XCircle, Zap, ExternalLink, ShieldAlert } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Admin, NewsItem, NewsStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const AdminOsintApprovals: React.FC = () => {
    const [pending, setPending] = useState<NewsItem[]>([]);
    const [currentUser, setCurrentUser] = useState<Admin | null>(null);
    const { addToast } = useToast();

    const fetchPending = async () => {
        const user = await storageService.getAuth();
        setCurrentUser(user);
        const items = await storageService.getNewsItems();
        // Specifically filter for OSINT items
        setPending(items.filter(i => i.status === 'pending_approval' && i.meta?.source === 'osint_feed'));
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (item: NewsItem, newStatus: NewsStatus) => {
        const approved = newStatus === 'published';
        const updated = {
            ...item,
            status: newStatus,
            publishedAt: approved ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
            approvedBy: approved ? 'OSINT Validator' : null
        };

        await storageService.saveNewsItem(updated);
        fetchPending();
        addToast(approved ? 'OSINT Intelligence Disseminated' : 'OSINT Signal Expunged', approved ? 'success' : 'info');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-purple-600"></div>
                <div>
                    <h1 className="text-2xl font-black text-intel-900 dark:text-white uppercase tracking-tight font-clarendon">OSINT Signal Queue</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{pending.length} Strategic Signals Awaiting Validation</p>
                </div>
            </div>

            {pending.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-purple-100 dark:border-purple-900/20">
                    <div className="max-w-xs mx-auto">
                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-intel-900 dark:text-white">Spectrum Clear</h3>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">No pending OSINT signals detected in the buffer.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {pending.map(item => {
                        const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                        const category = item.blocks.find(b => b.type === 'category')?.value || 'General';
                        const image = item.blocks.find(b => b.type === 'image')?.value;
                        const severity = item.severity;

                        const severityColor = 
                            severity === 'critical' ? 'bg-red-500 text-white' :
                            severity === 'high' ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white';

                        return (
                            <Card key={item.id} className="p-6 flex items-center justify-between gap-6 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all bg-white dark:bg-slate-800">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    {image?.src && (
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                            <img src={image.src} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-[8px] font-black uppercase tracking-widest">
                                                OSINT SIGNAL
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${severityColor}`}>
                                                {severity}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                {category}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-intel-900 dark:text-white font-clarendon line-clamp-1 mb-1">{title}</h3>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
                                                <Zap size={10} className="text-purple-500" /> Source: {item.author}
                                            </p>
                                            {item.meta?.externalLink && (
                                                <a 
                                                    href={item.meta.externalLink} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-[9px] text-maroon-500 hover:text-maroon-600 font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                >
                                                    <ExternalLink size={10} /> View Intel Origin
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link to={`/admin/edit/${item.id}`}>
                                        <Button
                                            variant="secondary"
                                            className="!text-slate-600 !border-slate-100 hover:!bg-slate-50 !text-[9px] !font-black !px-4"
                                        >
                                            Refine Protocol
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleAction(item, 'rejected')}
                                        className="!text-red-600 !border-red-100 hover:!bg-red-50 !text-[9px] !font-black !px-4"
                                    >
                                        Expunge
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(item, 'published')}
                                        className="!bg-purple-600 hover:!bg-purple-500 !text-[9px] !font-black !px-6 shadow-lg shadow-purple-900/20"
                                    >
                                        Validate & Broadcast
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
