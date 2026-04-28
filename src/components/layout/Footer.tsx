import React, { useState } from 'react';
import { Globe, Linkedin, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
    const today = new Date();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        if (!valid) {
            setIsError(true);
            setMessage('Please enter a valid email address.');
            return;
        }
        setIsError(false);
        setMessage('Subscription request received.');
        setEmail('');
    };

    return (
        <footer style={{ backgroundColor: '#070B24' }} className="border-t border-white/5 mt-20 pt-20 pb-10 font-inter text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                    
                    {/* Column 1: Brand & About */}
                    <div className="md:col-span-5 space-y-8">
                        <div>
                            <h2 className="font-clarendon text-4xl font-black text-maroon-600 mb-2">PULSE-R<sup className="text-2xl">24</sup></h2>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Puducherry Campus Intelligence Initiative</p>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed max-w-md">
                            A forward-looking security intelligence bulletin delivering situational awareness on emerging risks impacting business continuity and organizational resilience across India's Tier-1 cities.
                        </p>
                        <div className="pt-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Subscribe to Intel Briefs</p>
                            <form onSubmit={handleSubscribe} className="flex max-w-sm group">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-white/5 border border-white/10 rounded-l-md px-4 py-3 w-full text-sm text-white placeholder-white/20 focus:bg-white/10 focus:border-maroon-500/50 transition-all outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-maroon-600 hover:bg-maroon-700 text-white text-[11px] font-black uppercase tracking-widest rounded-r-md transition-all active:scale-95"
                                >
                                    Join
                                </button>
                            </form>
                            {message && (
                                <p className={`mt-3 text-[10px] font-medium tracking-wide ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Initiatives & Teams */}
                    <div className="md:col-span-4 space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-8 bg-maroon-500/30"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Initiative</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="group flex gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 p-2 border border-white/10 group-hover:border-maroon-500/50 transition-all shadow-inner overflow-hidden">
                                        <img src="/logos/pgdscim-logo.png" alt="PGDSCIM Logo" className="w-full h-full object-contain filter brightness-110" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-snug">
                                            Post Graduate Diploma in Security and Corporate Intelligence Management
                                        </p>
                                        <p className="text-[11px] text-white/30 mt-1.5 font-medium">Batch of 2025-2026</p>
                                        <p className="text-[10px] text-maroon-500/80 mt-1 font-bold uppercase tracking-wider">Rashtriya Raksha University, Puducherry Campus</p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5 group flex gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 p-2 border border-white/10 group-hover:border-maroon-500/50 transition-all shadow-inner overflow-hidden">
                                        <img src="/logos/cyber-logo.png" alt="Cyber Security Logo" className="w-full h-full object-contain filter brightness-110" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Technical Execution</p>
                                        <p className="text-sm font-semibold text-white/80 leading-snug">
                                            Post Graduate Diploma in Cyber Security and Digital Forensics
                                        </p>
                                        <p className="text-[11px] text-white/30 mt-1.5 font-medium">Batch of 2025-2026</p>
                                        <p className="text-[10px] text-maroon-500/80 mt-1 font-bold uppercase tracking-wider">Rashtriya Raksha University, Puducherry Campus</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Governance & Connect */}
                    <div className="md:col-span-3 space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-8 bg-blue-500/30"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Governance</h3>
                            </div>
                            <div className="flex gap-4 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 p-1.5 border border-white/10 group-hover:border-blue-500/50 transition-all overflow-hidden">
                                    <img src="/logos/issp-logo.png" alt="ISSP Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Guided By</p>
                                    <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">ISSP</p>
                                    <p className="text-[11px] text-white/40 leading-tight">International Society for Security Professionals</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-8 bg-emerald-500/30"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Connect</h3>
                            </div>
                            <nav className="flex flex-col gap-3">
                                <a href="mailto:editorial@pulser24.in" className="text-[13px] text-white/50 hover:text-maroon-500 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-maroon-500 transition-colors"></span>
                                    Contact Editorial
                                </a>
                                <a href="#/admin" className="text-[13px] text-white/50 hover:text-maroon-500 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-maroon-500 transition-colors"></span>
                                    Admin Portal
                                </a>
                            </nav>
                            <div className="flex gap-4 pt-4">
                                <a href="https://rru.ac.in" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:bg-maroon-600 hover:text-white transition-all shadow-inner"><Globe size={16} /></a>
                                <a href="https://www.linkedin.com/company/rashtriya-raksha-university-puducherry-campus/posts/?feedView=all" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:bg-maroon-600 hover:text-white transition-all shadow-inner"><Linkedin size={16} /></a>
                                <a href="https://www.instagram.com/rru.puducherrycampus/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:bg-maroon-600 hover:text-white transition-all shadow-inner"><Instagram size={16} /></a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center md:text-left">
                            © {today.getFullYear()} PULSE-R24 Intelligence Network. All rights reserved.
                        </p>
                        <p className="text-[9px] text-white/10 uppercase tracking-widest text-center md:text-left">
                            AN INSTITUTIONAL INTELLIGENCE PRODUCT • FOR INFORMATIONAL PURPOSES ONLY
                        </p>
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/20">
                        <a href="#/privacy" className="hover:text-maroon-500 transition-colors">Privacy</a>
                        <a href="#/terms" className="hover:text-maroon-500 transition-colors">Terms</a>
                        <a href="#/security" className="hover:text-maroon-500 transition-colors">Security</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
