import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useAuthContext } from '../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../features/teams/config/currentTeam.config';
import { Button } from '../components/ui/Button';

export const RootLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D0914] text-gray-100 flex flex-col selection:bg-[#8B44F7] selection:text-white">
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

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0D0914]/80 backdrop-blur-lg border-b border-[#26143E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#522B80]/40 border border-[#E2B86E]/50 flex items-center justify-center shadow-md shadow-[#8B44F7]/20 p-1 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt={URS_GAMARA_TEAM.name} className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              URS <span className="text-[#8B44F7]">GAMARA</span>
            </span>
          </Link>

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
                  onClick={() => setShowLogoutModal(true)}
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
                  <Button variant="primary" size="sm">
                    Iniciar Sesión
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
            <img src="/logo.png" alt={URS_GAMARA_TEAM.name} className="w-4 h-4 object-contain" />
            <span className="font-semibold text-gray-300">{URS_GAMARA_TEAM.name}</span>
            <span>— Management Platform</span>
          </div>
          <p>© {new Date().getFullYear()} {URS_GAMARA_TEAM.name}. Plataforma modular personalizable.</p>
        </div>
      </footer>
    </div>
  );
};
