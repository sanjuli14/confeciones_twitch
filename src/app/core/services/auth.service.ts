import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  readonly user = signal<User | null>(null);
  readonly initialized = signal(false);

  private listenerSetup = false;

  /** Hidrata la sesión y suscribe a cambios. Browser-only (guard/login). */
  async ensureSession(): Promise<void> {
    if (this.listenerSetup) {
      const { data } = await this.supabase.supabase.auth.getSession();
      this.user.set(data.session?.user ?? null);
      this.initialized.set(true);
      return;
    }
    this.listenerSetup = true;
    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
    });
    const { data } = await this.supabase.supabase.auth.getSession();
    this.user.set(data.session?.user ?? null);
    this.initialized.set(true);
  }

  async login(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async logout(): Promise<void> {
    await this.supabase.supabase.auth.signOut();
    this.user.set(null);
  }
}