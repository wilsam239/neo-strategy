import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Options {
  circleRadius: number;
  fontSize: number;
}

type ThemeTypes = 'indigo-pink' | 'pink-bluegrey' | 'purple-green' | 'deeppurple-amber';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly circleRadius = new BehaviorSubject(25);
  readonly fontSize = new BehaviorSubject(25);
  readonly theme = new BehaviorSubject('purple-green');

  constructor() {}
}
