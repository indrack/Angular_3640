import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-anniversary-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="anniversary-overlay" *ngIf="isVisible()">
      <img src="Logo%20Dorado%20PNG.png" id="anniversary-text" alt="10 Años Aniversario">
      <img src="FireCracker.png" class="firework firework-tl" alt="Firework">
      <img src="FireCracker.png" class="firework firework-tr" alt="Firework">
      <img src="FireCracker.png" class="firework firework-bl" alt="Firework">
      <img src="FireCracker.png" class="firework firework-br" alt="Firework">
    </div>
  `,
  styles: [`
    #anniversary-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
    }

    #anniversary-text {
      width: 85%;
      max-width: 1500px;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      min-height: 100px;
      min-width: 300px;
    }

    .firework {
      position: absolute;
      width: 15vh;
      height: 15vh;
      object-fit: contain;
    }

    .firework-tl { top: 10px; left: 10px; transform: rotate(-45deg); }
    .firework-tr { top: 10px; right: 10px; transform: rotate(45deg); }
    .firework-bl { bottom: 10px; left: 10px; transform: rotate(-135deg); }
    .firework-br { bottom: 10px; right: 10px; transform: rotate(135deg); }

    @keyframes popIn {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class AnniversaryOverlayComponent implements OnInit, OnDestroy {
  public isVisible = signal<boolean>(false);
  private intervalId: any;

  private readonly ANNIVERSARY_INTERVAL = 3500000;
  private readonly ANNIVERSARY_DURATION = 10000; // 10 seconds

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.showOverlay(), this.ANNIVERSARY_INTERVAL);
  }

  private showOverlay(): void {
    this.isVisible.set(true);
    setTimeout(() => this.isVisible.set(false), this.ANNIVERSARY_DURATION);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
