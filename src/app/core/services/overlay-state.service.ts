import { Injectable, signal, computed, inject, DestroyRef, afterNextRender } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Confession } from '../models/types';

@Injectable({ providedIn: 'root' })
export class OverlayStateService {
  private readonly supabase = inject(SupabaseService);
  private readonly destroyRef = inject(DestroyRef);

  /** Confesión que el streamer ha sacado a pantalla (una sola a la vez). */
  readonly current = signal<Confession | null>(null);

  /** Cola por orden: aprobadas aún no mostradas, de la más antigua a la más nueva. */
  readonly queue = signal<Confession[]>([]);

  readonly queueLength = computed(() => this.queue().length);

  private channel: ReturnType<SupabaseService['supabase']['channel']> | null = null;
  private connected = false;

  /** Conecta la pantalla del overlay. Browser-only. */
  connect(): void {
    if (this.connected) return;
    this.connected = true;
    afterNextRender(() => {
      void this.load();
      this.subscribe();
    });
  }

  disconnect(): void {
    if (this.channel) {
      this.supabase.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.connected = false;
  }

  /** Trae a pantalla la siguiente confesión (la más antigua). Atómica en servidor. */
  async bringNext(): Promise<void> {
    const { error } = await this.supabase.supabase.rpc('mark_confession_shown');
    if (!error) void this.load();
  }

  private async load(): Promise<void> {
    await Promise.all([this.loadCurrent(), this.loadQueue()]);
  }

  private async loadCurrent(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('confessions')
      .select('*')
      .eq('status', 'approved')
      .not('shown_at', 'is', null)
      .order('shown_at', { ascending: false })
      .limit(1);
    if (!error) this.current.set((data as Confession[])?.[0] ?? null);
  }

  private async loadQueue(): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('confessions')
      .select('*')
      .eq('status', 'approved')
      .is('shown_at', null)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!error) this.queue.set((data as Confession[]) ?? []);
  }

  private subscribe(): void {
    this.channel = this.supabase.supabase
      .channel('overlay-state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'confessions' },
        () => {
          void this.load();
        },
      )
      .subscribe();

    this.destroyRef.onDestroy(() => this.disconnect());
  }
}