import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StyleManagerService } from './style-manager.service';

export interface Theme {
  backgroundColor: string;
  buttonColor: string;
  headingColor: string;
  label: string;
  value: string;
  isDark: boolean;
}

export const DEEPPURPLE_AMBER = {
  backgroundColor: '#fff',
  buttonColor: '#ffc107',
  headingColor: '#673ab7',
  label: 'Deep Purple & Amber',
  value: 'deeppurple-amber',
  isDark: false,
};

export const INDIGO_PINK = {
  backgroundColor: '#fff',
  buttonColor: '#ff4081',
  headingColor: '#3f51b5',
  label: 'Indigo & Pink',
  value: 'indigo-pink',
  isDark: false,
};

export const PINK_BLUEGREY = {
  backgroundColor: '#303030',
  buttonColor: '#607d8b',
  headingColor: '#e91e63',
  label: 'Pink & Blue Grey',
  value: 'pink-bluegrey',
  isDark: true,
};

export const PURPLE_GREEN = {
  backgroundColor: '#303030',
  buttonColor: '#4caf50',
  headingColor: '#9c27b0',
  label: 'Purple & Green',
  value: 'purple-green',
  isDark: true,
};
@Injectable()
export class ThemeService {
  public themes: Theme[] = [PURPLE_GREEN, PINK_BLUEGREY, INDIGO_PINK, DEEPPURPLE_AMBER];

  readonly activeTheme = new BehaviorSubject(PURPLE_GREEN);
  constructor(private styleManager: StyleManagerService) {
    const theme = window.localStorage.getItem('theme');

    if (theme) {
      const realTheme = this.themes.find((t) => theme === t.value);

      this.setTheme(realTheme!);
    } else {
      this.setTheme(PURPLE_GREEN);
    }
  }

  setTheme(themeToSet: Theme) {
    this.styleManager.setStyle('theme', `assets/${themeToSet.value}.css`);
    this.activeTheme.next(themeToSet);
    window.localStorage.setItem('theme', themeToSet.value);
  }
}
