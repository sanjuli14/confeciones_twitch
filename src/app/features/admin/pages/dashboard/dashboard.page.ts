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
import { LucideAngularModule, Heart, Inbox, Clock, CheckCheck, CircleX, LogOut } from 'lucide-angular';
import { Confession, ConfessionStatus } from '../../../../core/models/types';
import { ConfessionCard } from '../../components/confession-card/confession-card';
import { QueueTabs } from '../../components/queue-tabs/queue-tabs';

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

  constructor() {
    afterNextRender(() => {
      void this.loadOnce();
      this.watchRealtime();
    });
  }

  private async loadOnce(): Promise<void> {
    await Promise.all([this.loadConfessions(), this.loadCounts()]);
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