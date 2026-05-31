import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  Receipt,
  UserSquare,
  Settings,
  Bell,
  LogOut,
  Brush,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'manager', 'receptionist'] },
    { name: 'Rooms', icon: BedDouble, path: '/rooms', roles: ['admin', 'manager', 'receptionist'] },
    { name: 'Bookings', icon: CalendarCheck, path: '/bookings', roles: ['admin', 'manager', 'receptionist'] },
    { name: 'Guests', icon: Users, path: '/guests', roles: ['admin', 'manager', 'receptionist'] },
    { name: 'Billing', icon: Receipt, path: '/billing', roles: ['admin', 'manager'] },
    { name: 'Housekeeping', icon: Brush, path: '/housekeeping', roles: ['admin', 'manager'] },
    { name: 'Staff', icon: UserSquare, path: '/staff', roles: ['admin'] },
    { name: 'Notifications', icon: Bell, path: '/notifications', roles: ['admin', 'manager', 'receptionist'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white shrink-0">
      <div className="flex items-center justify-between px-6 h-20 shadow-md">
        <h1 className="text-xl font-bold">Grand Hotel</h1>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          {theme === 'light' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul className="flex flex-col py-4">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 transition-colors duration-200 ${
                    isActive ? 'bg-slate-800 text-blue-400 border-r-4 border-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold mr-2 shrink-0">
            {user?.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors duration-200 text-sm"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
