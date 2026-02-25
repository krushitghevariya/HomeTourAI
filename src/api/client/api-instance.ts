import { HttpClient } from './http-client';
import { SupabaseClient } from './supabase-client';

let httpClientInstance: HttpClient | null = null;
let supabaseClientInstance: SupabaseClient | null = null;

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function initializeApiClients(): void {
  if (!httpClientInstance) {
    httpClientInstance = new HttpClient(API_BASE_URL);
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = new SupabaseClient();
  }
}

export function getHttpClient(): HttpClient {
  if (!httpClientInstance) {
    initializeApiClients();
  }
  return httpClientInstance!;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    initializeApiClients();
  }
  return supabaseClientInstance!;
}

export const apiClient = {
  get http() {
    return getHttpClient();
  },

  get supabase() {
    return getSupabaseClient();
  },

  initialize() {
    initializeApiClients();
  },
};
