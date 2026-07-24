import { Directive, ElementRef, AfterViewInit, OnDestroy, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appTvAutoScale]',
  standalone: true
})
export class TvAutoScaleDirective implements AfterViewInit, OnDestroy {
  @Input() isRotatedMode: boolean = true;

  private lastScrollWidth = 0;
  private lastScrollHeight = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.adjustScale();

    // Use native ResizeObserver if supported by browser
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.adjustScale();
      });
      this.resizeObserver.observe(this.el.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    setTimeout(() => this.adjustScale(), 80);
  }

  public adjustScale(): void {
    const nativeEl = this.el.nativeElement;
    if (!nativeEl) return;

    if (window.matchMedia('(orientation: portrait)').matches && !this.isRotatedMode) {
      nativeEl.style.transform = 'none';
      nativeEl.style.maxWidth = '100%';
      return;
    }

    const currentScrollWidth = nativeEl.scrollWidth;
    const currentScrollHeight = nativeEl.scrollHeight;

    if (this.lastScrollWidth === currentScrollWidth && this.lastScrollHeight === currentScrollHeight) {
      return;
    }

    let maxVisualWidth: number;
    let maxVisualHeight: number;

    if (this.isRotatedMode) {
      maxVisualWidth = window.innerHeight * 0.94;
      maxVisualHeight = window.innerWidth * 0.90;
    } else {
      maxVisualWidth = window.innerWidth * 0.94;
      maxVisualHeight = window.innerHeight * 0.90;
    }

    nativeEl.style.width = 'auto';
    nativeEl.style.maxWidth = `${maxVisualWidth}px`;
    nativeEl.style.height = 'auto';
    nativeEl.style.transform = 'scale(1)';

    const actualWidth = nativeEl.scrollWidth;
    const actualHeight = nativeEl.scrollHeight;

    if (actualWidth <= 0 || actualHeight <= 0) return;

    const scaleWidth = maxVisualWidth / actualWidth;
    const scaleHeight = maxVisualHeight / actualHeight;

    let scale = Math.min(scaleWidth, scaleHeight);

    if (scale > 1.6) scale = 1.6;
    if (scale < 0.25) scale = 0.25;

    nativeEl.style.transform = `scale(${scale})`;

    this.lastScrollWidth = currentScrollWidth;
    this.lastScrollHeight = currentScrollHeight;
  }
}
