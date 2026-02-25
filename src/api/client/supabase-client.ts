import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { AuthUser } from '../types';

export class SupabaseClient {
  private client: SupabaseClientType;
  private anonKey: string;
  private supabaseUrl: string;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabaseUrl = supabaseUrl;
    this.anonKey = anonKey;
    this.client = createClient(supabaseUrl, anonKey);
  }

  getClient() {
    return this.client;
  }

  async signUp(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return data.user
      ? {
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || '',
          planType: 'free',
          isActive: true,
          createdAt: data.user.created_at,
        }
      : null;
  }

  async signIn(email: string, password: string): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Sign in failed');

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        fullName: data.user.user_metadata?.full_name || '',
        planType: data.user.user_metadata?.plan_type || 'free',
        isActive: true,
        createdAt: data.user.created_at,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token || '',
      expiresIn: data.session.expires_in || 3600,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async refreshSession(): Promise<{
    accessToken: string;
    expiresIn: number;
  } | null> {
    const { data, error } = await this.client.auth.refreshSession();

    if (error) throw error;
    if (!data.session) return null;

    return {
      accessToken: data.session.access_token,
      expiresIn: data.session.expires_in || 3600,
    };
  }

  async getSession(): Promise<{
    user: AuthUser;
    accessToken: string;
  } | null> {
    const { data, error } = await this.client.auth.getSession();

    if (error) throw error;
    if (!data.session || !data.session.user) return null;

    const user = data.session.user;
    return {
      user: {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || '',
        planType: user.user_metadata?.plan_type || 'free',
        isActive: true,
        createdAt: user.created_at,
      },
      accessToken: data.session.access_token,
    };
  }

  async updateUserMetadata(metadata: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.auth.updateUser({
      data: metadata,
    });

    if (error) throw error;
  }

  async from<T extends Record<string, unknown>>(table: string) {
    return this.client.from(table).select('*') as any;
  }

  async query<T>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    const { data, error } = await this.client.rpc('query', {
      sql,
      params,
    });

    if (error) throw error;
    return data;
  }

  onAuthStateChange(
    callback: (event: string, session: any) => void
  ): { unsubscribe: () => void } {
    return this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}
