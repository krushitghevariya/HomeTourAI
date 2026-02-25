import { useCallback, useEffect, useState } from 'react';
import { authService } from '../api/services/auth.service';
import { useAsyncAction } from './use-async-action';
import type {
  AuthUser,
  SignUpRequest,
  LoginRequest,
} from '../api/types';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const signup = useAsyncAction<AuthUser>();
  const login = useAsyncAction<AuthUser>();
  const logout = useAsyncAction<void>();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.warn('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    const subscription = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignup = useCallback(
    async (request: SignUpRequest) => {
      const result = await signup.execute(async () => {
        const response = await authService.signUp(request);
        return response.user;
      });

      return result;
    },
    [signup]
  );

  const handleLogin = useCallback(
    async (request: LoginRequest) => {
      const result = await login.execute(async () => {
        const response = await authService.login(request);
        return response.user;
      });

      return result;
    },
    [login]
  );

  const handleLogout = useCallback(async () => {
    await logout.execute(async () => {
      await authService.logout();
      setUser(null);
    });
  }, [logout]);

  return {
    user,
    isAuthenticated: user !== null,
    isInitializing,
    signup: {
      execute: handleSignup,
      loading: signup.loading,
      error: signup.errorMessage,
    },
    login: {
      execute: handleLogin,
      loading: login.loading,
      error: login.errorMessage,
    },
    logout: {
      execute: handleLogout,
      loading: logout.loading,
      error: logout.errorMessage,
    },
  };
};
