import { Component, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  MessageSquareHeart,
  Send,
  Lock,
  Heart,
  HeartCrack,
  Flag,
  HeartOff,
  Skull,
} from 'lucide-angular';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { CATEGORIES } from '../../../../core/models/types';
import { SuccessCard } from '../../components/success-card/success-card';

@Component({
  selector: 'app-submit',
  imports: [ReactiveFormsModule, SuccessCard, LucideAngularModule],
  templateUrl: './submit.page.html',
})
export class SubmitPage {
  private readonly supabase = inject(SupabaseService);

  readonly MessageSquareHeart = MessageSquareHeart;
  readonly Send = Send;
  readonly Lock = Lock;
  readonly Heart = Heart;

  readonly categories = CATEGORIES;

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
  readonly submitted = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    body: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3000)],
    }),
    category: new FormControl('amor', { nonNullable: true }),
    nickname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
  });

  get bodyLength(): number {
    return this.form.value.body?.length ?? 0;
  }

  get remainingChars(): number {
    return 3000 - this.bodyLength;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);

    const { error } = await this.supabase.supabase.rpc('submit_confession', {
      p_title: this.form.value.title?.trim(),
      p_body: this.form.value.body?.trim(),
      p_category: this.form.value.category,
      p_nickname: this.form.value.nickname?.trim() || 'Anónimo',
    });

    this.sending.set(false);
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.form.reset();
    this.form.controls.category.setValue('amor');
    this.submitted.set(true);
  }

  resetForm(): void {
    this.submitted.set(false);
    this.error.set(null);
  }
}