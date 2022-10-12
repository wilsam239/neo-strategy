import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Options {
  circleRadius: number;
  circleFontSize: number;
}

type ThemeTypes = 'indigo-pink' | 'pink-bluegrey' | 'purple-green' | 'deeppurple-amber';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly circleRadius = new BehaviorSubject(25);
  readonly circleFontSize = new BehaviorSubject(25);
  readonly axisLabelFontSize = new BehaviorSubject(25);
  readonly showMidAxis = new BehaviorSubject(true);

  constructor() {}
}
