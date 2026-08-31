import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { AdminTvSimulatorComponent } from './admin-tv-simulator.component';
import { WodService } from '../../../../core/services/wod.service';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { ClockService } from '../../../../core/services/clock.service';
import { DEFAULT_CELEBRATION_CONFIG } from '../../../../core/models/celebration.model';

describe('AdminTvSimulatorComponent', () => {
  let component: AdminTvSimulatorComponent;

  beforeEach(() => {
    const mockWodService = {
      currentWodParts: signal([]),
      formatMarkdownText: (text: string) => {
        if (!text) return '';
        let formatted = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/(\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?(?:\s*(?:lbs|kg|in))?\b)/gi, '<span class="highlight-weight">$1</span>');
        return formatted;
      }
    };
    const mockCelebrationService = {
      config: signal(DEFAULT_CELEBRATION_CONFIG)
    };
    const mockClockService = {
      currentDate: signal('01/09/2026'),
      currentTime: signal('10:00:00')
    };

    const injector = createEnvironmentInjector([
      { provide: WodService, useValue: mockWodService },
      { provide: CelebrationService, useValue: mockCelebrationService },
      { provide: ClockService, useValue: mockClockService }
    ]);

    component = runInInjectionContext(injector, () => new AdminTvSimulatorComponent());
    component.slides = [
      { titulo: 'WARM-UP', contenido: '*3 SETS*\n10 PVC Pass Throughs\n60/42.5 kg' },
      { titulo: 'METCON', contenido: '21-15-9\nThrusters\nPull-ups' }
    ];
    component.contextTitle = 'TV MIRAFLORES';
    component.ngOnInit();
  });

  it('should initialize with slide index 0 and compute effectiveSlides correctly', () => {
    expect(component.currentSlideIndex()).toBe(0);
    expect(component.effectiveSlides().length).toBe(2);
    expect(component.currentSlide().titulo).toBe('WARM-UP');
    expect(component.hasPrev()).toBe(false);
    expect(component.hasNext()).toBe(true);
  });

  it('should navigate forward and backward between slides', () => {
    component.nextSlide();
    expect(component.currentSlideIndex()).toBe(1);
    expect(component.currentSlide().titulo).toBe('METCON');
    expect(component.hasPrev()).toBe(true);
    expect(component.hasNext()).toBe(false);

    component.prevSlide();
    expect(component.currentSlideIndex()).toBe(0);
    expect(component.currentSlide().titulo).toBe('WARM-UP');
  });

  it('should format markdown and regex highlights correctly', () => {
    const formatted = component.formatMarkdownText(component.currentSlide().contenido);
    expect(formatted).toContain('<strong>3 SETS</strong>');
    expect(formatted).toContain('class="highlight-weight"');
  });

  it('should handle orientation toggle', () => {
    expect(component.orientationMode()).toBe('vertical');
    component.toggleOrientation();
    expect(component.orientationMode()).toBe('horizontal');
    component.toggleOrientation();
    expect(component.orientationMode()).toBe('vertical');
  });
});
