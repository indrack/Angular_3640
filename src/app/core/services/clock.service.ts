import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClockService implements OnDestroy {
  public currentDate = signal<string>('--/--/----');
  public currentTime = signal<string>('--:--:--');
  public currentDayIndex = signal<number>(new Date().getDay());

  private timeOffset = 0;
  private clockInterval: any;
  private syncInterval: any;

  constructor() {
    this.syncTime();
    this.updateClock();

    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.syncInterval = setInterval(() => this.syncTime(), 3600000); // Sync hourly
  }

  public getBoliviaDate(): Date {
    return new Date(Date.now() + this.timeOffset);
  }

  private syncTime(): void {
    fetch('https://worldtimeapi.org/api/timezone/America/La_Paz')
      .then(res => res.json())
      .then(data => {
        if (data && data.datetime) {
          const serverTime = new Date(data.datetime).getTime();
          const localTime = Date.now();
          this.timeOffset = serverTime - localTime;
          this.updateClock();
        }
      })
      .catch(() => {
        // Fallback to local system time if API fails or offline
      });
  }

  private updateClock(): void {
    const now = this.getBoliviaDate();
    this.currentDayIndex.set(now.getDay());

    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const anio = now.getFullYear();
    this.currentDate.set(`${dia}/${mes}/${anio}`);

    const horas = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const seg = String(now.getSeconds()).padStart(2, '0');
    this.currentTime.set(`${horas}:${min}:${seg}`);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}
