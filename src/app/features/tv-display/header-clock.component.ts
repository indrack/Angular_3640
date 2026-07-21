import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClockService } from '../../core/services/clock.service';
import { WodService } from '../../core/services/wod.service';

@Component({
  selector: 'app-header-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="datetime-container">
      <div id="date-display">{{ clockService.currentDate() }}</div>
      <div id="time-display">{{ clockService.currentTime() }}</div>
    </div>
    <div class="slide-indicator" id="slide-indicator">
      {{ wodService.indicatorText() }}
    </div>
  `,
  styles: [`
    .datetime-container {
      position: absolute;
      left: 30px;
      top: 30px;
      text-align: left;
      opacity: 0.8;
      z-index: 10;
    }

    #date-display {
      font-size: 1.5em;
      color: #ccc;
      margin-bottom: 5px;
    }

    #time-display {
      font-size: 2.5em;
      color: #39ff14;
      font-weight: bold;
      text-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
    }

    .slide-indicator {
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2em;
      color: #888;
      font-weight: bold;
      z-index: 10;
      letter-spacing: 1px;
    }
  `]
})
export class HeaderClockComponent {
  public clockService = inject(ClockService);
  public wodService = inject(WodService);
}
