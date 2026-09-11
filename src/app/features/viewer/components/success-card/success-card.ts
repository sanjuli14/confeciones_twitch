import { Component, output } from '@angular/core';
import { LucideAngularModule, MessageSquareHeart, Heart, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-success-card',
  imports: [LucideAngularModule],
  template: `
    <div class="relative w-full max-w-lg">
      <!-- Burbuja de corazones subiendo -->
      <div class="absolute inset-x-0 bottom-10 flex justify-center pointer-events-none" aria-hidden="true">
        <lucide-angular
          [img]="Heart"
          [size]="20"
          class="text-heart animate-[heart-rise_2.6s_ease-out_infinite] absolute left-1/2 -ml-10"
        />
        <lucide-angular
          [img]="Heart"
          [size]="14"
          class="text-rose animate-[heart-rise_2.6s_ease-out_1.2s_infinite] absolute left-1/2 ml-10"
        />
      </div>

      <div
        class="relative bg-panel/60 backdrop-blur-xl border border-leaf/40 rounded-3xl p-10 text-center shadow-[0_0_50px_-15px_rgba(32,224,138,0.45)] animate-[card-in_.55s_cubic-bezier(.22,1,.36,1)]"
      >
        <div class="relative inline-flex items-center justify-center mb-5" aria-hidden="true">
          <div class="absolute inset-0 rounded-full bg-leaf/40 blur-2xl"></div>
          <lucide-angular
            [img]="MessageSquareHeart"
            [size]="72"
            class="relative text-leaf drop-shadow-[0_0_24px_rgba(32,224,138,0.7)] animate-bounce"
          />
          <lucide-angular
            [img]="Sparkles"
            [size]="22"
            class="absolute -top-2 -right-4 text-soft"
          />
        </div>

        <h2
          class="text-5xl sm:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-leaf to-soft bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(32,224,138,0.35)]"
        >
          ¡Confesión enviada!
        </h2>

        <p class="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
          Tu historia ha sido enviada a
          <span class="font-script text-3xl text-rose">Jevitas y Tarros</span>. Espera a que la lean en
          directo
        </p>

        <button
          (click)="reset.emit()"
          class="btn-ghost px-8 py-3.5 font-semibold border-leaf/40 hover:border-leaf hover:text-leaf text-lg"
        >
          Enviar otra confesión
        </button>
      </div>
    </div>
  `,
})
export class SuccessCard {
  readonly reset = output();
  readonly MessageSquareHeart = MessageSquareHeart;
  readonly Heart = Heart;
  readonly Sparkles = Sparkles;
}