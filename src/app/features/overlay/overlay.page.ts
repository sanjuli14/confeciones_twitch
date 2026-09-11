import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, Camera, Heart, Play, ListOrdered, ChevronDown, ChevronUp } from 'lucide-angular';
import { OverlayStateService } from '../../core/services/overlay-state.service';
import { categoryLabel } from '../../core/models/types';

const STAGE_W = 1920;
const STAGE_H = 1080;

@Component({
  selector: 'app-overlay',
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './overlay.page.html',
  styleUrl: './overlay.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayPage implements OnDestroy {
  private readonly state = inject(OverlayStateService);
  private readonly onResize = () => {
    this.windowW.set(window.innerWidth);
    this.windowH.set(window.innerHeight);
  };

  /** Iconos expuestos para el template. */
  readonly Camera = Camera;
  readonly Heart = Heart;
  readonly Play = Play;
  readonly ListOrdered = ListOrdered;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  /** Confesión actualmente en pantalla (la trae el streamer). */
  readonly current = this.state.current;
  readonly queueLength = this.state.queueLength;

  /** Evita doble clic mientras se está trayendo la siguiente. */
  readonly bringing = signal(false);

  /** Expansión del cuerpo en tarjetas largas. */
  readonly expanded = signal(false);
  protected readonly previewLimit = 350;

  protected readonly categoryLabel = categoryLabel;

  private readonly currentId = computed(() => this.state.current()?.id);

  /** Escala automática: el stage 1920×1080 siempre cabe en el viewport. */
  private readonly windowW = signal(STAGE_W);
  private readonly windowH = signal(STAGE_H);
  readonly stageScale = computed(() =>
    Math.min(this.windowW() / STAGE_W, this.windowH() / STAGE_H, 1),
  );

  constructor() {
    if (typeof window !== 'undefined') {
      this.windowW.set(window.innerWidth);
      this.windowH.set(window.innerHeight);
      window.addEventListener('resize', this.onResize);
    }
    this.state.connect();
    effect(() => {
      if (this.currentId()) this.expanded.set(false);
    });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  protected get isLong(): boolean {
    return (this.state.current()?.body?.length ?? 0) > this.previewLimit;
  }

  protected get bodyPreview(): string {
    const body = this.state.current()?.body ?? '';
    return body.slice(0, this.previewLimit) + (this.isLong ? '…' : '');
  }

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  async bringNext(): Promise<void> {
    if (this.bringing()) return;
    this.bringing.set(true);
    try {
      await this.state.bringNext();
    } finally {
      this.bringing.set(false);
    }
  }
}