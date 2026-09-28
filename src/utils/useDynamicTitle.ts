import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'URS Gamara - Official Team Portal',
  '/login': 'Iniciar Sesión - URS Gamara',
  '/register': 'Registro Privado - URS Gamara',
  '/dashboard': 'Visión General - URS Gamara',
  '/dashboard/team': 'Plantilla & Roles - URS Gamara',
  '/dashboard/scrims': 'Scrims & Torneos - URS Gamara',
  '/dashboard/scrims/new': 'Nuevo Resultado - URS Gamara',
  '/dashboard/vods': 'VODs & Estudio - URS Gamara',
  '/dashboard/schedule': 'Calendario & Entrenos - URS Gamara',
  '/dashboard/calendar': 'Calendario & Entrenos - URS Gamara',
  '/dashboard/calendario': 'Calendario & Entrenos - URS Gamara',
  '/dashboard/profile': 'Mi Perfil - URS Gamara',
  '/dashboard/perfil': 'Mi Perfil - URS Gamara',
  '/dashboard/notes': 'Estrategias & Notas - URS Gamara',
  '/dashboard/stats': 'Estadísticas & Análisis - URS Gamara',
};

export const useDynamicTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    let title = ROUTE_TITLES[pathname];

    if (!title) {
      if (pathname.startsWith('/dashboard/scrims/edit/')) {
        title = 'Editar Resultado - URS Gamara';
      } else if (pathname.startsWith('/dashboard/vods/')) {
        title = 'Detalle de VOD - URS Gamara';
      } else if (pathname.startsWith('/dashboard')) {
        title = 'Dashboard - URS Gamara';
      } else {
        title = 'URS Gamara - Official Team Portal';
      }
    }

    document.title = title;
  }, [location]);
};
