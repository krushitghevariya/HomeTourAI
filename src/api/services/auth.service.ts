import { getSupabaseClient } from '../client/api-instance';
import { validateEmail, validatePassword } from '../middleware/validation';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
} from '../errors';
import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
} from '../types';

export class AuthService {
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    validateEmail(request.email);
    validatePassword(request.password);

    if (!request.fullName?.trim()) {
      throw new ValidationError('Full name is required');
    }

    const client = getSupabaseClient();

    try {
      const result = await client.signUp(request.email, request.password);

      if (!result) {
        throw new Error('Sign up failed');
      }

      await client.updateUserMetadata({
        full_name: request.fullName,
        plan_type: 'free',
      });

      const session = await client.getSession();
      if (!session) {
        throw new AuthenticationError('Session creation failed');
      }

      return {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: '',
        expiresIn: 3600,
      };
    } catch (error: any) {
      if (error?.message?.includes('already registered')) {
        throw new ConflictError('Email already registered');
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new AuthenticationError('Sign up failed', { originalError: error });
    }
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    validateEmail(request.email);

    if (!request.password) {
      throw new ValidationError('Password is required');
    }

    const client = getSupabaseClient();

    try {
      const result = await client.signIn(request.email, request.password);

      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (error: any) {
      if (error?.message?.includes('Invalid login credentials')) {
        throw new AuthenticationError('Invalid email or password');
      }

      throw new AuthenticationError('Login failed', { originalError: error });
    }
  }

  async logout(): Promise<void> {
    const client = getSupabaseClient();

    try {
      await client.signOut();
    } catch (error) {
      console.warn('Logout error:', error);
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const client = getSupabaseClient();

    try {
      const result = await client.refreshSession();

      if (!result) {
        throw new AuthenticationError('Session refresh failed');
      }

      return {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      throw new AuthenticationError('Token refresh failed', {
        originalError: error,
      });
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const client = getSupabaseClient();

    try {
      const session = await client.getSession();
      return session?.user || null;
    } catch (error) {
      console.warn('Get current user error:', error);
      return null;
    }
  }

  onAuthStateChange(
    callback: (user: AuthUser | null) => void
  ): { unsubscribe: () => void } {
    const client = getSupabaseClient();

    const subscription = client.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || '',
          planType: session.user.user_metadata?.plan_type || 'free',
          isActive: true,
          createdAt: session.user.created_at,
        });
      } else {
        callback(null);
      }
    });

    return subscription;
  }
}

export const authService = new AuthService();
