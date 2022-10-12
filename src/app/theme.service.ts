import { Injectable } from '@angular/core';
import { StyleManagerService } from './style-manager.service';

export interface Theme {
  backgroundColor: string;
  buttonColor: string;
  headingColor: string;
  label: string;
  value: string;
}

@Injectable()
export class ThemeService {
  public themes: Theme[] = [
    {
      backgroundColor: '#fff',
      buttonColor: '#ffc107',
      headingColor: '#673ab7',
      label: 'Deep Purple & Amber',
      value: 'deeppurple-amber',
    },
    {
      backgroundColor: '#fff',
      buttonColor: '#ff4081',
      headingColor: '#3f51b5',
      label: 'Indigo & Pink',
      value: 'indigo-pink',
    },
    {
      backgroundColor: '#303030',
      buttonColor: '#607d8b',
      headingColor: '#e91e63',
      label: 'Pink & Blue Grey',
      value: 'pink-bluegrey',
    },
    {
      backgroundColor: '#303030',
      buttonColor: '#4caf50',
      headingColor: '#9c27b0',
      label: 'Purple & Green',
      value: 'purple-green',
    },
  ];
  constructor(private styleManager: StyleManagerService) {}

  setTheme(themeToSet: Theme) {
    this.styleManager.setStyle('theme', `assets/${themeToSet.value}.css`);
  }
}
