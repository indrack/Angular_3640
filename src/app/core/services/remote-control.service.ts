import { Injectable, inject, HostListener } from '@angular/core';
import { WodService } from './wod.service';

@Injectable({
  providedIn: 'root'
})
export class RemoteControlService {
  private wodService = inject(WodService);

  public handleKeyDown(event: KeyboardEvent): void {
    // Avoid triggering when user is typing in form inputs (e.g. in Admin view)
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const key = event.key;

    if (key === '7') {
      this.wodService.toggleMode('miraflores');
      return;
    }

    if (key === '8') {
      this.wodService.toggleMode('calacoto');
      return;
    }

    if (key === '9') {
      this.wodService.toggleMode('wgirls');
      return;
    }

    if (key === '0') {
      this.wodService.toggleFullView();
      return;
    }

    if (this.wodService.isFullViewMode() && (key === 'Escape' || key === 'Backspace')) {
      this.wodService.toggleFullView();
      return;
    }

    if (key >= '1' && key <= '6') {
      const targetIndex = parseInt(key, 10) - 1;
      this.wodService.goToSlide(targetIndex);
      return;
    }

    if (key === 'ArrowLeft') {
      this.wodService.prevSlide();
      return;
    }

    if (key === 'ArrowRight' || key === 'Enter' || key === ' ') {
      this.wodService.nextSlide();
      return;
    }
  }
}
