import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
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
  Dumbbell,
  AlertTriangle,
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

  const roleStr = (user?.role || '').toLowerCase();
  const teamRoleStr = (user?.teamRole || '').toLowerCase();
  const isPlayerMissingGameTag = Boolean(
    user && (user.teamRole === 'Player' || roleStr === 'player') && (!user.gameTag || user.gameTag.trim() === '')
  );

  const isCeoOrStaff = Boolean(
    user &&
    (user.role === 'ceo' ||
     user.role === 'staff' ||
     user.teamRole === 'CEO' ||
     user.teamRole === 'Staff')
  );

  const canAccessRoutines = Boolean(
    user &&
    (roleStr === 'ceo' ||
     roleStr === 'coach' ||
     roleStr === 'player' ||
     roleStr === 'manager' ||
     roleStr === 'staff' ||
     teamRoleStr === 'ceo' ||
     teamRoleStr === 'coach' ||
     teamRoleStr === 'player' ||
     teamRoleStr === 'titular' ||
     teamRoleStr === 'suplente' ||
     teamRoleStr === 'manager' ||
     teamRoleStr === 'staff')
  );

  const navItems = [
    { label: 'Visión General', path: '/dashboard', icon: LayoutDashboard },
    ...(isCeoOrStaff ? [{ label: 'Plantilla & Roles', path: '/dashboard/team', icon: Users }] : []),
    { label: 'Scrims & Torneos', path: '/dashboard/scrims', icon: Swords },
    { label: 'VODs & Estudio', path: '/dashboard/vods', icon: Video },
    { label: 'Calendario & Entrenos', path: '/dashboard/schedule', icon: Calendar },
    ...(canAccessRoutines ? [{ label: 'Check-in Rutina', path: '/dashboard/routines', icon: Dumbbell }] : []),
    { label: 'Estrategias & Notas', path: '/dashboard/notes', icon: FileText },
    { label: 'Estadísticas & Análisis', path: '/dashboard/stats', icon: BarChart3 },
  ];

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0D0914] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl p-6 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/20">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">¿Cerrar Sesión?</h3>
              <p className="text-xs text-gray-300">
                ¿Estás seguro de que deseas salir del panel de control de URS Gamara?
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1 text-xs font-bold"
                onClick={handleConfirmLogout}
              >
                Sí, Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed & Responsive */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-56 md:w-60 lg:w-64 2xl:w-72 h-full md:h-screen shrink-0 bg-[#140b21] border-r border-[#26143E] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 2xl:px-5 2xl:py-4 border-b border-[#26143E] flex items-center justify-between shrink-0">
          <Link to="/dashboard" className="flex items-center space-x-2.5 2xl:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-lg bg-[#522B80]/40 border border-[#E2B86E]/50 flex items-center justify-center shadow-md shadow-[#8B44F7]/20 p-1 shrink-0">
              <img src="/logo.png" alt={URS_GAMARA_TEAM.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-black text-white tracking-wide text-xs sm:text-sm 2xl:text-base leading-tight">{URS_GAMARA_TEAM.name}</h2>
              <p className="text-[9px] sm:text-[10px] 2xl:text-xs text-[#E2B86E] font-bold tracking-widest uppercase">Team Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Link to Profile */}
        <div className="shrink-0">
          <Link
            to="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className={`p-2.5 2xl:p-3 mx-2.5 2xl:mx-3 my-2 2xl:my-2.5 border rounded-xl flex items-center space-x-2.5 2xl:space-x-3 transition-all duration-200 group relative ${
              location.pathname === '/dashboard/profile' || location.pathname === '/dashboard/perfil'
                ? 'bg-[#26143E] border-[#E2B86E] shadow-md shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/40'
                : 'bg-[#26143E]/50 border-[#8B44F7]/20 hover:bg-[#26143E] hover:border-[#8B44F7]/60 hover:shadow-sm'
            }`}
            title={isPlayerMissingGameTag ? '¡Atención! Falta configurar tu Nickname/Tag de juego' : 'Ver mi perfil'}
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center font-bold text-xs 2xl:text-sm text-white shadow group-hover:scale-105 transition-transform">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isPlayerMissingGameTag && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#140b21] flex items-center justify-center shadow animate-pulse" title="Falta configurar tu Nickname y Tag de juego">
                  <AlertTriangle className="w-2.5 h-2.5 text-black stroke-[3]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-[13px] 2xl:text-sm font-bold text-white truncate group-hover:text-[#E2B86E] transition-colors">
                  {user?.displayName}
                </p>
                {isPlayerMissingGameTag && (
                  <span className="text-amber-400 ml-1 shrink-0" title="Configuración de nick requerida">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <Badge
                  variant={user?.role === 'ceo' || user?.teamRole === 'CEO' ? 'gold' : 'purple'}
                  className="text-[10px] 2xl:text-xs px-1.5 py-0.5 font-bold"
                >
                  {user?.teamRole || (user?.role === 'ceo' ? 'CEO' : user?.role)}
                </Badge>
                {user?.position && (
                  <span className="text-[10px] 2xl:text-xs text-gray-400 truncate">{user.position}</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-2.5 2xl:px-3 py-1 space-y-1 2xl:space-y-1.5 overflow-y-auto">
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
                className={`flex items-center justify-between px-3 py-2 2xl:py-2.5 rounded-lg text-xs sm:text-[13px] 2xl:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#522B80] text-white font-bold shadow-md shadow-[#8B44F7]/25 border-l-[3px] border-[#E2B86E]'
                    : 'text-gray-300 hover:text-white hover:bg-[#26143E]/70'
                }`}
              >
                <div className="flex items-center space-x-2.5 2xl:space-x-3">
                  <Icon className={`w-4 h-4 2xl:w-4.5 2xl:h-4.5 ${isActive ? 'text-[#E2B86E]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-[#E2B86E]" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-2.5 2xl:p-3.5 border-t border-[#26143E] shrink-0">
          <Button
            onClick={() => setShowLogoutModal(true)}
            variant="ghost"
            className="w-full justify-start text-xs sm:text-[13px] 2xl:text-sm text-red-400 hover:text-red-300 hover:bg-red-950/40 py-2 2xl:py-2.5"
            leftIcon={<LogOut className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />}
          >
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Dashboard Area - Right panel with dedicated scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Topbar */}
        <header className="h-13 sm:h-14 2xl:h-16 bg-[#140b21]/80 border-b border-[#26143E] px-4 sm:px-6 2xl:px-8 flex items-center justify-between backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
              <span className="font-semibold text-white">{URS_GAMARA_TEAM.name}</span>
              <span>/</span>
              <span className="text-[#E2B86E]">Panel de Control</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard/profile"
              className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-[#E2B86E] hover:underline"
            >
              <UserIcon className="w-4 h-4" />
              <span>{user?.displayName}</span>
            </Link>
          </div>
        </header>

        {/* Content Outlet - ONLY THIS CONTAINER SCROLLS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 2xl:p-9 overflow-y-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
