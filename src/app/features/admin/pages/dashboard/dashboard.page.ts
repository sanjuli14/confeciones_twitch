import {
  Component,
  signal,
  computed,
  inject,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { LucideAngularModule, Heart, Inbox, Clock, CheckCheck, CircleX, LogOut, Camera, Save, AtSign } from 'lucide-angular';
import { Confession, ConfessionStatus, Streamer, STREAMER_SLOTS } from '../../../../core/models/types';
import { ConfessionCard } from '../../components/confession-card/confession-card';
import { QueueTabs } from '../../components/queue-tabs/queue-tabs';

interface StreamerDraft {
  id: string | null;
  name: string;
  twitch_handle: string;
  slot: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [ConfessionCard, QueueTabs, LucideAngularModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Heart = Heart;
  readonly Inbox = Inbox;
  readonly Clock = Clock;
  readonly CheckCheck = CheckCheck;
  readonly CircleX = CircleX;
  readonly LogOut = LogOut;
  readonly Camera = Camera;
  readonly Save = Save;
  readonly AtSign = AtSign;

  readonly tab = signal<ConfessionStatus>('pending');
  readonly confessions = signal<Confession[]>([]);

  private readonly rawCounts = signal<Record<ConfessionStatus, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  });

  readonly filtered = computed(() => {
    const list = this.confessions().filter((c) => c.status === this.tab());
    if (this.tab() === 'approved') {
      return list.filter((c) => !c.shown_at);
    }
    return list;
  });

  readonly counts = computed(() => this.rawCounts());

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');

  readonly streamerDrafts = signal<StreamerDraft[]>([]);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.loadOnce();
      this.watchRealtime();
    });
  }

  private async loadOnce(): Promise<void> {
    await Promise.all([this.loadConfessions(), this.loadCounts(), this.loadStreamers()]);
  }

  private async loadConfessions(): Promise<void> {
    const { data } = await this.supabase.supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    this.confessions.set((data as Confession[]) ?? []);
  }

  private async loadCounts(): Promise<void> {
    const countFor = async (status: ConfessionStatus): Promise<number> => {
      let query = this.supabase.supabase
        .from('confessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      if (status === 'approved') query = query.is('shown_at', null);
      const { count } = await query;
      return count ?? 0;
    };

    const [pending, approved, rejected] = await Promise.all([
      countFor('pending'),
      countFor('approved'),
      countFor('rejected'),
    ]);
    this.rawCounts.set({ pending, approved, rejected, archived: 0 });
  }

  private async loadStreamers(): Promise<void> {
    const { data } = await this.supabase.supabase
      .from('streamers')
      .select('*')
      .order('slot', { ascending: true });
    const rows = (data as Streamer[] | null) ?? [];
    this.streamerDrafts.set(
      STREAMER_SLOTS.map((slot) => {
        const row = rows.find((r) => r.slot === slot);
        return row
          ? { id: row.id, name: row.name, twitch_handle: row.twitch_handle, slot }
          : { id: null, name: '', twitch_handle: '', slot };
      }),
    );
  }

  updateStreamerDraft(
    slot: number,
    field: 'name' | 'twitch_handle',
    value: string,
  ): void {
    this.streamerDrafts.update((list) =>
      list.map((d) => (d.slot === slot ? { ...d, [field]: value } : d)),
    );
  }

  async saveStreamers(): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      for (const draft of this.streamerDrafts()) {
        const name = draft.name.trim();
        const handle = draft.twitch_handle.trim().replace(/^@/, '');
        if (name || handle) {
          const { error } = await this.supabase.supabase
            .from('streamers')
            .upsert(
              { name, twitch_handle: handle, slot: draft.slot },
              { onConflict: 'slot' },
            );
          if (error) throw error;
        } else if (draft.id) {
          const { error } = await this.supabase.supabase
            .from('streamers')
            .delete()
            .eq('id', draft.id);
          if (error) throw error;
        }
      }
      await this.loadStreamers();
    } catch {
      this.saveError.set(
        'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private watchRealtime(): void {
    const channel = this.supabase.supabase
      .channel('admin-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'confessions' },
        () => {
          void this.loadOnce();
        },
      )
      .subscribe();

    this.destroyRef.onDestroy(() =>
      this.supabase.supabase.removeChannel(channel),
    );
  }

  async approve(confession: Confession): Promise<void> {
    await this.supabase.supabase
      .from('confessions')
      .update({ status: 'approved' })
      .eq('id', confession.id);
  }

  async reject(confession: Confession): Promise<void> {
    await this.supabase.supabase
      .from('confessions')
      .update({ status: 'rejected' })
      .eq('id', confession.id);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}