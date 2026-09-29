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
import { MatchStatsDetailPage } from '../../features/scrims-tournaments/pages/MatchStatsDetailPage';
import { VodsPage } from '../../features/resources-vods/pages/VodsPage';
import { VodDetailPage } from '../../features/resources-vods/pages/VodDetailPage';
import { SchedulePage } from '../../features/schedule/pages/SchedulePage';

import { StatsAnalyticsPage } from '../../features/stats-analytics/pages/StatsAnalyticsPage';
import { TeamPage } from '../../features/teams/pages/TeamPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { NotesPage } from '../../features/notes/pages/NotesPage';
import { RoutinesPage } from '../../features/routines/pages/RoutinesPage';
import { useDynamicTitle } from '../../utils/useDynamicTitle';

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
        <Route path="scrims/match/:id/stats" element={<MatchStatsDetailPage />} />
        <Route path="scrims/:id/stats" element={<MatchStatsDetailPage />} />
        <Route path="vods" element={<VodsPage />} />
        <Route path="vods/:id" element={<VodDetailPage />} />
        
        {/* Rutas para Calendario */}
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="calendar" element={<SchedulePage />} />
        <Route path="calendario" element={<SchedulePage />} />

        {/* Check-in de Rutina */}
        <Route path="routines" element={<RoutinesPage />} />
        <Route path="rutina" element={<RoutinesPage />} />
        <Route path="rutinas" element={<RoutinesPage />} />

        {/* Perfil del Usuario Autenticado */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="perfil" element={<ProfilePage />} />

        {/* Plantilla & Roles (exclusivo CEO / Staff) */}
        <Route path="team" element={<TeamPage />} />

        <Route path="notes" element={<NotesPage />} />
        <Route path="notas" element={<NotesPage />} />
        <Route path="playbooks" element={<NotesPage />} />
        
        {/* Estadísticas & Análisis */}
        <Route path="stats" element={<StatsAnalyticsPage />} />
        <Route path="estadisticas" element={<StatsAnalyticsPage />} />
        <Route path="analytics" element={<StatsAnalyticsPage />} />

        {/* Catch-all dentro de dashboard */}
        <Route path="*" element={<DashboardPage />} />
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
