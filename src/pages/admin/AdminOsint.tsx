import React, { useState, useEffect } from 'react';
import { osintService } from '../../services/osintService';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Check, X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export const AdminOsint: React.FC = () => {
    const [liveItems, setLiveItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const items = await osintService.fetchLiveNationalNews();
            setLiveItems(items);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleApprove = async (item: NewsItem) => {
        setActioning(item.id);
        try {
            // Change status to published and save to DB
            const approvedItem = {
                ...item,
                status: 'published' as const,
                publishedAt: new Date().toISOString()
            };
            await storageService.saveNewsItem(approvedItem);
            // Remove from local list
            setLiveItems(prev => prev.filter(i => i.id !== item.id));
        } catch (e) {
            console.error('Failed to approve:', e);
        }
        setActioning(null);
    };

    const handleReject = (id: string) => {
        setLiveItems(prev => prev.filter(i => i.id !== id));
    };

    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getSummary = (item: NewsItem) => item.blocks.find(b => b.type === 'markdown')?.value || 'No content';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-clarendon font-black text-intel-900">OSINT Intelligence Wire</h1>
                        <p className="text-gray-500 font-mono text-sm mt-1 uppercase tracking-wider">Review and approve live signals for official publication</p>
                    </div>
                    <button 
                        onClick={fetchNews}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-intel-900 text-white rounded-lg hover:bg-intel-800 disabled:opacity-50 transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh Feed
                    </button>
                </div>

                {liveItems.length === 0 && !loading ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No emerging signals found</h3>
                        <p className="text-gray-500">All live news has been processed or the feeds are currently dry.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {liveItems.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    {/* Content Section */}
                                    <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                                item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {item.severity}
                                            </span>
                                            <span className="text-xs font-mono text-gray-400">{item.author}</span>
                                            <span className="text-xs font-mono text-gray-400 ml-auto">
                                                {new Date(item.publishedAt || '').toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{getTitle(item)}</h3>
                                        <div className="text-gray-600 text-sm line-clamp-3 mb-4 italic">
                                            {getSummary(item)}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {item.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono uppercase tracking-wider">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Section */}
                                    <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col justify-center gap-3">
                                        <button 
                                            onClick={() => handleApprove(item)}
                                            disabled={actioning !== null}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-sm"
                                        >
                                            <Check size={20} />
                                            {actioning === item.id ? 'Approving...' : 'Approve for Pulse'}
                                        </button>
                                        <button 
                                            onClick={() => handleReject(item.id)}
                                            disabled={actioning !== null}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition-all"
                                        >
                                            <X size={20} />
                                            Discard Item
                                        </button>
                                        <a 
                                            href="#" // Source link if available
                                            className="text-center text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mt-2"
                                        >
                                            View Original Source <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
