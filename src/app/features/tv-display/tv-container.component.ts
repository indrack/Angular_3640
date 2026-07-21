import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderClockComponent } from './header-clock.component';
import { WodSlideComponent } from './wod-slide.component';
import { FullViewModalComponent } from './full-view-modal.component';
import { AnniversaryOverlayComponent } from './anniversary-overlay.component';
import { WodService } from '../../core/services/wod.service';
import { RemoteControlService } from '../../core/services/remote-control.service';

@Component({
  selector: 'app-tv-container',
  standalone: true,
  imports: [
    CommonModule,
    HeaderClockComponent,
    WodSlideComponent,
    FullViewModalComponent,
    AnniversaryOverlayComponent
  ],
  template: `
    <div class="tv-container">
      <img src="logo.png" class="bg-logo" alt="Logo CrossFit">

      <app-header-clock></app-header-clock>

      <app-wod-slide></app-wod-slide>

      <div class="nav-buttons" [ngClass]="{'hidden': wodService.isFullViewMode()}">
        <button id="btn-prev"
                [disabled]="!wodService.hasPrev()"
                [style.opacity]="wodService.hasPrev() ? '1' : '0.3'"
                (click)="wodService.prevSlide()">&#9664;</button>
        <button id="btn-next"
                [disabled]="!wodService.hasNext()"
                [style.opacity]="wodService.hasNext() ? '1' : '0.3'"
                (click)="wodService.nextSlide()">&#9654;</button>
      </div>

      <app-full-view-modal></app-full-view-modal>

      <app-anniversary-overlay></app-anniversary-overlay>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      background: #000;
      overflow: hidden;
    }

    .tv-container {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100vh;
      height: 100vw;
      transform: translate(-50%, -50%) rotate(-90deg);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: #000;
    }

    .bg-logo {
      position: absolute;
      top: 30px;
      right: 40px;
      width: 210px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
    }

    .nav-buttons {
      position: absolute;
      bottom: 10px;
      width: 100%;
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 0 20px;
      z-index: 100;
      pointer-events: none;
    }

    .nav-buttons.hidden {
      display: none !important;
    }

    button {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid #555;
      color: #fff;
      font-size: 2em;
      padding: 10px 25px;
      border-radius: 50px;
      cursor: pointer;
      backdrop-filter: blur(5px);
      transition: all 0.2s;
    }

    button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }
  `]
})
export class TvContainerComponent {
  public wodService = inject(WodService);
  private remoteControlService = inject(RemoteControlService);

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.remoteControlService.handleKeyDown(event);
  }
}
