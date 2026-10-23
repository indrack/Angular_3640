import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnvironmentInjector, runInInjectionContext, signal, EnvironmentInjector, Injector, ɵChangeDetectionScheduler, ɵEffectScheduler } from '@angular/core';
import { WodService } from './wod.service';
import { ClockService } from './clock.service';

describe('WodService - Auto Reset to First Slide', () => {
  let wodService: WodService;
  let mockClockService: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockClockService = {
      currentDate: signal('23/10/2026'),
      currentTime: signal('12:00:00'),
      currentDayIndex: signal(1), // Lunes
      getBoliviaDate: () => new Date()
    };

    const injector = createEnvironmentInjector([
      { provide: ɵChangeDetectionScheduler, useValue: { notify: () => {} } },
      { provide: ɵEffectScheduler, useValue: { add: () => {} } },
      { provide: ClockService, useValue: mockClockService },
      WodService
    ], Injector.NULL as unknown as EnvironmentInjector);

    wodService = runInInjectionContext(injector, () => injector.get(WodService));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reset currentSlideIndex to 0 when in standard mode and currentSlideIndex > 0', () => {
    wodService.currentSlideIndex.set(2);
    expect(wodService.currentSlideIndex()).toBe(2);

    wodService.autoResetToWarmupSlide();
    vi.advanceTimersByTime(250);

    expect(wodService.currentSlideIndex()).toBe(0);
  });

  it('should close isFullViewMode when auto-resetting', () => {
    wodService.isFullViewMode.set(true);
    wodService.currentSlideIndex.set(1);

    wodService.autoResetToWarmupSlide();
    vi.advanceTimersByTime(250);

    expect(wodService.isFullViewMode()).toBe(false);
    expect(wodService.currentSlideIndex()).toBe(0);
  });

  it('should NOT reset slide when activeMode is miraflores (tecla 7)', () => {
    wodService.activeMode.set('miraflores');
    wodService.firebaseMiraflores.set([
      { titulo: 'Warmup', contenido: 'Warmup content' },
      { titulo: 'Metcon', contenido: 'Metcon content' }
    ]);
    wodService.currentSlideIndex.set(1);

    wodService.autoResetToWarmupSlide();
    vi.advanceTimersByTime(250);

    expect(wodService.currentSlideIndex()).toBe(1);
    expect(wodService.activeMode()).toBe('miraflores');
  });

  it('should NOT reset slide when activeMode is calacoto (tecla 8)', () => {
    wodService.activeMode.set('calacoto');
    wodService.firebaseCalacoto.set([
      { titulo: 'Warmup', contenido: 'Warmup content' },
      { titulo: 'Metcon', contenido: 'Metcon content' }
    ]);
    wodService.currentSlideIndex.set(1);

    wodService.autoResetToWarmupSlide();
    vi.advanceTimersByTime(250);

    expect(wodService.currentSlideIndex()).toBe(1);
    expect(wodService.activeMode()).toBe('calacoto');
  });

  it('should NOT reset slide when activeMode is wgirls (tecla 9)', () => {
    wodService.activeMode.set('wgirls');
    wodService.currentSlideIndex.set(1);

    wodService.autoResetToWarmupSlide();
    vi.advanceTimersByTime(250);

    expect(wodService.currentSlideIndex()).toBe(1);
    expect(wodService.activeMode()).toBe('wgirls');
  });

  it('should correctly check class times with isClassTime', () => {
    // 1: Lunes
    expect(wodService.isClassTime(1, '12:50')).toBe(true);
    expect(wodService.isClassTime(1, '06:00')).toBe(true);
    expect(wodService.isClassTime(1, '17:00')).toBe(true);
    expect(wodService.isClassTime(1, '13:00')).toBe(false);

    // 0: Domingo
    expect(wodService.isClassTime(0, '09:00')).toBe(true);
    expect(wodService.isClassTime(0, '10:00')).toBe(true);
    expect(wodService.isClassTime(0, '12:50')).toBe(false);
  });
});
