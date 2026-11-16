import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Server, 
  LayoutDashboard, 
  Plus, 
  LogOut, 
  X, 
  Settings, 
  User, 
  Activity, 
  Box, 
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion } from "framer-motion";

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  color: {
    text: string;
    bg: string;
    border: string;
    glow: string;
  };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ onClose, isCollapsed, toggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { panelName, panelLogo } = useSettings();

  const pName = panelName || "SPACEMC PANEL";
  const nameParts = pName.split(" ");
  const firstWord = nameParts[0].toUpperCase();
  const restWords = nameParts.slice(1).join(" ").toUpperCase() || "PANEL";

  const isOwnerOrAdmin = user?.role === "admin" || user?.role === "owner";

  const sections: NavSection[] = [
    {
      title: "Navigation",
      items: [
        {
          name: "Overview",
          path: "/",
          icon: <LayoutDashboard size={18} />,
          color: {
            text: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-400",
            glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
          },
        },
        {
          name: "Servers",
          path: "/servers",
          icon: <Server size={18} />,
          color: {
            text: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-400",
            glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
          },
        },
        {
          name: "Nodes",
          path: "/nodes",
          icon: <Activity size={18} />,
          color: {
            text: "text-green-300",
            bg: "bg-green-500/10",
            border: "border-green-300",
            glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
          },
        },
      ],
    },
    ...(isOwnerOrAdmin
      ? [
          {
            title: "Fleet & Control",
            items: [
              {
                name: "Deploy Server",
                path: "/servers/create",
                icon: <Plus size={18} />,
                badge: "NEW",
                badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
                color: {
                  text: "text-green-400",
                  bg: "bg-green-500/10",
                  border: "border-green-400",
                  glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
                },
              },
              {
                name: "Fleet Overview",
                path: "/admin/servers",
                icon: <Box size={18} />,
                color: {
                  text: "text-green-300",
                  bg: "bg-green-500/10",
                  border: "border-green-300",
                  glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
                },
              },
              {
                name: "Fleet Overview",
                path: "/admin/servers",
                icon: <Box size={18} />,
                color: {
                  text: "text-green-300",
                  bg: "bg-green-500/10",
                  border: "border-green-300",
                  glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
                },
              },
            ],
          },
        ]
      : []),
    {
      title: "Account",
      items: [
        {
          name: "My Account",
          path: "/account",
          icon: <User size={18} />,
          color: {
            text: "text-green-300",
            bg: "bg-green-500/10",
            border: "border-green-300",
            glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]",
          },
        },
      ],
    },
  ];

  return (
    <aside 
      className={`h-full flex flex-col bg-card/95 backdrop-blur-xl text-white font-body border-r border-border transition-all duration-300 z-30 select-none ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-16 px-4 flex items-center justify-between border-b border-border/70 flex-shrink-0 bg-card/50">
        {!isCollapsed ? (
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group" onClick={onClose}>
            {panelLogo ? (
              <img src={panelLogo} alt="Logo" className="w-8 h-8 rounded-xl object-contain flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-400 via-green-500 to-green-600 flex items-center justify-center font-display font-bold text-black text-sm shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/20 group-hover:scale-105 transition-transform">
                S
              </div>
            )}
            <div className="truncate">
              <div className="font-display font-bold text-sm tracking-wide uppercase text-white truncate flex items-center gap-1.5">
                <span>{firstWord}</span>
                <span className="text-muted-foreground font-medium">{restWords}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/" className="mx-auto" onClick={onClose} title={`${firstWord} ${restWords}`}>
            {panelLogo ? (
              <img src={panelLogo} alt="Logo" className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-display font-bold text-black text-sm shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/20">
                S
              </div>
            )}
          </Link>
        )}

        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-1.5 text-muted-foreground hover:text-white hover:bg-card/60 rounded-md transition-colors"
            title="Close menu"
          >
            <X size={18} />
          </button>
        )}

        <button 
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 text-muted-foreground hover:text-white hover:bg-card/60 rounded-md transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!isCollapsed && isOwnerOrAdmin && (
        <div className="px-3 pt-3 pb-1">
          <Link
            to="/servers/create"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:to-green-500 text-white font-mono text-xs font-semibold tracking-wider shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/25 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-400/30 transition-all duration-200 group"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            <span>DEPLOY SERVER</span>
          </Link>
        </div>
      )}

      <nav className="flex-1 w-full px-2.5 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-2.5 pb-1 font-mono text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = 
                location.pathname === item.path || 
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  title={isCollapsed ? item.name : undefined}
                  className={`relative flex items-center ${
                    isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                  } rounded-xl transition-all duration-200 group ${
                    isActive
                      ? `${item.color.bg} text-white font-semibold ${item.color.glow}`
                      : "text-muted-foreground hover:text-white hover:bg-card/60"
                  }`}
                >
                  {isActive && !isCollapsed && (
                    <motion.div 
                      layoutId="sidebarActivePill" 
                      className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-xl ${item.color.border.replace("border-", "bg-")}`}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div 
                    className={`flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? item.color.text : "text-muted-foreground group-hover:text-white"
                    }`}
                  >
                    {item.icon}
                  </div>

                  {!isCollapsed && (
                    <span className="ml-3 font-mono text-xs tracking-wide truncate flex-1">
                      {item.name}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span 
                      className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${
                        item.badgeColor || "bg-green-500/20 text-green-300 border-green-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="w-full p-3 border-t border-border/70 mt-auto bg-card/50">
        {!isCollapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="tracking-wider">v1.0.0 PROD</span>
              </span>
              <span className="text-muted-foreground tracking-widest uppercase">STABLE</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-card/70 border border-border hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0 shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/20">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="truncate">
                  <p className="font-mono text-xs font-semibold text-white truncate">
                    {user?.username || "Admin"}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest truncate">
                    {user?.role || "Owner"}
                  </p>
                </div>
              </div>

              <button 
                onClick={logout} 
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-display font-bold text-xs text-white"
              title={`${user?.username || "User"} (${user?.role || "Admin"})`}
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <button 
              onClick={logout} 
              title="Logout" 
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

