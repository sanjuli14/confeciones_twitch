import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  private client: SupabaseClient | null = null;

  get supabase(): SupabaseClient {
    if (this.client) return this.client;
    if (isPlatformServer(this.platformId)) {
      throw new Error('Supabase client is browser-only — use afterNextRender');
    }
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 2 } },
    });
    return this.client;
  }
}