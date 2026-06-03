import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bed,
  Bell,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ScrollText,
  Settings,
  Sparkles,
  Sun,
  UtensilsCrossed,
  Users,
  Wrench,
  X,
  BarChart3,
  UserCog,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { toggleTheme } from '@/store/themeSlice';
import { can, Permission } from '@/lib/permissions';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Bed;
  permission: Permission;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'reports' },
  { to: '/reservations', label: 'Reservations', icon: CalendarCheck, permission: 'reservations' },
  { to: '/rooms', label: 'Rooms', icon: Bed, permission: 'rooms' },
  { to: '/guests', label: 'Guests', icon: Users, permission: 'guests' },
  { to: '/invoices', label: 'Billing', icon: FileText, permission: 'invoices' },
  { to: '/housekeeping', label: 'Housekeeping', icon: ClipboardList, permission: 'housekeeping' },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance' },
  { to: '/restaurant', label: 'Restaurant', icon: UtensilsCrossed, permission: 'restaurant' },
  { to: '/inventory', label: 'Inventory', icon: Package, permission: 'inventory' },
  { to: '/events', label: 'Events', icon: CalendarRange, permission: 'events' },
  { to: '/staff', label: 'Staff', icon: UserCog, permission: 'staff' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
  { to: '/audit', label: 'Audit Logs', icon: ScrollText, permission: 'audit' },
];

const SECONDARY_NAV: { to: string; label: string; icon: typeof Bed }[] = [
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.theme.mode);
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => can(user?.role, item.permission));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">HMS</p>
            <p className="text-xs text-slate-400">Hotel Management</p>
          </div>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
          {SECONDARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="text-sm font-semibold lg:hidden">
            HMS
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role.replace(/_/g, ' ')}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
