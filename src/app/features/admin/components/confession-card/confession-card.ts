import { Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  LucideAngularModule,
  Check,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Heart,
  HeartCrack,
  Flag,
  HeartOff,
  Skull,
} from 'lucide-angular';
import { Confession, categoryLabel } from '../../../../core/models/types';

@Component({
  selector: 'app-confession-card',
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './confession-card.html',
})
export class ConfessionCard {
  readonly confession = input.required<Confession>();
  readonly approve = output<Confession>();
  readonly reject = output<Confession>();

  readonly Check = Check;
  readonly X = X;
  readonly RotateCcw = RotateCcw;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;
  readonly Heart = Heart;

  readonly categoryIcons: Record<string, typeof Heart> = {
    amor: Heart,
    desamor: HeartCrack,
    redflag: Flag,
    norespondido: HeartOff,
    toxico: Skull,
  };

  protected categoryIcon(category: string): typeof Heart {
    return this.categoryIcons[category] ?? Heart;
  }

  protected readonly categoryLabel = categoryLabel;

  readonly expanded = signal(false);

  protected readonly previewLimit = 220;

  protected get isLong(): boolean {
    return this.confession().body.length > this.previewLimit;
  }

  protected get bodyPreview(): string {
    return (
      this.confession().body.slice(0, this.previewLimit) + (this.isLong ? '…' : '')
    );
  }

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }
}