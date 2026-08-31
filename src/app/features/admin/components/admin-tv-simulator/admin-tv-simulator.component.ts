import { Component, EventEmitter, Input, OnInit, Output, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WodItem } from '../../../../core/models/wod.model';
import { WodService } from '../../../../core/services/wod.service';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { ClockService } from '../../../../core/services/clock.service';
import { CELEBRATION_PRESETS } from '../../../../core/models/celebration.model';

@Component({
  selector: 'app-admin-tv-simulator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-tv-simulator.component.html'
})
export class AdminTvSimulatorComponent implements OnInit {
  @Input() slides: WodItem[] = [];
  @Input() contextTitle: string = 'VISTA PREVIA';
  @Input() initialSlideIndex: number = 0;

  @Output() close = new EventEmitter<void>();

  public wodService = inject(WodService);
  public celebrationService = inject(CelebrationService);
  public clockService = inject(ClockService);

  public currentSlideIndex = signal<number>(0);
  public orientationMode = signal<'vertical' | 'horizontal'>('vertical');

  ngOnInit(): void {
    const initIdx = Math.max(0, this.initialSlideIndex || 0);
    this.currentSlideIndex.set(initIdx);
  }

  public effectiveSlides = computed<WodItem[]>(() => {
    if (this.slides && this.slides.length > 0) {
      const sanitized = this.slides.map(s => ({
        titulo: s.titulo?.trim() || 'WOD',
        contenido: s.contenido?.trim() || ''
      }));
      return sanitized;
    }

    // Fallback si no se pasaron slides (ej. preview global desde el selector de sede)
    const fallback = this.wodService.currentWodParts();
    return fallback && fallback.length > 0
      ? fallback
      : [{ titulo: 'DESCANSO', contenido: 'Box Cerrado / Open Box' }];
  });

  public currentSlide = computed<WodItem>(() => {
    const list = this.effectiveSlides();
    let idx = this.currentSlideIndex();
    if (idx < 0 || idx >= list.length) {
      idx = 0;
    }
    return list[idx] || { titulo: 'WOD', contenido: 'Sin contenido en esta pantalla' };
  });

  public hasPrev = computed<boolean>(() => this.currentSlideIndex() > 0);
  public hasNext = computed<boolean>(() => this.currentSlideIndex() < this.effectiveSlides().length - 1);

  public indicatorText = computed<string>(() => {
    const list = this.effectiveSlides();
    const idx = this.currentSlideIndex();
    const prefix = this.contextTitle ? `${this.contextTitle.toUpperCase()} - ` : '';
    return `${prefix}${idx + 1} / ${list.length}`;
  });

  public prevSlide(): void {
    if (this.hasPrev()) {
      this.currentSlideIndex.update(i => i - 1);
    }
  }

  public nextSlide(): void {
    if (this.hasNext()) {
      this.currentSlideIndex.update(i => i + 1);
    }
  }

  public goToSlide(index: number): void {
    const list = this.effectiveSlides();
    if (index >= 0 && index < list.length) {
      this.currentSlideIndex.set(index);
    }
  }

  public toggleOrientation(): void {
    this.orientationMode.update(m => m === 'vertical' ? 'horizontal' : 'vertical');
  }

  public formatMarkdownText(text: string): string {
    return this.wodService.formatMarkdownText(text);
  }

  public getCelebrationIcon(): string {
    const key = this.celebrationService.config().presetKey;
    const preset = CELEBRATION_PRESETS.find(p => p.key === key);
    return preset ? preset.icon : '🎉';
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prevSlide();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextSlide();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.close.emit();
      event.preventDefault();
    }
  }
}
