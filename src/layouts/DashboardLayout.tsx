import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  Swords,
  Video,
  Calendar,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../features/teams/config/currentTeam.config';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Visión General', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Plantilla & Roles', path: '/dashboard/team', icon: Users },
    { label: 'Scrims & Torneos', path: '/dashboard/scrims', icon: Swords },
    { label: 'VODs & Estudio', path: '/dashboard/vods', icon: Video },
    { label: 'Calendario & Entrenos', path: '/dashboard/schedule', icon: Calendar },
    { label: 'Estrategias & Notas', path: '/dashboard/notes', icon: FileText },
    { label: 'Estadísticas & Análisis', path: '/dashboard/stats', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0D0914] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#140b21] border-r border-[#26143E] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80] border border-[#E2B86E]/50 flex items-center justify-center shadow-lg shadow-[#8B44F7]/30">
              <Shield className="w-6 h-6 text-[#E2B86E]" />
            </div>
            <div>
              <h2 className="font-black text-white tracking-wide text-sm">{URS_GAMARA_TEAM.name}</h2>
              <p className="text-[10px] text-[#E2B86E] font-semibold tracking-widest uppercase">Team Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-[#26143E]/50 border border-[#8B44F7]/20 rounded-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center font-bold text-white shadow">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                {user?.role}
              </Badge>
              {user?.position && (
                <span className="text-[10px] text-gray-400 truncate">{user.position}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#522B80] text-white font-semibold shadow-md shadow-[#8B44F7]/20 border-l-4 border-[#E2B86E]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#26143E]/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E2B86E]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#E2B86E]" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-[#26143E]">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Topbar */}
        <header className="h-16 bg-[#140b21]/70 border-b border-[#26143E] px-4 sm:px-6 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
              <span className="font-semibold text-white">{URS_GAMARA_TEAM.name}</span>
              <span>/</span>
              <span className="text-[#E2B86E]">Panel de Control</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-[#26143E]/40 border border-[#8B44F7]/20 rounded-full text-xs text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-[#E2B86E]" />
              <span>Modo URS Gamara</span>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-xs font-semibold text-[#E2B86E] hover:underline"
            >
              <UserIcon className="w-4 h-4" />
              <span>{user?.displayName}</span>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
