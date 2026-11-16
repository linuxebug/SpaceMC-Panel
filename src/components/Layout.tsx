import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, ChevronRight } from "lucide-react";
import { useLocation, matchPath, Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import GlobalSearchModal from "./GlobalSearchModal";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { panelName, panelLogo } = useSettings();

  const pName = panelName || 'SPACEMC PANEL';
  const nameParts = pName.split(' ');
  const firstWord = nameParts[0].toUpperCase();
  const restWords = nameParts.slice(1).join(' ').toUpperCase() || 'PANEL';

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 768) {
        setMobileOpen(prev => !prev);
      } else {
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const isServerView = matchPath("/servers/:id/*", location.pathname) && !matchPath("/servers/create", location.pathname);
  const isCreateServer = matchPath("/servers/create", location.pathname);
  const isAdminSettings = matchPath("/admin/settings", location.pathname);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path === '/servers') return 'Servers';
    if (path === '/servers/create') return 'Deploy Server';
    if (path.startsWith('/servers/')) return 'Server Management';
    if (path === '/admin/servers') return 'Fleet';
    if (path === '/account') return 'Account';
    return '';
  };

  if (isServerView || isCreateServer || isAdminSettings) {
    return (
      <div className="flex h-[100dvh] w-full bg-background text-foreground font-body overflow-hidden selection:bg-green-500/30">
        <main className="flex-1 w-full h-full relative z-10 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] w-full bg-background text-foreground font-body overflow-hidden selection:bg-green-500/30`}>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-card/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform flex-shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setMobileOpen(false)} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-background">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl flex-shrink-0">
            <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-white hover:bg-card/60 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                        title="Toggle Sidebar Menu"
                        aria-label="Toggle Sidebar Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="md:hidden">
                      <Link to="/" className="flex items-center gap-2 group">
                          {panelLogo ? (
                              <img src={panelLogo} alt="Logo" className="w-7 h-7 object-contain" />
                          ) : (
                              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-green-400 via-green-500 to-green-600 flex items-center justify-center font-display font-bold text-xs text-white shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/20">
                                  S
                              </div>
                          )}
                          <span className="font-display font-bold text-base tracking-wide uppercase text-white">{firstWord} <span className="text-muted-foreground font-medium">{restWords}</span></span>
                      </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <Link to="/" className="hover:text-white transition-colors">{firstWord}</Link>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-white font-semibold">{getBreadcrumb()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-wider px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_#22c55e]"></span> 
                        <span className="font-semibold text-green-400">SYSTEM NOMINAL</span>
                    </div>
                    <GlobalSearchModal />
                    <NotificationsDropdown />
                </div>
            </div>
        </header>

        <main className={`flex-1 w-full h-full relative z-0 overflow-x-hidden overflow-y-auto pb-safe custom-scrollbar`}>
          {location.pathname === "/" ? children : (
            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

