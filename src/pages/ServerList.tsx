// @ts-nocheck
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Server, Plus, ChevronRight, Settings, Lock } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ServerLiveStats from "../components/ServerLiveStats";

type ServerStatus = "online" | "offline" | (string & {});

interface ServerRecord {
  id: string;
  name: string;
  status: ServerStatus;
  cpu?: number;
  ram?: number;
  disk?: number;
  version?: string;
  suspended?: boolean;
}

interface ServersState {
  servers: ServerRecord[];
  error: string | null;
  isLoading: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const POLL_INTERVAL_MS = 5_000;
const DEFAULT_CPU = 100;
const DEFAULT_DISK = 10;
const SURFACE = "transparent";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const isOnline = (status?: ServerStatus): boolean => status === "online";

function useServers(pollIntervalMs = POLL_INTERVAL_MS): ServersState {
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServers = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await axios.get<ServerRecord[]>("/api/servers", { signal });
      setServers(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError("Unable to load servers. Retrying…");
      console.error("Failed to fetch servers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchServers(controller.signal);
    const interval = window.setInterval(
      () => void fetchServers(controller.signal),
      pollIntervalMs,
    );
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [fetchServers, pollIntervalMs]);

  return { servers, error, isLoading };
}

const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status?: ServerStatus;
}) {
  const online = isOnline(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
        online
          ? "bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20"
          : "bg-muted text-muted-foreground ring-1 ring-inset ring-border"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/80 motion-reduce:hidden" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            online ? "bg-green-500" : "bg-zinc-500"
          }`}
        />
      </span>
      {online ? "Online" : "Offline"}
    </span>
  );
});

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="font-mono text-sm font-semibold text-white">
        {children}
      </div>
    </div>
  );
}

const ServerCard = memo(function ServerCard({
  server,
}: {
  server: ServerRecord;
}) {
  const online = isOnline(server.status);
  const isSuspended = server.suspended;

  const content = (
    <>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          online
            ? "bg-gradient-to-r from-transparent via-green-500/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
        }`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors group-hover:border-green-500 group-hover:text-white">
            <Server className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white">
              {server.name}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={server.status} />
              {isSuspended && (
                <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-green-400 uppercase">
                  <Lock className="h-3 w-3" />
                  Suspended
                </span>
              )}
            </div>
          </div>
        </div>
        {!isSuspended && (
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-green-400" />
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-4 sm:grid-cols-4">
        <Metric label="CPU Limit">
          {server.cpu ?? DEFAULT_CPU}
          <span className="ml-0.5 text-muted-foreground">%</span>
        </Metric>
        <Metric label="RAM Usage">
          <ServerLiveStats
            serverId={server.id}
            limitRam={server.ram}
            status={server.status}
          />
        </Metric>
        <Metric label="Disk Limit">
          {server.disk ?? DEFAULT_DISK}
          <span className="ml-0.5 text-muted-foreground">GB</span>
        </Metric>
        <Metric label="Version">
          <span className="block truncate" title={server.version}>
            {server.version ?? "—"}
          </span>
        </Metric>
      </div>
    </>
  );

  return (
    <motion.article variants={itemVariants}>
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-2xl border border-green-500/10 bg-card/60 p-5 opacity-75 md:p-6 cursor-not-allowed">
          {content}
        </div>
      ) : (
        <Link
          to={`/servers/${server.id}`}
          className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 transition-colors duration-200 hover:border-green-500/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/20 md:p-6"
        >
          {content}
        </Link>
      )}
    </motion.article>
  );
});

function LoadingState() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-green-500"
        aria-hidden
      />
      <p className="text-sm font-medium text-muted-foreground">Loading instances…</p>
    </div>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <motion.div
      variants={itemVariants}
      className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 backdrop-blur-sm px-6 py-24 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
        <Server className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-white">
        No instances running
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You haven&apos;t deployed any servers yet. Create one to start managing your game instances.
      </p>
      {isAdmin && (
        <Link
          to="/servers/create"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl btn-forest px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Deploy your first server
        </Link>
      )}
    </motion.div>
  );
}

export default function ServerList() {
  const { user } = useAuth();
  const { servers, error, isLoading } = useServers();

  const isAuthReady = user !== undefined;
  const isAdmin = isAuthReady && (user?.role === "admin" || user?.role === "owner");
  const hasServers = servers.length > 0;

  const onlineCount = useMemo(
    () => servers.reduce((n, s) => n + (isOnline(s.status) ? 1 : 0), 0),
    [servers],
  );

  if (!isAuthReady || (isLoading && !hasServers)) return <LoadingState />;

  return (
    <div className="relative bg-background">
      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <PageHeader 
          title="Instances" 
          subtitle="INFRASTRUCTURE" 
          actions={
            isAdmin && (
              <>
                <Link to="/admin/servers" className="px-4 py-2 text-xs btn-forest-outline rounded-xl">
                  <Settings className="w-4 h-4 mr-2 inline-block" /> Manage
                </Link>
                <Link to="/servers/create" className="px-4 py-2 text-xs btn-forest rounded-xl">
                  <Plus className="w-4 h-4 mr-2 inline-block" /> New Instance
                </Link>
              </>
            )
          }
        />

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <span className="font-mono text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">{onlineCount} of {servers.length} online</span>
        </div>

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label="Server instances"
        >
          {hasServers ? (
            servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))
          ) : (
            <EmptyState isAdmin={isAdmin} />
          )}
        </motion.section>
      </div>
    </div>
  );
}

