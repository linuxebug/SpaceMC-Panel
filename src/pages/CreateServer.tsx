import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import CategorizedVersionDropdown from "../components/CategorizedVersionDropdown";
import { getJavaVersionForMinecraft } from "../utils/minecraftJava";
import {
  ArrowLeft, Server, AlertTriangle, AlignLeft, MemoryStick as MemoryStickIcon,
  Cpu, Zap, Sparkles, HardDrive, Globe, User, Radio, GitBranch, Check,
  ChevronDown, Search, Rocket, SlidersHorizontal, FastForward, Network,
  Wrench, Feather, Info, Code2, TerminalSquare, Lock
} from "lucide-react";

const RAM = [
  {v:1,label:'Small Testing Server'},{v:2,label:'Small Testing Server'},{v:4,label:'Starter Survival'},
  {v:8,label:'Medium Survival Server'},{v:16,label:'Large Community Server'},
  {v:24,label:'Heavy Modpack Server'},{v:32,label:'High-Traffic Network'},
  {v:48,label:'Enterprise Workload'},{v:64,label:'Extreme Performance'},
];
const CPU_MAP: Record<number, number> = {1:100,2:100,4:150,8:200,16:300,24:400,32:500,48:700,64:800};

const MINECRAFT_SOFTWARE = [
  {id:'paper',name:'Paper',desc:'High Performance',icon: Zap},
  {id:'spigot',name:'Spigot',desc:'Classic Plugins',icon: Wrench},
  {id:'fabric',name:'Fabric',desc:'Lightweight Mods',icon: Feather},
  {id:'forge',name:'Forge',desc:'Classic Modpack',icon: Wrench},
  {id:'bungeecord',name:'BungeeCord',desc:'Classic Proxy',icon: Network},
  {id:'velocity',name:'Velocity',desc:'Next-gen Proxy',icon: FastForward}
];

const APPLICATION_SOFTWARE = [
  {id:'nodejs',name:'Node.js',desc:'JS / TS Runtime & Discord Bots',icon: Code2},
  {id:'python',name:'Python',desc:'Python 3.x Runtime & Scripts',icon: TerminalSquare}
];

const SOFTWARE = [...MINECRAFT_SOFTWARE, ...APPLICATION_SOFTWARE];

const STEPS = ['IDENTITY','RESOURCES','ACCESS','SOFTWARE','REVIEW'];

