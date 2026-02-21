import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Home, Droplets, Target, FolderOpen, Settings, ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react';
import DemoBanner from './DemoBanner';
import { useDemoMode } from '../hooks/useDemoMode';
import { useHide } from '../context/HideContext';
import { useContext } from 'react';
import { LockContext } from '../context/LockContext';

const PAGE_TITLES: Record<string, string> = {
  '/': "Dad's Finance Hub",
  '/bank-accounts': 'Bank Accounts',
  '/ids-cards': 'IDs & Cards',
  '/liquid': 'Liquid Assets',
  '/liquid/fds': 'Fixed Deposits',
  '/liquid/mfs': 'Mutual Funds',
  '/illiquid': 'Illiquid Assets',
  '/retirement': 'Retirement Tracker',
  '/documents': 'Document Vault',
  '/settings': 'Settings',
};

const NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/', exact: true },
  { icon: Droplets, label: 'Assets', to: '/liquid', match: ['/liquid', '/illiquid'] },
  { icon: Target, label: 'Retire', to: '/retirement', match: ['/retirement'] },
  { icon: FolderOpen, label: 'Docs', to: '/documents', match: ['/documents'] },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemo } = useDemoMode();
  const { isHidden, toggleHide } = useHide();
  const { isPassphraseSet, lock } = useContext(LockContext);

  const title = PAGE_TITLES[location.pathname] || "Dad's Finance";
  const isHome = location.pathname === '/';

  const isNavActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.to;
    return item.match?.some(m => location.pathname.startsWith(m));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="flex items-center flex-1 gap-3">
          {!isHome && (
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <h1 className="text-white font-semibold text-base flex-1 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Hide / Show numbers */}
          <button onClick={toggleHide} className="p-1.5 rounded-lg hover:bg-white/10" title={isHidden ? 'Show numbers' : 'Hide numbers'}>
            {isHidden
              ? <EyeOff className="w-5 h-5 text-white" />
              : <Eye className="w-5 h-5 text-white" />}
          </button>
          {/* Lock app */}
          {isPassphraseSet && (
            <button onClick={lock} className="p-1.5 rounded-lg hover:bg-white/10" title="Lock app">
              <Lock className="w-5 h-5 text-white" />
            </button>
          )}
          {/* Settings */}
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-white/10">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Demo Banner */}
      <DemoBanner />

      {/* Page Content */}
      <main className={`page ${isDemo ? 'page-with-demo' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = isNavActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 ${active ? 'text-[var(--color-navy)]' : 'text-[var(--color-text-muted)]'}`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
