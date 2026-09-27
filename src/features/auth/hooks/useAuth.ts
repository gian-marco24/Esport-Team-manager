import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useAuth = () => {
  return useAuthContext();
};
