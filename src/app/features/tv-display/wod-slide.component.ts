import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WodService } from '../../core/services/wod.service';
import { TvAutoScaleDirective } from '../../core/directives/tv-auto-scale.directive';

@Component({
  selector: 'app-wod-slide',
  standalone: true,
  imports: [CommonModule, TvAutoScaleDirective],
  template: `
    <div class="content-wrapper" appTvAutoScale [isRotatedMode]="true" [ngClass]="{'hidden': wodService.isFullViewMode()}">
      <h3>{{ wodService.currentSlide().titulo }}</h3>
      <p [innerHTML]="wodService.formatMarkdownText(wodService.currentSlide().contenido)"></p>
    </div>
  `,
  styles: [`
    .content-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: auto;
      max-width: 100%;
      margin: 0 auto;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 1;
    }

    .content-wrapper.hidden {
      display: none !important;
    }

    .content-wrapper h3 {
      font-size: 5.1em;
      color: #ff0000;
      margin-bottom: 0.3em;
      text-transform: uppercase;
      border-bottom: 4px solid #333;
      display: inline-block;
      text-shadow: 0px 0px 20px rgba(255, 0, 0, 0.6);
    }

    .content-wrapper p {
      font-size: 3.8em;
      line-height: 1.2;
      color: #fff;
      white-space: pre-wrap;
      font-weight: 400;
      width: 100%;
      text-align: left;
      padding: 0 40px;
      margin: 0;
      word-wrap: break-word;
    }

    :host ::ng-deep strong {
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0px 0px 10px rgba(255, 255, 255, 0.3);
    }
  `]
})
export class WodSlideComponent {
  public wodService = inject(WodService);
}
