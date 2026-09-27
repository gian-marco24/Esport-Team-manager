import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, User as UserIcon, LogOut, LayoutDashboard, Home, Award } from 'lucide-react';
import { useAuthContext } from '../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../features/teams/config/currentTeam.config';
import { Button } from '../components/ui/Button';

export const RootLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D0914] text-gray-100 flex flex-col selection:bg-[#8B44F7] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0D0914]/80 backdrop-blur-lg border-b border-[#26143E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#522B80] border border-[#E2B86E]/50 flex items-center justify-center shadow-md shadow-[#8B44F7]/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-[#E2B86E]" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              URS <span className="text-[#8B44F7]">GAMARA</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="flex items-center gap-1.5 text-gray-300 hover:text-[#E2B86E] transition-colors">
              <Home className="w-4 h-4" /> Inicio
            </Link>
            <Link to="/#team" className="flex items-center gap-1.5 text-gray-300 hover:text-[#E2B86E] transition-colors">
              <Award className="w-4 h-4" /> Roster
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="flex items-center gap-1.5 text-[#8B44F7] font-semibold hover:text-white transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            )}
          </nav>

          {/* Auth Button CTA */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 bg-[#26143E] hover:bg-[#522B80]/60 border border-[#8B44F7]/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>{user.displayName}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Unirse al Equipo
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0D0914] border-t border-[#26143E] py-8 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#E2B86E]" />
            <span className="font-semibold text-gray-300">{URS_GAMARA_TEAM.name}</span>
            <span>— Management Platform</span>
          </div>
          <p>© {new Date().getFullYear()} {URS_GAMARA_TEAM.name}. Plataforma modular personalizable.</p>
        </div>
      </footer>
    </div>
  );
};
