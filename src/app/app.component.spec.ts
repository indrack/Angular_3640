import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app component', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });
});
