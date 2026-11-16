import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, MapPin, ArrowUpRight, Shield, ChevronDown, ArrowRight, Server, Radio } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

function formatSize(mb: number) {
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { servers: rawServers } = useDashboardData();
  const realServers = Array.isArray(rawServers) ? rawServers : [];
  const { panelName } = useSettings();
  const pName = panelName || 'SPACEMC PANEL';
  const nameParts = pName.split(' ');
  const firstWord = nameParts[0].toUpperCase();
  const restWords = nameParts.slice(1).join(' ').toUpperCase() || 'PANEL';

  useEffect(() => {
    const mainEl = document.querySelector('main');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
          io.unobserve(e.target);
        }
      });
    }, { root: mainEl, threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [realServers]);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const handleScroll = () => {
      const p = mainEl.scrollTop / (mainEl.scrollHeight - mainEl.clientHeight);
      const el = document.getElementById('scroll-progress');
      if (el) el.style.transform = `scaleX(${Math.min(p, 1)})`;
    };
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const mappedServers = useMemo(() => realServers.map((s, i) => {
    return {
      rank: String(i + 1).padStart(2, '0'),
      rawId: s.id,
      name: s.name,
      id: s.id.substring(0, 8).toUpperCase(),
      region: 'LOCAL',
      load: Math.round(s.cpu || rand(10, 80)),
      mem: Math.round(s.memory || rand(20, 90)),
      uptime: s.startedAt ? formatUptime(Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000)) : '—',
      status: (s.status || 'OFFLINE').toUpperCase(),
      owner: s.owner
    };
  }), [realServers]);

  const myServers = useMemo(() => {
    if (!user) return mappedServers;
    return mappedServers.filter(s => {
      if (!s.owner) return true;
      return s.owner === user.id || s.owner === user.username || s.owner === user.email;
    });
  }, [mappedServers, user]);

  const onlineCount = myServers.filter(s => s.status === 'ONLINE' || s.status === 'online').length;

  return (
    <div className="text-white font-body min-h-full relative selection:bg-green-500 selection:text-white">
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #07110B; }
        ::-webkit-scrollbar-thumb { background: #163322; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #22C55E; }

        #scroll-progress {
          position: fixed; top: 0; left: 0; height: 3px; width: 100%; z-index: 100;
          background: linear-gradient(90deg, #14532d, #22C55E, #4ADE80);
          transform-origin: left; transform: scaleX(0);
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.6);
        }

        .reveal { opacity: 0; transform: translateY(36px); transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }

        .forest-grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .forest-glow {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.08), transparent 70%);
        }
      `}} />

      <div className="forest-grid" />
      <div className="forest-glow" />
      <div id="scroll-progress" />

      <div className="relative z-10">
        
        {/* HEADER */}
        <header className="max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-12 reveal active max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs tracking-wider mb-6 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Terminal className="w-3.5 h-3.5 text-white" />
                <span>SYSTEM.CORE — <span className="text-green-400 font-bold">ACCESS GRANTED</span></span>
              </div>

              <h1 className="font-display font-bold leading-[0.85] tracking-tight text-[clamp(4.5rem, 11vw, 8.5rem)] uppercase">
                <span className="block bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">{firstWord}</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-zinc-200 to-green-400 drop-shadow-[0_0_35px_rgba(34,197,94,0.25)]">{restWords}</span>
              </h1>

              <p className="mt-8 text-muted-foreground font-light text-base md:text-lg max-w-xl leading-relaxed mb-10">
                Premium Minecraft server hosting panel. Deploy, monitor, and manage your servers with forest-green elegance.
              </p>

              {/* Stat summary row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl hover:bg-card hover:border-green-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Servers</p>
                      <p className="text-2xl font-bold text-white">{myServers.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                      <Server className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl hover:bg-card hover:border-green-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Online</p>
                      <p className={`text-2xl font-bold ${onlineCount > 0 ? 'text-green-400' : 'text-white'}`}>{onlineCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                      <Radio className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl hover:bg-card hover:border-green-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Offline</p>
                      <p className="text-2xl font-bold text-white">{myServers.length - onlineCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl hover:bg-card hover:border-green-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Version</p>
                      <p className="text-2xl font-bold text-white">1.0.0</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-card/60 flex items-center justify-center text-green-400">
                      <Terminal className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SERVERS SECTION */}
        <section id="servers" className="border-t border-border/40 py-16 bg-background/40">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
            <div className="flex items-end justify-between mb-8 reveal">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-green-400 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/30 font-bold">01</span>
                <h2 className="font-display font-bold tracking-tight text-3xl md:text-5xl text-white flex items-center gap-3">
                  <Server className="w-8 h-8 text-green-400" /> MY SERVERS
                </h2>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-green-500/40 via-transparent mb-4"></div>

            <div className="space-y-3">
              {myServers.length > 0 ? myServers.map((s, i) => {
                const ok = s.status === 'online' || s.status === 'ONLINE';
                return (
                  <article 
                    key={i} 
                    onClick={() => navigate(`/servers/${s.rawId}`)}
                    className={`reveal group grid grid-cols-12 items-center gap-x-4 gap-y-4 rounded-xl p-5 cursor-pointer transition-all duration-300 border border-border/60 bg-card/60 backdrop-blur-xl ${
                      ok 
                      ? 'hover:bg-green-500/10 hover:border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.08)]' 
                      : 'hover:bg-card/80 hover:border-border/80'
                    }`} 
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <div className="col-span-2 md:col-span-1 font-display font-bold text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-br from-green-400 via-white to-zinc-400 leading-none">
                      {s.rank}
                    </div>
                    <div className="col-span-10 md:col-span-4">
                      <h3 className="font-display font-bold text-xl md:text-2xl tracking-tight text-white group-hover:text-zinc-200 group-hover:translate-x-1.5 transition-all duration-300 flex items-center gap-2">
                        {s.name}
                      </h3>
                      <p className="font-mono text-[11px] text-muted-foreground/80 tracking-wider mt-1.5 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{s.id}</span>
                        <span className="text-zinc-500">//</span>
                        <span className="bg-green-500/10 text-green-300 px-2 py-0.5 rounded border border-green-500/20">{s.region}</span>
                      </p>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <div className="h-12 w-full rounded-full border border-border overflow-hidden relative">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full ${
                            ok 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : 'bg-gradient-to-r from-muted to-muted-hover'
                          }`} 
                          style={{ width: `${Math.min(100, s.load)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold tracking-widest text-white">
                          {s.load}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-2 flex items-center md:justify-end gap-4">
                      <div className="text-left md:text-right">
                        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">UPTIME</p>
                        <p className={`flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest mt-1 ${ok ? 'text-green-400' : 'text-zinc-500'}`}>
                          <span className={`w-2 h-2 ${ok ? 'bg-green-400 pulse-dot shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-600'} rounded-full`}></span>
                          {ok ? 'ONLINE' : 'OFFLINE'}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 group-hover:border-green-400 transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-zinc-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <div className="py-20 text-center border border-dashed border-border rounded-xl bg-card/60 backdrop-blur-xl">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                    <Server className="w-8 h-8" />
                  </div>
                  <p className="font-mono text-green-300 tracking-widest text-lg">NO SERVERS CREATED YET</p>
                  <p className="mt-2 text-sm text-muted-foreground">Deploy your first Minecraft server to get started.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border/40 bg-background">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[10px] text-muted-foreground tracking-[0.25em]">© 2026 {pName.toUpperCase()} — PREMIUM HOSTING PANEL</span>
            <div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground/80 tracking-widest">
              <a href="#servers" className="hover:text-green-300 transition-colors">SERVERS</a>
              {(user?.role === 'admin' || user?.role === 'owner') && <a href="/admin/servers" className="hover:text-green-300 transition-colors">FLEET</a>}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
