// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Terminal as XTerm, Cpu, MemoryStick as MemoryIcon, HardDrive, 
  Play, Square, RotateCw, Wifi, Clock, ArrowDown, ArrowUp, ChevronRight, Power
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface ServerStats {
  cpu: number;
  ram: number;
  disk: number;
  limitRam: number;
  limitCpu: number;
  limitDisk: number;
  netIn?: number;
  netOut?: number;
  startedAt?: string | null;
  status?: string;
}

interface ServerConsoleProps {
  serverId: string;
  server?: any;
}

const STATS_POLL_MS = 3000;
const SPARK_CAP = 30;

function stripAnsi(str: string) {
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

function formatSize(mb: number) {
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatRate(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
}

const StatCard = ({ icon, label, value, dim }: any) => (
  <div className="relative rounded-xl p-5 bg-card/60 border border-border/60 backdrop-blur-sm min-h-[88px] flex flex-col justify-center transition-colors duration-300 hover:bg-card/80 hover:border-green-500/40 group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-[12deg] text-green-500/20 transition-all duration-300 group-hover:text-green-400/40 group-hover:scale-110 pointer-events-none">
      {icon}
    </div>
    <div className="text-[12px] text-muted-foreground mb-2 relative z-10 font-semibold uppercase tracking-wider">{label}</div>
    <div className="text-[15px] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis relative z-10">
      {value} {dim && <span className="text-muted-foreground font-normal text-[12px]">{dim}</span>}
    </div>
  </div>
);

const ChartCard = ({ title, data, dataKey, dataKey2, max, icons }: any) => {
  const chartData = useMemo(() => {
    let d = [...data];
    while (d.length < 30) {
      d.unshift({ [dataKey]: 0, ...(dataKey2 ? { [dataKey2]: 0 } : {}) });
    }
    return d;
  }, [data, dataKey, dataKey2]);

  return (
    <div className="rounded-xl p-5 bg-card/60 border border-border/60 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {icons && <div className="flex gap-3 items-center">{icons}</div>}
      </div>
      <div className="relative h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
              </linearGradient>
              {dataKey2 && (
                <linearGradient id={`fill${dataKey2}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.02" />
                </linearGradient>
              )}
            </defs>
            <YAxis domain={[0, max || 'auto']} hide />
            <Area 
               type="monotone" 
               dataKey={dataKey} 
               stroke="#22C55E" 
               strokeWidth={2} 
               fillOpacity={1} 
               fill={`url(#fill${dataKey})`} 
               isAnimationActive={false}
            />
            {dataKey2 && (
              <Area 
                 type="monotone" 
                 dataKey={dataKey2} 
                 stroke="#4ADE80" 
                 strokeWidth={2} 
                 fillOpacity={1} 
                 fill={`url(#fill${dataKey2})`} 
                 isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function ServerConsole({ serverId, server }: ServerConsoleProps) {
  const { token } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  
  const [stats, setStats] = useState<ServerStats>({
    cpu: 0, ram: 0, disk: 0, limitRam: server?.ram || 1024, limitCpu: server?.cpu || 100, limitDisk: server?.disk || 10, status: server?.status || 'offline'
  });
  const [netRates, setNetRates] = useState({ in: 0, out: 0 });

  const [cpuHist, setCpuHist] = useState<any[]>([]);
  const [ramHist, setRamHist] = useState<any[]>([]);
  const [netHist, setNetHist] = useState<any[]>([]);
  
  const [atBottom, setAtBottom] = useState(true);
  const [uptime, setUptime] = useState(0);
  
  const sockRef = useRef<Socket | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevNetRef = useRef({ netIn: 0, netOut: 0, timestamp: 0 });
  const isVisible = useRef(true);
  const isTouchingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const lastRawLogsRef = useRef<string>("");
  const prevStartedAtRef = useRef<string | null | undefined>(server?.startedAt);

  useEffect(() => {
    if (stats.startedAt && prevStartedAtRef.current && stats.startedAt !== prevStartedAtRef.current) {
      setLogs([]);
      lastRawLogsRef.current = "";
    }
    prevStartedAtRef.current = stats.startedAt;
  }, [stats.startedAt]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    let alive = true;
    
    const syncLogs = async () => {
      if (!alive || !isVisible.current) return;
      try {
        const { data } = await axios.get(`/api/servers/${serverId}/logs`);
        const raw: string = data?.logs || "";
        if (!raw.trim()) return;

        if (raw === lastRawLogsRef.current) return;
        lastRawLogsRef.current = raw;

        const fetchedLines = raw.split(/\r?\n/).filter((l: string) => l.trim());
        if (fetchedLines.length === 0) return;

        setLogs((prev) => {
          if (prev.length === 0) {
            return fetchedLines.slice(-500);
          }

          const prevServerLines = prev.filter((l) => !l.startsWith("> ") && !l.startsWith("[System"));
          if (prevServerLines.length === 0) {
            return fetchedLines.slice(-500);
          }

          let matchIdx = -1;
          const maxWindow = Math.min(prevServerLines.length, 8);

          for (let w = maxWindow; w >= 1; w--) {
            const needle = prevServerLines.slice(-w);
            const lastNeedle = needle[needle.length - 1];
            let candidateIdx = fetchedLines.lastIndexOf(lastNeedle);

            while (candidateIdx !== -1) {
              let matches = true;
              for (let i = 0; i < needle.length; i++) {
                const fIdx = candidateIdx - (needle.length - 1) + i;
                if (fIdx < 0 || fetchedLines[fIdx] !== needle[i]) {
                  matches = false;
                  break;
                }
              }
              if (matches) {
                matchIdx = candidateIdx;
                break;
              }
              candidateIdx = fetchedLines.lastIndexOf(lastNeedle, candidateIdx - 1);
            }
            if (matchIdx !== -1) break;
          }

          if (matchIdx !== -1) {
            const newLines = fetchedLines.slice(matchIdx + 1);
            if (newLines.length === 0) return prev;
            const next = [...prev, ...newLines];
            return next.length > 500 ? next.slice(-500) : next;
          } else {
            return fetchedLines.slice(-500);
          }
        });
      } catch (err) {}
    };

    syncLogs();
    const iv = setInterval(syncLogs, 2500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [serverId]);

  useEffect(() => {
    if (!token || !serverId) return;
    const socket: Socket = io({
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    sockRef.current = socket;
    socket.on("connect", () => {
      socket.emit("joinServer", serverId);
    });

    socket.on("clear_logs", () => {
      setLogs([]);
      lastRawLogsRef.current = "";
    });

    socket.on("log", (data: string) => {
      if (typeof data !== "string") return;
      const lines = data.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) return;
      setLogs((prev) => {
        const next = [...prev, ...lines];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    });
    return () => {
      socket.emit("leaveServer", serverId);
      socket.removeAllListeners();
      socket.disconnect();
      sockRef.current = null;
    };
  }, [serverId, token]);

  useEffect(() => {
    let alive = true;
    let failCount = 0;
    
    const pull = async () => {
      if (!alive) return;
      if (!isVisible.current) return;
      
      try {
        const { data } = await axios.get<ServerStats>(`/api/servers/${serverId}/stats`);
        if (alive && data) {
          failCount = 0;
          setStats((p) => ({
            ...p,
            cpu: data.cpu ?? p.cpu,
            ram: data.ram ?? p.ram,
            disk: data.disk ?? p.disk,
            limitRam: data.limitRam ?? p.limitRam,
            limitCpu: data.limitCpu ?? p.limitCpu,
            limitDisk: data.limitDisk ?? p.limitDisk,
            startedAt: data.startedAt ?? p.startedAt,
            status: data.status ?? p.status,
          }));

          setCpuHist((h) => [...h, { cpu: data.cpu ?? 0 }].slice(-SPARK_CAP));
          setRamHist((h) => [...h, { ram: data.ram ?? 0 }].slice(-SPARK_CAP));
          
          const now = Date.now();
          if (prevNetRef.current.timestamp > 0 && data.netIn !== undefined && data.netOut !== undefined) {
            const elapsedSeconds = (now - prevNetRef.current.timestamp) / 1000;
            if (data.netIn >= prevNetRef.current.netIn && data.netOut >= prevNetRef.current.netOut) {
                const inRate = Math.max(0, data.netIn - prevNetRef.current.netIn) / elapsedSeconds;
                const outRate = Math.max(0, data.netOut - prevNetRef.current.netOut) / elapsedSeconds;
                setNetRates({ in: inRate, out: outRate });
                setNetHist((h) => [...h, { netIn: inRate / 1024, netOut: outRate / 1024 }].slice(-SPARK_CAP));
            } else {
                setNetRates({ in: 0, out: 0 });
                setNetHist((h) => [...h, { netIn: 0, netOut: 0 }].slice(-SPARK_CAP));
            }
          }
          prevNetRef.current = { netIn: data.netIn || 0, netOut: data.netOut || 0, timestamp: now };
        }
      } catch { 
         failCount++;
         if (failCount > 3) {
            setStats(p => ({ ...p, status: 'offline', cpu: 0, ram: 0, disk: 0 }));
            setNetRates({ in: 0, out: 0 });
            setCpuHist((h) => [...h, { cpu: 0 }].slice(-SPARK_CAP));
            setRamHist((h) => [...h, { ram: 0 }].slice(-SPARK_CAP));
            setNetHist((h) => [...h, { netIn: 0, netOut: 0 }].slice(-SPARK_CAP));
         }
      }
    };
    
    pull();
    const iv = setInterval(pull, STATS_POLL_MS);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [serverId]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (stats.status === "online" || stats.status === "running") {
        if (stats.startedAt) {
           const start = new Date(stats.startedAt).getTime();
           if (start > 0) {
             setUptime(Math.max(0, Math.floor((Date.now() - start) / 1000)));
             return;
           }
        }
      }
      setUptime(0);
    }, 1000);
    return () => clearInterval(iv);
  }, [stats.startedAt, stats.status]);

  let uptimeStr = "—";
  if (stats.status === "online" || stats.status === "running") {
      const d = Math.floor(uptime / 86400);
      const h = Math.floor((uptime % 86400) / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = uptime % 60;
      if (d > 0) uptimeStr = `${d}d ${h}h ${m}m`;
      else if (h > 0) uptimeStr = `${h}h ${m}m ${s}s`;
      else uptimeStr = `${m}m ${s}s`;
  }

  useEffect(() => {
    if (atBottom && !isTouchingRef.current && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, atBottom]);

  const onScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = dist < 35;
    setAtBottom(prev => (prev === near ? prev : near));
  }, []);

  const scrollToBottom = useCallback(() => {
    setAtBottom(true);
    if (bodyRef.current) {
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const cmd = command.trim();
      if (!cmd) return;
      setCommand("");
      setLogs((p) => [...p, `> ${cmd}`]);
      try {
        await axios.post(`/api/servers/${serverId}/command`, { command: cmd });
      } catch (err: any) {
        setLogs((p) => [...p, `[System] Failed to send: ${err?.message}`]);
      }
    },
    [command, serverId]
  );

  const executeAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
    if (!server) return;
    if (action === 'start' || action === 'restart') {
      setLogs([]);
      lastRawLogsRef.current = "";
    }
    try {
      setLogs((p) => [...p, `[System] Sending ${action} signal...`]);
      await axios.post(`/api/servers/${server.id}/${action}`);
      const actionName = action === 'start' ? 'started' : action === 'stop' ? 'stopped' : action === 'kill' ? 'forcefully killed' : 'restarted';
      setLogs((p) => [...p, `[System] Server ${actionName} successfully`]);
    } catch (error: any) {
      setLogs((p) => [...p, `[System Error] Failed to ${action} server. Reason: ${error.response?.data?.error || error.message}`]);
    }
  };

  const renderLog = (line: string, i: number) => {
    const upperLine = line.toUpperCase();
    const isError = upperLine.includes("ERROR") || upperLine.includes("FATAL") || upperLine.includes("EXCEPTION") || upperLine.includes("SEVERE");
    const isWarn = upperLine.includes("WARN") || upperLine.includes("RESTARTING") || upperLine.includes("STOPPING") || upperLine.includes("PLUGIN") || upperLine.includes("LOADING");
    
    let textColor = 'text-zinc-100';
    if (isError) textColor = 'text-red-400';
    else if (isWarn) textColor = 'text-yellow-400';

    return (
      <div key={i} className={`mb-px break-all sm:break-words [overflow-wrap:anywhere] min-w-0 animate-[login_.25s_ease_both] ${textColor}`}>
        {stripAnsi(line)}
      </div>
    );
  };

  const isOnline = stats.status === "online" || stats.status === "running";

  return (
    <div 
      className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-y-contain relative"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-8">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
          @keyframes pulseOrb { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        `}} />

        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6 animate-[rise_0.5s_ease_both]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3 h-3 rounded-full shrink-0 ${isOnline ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-[pulseOrb_2s_ease-in-out_infinite]' : stats.status === 'offline' ? 'bg-zinc-600' : 'bg-yellow-500 animate-[pulseOrb_1s_ease-in-out_infinite]'}`} />
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{server?.name || "Server"}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button onClick={() => executeAction('start')} className="flex-1 sm:flex-initial min-w-[60px] sm:min-w-[90px] h-10 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base text-white cursor-pointer bg-green-600 transition-all hover:bg-green-500 hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Start">
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => executeAction('restart')} className="flex-1 sm:flex-initial min-w-[60px] sm:min-w-[90px] h-10 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base text-white cursor-pointer bg-yellow-500 transition-all hover:bg-yellow-400 hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Restart">
              <RotateCw className="w-4 h-4" />
            </button>
            <button onClick={() => executeAction('stop')} className="flex-1 sm:flex-initial min-w-[60px] sm:min-w-[90px] h-10 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base text-white cursor-pointer bg-red-500 transition-all hover:bg-red-400 hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Graceful Stop">
              <Square className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => executeAction('kill')} className="flex-1 sm:flex-initial min-w-[60px] sm:min-w-[90px] h-10 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base text-white cursor-pointer bg-red-700 hover:bg-red-600 transition-all hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Force Kill (SIGKILL)">
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 mb-8">
          <div className="relative bg-card/40 rounded-xl overflow-hidden flex flex-col h-[380px] sm:h-[500px] xl:h-[700px] animate-[rise_0.5s_0.08s_both] border border-border/60 backdrop-blur-sm">
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-card/20 font-mono text-sm leading-1.6 text-zinc-200 custom-scrollbar overscroll-contain select-text" 
              ref={bodyRef} 
              onScroll={onScroll}
              onTouchStart={() => {
                isTouchingRef.current = true;
              }}
              onTouchEnd={() => {
                isTouchingRef.current = false;
                clearTimeout(scrollTimeoutRef.current);
                scrollTimeoutRef.current = setTimeout(onScroll, 120);
              }}
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y'
              }}
            >
               {logs.map((log, i) => renderLog(log, i))}
            </div>

            {!atBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-4 right-3 z-20 px-3 py-1.5 bg-card/90 hover:bg-card text-zinc-200 border border-border/80 rounded-full text-[11px] font-medium shadow-[0_0_15px_rgba(34,197,94,0.3)]l flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 touch-manipulation cursor-pointer select-none"
                title="Scroll to bottom"
              >
                <ArrowDown className="w-3 h-3 text-green-400 animate-bounce" />
                <span>Scroll to bottom</span>
              </button>
            )}

            <form onSubmit={send} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card/40 border-t border-border/60 shrink-0">
              <ChevronRight className="text-zinc-500 w-4 h-4 shrink-0" />
              <input 
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                type="text" 
                placeholder="Type a command..." 
                className="flex-1 bg-transparent border-0 outline-none text-zinc-100 font-mono text-sm placeholder:text-zinc-500 min-w-0" 
                autoComplete="off" 
              />
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-col gap-4 animate-[rise_0.5s_0.16s_both]">
            <StatCard 
              icon={<Wifi style={{width: 56, height: 56}} />} 
              label="Address" 
              value={(() => {
                if (!server) return "—";
                const alias = server.ipAlias?.trim();
                if (alias) {
                  return alias.includes(":") ? alias : `${alias}:${server.port || "25565"}`;
                }
                return server.port ? `${server.port}` : "25565";
              })} 
            />
            <StatCard icon={<Clock style={{width: 56, height: 56}} />} label="Uptime" value={uptimeStr} />
            <StatCard icon={<Cpu style={{width: 56, height: 56}} />} label="CPU Load" value={isOnline ? `${stats.cpu.toFixed(2)}%` : '—'} dim={isOnline ? `/ ${stats.limitCpu}%` : ''} />
            <StatCard icon={<MemoryIcon style={{width: 56, height: 56}} />} label="Memory" value={isOnline ? formatSize(stats.ram) : '—'} dim={isOnline ? `/ ${formatSize(stats.limitRam)}` : ''} />
            <StatCard icon={<HardDrive style={{width: 56, height: 56}} />} label="Disk" value={isOnline ? formatSize(stats.disk) : '—'} dim={`/ ${formatSize(stats.limitDisk)}`} />
            <StatCard icon={<ArrowDown style={{width: 56, height: 56}} />} label="Network Inbound" value={isOnline ? `↓ ${formatRate(netRates.in)}` : '—'} />
            <StatCard icon={<ArrowUp style={{width: 56, height: 56}} />} label="Network Outbound" value={isOnline ? `↑ ${formatRate(netRates.out)}` : '—'} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[rise_0.5s_0.24s_both]">
           <ChartCard title="CPU Load (%)" data={cpuHist} dataKey="cpu" max={stats.limitCpu} />
           <ChartCard title="Memory (MB)" data={ramHist} dataKey="ram" max={stats.limitRam} />
           <ChartCard title="Network (KB/s)" data={netHist} dataKey="netIn" dataKey2="netOut" max={100} icons={<><ArrowDown className="w-3 h-3 text-green-400"/><ArrowUp className="w-3 h-3 text-yellow-400"/></>} />
        </div>
      </div>
    </div>
  );
}

