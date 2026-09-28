import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../../layouts/RootLayout';
import { AuthLayout } from '../../layouts/AuthLayout';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';

import { HomePage } from '../../features/home/pages/HomePage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { DashboardPage } from '../../features/stats-analytics/pages/DashboardPage';
import { ScrimsPage } from '../../features/scrims-tournaments/pages/ScrimsPage';
import { NewMatchResultPage } from '../../features/scrims-tournaments/pages/NewMatchResultPage';
import { EditMatchResultPage } from '../../features/scrims-tournaments/pages/EditMatchResultPage';
import { VodsPage } from '../../features/resources-vods/pages/VodsPage';
import { VodDetailPage } from '../../features/resources-vods/pages/VodDetailPage';
import { SchedulePage } from '../../features/schedule/pages/SchedulePage';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import { TeamPage } from '../../features/teams/pages/TeamPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { useDynamicTitle } from '../../utils/useDynamicTitle';

const UnimplementedPlaceholder: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
    <Card glow="purple" className="p-8 space-y-4">
      <Badge variant="gold">{title}</Badge>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm text-gray-400">{description}</p>
    </Card>
  </div>
);

export const AppRoutes: React.FC = () => {
  useDynamicTitle();

  return (
    <Routes>
      {/* Public Landing Route */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="scrims" element={<ScrimsPage />} />
        <Route path="scrims/new" element={<NewMatchResultPage />} />
        <Route path="scrims/edit/:id" element={<EditMatchResultPage />} />
        <Route path="vods" element={<VodsPage />} />
        <Route path="vods/:id" element={<VodDetailPage />} />
        
        {/* Rutas para Calendario */}
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="calendar" element={<SchedulePage />} />
        <Route path="calendario" element={<SchedulePage />} />

        {/* Perfil del Usuario Autenticado */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="perfil" element={<ProfilePage />} />

        {/* Plantilla & Roles (exclusivo CEO / Staff) */}
        <Route path="team" element={<TeamPage />} />

        <Route
          path="notes"
          element={
            <UnimplementedPlaceholder
              title="Estrategias & Notas"
              description="Repositorio táctico de ejecuciones, composiciones y libros de jugadas."
            />
          }
        />
        <Route
          path="stats"
          element={
            <UnimplementedPlaceholder
              title="Estadísticas & Análisis"
              description="Métricas avanzadas de rendimiento por mapa, agente e integrante."
            />
          }
        />

        {/* Catch-all dentro de dashboard */}
        <Route path="*" element={<DashboardPage />} />
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