function CustomDropdown({ value, options, onChange, renderValue, renderOption, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = options.filter((o: any) => 
    (o.label || o.name || o.value || o.v || '').toString().toLowerCase().includes(search.toLowerCase())
  );
  
  const selected = options.find((o: any) => (o.value || o.v) === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3 text-left text-white transition-all hover:bg-card/80 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500/30"
      >
        <span className="flex items-center gap-3 min-w-0">
          {selected ? renderValue(selected) : <span className="text-muted-foreground">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]xl shadow-[0_0_15px_rgba(34,197,94,0.3)]lack/50">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                autoFocus
                className="w-full bg-background border border-border pl-8 pr-2 py-2 text-sm outline-none text-white transition-colors placeholder:text-muted-foreground/50"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length > 0 ? filtered.map((o: any, i: number) => {
               const val = o.value || o.v;
               const isSel = val === value;
               return (
                 <div key={i} onClick={() => { onChange(val); setOpen(false); setSearch(''); }}>
                   {renderOption(o, isSel)}
                 </div>
               );
            }) : <p className="px-3 py-3 text-[11px] text-muted-foreground font-mono">NO RESULTS</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const getInitials = (name: string) => name ? name.slice(0, 2).toUpperCase() : '??';

import { useSettings } from '../context/SettingsContext';

export default function CreateServer() {
  const { defaultRuntime, isDevPanel } = useSettings();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [nodes, setNodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [deployed, setDeployed] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [nameError, setNameError] = useState(false);
  const [dir, setDir] = useState('forward');
  
  const [portStatus, setPortStatus] = useState('idle');
  const portCheckIdRef = useRef(0);
  
  const [state, setState] = useState({
    name: '', desc: '', ram: 4, cpu: 150, disk: 10, ip: '', port: 25565, runtimeType: defaultRuntime || 'docker', 
    owner: user?.id || '', node: '', software: 'paper', version: '26.3', auto: true
  });

  useEffect(() => {
    if (defaultRuntime) {
      setState(s => ({ ...s, runtimeType: defaultRuntime }));
    }
  }, [defaultRuntime]);

  useEffect(() => {
    if (currentStep < 2) return;
    
    if (!state.port || state.port <= 0 || state.port > 65535) {
      setPortStatus('invalid');
      return;
    }
    
    const checkId = ++portCheckIdRef.current;
    setPortStatus('checking');
    
    const timer = setTimeout(() => {
      axios.get(`/api/servers/check-port?port=${state.port}`)
        .then(res => {
          if (checkId === portCheckIdRef.current) {
            setPortStatus(res.data.inUse ? 'used' : 'available');
          }
        })
        .catch(() => {
          if (checkId === portCheckIdRef.current) {
            setPortStatus('error');
          }
        });
    }, 400);
    
    return () => clearTimeout(timer);
  }, [state.port, currentStep]);

  useEffect(() => {
    axios.get("/api/nodes").then((res) => {
      setNodes(res.data);
      if (res.data.length > 0 && !state.node) {
        setState(s => ({ ...s, node: res.data[0].id }));
      }
    }).catch(() => {});
    
    if (user?.role === "admin" || user?.role === "owner") {
      axios.get("/api/auth/users").then((res) => setUsers(res.data)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setState(s => ({ ...s, version: '' }));
    axios.get(`/api/system/versions?type=${state.software}`).then((res) => {
      const v = Array.isArray(res.data) ? res.data : (res.data.versions || []);
      setVersions(v);
      if (v.length > 0) {
        setState(s => ({ ...s, version: v[0] }));
      }
    }).catch(() => {
      setVersions(['latest']);
      setState(s => ({ ...s, version: 'latest' }));
    });
  }, [state.software]);

  const updateState = (key: string, val: any) => {
    setState(prev => ({ ...prev, [key]: val }));
  };

  const handleRamClick = (ramVal: number) => {
    let newCpu = state.cpu;
    if (state.auto) {
      newCpu = CPU_MAP[ramVal] || 100;
    }
    setState(prev => ({ ...prev, ram: ramVal, cpu: newCpu }));
  };

  const handleAutoToggle = () => {
    const nextAuto = !state.auto;
    setState(prev => ({ 
      ...prev, 
      auto: nextAuto, 
      cpu: nextAuto ? (CPU_MAP[prev.ram] || 100) : prev.cpu 
    }));
  };

  const [isCheckingPort, setIsCheckingPort] = useState(false);
  const validateStep = async () => {
    if (currentStep === 0 && !state.name.trim()) {
      setNameError(true);
      return false;
    }
    
    if (currentStep === 2) {
      if (!state.port || state.port <= 0 || state.port > 65535) {
        alert("Please enter a valid Server Port (1-65535).");
        return false;
      }
      if (portStatus === 'used') {
        alert("Port is already in use by another server.");
        return false;
      }
      if (portStatus === 'checking') {
        return false;
      }
      if (portStatus === 'error') {
        alert("Could not verify this port. Try again.");
        return false;
      }
    }
    return true;
  };

  const showStep = (n: number) => {
    setDir(n > currentStep ? 'forward' : 'back');
    setCurrentStep(n);
    setMaxVisited(Math.max(maxVisited, n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;
    if (currentStep < STEPS.length - 1) {
      showStep(currentStep + 1);
    } else {
      launch();
    }
  };
  
  const launch = async () => {
    if (deployed) return;
    setDeployProgress(1);
    
    const iv = setInterval(() => {
      setDeployProgress(p => Math.min(90, p + Math.random() * 8 + 2));
    }, 280);
    
    try {
      const payload = {
        name: state.name,
        description: state.desc,
        ram: state.ram,
        cpuLimit: state.cpu,
        diskLimit: state.disk,
        port: state.port,
        ipAlias: state.ip,
        type: state.software,
        version: state.version,
        ownerId: state.owner || user?.id, runtimeType: state.runtimeType,
        nodeId: state.node
      };
      await axios.post("/api/servers", payload);
      
      clearInterval(iv);
      setDeployProgress(100);
      
      setTimeout(() => {
        setDeployed(true);
      }, 500);
      
      setTimeout(() => {
        navigate("/servers");
      }, 2500);
      
    } catch (e: any) {
      clearInterval(iv);
      setDeployProgress(0);
      alert(e.response?.data?.error || "Failed to deploy container");
    }
  };

  const renderReviewRow = (k: string, v: string) => (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/50 last:border-0">
      <span className="text-[11px] font-mono text-muted-foreground tracking-widest">{k}</span>
      <span className="text-right font-mono text-white truncate">{v}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-green-500/30">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full max-h-[800px] bg-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-green-800/10 blur-[100px] rounded-full" />
        <div className="absolute left-0 bottom-0 w-72 h-72 bg-green-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
            <button onClick={() => navigate('/servers')} className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted-foreground hover:text-white transition-colors border border-border/60 px-3 py-1.5 rounded-xl hover:bg-card/60">
              <ArrowLeft className="w-3.5 h-3.5" /> INSTANCES
            </button>
            <Link to="/" className="flex items-center gap-3 group">
              <span className="font-display font-bold text-lg tracking-wide text-white">SPACEMC <span className="text-green-400 font-medium">PANEL</span></span>
              <div className="w-7 h-7 bg-green-600 flex items-center justify-center rounded-lg group-hover:rotate-45 transition-transform duration-500">
                <div className="w-3.5 h-3.5 bg-background"></div>
              </div>
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-5 pt-12 pb-16 relative z-10">
          <header className="mb-10">
            <p className="font-mono text-[11px] tracking-[0.3em] text-green-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot"></span> DEPLOY INSTANCE
            </p>
            <h1 className="font-display font-bold tracking-tight text-4xl md:text-5xl text-white uppercase">Deploy Instance</h1>
          </header>

          {/* Stepper */}
          <div className="mb-6">
            <div className="flex items-start">
              {STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center flex-shrink-0" style={{ width: '56px' }}>
                    <button 
                      type="button" 
                      onClick={() => { if (i <= maxVisited && i !== currentStep && !deployed) showStep(i); }}
                      className={`dot font-mono ${i < currentStep ? 'bg-green-500 text-white border-green-500' : i === currentStep ? 'border-green-500 text-green-400' : 'text-muted-foreground border-border'}`}
                    >
                      {i < currentStep ? <Check className="w-4 h-4 stroke-[3]" /> : String(i + 1).padStart(2, '0')}
                    </button>
                    <span className="hidden sm:block mt-2 font-mono text-[9px] tracking-widest text-muted-foreground text-center">
                      {s}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-border/50 mt-[19px] mx-1 relative">
                      <div className="conn-fill" style={{ width: i < currentStep ? '100%' : '0%' }} className="h-full bg-green-500 transition-all duration-500"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="sm:hidden mt-4 font-mono text-[11px] tracking-widest text-muted-foreground text-center">
              STEP {currentStep + 1} OF {STEPS.length} — {STEPS[currentStep]}
            </p>
          </div>

          <div className="relative border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-9 mt-6 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]l">
            <div className={`${dir === 'forward' ? 'animate-qx-enter-right' : 'animate-qx-enter-left'}`}>
              
              {/* STEP 1: IDENTITY */}
              {currentStep === 0 && (
                <div className="step-content">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-xs text-green-400">01</span>
                    <h2 className="font-display font-bold tracking-wide text-sm text-white">IDENTITY</h2>
                    <span className="flex-1 h-px bg-border/50"></span>
                  </div>
                  
                  <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                    <Server className="w-4 h-4 text-green-400" /> Instance Name <span className="text-white">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`bg-card border border-border rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500/20 ${nameError ? 'border-red-500' : ''}`}
                    placeholder="e.g. Production Survival" 
                    value={state.name}
                    onChange={(e) => { updateState('name', e.target.value); setNameError(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNext(); } }}
                  />
                  {nameError && (
                    <p className="mt-2 text-xs text-red-400 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Instance name is required.
                    </p>
                  )}

                  <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5 mt-7">
                    <AlignLeft className="w-4 h-4 text-green-400" /> Description
                  </label>
                  <textarea 
                    className="bg-card border border-border rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
                    style={{ resize: 'vertical', minHeight: '96px' }}
                    placeholder="Short description of this server (optional)"
                    value={state.desc}
                    onChange={(e) => updateState('desc', e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 mb-7 font-mono">Helps your team identify this instance later.</p>

                  <label className="flex items-center justify-between text-sm text-muted-foreground mb-2.5">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-green-400" /> Execution Runtime
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                      <Lock className="w-3 h-3" /> Main Panel (Locked)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!isDevPanel}
                      onClick={() => {
                        if (isDevPanel) updateState('runtimeType', 'docker');
                      }}
                      className={`sel-card p-4 text-left flex flex-col justify-between rounded-xl border transition-all ${
                        state.runtimeType === 'docker' ? 'border-green-500 bg-green-500/5' : 'border-border/60'
                      } ${!isDevPanel ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-green-500'}`}
                    >
                      <span className="tick"><Check className="w-3 h-3 stroke-[3]" /></span>
                      <div>
                        <div className="font-display font-bold text-sm text-white flex items-center gap-2">
                          Docker Container
                          {state.runtimeType === 'docker' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase flex items-center gap-1 ${!isDevPanel ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-green-500 text-white'}`}>
                              {!isDevPanel && <Lock className="w-2.5 h-2.5" />}
                              {isDevPanel ? 'Active' : 'Installed Runtime'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Isolated sandbox environment with full resource limits and terminal support.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={!isDevPanel}
                      onClick={() => {
                        if (isDevPanel) updateState('runtimeType', 'local');
                      }}
                      className={`sel-card p-4 text-left flex flex-col justify-between rounded-xl border transition-all ${
                        state.runtimeType === 'local' ? 'border-green-500 bg-green-500/5' : 'border-border/60'
                      } ${!isDevPanel ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-green-500'}`}
                    >
                      <span className="tick"><Check className="w-3 h-3 stroke-[3]" /></span>
                      <div>
                        <div className="font-display font-bold text-sm text-white flex items-center gap-2">
                          Local Process (Node.js)
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Direct system process execution. Ideal for environments without Docker daemon.
                        </div>
                      </div>
                    </button>
                  </div>
                  {!isDevPanel ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-[11px] text-green-300 flex items-start gap-2.5 font-mono">
                      <Lock className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-white font-semibold">Fixed Installation Runtime:</span>
                        <p className="mt-0.5 text-green-200/80 leading-relaxed">
                          Runtime selection is locked to <strong className="text-green-300 uppercase">{state.runtimeType === 'local' ? 'Local Process' : 'Docker Container'}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-2 font-mono">Select how this unit will be executed on the host.</p>
                  )}
                </div>
              )}

              {/* STEP 2: RESOURCES */}
              {currentStep === 1 && (
                <div className="step-content">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-xs text-green-400">02</span>
                    <h2 className="font-display font-bold tracking-wide text-sm text-white">RESOURCES</h2>
                    <span className="flex-1 h-px bg-border/50"></span>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MemoryStickIcon className="w-4 h-4 text-green-400" /> RAM Allocation (GB)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {RAM.map(r => (
                      <button 
                        key={r.v} 
                        type="button" 
                        onClick={() => handleRamClick(r.v)}
                        className={`sel-card p-4 text-left rounded-xl border transition-all ${
                          r.v === state.ram ? 'border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-border/60 hover:border-border/80'
                        }`}
                      >
                        <span className="tick"><Check className="w-3 h-3 stroke-[3]" /></span>
                        <div className="font-display font-bold text-2xl text-white">
                          {r.v}<span className="text-sm text-muted-foreground ml-1">GB</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{r.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                    <div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                        <Cpu className="w-4 h-4 text-green-400" /> CPU Limit (%)
                      </label>
                      <div className="flex gap-2.5">
                        <div className="relative flex-1">
                          <input 
                            type="number" min="10" 
                            className="bg-card border border-border rounded-xl px-4 py-2.5 text-white font-mono pr-10 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20" 
                            value={state.cpu}
                            onChange={(e) => { updateState('cpu', Number(e.target.value)); updateState('auto', false); }}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">%</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleAutoToggle}
                          className={`px-4 py-3 font-display font-bold text-sm tracking-widest rounded-xl transition-all flex items-center gap-2 whitespace-nowrap border ${state.auto ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-muted-foreground border-border/60'}`}
                        >
                          {state.auto ? <><Zap className="w-4 h-4" /> AUTO</> : <><SlidersHorizontal className="w-4 h-4" /> MANUAL</>}
                        </button>
                      </div>
                      <p className={`text-[11px] mt-2.5 font-mono flex items-center gap-1.5 ${state.auto ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {state.auto 
                          ? <><Sparkles className="w-3.5 h-3.5" /> Auto-optimized for {state.ram}GB</> 
                          : <><SlidersHorizontal className="w-3.5 h-3.5" /> Manual override active</>
                        }
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                        <HardDrive className="w-4 h-4 text-green-400" /> Disk Limit (GB)
                      </label>
                      <input 
                        type="number" min="1" 
                        className="bg-card border border-border rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500/20" 
                        value={state.disk}
                        onChange={(e) => updateState('disk', Number(e.target.value))}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2.5 font-mono flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Storage space allocated to this server.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: NETWORK & ACCESS */}
              {currentStep === 2 && (
                <div className="step-content">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-xs text-green-400">03</span>
                    <h2 className="font-display font-bold tracking-wide text-sm text-white">NETWORK & ACCESS</h2>
                    <span className="flex-1 h-px bg-border/50"></span>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                    <Network className="w-4 h-4 text-green-400" /> Server Port
                  </label>
                  <div className="relative mb-4">
                    <input 
                      type="number" className="bg-card border border-border rounded-xl px-4 py-2.5 font-mono text-white outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500/20 ${portStatus === 'used' || portStatus === 'invalid' ? 'border-red-500' : portStatus === 'available' ? 'border-green-500' : ''}" placeholder="25565" 
                      value={state.port || ''} onChange={e => updateState('port', e.target.value ? Number(e.target.value) : '')}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-widest flex items-center">
                      {portStatus === 'checking' && <span className="text-muted-foreground">CHECKING...</span>}
                      {portStatus === 'available' && <span className="text-green-400">AVAILABLE</span>}
                      {portStatus === 'used' && <span className="text-red-400">IN USE</span>}
                      {portStatus === 'invalid' && <span className="text-red-400">INVALID</span>}
                      {portStatus === 'error' && <span className="text-red-400">ERROR</span>}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground -mt-2 mb-8 font-mono">
                    {portStatus === 'used' ? "This port is already in use." : portStatus === 'invalid' ? "Port must be between 1 and 65535." : portStatus === 'error' ? "Could not verify this port. Try again." : "The main port the server will bind to. Must not be in use."}
                  </p>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                    <Globe className="w-4 h-4 text-green-400" /> IP Alias
                  </label>
                  <input 
                    type="text" className="bg-card border border-border rounded-xl px-4 py-2.5 font-mono text-white outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500/20" placeholder="play.example.com" 
                    value={state.ip} onChange={e => updateState('ip', e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 mb-8 font-mono">Optional custom domain or subdomain used to access your server.</p>

                  {(user?.role === "admin" || user?.role === "owner") && (
                    <>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                        <User className="w-4 h-4 text-green-400" /> Assign Server Owner
                      </label>
                      <CustomDropdown
                        value={state.owner}
                        options={users.map(u => ({ v: u.id, name: u.username, tag: u.role, role: u.role }))}
                        onChange={(v: string) => updateState('owner', v)}
                        placeholder="Select an owner..."
                        renderValue={(o: any) => (
                          <>
                            <span className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center font-display font-bold text-[11px] text-white shrink-0">
                              {getInitials(o.name)}
                            </span>
                            <span className="truncate text-white font-mono text-sm">{o.name} <span className="text-muted-foreground">({o.tag})</span></span>
                          </>
                        )}
                        renderOption={(o: any, sel: boolean) => (
                          <button type="button" className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors rounded-lg ${sel ? 'bg-green-500/10' : 'hover:bg-card/80'}`}>
                            <span className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center font-display font-bold text-[11px] text-white shrink-0">
                              {getInitials(o.name)}
                            </span>
                            <span className="flex-1 text-left font-mono">
                              <span className="block text-sm text-white">{o.name} <span className="text-muted-foreground">({o.tag})</span></span>
                              <span className="block text-[11px] text-muted-foreground">{o.role}</span>
                            </span>
                            {sel && <Check className="w-4 h-4 text-white" />}
                          </button>
                        )}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2 mb-8 font-mono">Select which user owns and has access to this server.</p>

                      <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                        <Radio className="w-4 h-4 text-green-400" /> Deployment Node
                      </label>
                      <CustomDropdown
                        value={state.node}
                        options={nodes.map(n => ({ v: n.id, label: n.name + ' (' + n.ip + ')' }))}
                        onChange={(v: string) => updateState('node', v)}
                        placeholder="Select a node..."
                        renderValue={(o: any) => (
                          <>
                            <Radio className="w-4 h-4 text-white shrink-0" />
                            <span className="text-white truncate font-mono text-sm">{o.label}</span>
                          </>
                        )}
                        renderOption={(o: any, sel: boolean) => (
                          <button type="button" className={`w-full flex items-center justify-between px-3 py-2.5 font-mono text-sm transition-colors rounded-lg ${sel ? 'bg-green-500/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-card/80'}`}>
                            <span>{o.label}</span>
                            {sel && <Check className="w-4 h-4 text-white" />}
                          </button>
                        )}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2 font-mono">Physical node this container will be deployed to.</p>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: SOFTWARE */}
              {currentStep === 3 && (
                <div className="step-content space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono text-xs text-green-400">04A</span>
                      <h2 className="font-display font-bold tracking-wide text-sm text-white">MINECRAFT ENGINES</h2>
                      <span className="flex-1 h-px bg-border/50"></span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {MINECRAFT_SOFTWARE.map(s => {
                        const Icon = s.icon;
                        return (
                          <button 
                            key={s.id} 
                            type="button" 
                            onClick={() => updateState('software', s.id)}
                            className={`sel-card soft-card p-4 flex flex-col items-center text-center rounded-xl border transition-all ${state.software === s.id ? 'border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-border/60 hover:border-border/80'}`}
                          >
                            <span className="tick"><Check className="w-3 h-3 stroke-[3]" /></span>
                            <Icon className={`ic w-6 h-6 mb-2.5 ${state.software === s.id ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className="font-display font-semibold text-sm text-white">{s.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono text-xs text-green-400">04B</span>
                      <h2 className="font-display font-bold tracking-wide text-sm text-white">APPLICATION & SCRIPT RUNTIMES</h2>
                      <span className="text-[10px] font-mono uppercase bg-green-500/10 text-green-400 px-2 py-0.5 rounded tracking-widest border border-green-500/20">Non-Minecraft</span>
                      <span className="flex-1 h-px bg-border/50"></span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {APPLICATION_SOFTWARE.map(s => {
                        const Icon = s.icon;
                        return (
                          <button 
                            key={s.id} 
                            type="button" 
                            onClick={() => updateState('software', s.id)}
                            className={`sel-card soft-card p-4 flex items-center gap-4 text-left rounded-xl border transition-all ${state.software === s.id ? 'border-green-500 bg-green-500/5' : 'border-border/60 hover:border-border/80'}`}
                          >
                            <span className="tick"><Check className="w-3 h-3 stroke-[3]" /></span>
                            <div className="w-10 h-10 rounded-lg bg-card/50 border border-border/60 flex items-center justify-center shrink-0">
                              <Icon className={`ic w-5 h-5 ${state.software === s.id ? 'text-green-400' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-semibold text-sm text-white">{s.name}</span>
                                <span className="text-[9px] font-mono bg-card/50 text-muted-foreground/60 px-1.5 py-0.5 rounded border border-border/50">Standalone</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">{s.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {['nodejs', 'python'].includes(state.software) && (
                      <div className="mt-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                          Standalone runtime selected: Minecraft game features will be disabled. You will be able to upload your code files via File Manager and start them in the Console.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2.5">
                      <GitBranch className="w-4 h-4 text-green-400" /> {['nodejs', 'python'].includes(state.software) ? 'Runtime Version' : 'Software Version'}
                    </label>

                    <CategorizedVersionDropdown
                      value={state.version}
                      onChange={(v: string) => updateState('version', v)}
                      versions={versions}
                      software={state.software}
                      placeholder="Select a version..."
                    />
                    {!['nodejs', 'python'].includes(state.software) && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-green-400 font-mono bg-green-500/5 px-2.5 py-1.5 rounded-lg border border-green-500/10">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-green-400" />
                        <span>Java Auto-detect: <strong>Java {getJavaVersionForMinecraft(state.version, state.software)}</strong> will be automatically provisioned</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW */}
              {currentStep === 4 && (
                <div className="step-content">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-xs text-green-400">05</span>
                    <h2 className="font-display font-bold tracking-wide text-sm text-white">FINAL SPECIFICATION</h2>
                    <span className="flex-1 h-px bg-border/50"></span>
                  </div>
                  
                  {!deployed && deployProgress === 0 && (
                    <>
                      <div className="font-mono text-[13px] divide-y divide-border/50 border border-border/60 rounded-xl bg-card/60 backdrop-blur-sm p-4">
                        {renderReviewRow('INSTANCE', state.name || '—')}
                        {renderReviewRow('RUNTIME', state.runtimeType === 'local' ? 'Local Process' : 'Docker Container')}
                        {renderReviewRow('DESCRIPTION', state.desc || '—')}
                        {renderReviewRow('PORT', String(state.port))}
                        {renderReviewRow('RAM', state.ram + ' GB')}
                        {renderReviewRow('CPU ' + (state.auto ? '(AUTO)' : '(MANUAL)'), state.cpu + ' %')}
                        {renderReviewRow('DISK', state.disk + ' GB')}
                        {renderReviewRow('IP ALIAS', state.ip || '—')}
                        {(user?.role === "admin" || user?.role === "owner") && renderReviewRow('OWNER ID', state.owner || '—')}
                        {(user?.role === "admin" || user?.role === "owner") && renderReviewRow('NODE ID', state.node || '—')}
                        {renderReviewRow('SOFTWARE', SOFTWARE.find(s => s.id === state.software)?.name || 'Unknown')}
                        {renderReviewRow('VERSION', state.version || 'latest')}
                        {!['nodejs', 'python'].includes(state.software) && renderReviewRow('JAVA RUNTIME', `Java ${getJavaVersionForMinecraft(state.version, state.software)} (Auto-detected)`)}
                        
                        <div className="px-4 py-4">
                          <div className="flex justify-between text-[10px] text-muted-foreground tracking-widest mb-2 font-mono">
                            <span>EST. HOST FOOTPRINT</span>
                            <span>{Math.min(100, Math.round(state.ram / 32 * 100))}%</span>
                          </div>
                          <div className="w-full bg-border/50 h-1.5 overflow-hidden rounded-full">
                            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, Math.round(state.ram / 32 * 100))}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {deployProgress > 0 && !deployed && (
                    <div className="mt-6 border border-border/60 rounded-xl bg-card/60 backdrop-blur-sm p-4">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-sm font-mono text-muted-foreground">Provisioning container...</span>
                        <span className="text-sm font-mono text-white">{Math.round(deployProgress)}%</span>
                      </div>
                      <div className="w-full bg-border/50 h-1.5 overflow-hidden rounded-full">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 rounded-full" style={{ width: `${deployProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {deployed && (
                    <div className="mt-6 border border-green-500/30 rounded-xl bg-green-500/5 p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-green-500 text-white flex items-center justify-center rounded-full">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <p className="font-display font-bold text-lg text-white">Instance Deployed</p>
                      <p className="text-muted-foreground text-sm mt-1 font-mono">
                        {state.name} → {state.ram}GB
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-9 pt-7 border-t border-border/60">
              <button 
                type="button" 
                onClick={() => { if (currentStep > 0) showStep(currentStep - 1); }}
                disabled={currentStep === 0 || deployed || deployProgress > 0}
                className="px-5 py-3 text-sm font-medium flex items-center gap-2 rounded-xl border border-border/60 text-muted-foreground hover:text-white hover:bg-card/80 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> BACK
              </button>
              
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground hidden sm:block">
                STEP {currentStep + 1} / {STEPS.length}
              </span>
              
              <button 
                type="button" 
                onClick={handleNext}
                disabled={deployed || deployProgress > 0 || isCheckingPort}
                className="px-7 py-3 text-sm font-display font-bold tracking-widest flex items-center gap-2 btn-forest rounded-xl shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isCheckingPort ? 'CHECKING...' : currentStep === STEPS.length - 1 ? (deployed ? 'DEPLOYED' : 'LAUNCH') : 'NEXT'}</span>
                {isCheckingPort ? null : currentStep === STEPS.length - 1 ? <Rocket className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 rotate-180" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

