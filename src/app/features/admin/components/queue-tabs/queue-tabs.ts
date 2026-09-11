import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Clock, CheckCheck, CircleX, type LucideIconData } from 'lucide-angular';
import { ConfessionStatus } from '../../../../core/models/types';

@Component({
  selector: 'app-queue-tabs',
  imports: [LucideAngularModule],
  template: `
    <div
      class="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-1.5 shadow-[0_0_30px_-12px_rgba(255,46,136,0.4)]"
      role="tablist"
      aria-label="Cola de confesiones"
    >
      @for (tab of tabs; track tab.value) {
        <button
          role="tab"
          [attr.aria-selected]="active() === tab.value"
          (click)="selected.emit(tab.value)"
          class="inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-base sm:text-lg font-semibold transition-all duration-200 active:scale-95"
          [class]="
            active() === tab.value
              ? 'bg-heart/15 text-white border border-heart/50 shadow-[0_0_22px_-6px_rgba(255,46,136,0.85)]'
              : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'
          "
        >
          <lucide-angular
            [img]="tab.icon"
            [size]="17"
            class="shrink-0"
            [class]="active() === tab.value ? 'text-heart' : 'text-soft/60'"
          />
          <span>{{ tab.label }}</span>
          <span
            class="ml-1 rounded-full px-2 py-0.5 text-xs font-bold"
            [class]="
              active() === tab.value
                ? 'bg-heart/25 text-white shadow-[0_0_12px_-2px_rgba(255,46,136,0.6)]'
                : 'bg-white/10 text-white/50'
            "
          >
            {{ counts()[tab.value] ?? 0 }}
          </span>
        </button>
      }
    </div>
  `,
})
export class QueueTabs {
  readonly active = input.required<ConfessionStatus>();
  readonly counts = input.required<Record<ConfessionStatus, number>>();
  readonly selected = output<ConfessionStatus>();

  readonly Clock = Clock;
  readonly CheckCheck = CheckCheck;
  readonly CircleX = CircleX;

  protected readonly tabs: Array<{ value: ConfessionStatus; label: string; icon: LucideIconData }> = [
    { value: 'pending', label: 'Pendientes', icon: Clock },
    { value: 'approved', label: 'En cola', icon: CheckCheck },
    { value: 'rejected', label: 'Rechazadas', icon: CircleX },
  ];
}