import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Calendar, ChevronRight, AlertTriangle, X, FileText } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { osintService } from '../../services/osintService';
import { supabase } from '../../services/supabaseClient';
import { NewsItem } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { STRATEGIC_CATEGORIES } from '../../constants';
import { ThreatMap } from '../../components/ui/ThreatMap';
import { LiveTicker } from '../../components/ui/LiveTicker';

// National Intelligence Domains
const ITEMS_PER_PAGE = 3;
const DOMAINS = ['All', ...STRATEGIC_CATEGORIES];

const isDomainTag = (tag: string) =>
    DOMAINS.some(domain => domain.toLowerCase() === tag.toLowerCase());

function getIssueNumber(): string {
    const base = 89;
    const baseDate = new Date('2026-02-27');
    const today = new Date();
    const diff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return `ISSP_RRUPY/Issue No.${base + diff}/2026`;
}

function formatBulletinDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${days[date.getDay()]}`;
}

export const PublicHome: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbConnected, setDbConnected] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStartDate, setActiveStartDate] = useState('');
    const [activeEndDate, setActiveEndDate] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const [activeMapFocus, setActiveMapFocus] = useState<[number, number] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [tickerItems, setTickerItems] = useState<NewsItem[]>([
        {
            id: 'mock-1',
            templateId: 'tpl-1764398847255',
            status: 'published',
            author: 'Pulse-R24 | Intelligence Sensor',
            createdAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            severity: 'info',
            tags: ['OSINT', 'National'],
            blocks: [{ blockId: 'b1', type: 'title', value: 'Initializing live national intelligence feeds...' }]
        },
        {
            id: 'mock-2',
            templateId: 'tpl-1764398847255',
            status: 'published',
            author: 'Pulse-R24 | Intelligence Sensor',
            createdAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            severity: 'info',
            tags: ['OSINT', 'National'],
            blocks: [{ blockId: 'b1', type: 'title', value: 'Scanning Tier-1 city security signals: Mumbai, Delhi, Bengaluru, Chennai...' }]
        }
    ]);

    const location = useLocation();
    const today = new Date();
    const issueNumber = getIssueNumber();

    const scrollToSection = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // Approximate navbar height
            const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }, []);

    // Pick up ?tag= and ?section= from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tag = params.get('tag');
        setActiveTag(tag ? decodeURIComponent(tag) : '');

        const section = params.get('section');
        if (section) {
            setTimeout(() => scrollToSection(section), 50);
        }
        setCurrentPage(1);
    }, [location.search, scrollToSection]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const conn = await storageService.checkConnection();
            if (!conn.connected) {
                setDbConnected(false);
                setLoading(false);
                return;
            }
            const allItems = await storageService.getNewsItems();
            const now = new Date();
            const published = allItems.filter(i =>
                i.status === 'published' && i.publishedAt && new Date(i.publishedAt) <= now
            ).sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

            setItems(published);
            
            // 2. Fetch Live OSINT for the Ticker (Breaking News)
            try {
                const liveArticles = await osintService.fetchLiveNationalNews();
                // EXCLUSIVE: Ticker now ONLY shows live OSINT news
                setTickerItems(liveArticles);
            } catch (err) {
                console.error('Failed to fetch live OSINT for ticker:', err);
                setTickerItems([]); // Do not fallback to manual uploads
            }

            setLoading(false);
        };
        init();

        // 3. Polling for live news updates every 60 seconds for true "Real-Time" feel
        const tickerInterval = setInterval(async () => {
            try {
                const live = await osintService.fetchLiveNationalNews();
                const currentPublished = await storageService.getNewsItems();
                const now = new Date();
                const published = currentPublished.filter(i =>
                    i.status === 'published' && i.publishedAt && new Date(i.publishedAt) <= now
                );
                
                // EXCLUSIVE: Ticker now ONLY shows live OSINT news
                setTickerItems(live);
            } catch (e) {
                console.warn('Ticker poll failed:', e);
            }
        }, 60000); // 1 minute

        const channel = supabase.channel('public:news_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'news_items' }, () => {
                init();
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(channel);
            clearInterval(tickerInterval);
        };
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(i => {
            const title = i.blocks.find(b => b.type === 'title')?.value?.toString().toLowerCase() || '';
            const body = i.blocks.find(b => b.type === 'markdown')?.value?.toString().toLowerCase() || '';
            const term = activeSearch.toLowerCase();
            const matchesSearch = !term || title.includes(term) || body.includes(term);

            const pubDate = i.publishedAt ? new Date(i.publishedAt) : null;
            let matchesDate = true;
            if (pubDate) {
                if (activeStartDate) {
                    const [y, m, d] = activeStartDate.split('-').map(Number);
                    if (pubDate < new Date(y, m - 1, d)) matchesDate = false;
                }
                if (activeEndDate) {
                    const [y, m, d] = activeEndDate.split('-').map(Number);
                    if (pubDate > new Date(y, m - 1, d, 23, 59, 59)) matchesDate = false;
                }
            }

            const matchesDomain = selectedDomain === 'All' ||
                i.tags?.some(t => t.toLowerCase() === selectedDomain.toLowerCase());

            const matchesTag = !activeTag || i.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase());

            return matchesSearch && matchesDate && matchesDomain && matchesTag;
        });
    }, [items, activeSearch, activeStartDate, activeEndDate, selectedDomain, activeTag]);

    const featuredItem = filteredItems[0] ?? null;

    const paginatedItems = useMemo(() => {
        if (filteredItems.length === 0) return [];
        if (currentPage === 1) {
            return filteredItems.slice(1, 4); // 3 cards below the featured hero
        }
        const start = 4 + (currentPage - 2) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredItems.slice(start, end);
    }, [filteredItems, currentPage]);

    const totalPages = useMemo(() => {
        if (filteredItems.length <= 1) return 1;
        // page 1 holds 1 featured + 3 grid = 4 items total
        const remaining = filteredItems.length - 4;
        if (remaining <= 0) return 1;
        return 1 + Math.ceil(remaining / ITEMS_PER_PAGE);
    }, [filteredItems]);

    useEffect(() => {
        if (paginatedItems.length === 0 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    }, [paginatedItems, currentPage]);

    const handleSearch = async () => {
        setActiveSearch(searchInput);
        setActiveStartDate(startDateInput);
        setActiveEndDate(endDateInput);
        if (searchInput.trim() !== '') {
            setLoading(true);
            const results = await storageService.searchNews(searchInput);
            setItems(results);
            setLoading(false);
        } else {
            const allItems = await storageService.getNewsItems();
            setItems(allItems.filter(i => i.status === 'published'));
        }
        setCurrentPage(1);
    };

    const handleClear = () => {
        setSearchInput(''); setStartDateInput(''); setEndDateInput('');
        setActiveSearch(''); setActiveStartDate(''); setActiveEndDate('');
        setActiveTag('');
        setCurrentPage(1);
    };

    const remainingItems = paginatedItems;

    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getExcerpt = (item: NewsItem) => item.blocks.find(b => b.type === 'excerpt')?.value || '';
    const getImage = (item: NewsItem) => {
        const raw = item.blocks.find(b => b.type === 'image')?.value;
        if (typeof raw === 'string') return { src: raw };
        return raw;
    };
    const getDate = (item: NewsItem) => item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const getDomain = (item: NewsItem) => {
        const domainTag = item.tags?.find(t => isDomainTag(t));
        if (!domainTag) return '';
        return DOMAINS.find(d => d.toLowerCase() === domainTag.toLowerCase()) || domainTag;
    };

    return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />

            {/* ─── HERO SECTION ─── */}
            <section className="min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text Content */}
                        <div className="relative z-10">
                            {/* Section Label */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-px w-10 bg-maroon-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                                <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">
                                    Where the Nation's Pulse Meets Insights
                                </span>
                            </div>

                            <h1 className="font-clarendon text-5xl md:text-6xl xl:text-7xl font-black text-intel-900 leading-none mb-8">
                                Intelligence,<br />
                                <span className="text-maroon-600">Risk</span> and<br />
                                Resilience
                            </h1>

                            <p className="text-gray-600 text-lg leading-relaxed max-w-md mb-10">
                                A forward-looking security intelligence bulletin delivering situational awareness on emerging threats across India's Tier-1 cities.
                            </p>

                            {/* Issue Info */}
                            <div className="flex flex-col gap-2 mb-10 text-sm font-mono text-gray-400">
                                <span>{formatBulletinDate(today)}</span>
                                <span className="text-[11px]">{issueNumber}</span>
                            </div>


                        </div>

                        {/* Right: Live Interactive Threat Map */}
                        <div className="relative flex flex-col items-center justify-center lg:justify-end w-full h-full min-h-[500px]">
                            <ThreatMap items={paginatedItems} flyToArea={activeMapFocus} />
                            
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── STATUS STRIP / LIVE TICKER ─── */}
            <div className="bg-black border-y border-gray-900 h-10 shadow-lg relative overflow-hidden">
                <LiveTicker items={tickerItems.slice(0, 25)} onFlyTo={setActiveMapFocus} />
                
                {/* Overlay for Issue number to keep it visible but out of way of scrolling text */}
                <div className="absolute right-0 top-0 bottom-0 px-6 bg-black/90 backdrop-blur-sm border-l border-gray-800 flex items-center z-10 pointer-events-none">
                    <span className="text-gray-400 font-mono text-[10px] tracking-[0.1em] uppercase">
                        {issueNumber}
                    </span>
                </div>
            </div>

            {/* ─── SEARCH & DOMAIN FILTER ─── */}
            <div id="feed" className="bg-gray-50 border-b border-gray-200 py-6 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        {/* Search */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bulletins..."
                                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 w-52 placeholder-gray-400"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input type="date" className="pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500" value={startDateInput} onChange={e => setStartDateInput(e.target.value)} />
                            </div>
                            <span className="text-gray-400 text-sm">to</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input type="date" className="pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500" value={endDateInput} onChange={e => setEndDateInput(e.target.value)} />
                            </div>
                            <button onClick={handleSearch} className="px-5 py-2 bg-maroon-600 hover:bg-maroon-700 text-white text-sm font-semibold uppercase tracking-wider transition-colors">
                                Search
                            </button>
                            {(activeSearch || activeStartDate || activeEndDate) && (
                                <button onClick={handleClear} className="px-3 py-2 border border-gray-300 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Domain Filter Bar */}
                    <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-gray-100">
                        {DOMAINS.map(domain => (
                            <button
                                key={domain}
                                onClick={() => {
                                    setSelectedDomain(domain);
                                    setCurrentPage(1);
                                }}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${selectedDomain === domain
                                        ? 'bg-maroon-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-maroon-50 hover:text-maroon-700 border border-gray-200'
                                    }`}
                            >
                                {domain}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                {currentPage === 1 && featuredItem && (
                    <>
                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-12">
                            <div className="h-px w-10 bg-maroon-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                            <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">Latest Intelligence Briefs</span>
                            {!loading && <span className="ml-auto text-xs font-mono text-gray-400">{filteredItems.length} bulletins</span>}
                        </div>

                        {featuredItem && (
                            <Link
                                key={featuredItem.id}
                                to={`/news/${featuredItem.id}`}
                                className="group flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-center mb-16"
                            >
                                {/* Image */}
                                <div className="overflow-hidden rounded-sm mb-5 md:mb-0">
                                    {getImage(featuredItem) ? (
                                        <img
                                            src={getImage(featuredItem)!.src}
                                            alt={getImage(featuredItem)!.caption}
                                            className="w-full object-cover group-hover:scale-105 transition-transform duration-500 h-64 sm:h-72 md:h-80"
                                        />
                                    ) : (
                                        <div className="w-full bg-intel-800 flex items-center justify-center h-64 sm:h-72 md:h-80">
                                            <span className="font-mono text-intel-400 text-sm uppercase tracking-widest">Intelligence Brief</span>
                                        </div>
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col py-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-px w-8 bg-maroon-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                                        <span className="text-xs text-maroon-600 font-mono uppercase tracking-widest font-semibold">Featured Report</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        {getDomain(featuredItem) && <span className="text-maroon-600 font-bold text-xs uppercase tracking-wider">{getDomain(featuredItem)}</span>}
                                        {featuredItem.tags?.filter(t => !isDomainTag(t)).slice(0, 1).map(tag => (
                                            <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5">{tag}</span>
                                        ))}
                                        {featuredItem.meta?.pdfUrl && (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-maroon-600 bg-maroon-50 px-2 py-0.5 rounded border border-maroon-100">
                                                <FileText size={10} /> PDF Bulletin
                                            </span>
                                        )}
                                        <span className="text-xs font-mono text-gray-400 ml-auto">{getDate(featuredItem)}</span>
                                    </div>
                                    <h2 className="text-3xl font-clarendon font-black text-intel-900 group-hover:text-maroon-600 transition-colors mb-4 line-clamp-3">
                                        {getTitle(featuredItem)}
                                    </h2>
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 font-inter">
                                        {featuredItem.blocks.find(b => b.type === 'markdown')?.value as string}
                                    </p>
                                    <div className="flex items-center gap-2 text-maroon-600 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                        Read Full Brief <ChevronRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        )}
                    </>
                )}

                {/* Error / Loading states */}
                {!dbConnected ? (
                    <div className="text-center py-20 border border-dashed border-red-200 bg-red-50">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h2 className="text-xl font-playfair font-bold text-gray-800">System Maintenance</h2>
                        <p className="text-gray-500 mt-2">The intelligence portal is currently undergoing database setup.</p>
                        <Link to="/admin" className="text-maroon-600 font-medium hover:underline mt-4 inline-block">Go to Admin Setup</Link>
                    </div>
                ) : loading ? (
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col gap-4">
                                    <div className="aspect-video bg-gray-200 rounded-sm"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-full bg-gray-200 rounded"></div>
                                    <div className="h-6 w-4/5 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-200">
                        <p className="text-gray-500">No bulletins found matching your criteria.</p>
                        <button onClick={() => { handleClear(); setSelectedDomain('All'); }} className="mt-4 text-maroon-600 font-medium hover:underline">
                            Clear all filters
                        </button>
                    </div>
                ) : paginatedItems.length === 0 && currentPage > 1 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No more articles. <button onClick={() => setCurrentPage(1)} className="text-[#8b0000] underline">Go to page 1</button>
                    </div>
                ) : (
                    <div id="news-grid" className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                        {remainingItems.map((item) => {
                            const image = getImage(item);
                            const domain = getDomain(item);
                            return (
                                <Link
                                    key={item.id}
                                    to={`/news/${item.id}`}
                                    className="group flex flex-col"
                                >
                                    {/* Image */}
                                    <div className="overflow-hidden rounded-sm mb-5">
                                        {image ? (
                                            <img
                                                src={image.src}
                                                alt={image.caption}
                                                className="w-full object-cover group-hover:scale-105 transition-transform duration-500 h-52"
                                            />
                                        ) : (
                                            <div className="w-full bg-intel-800 flex items-center justify-center h-52">
                                                <span className="font-mono text-intel-400 text-sm uppercase tracking-widest">Intelligence Brief</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            {domain && <span className="text-maroon-600 font-bold text-xs uppercase tracking-wider">{domain}</span>}
                                            {item.tags?.filter(t => !isDomainTag(t)).slice(0, 1).map(tag => (
                                                <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5">{tag}</span>
                                            ))}
                                            {item.meta?.pdfUrl && (
                                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-maroon-600 bg-maroon-50 px-2 py-0.5 rounded border border-maroon-100">
                                                    <FileText size={10} /> PDF
                                                </span>
                                            )}
                                            <span className="text-xs font-mono text-gray-400 ml-auto">{getDate(item)}</span>
                                        </div>
                                        <h3 className="font-playfair font-bold text-gray-900 leading-tight mb-3 group-hover:text-maroon-700 transition-colors text-xl line-clamp-3">
                                            {getTitle(item)}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-5">{getExcerpt(item)}</p>
                                        {/* MitKat style "read more" link */}
                                        <div className="flex items-center gap-3 text-maroon-600 group-hover:text-maroon-800 transition-colors">
                                            <div className="h-px w-8 bg-maroon-500 group-hover:w-12 transition-all duration-300"></div>
                                            <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                                            <span className="text-xs font-semibold uppercase tracking-widest">Read Full Brief</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 mb-6 flex-wrap">
                        {/* Prev Button */}
                        <button
                            onClick={() => {
                                setCurrentPage(p => p - 1);
                                scrollToSection('news-grid');
                            }}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded border text-sm font-semibold
                                        disabled:opacity-30 disabled:cursor-not-allowed
                                        hover:bg-[#8b0000] hover:text-white hover:border-[#8b0000]
                                        transition-colors border-gray-300 text-gray-800 bg-white
                                        dark:bg-slate-800 dark:text-white dark:border-slate-600"
                        >
                            ← Prev
                        </button>

                        {/* Page Number Buttons with Ellipsis - Desktop only */}
                        <div className="hidden sm:flex items-center gap-2">
                            {(() => {
                                const pages: (number | string)[] = [];
                                if (totalPages <= 7) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    pages.push(1);
                                    if (currentPage > 3) pages.push('...');
                                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                        pages.push(i);
                                    }
                                    if (currentPage < totalPages - 2) pages.push('...');
                                    pages.push(totalPages);
                                }
                                return pages.map((page, idx) =>
                                    page === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => {
                                                setCurrentPage(page as number);
                                                scrollToSection('news-grid');
                                            }}
                                            className={`w-9 h-9 rounded text-sm font-bold border transition-colors
                                            ${currentPage === page
                                                    ? 'bg-[#8b0000] text-white border-[#8b0000]'
                                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-[#8b0000] hover:text-white hover:border-[#8b0000] dark:bg-slate-800 dark:text-white dark:border-slate-600'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                );
                            })()}
                        </div>

                        {/* Current Page Info - Mobile only */}
                        <div className="flex sm:hidden items-center px-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                            Page {currentPage} of {totalPages}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => {
                                setCurrentPage(p => p + 1);
                                scrollToSection('news-grid');
                            }}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded border text-sm font-semibold
                                        disabled:opacity-30 disabled:cursor-not-allowed
                                        hover:bg-[#8b0000] hover:text-white hover:border-[#8b0000]
                                        transition-colors border-gray-300 text-gray-800 bg-white
                                        dark:bg-slate-800 dark:text-white dark:border-slate-600"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </main>

            {/* About section */}
            <section id="about" className="bg-white border-t border-gray-100 py-24">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px w-10 bg-maroon-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">About PULSE-R24</span>
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 leading-tight border-l-4 border-maroon-600 pl-6 py-2">
                                INDIA'S FIRST INTELLIGENCE PRODUCT DELIVERED BY STUDENTS UNDER THE GUIDANCE OF SECURITY LEADERS AND PROFESSIONALS
                            </h2>
                            
                            <p className="text-gray-600 text-lg leading-relaxed">
                                The Pulse-R24 is a structured, forward-looking intelligence product presented by the International Society for Security Professionals (ISSP) in collaboration with the students of Rashtriya Raksha University (RRU), Puducherry Campus, enrolled in the PGDM program in Security and Corporate Intelligence Management. Delivered each morning, the bulletin focuses on identifying emerging risks, early warning indicators, and upcoming developments that may impact organizational stability, business operations, and sectoral continuity.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 border-y border-gray-100">
                            <div className="space-y-4">
                                <h3 className="font-playfair text-xl font-bold text-maroon-800 uppercase tracking-wide">Evolution of Resilience</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    PULSE-R24 represents a significant evolution in business continuity and resilience management for Indian enterprises. Moving beyond conventional risk assessment models and static response frameworks, it delivers real-time, actionable intelligence across multiple critical risk vectors, aligned with an organization’s operational footprint and threat landscape.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-playfair text-xl font-bold text-maroon-800 uppercase tracking-wide">Strategic Impact</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    By integrating continuous monitoring with analytical prioritization, the platform enhances situational awareness, enables proactive risk mitigation, and supports informed executive decision-making to minimize operational and reputational disruptions. The launch of PULSE-R24 in partnership with ISSP underscores a strong commitment to bridging academia and industry.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8 bg-gray-50 p-8 md:p-12 rounded-3xl">
                            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-6">Leadership & Mentorship</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-2">
                                    <h4 className="text-maroon-700 font-bold uppercase tracking-widest text-xs">Visionary Leadership</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">Mr. John Paul Manickam</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">Distinguished professional in corporate security. His forward-looking approach and deep domain expertise have been central to shaping the foundation and direction of this platform.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-maroon-700 font-bold uppercase tracking-widest text-xs">Strategic Support</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">Mr. Rahul Ethirajan</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">Strategic insights and consistent guidance have contributed significantly to the relevance and execution of this bulletin.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-maroon-700 font-bold uppercase tracking-widest text-xs">Institutional Framework</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">Mr. Arsh Ganeshan</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">Campus Director, whose administrative vision and emphasis on academic excellence provide a strong institutional framework.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-maroon-700 font-bold uppercase tracking-widest text-xs">Academic Mentorship</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">Mr. Sharuhasan Shankar</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">Course Coordinator, ensuring the bulletin maintains high analytical standards and professional quality through hands-on mentorship.</p>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-200">
                                <p className="text-gray-600 text-sm italic leading-relaxed">
                                    A central role has been played by the students of RRU, Puducherry Campus, from the SCIM program. Their dedication, analytical rigor, and collaborative approach have been instrumental in delivering depth, accuracy, and consistency to the bulletin.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-8">
                            <h3 className="font-playfair text-2xl font-bold text-gray-900">About Rashtriya Raksha University (RRU)</h3>
                            <p className="text-gray-600 text-md leading-relaxed">
                                Rashtriya Raksha University (RRU), Puducherry Campus, is a premier institution dedicated to advancing education, research, and capacity building in the domains of national security, policing, and strategic studies. As an Institution of National Importance, RRU contributes significantly to strengthening India’s internal security framework by developing skilled professionals capable of addressing evolving security challenges across public and private sectors.
                            </p>
                            <p className="text-gray-600 text-md leading-relaxed">
                                The Puducherry Campus reflects this mandate through a multidisciplinary learning environment that integrates academic rigor with practical application. Its PGDM program in Security and Corporate Intelligence Management is designed to build expertise in risk analysis, corporate security strategy, and intelligence-led decision-making, aligned with contemporary industry requirements.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
