import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WodService } from '../../core/services/wod.service';

@Component({
  selector: 'app-full-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="full-view-container" *ngIf="wodService.isFullViewMode()">
      <div *ngIf="wodService.activeMode() === 'miraflores'" class="mode-header mode-mira">
        -- MIRAFLORES --
      </div>
      <div *ngIf="wodService.activeMode() === 'calacoto'" class="mode-header mode-cala">
        -- CALACOTO --
      </div>
      <div *ngIf="wodService.activeMode() === 'wgirls'" class="mode-header mode-girls">
        -- WGIRLS MODE --
      </div>

      <div class="full-section" *ngFor="let part of wodService.currentWodParts()">
        <h3>{{ part.titulo }}</h3>
        <p [innerHTML]="wodService.formatMarkdownText(part.contenido)"></p>
      </div>
    </div>
  `,
  styles: [`
    #full-view-container {
      width: 96vh;
      height: 88vw;
      overflow-y: auto;
      padding: 20px 40px;
      background: #000;
      z-index: 50;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .mode-header {
      text-align: center;
      letter-spacing: 3px;
      margin-bottom: 20px;
      font-size: 1.8em;
      font-weight: bold;
    }

    .mode-mira { color: #ff0000; }
    .mode-cala { color: #39ff14; }
    .mode-girls { color: #ff00d4; }

    .full-section {
      border-bottom: 1px solid #333;
      padding-bottom: 15px;
    }

    .full-section h3 {
      font-size: 3em;
      color: #ff0000;
      margin-bottom: 10px;
      text-shadow: 0px 0px 20px rgba(255, 0, 0, 0.6);
      text-align: left;
    }

    .full-section p {
      font-size: 2em;
      line-height: 1.3;
      color: #ddd;
      white-space: pre-wrap;
    }

    :host ::ng-deep strong {
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0px 0px 10px rgba(255, 255, 255, 0.3);
    }

    #full-view-container::-webkit-scrollbar {
      width: 8px;
    }

    #full-view-container::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 4px;
    }
  `]
})
export class FullViewModalComponent {
  public wodService = inject(WodService);
}
