import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatSidenav } from '@angular/material/sidenav';
import { Group } from 'konva/lib/Group';
import { Circle } from 'konva/lib/shapes/Circle';
import { filter, Subscription, tap } from 'rxjs';
import { KonvaHelper } from '../konva-helper';
import { SettingsService } from '../settings.service';
import { Theme, ThemeService } from '../theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss', '../app.component.scss'],
})
export class SettingsComponent implements OnInit {
  private subs: Subscription[] = [];

  @Input()
  helper!: KonvaHelper;

  @Input()
  menu!: MatSidenav;

  themes!: Theme[];

  currentlyDark!: boolean;

  @ViewChild('themeList')
  themeList!: MatSelectionList;

  constructor(private themeService: ThemeService, public settings: SettingsService) {}

  ngOnInit(): void {
    this.themes = this.themeService.themes;

    this.subs.push(
      this.themeService.activeTheme
        .pipe(
          filter((theme) => theme.isDark !== this.currentlyDark),
          tap((theme) => {
            this.currentlyDark = theme.isDark;
            // change text colours and stuff here
            console.log(`We are now ${this.currentlyDark ? 'dark' : 'light'}`);
          })
        )
        .subscribe()
    );

    this.subs.push(
      this.settings.circleRadius
        .pipe(
          tap((radius) => {
            const groups = this.helper.fetchItemsOfType('Group') as Group[];
            groups.forEach((group) => {
              const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];
              circles.forEach((circle) => circle.radius(radius));
            });
          })
        )
        .subscribe()
    );
  }

  ngAfterViewInit() {
    const activeTheme = this.themeList.options.find((o) => o.value.value === this.settings.theme.getValue());
    if (activeTheme) {
      this.themeList.selectedOptions.select(activeTheme);
    }
  }

  updateRadius(radius: number | null) {
    if (!!radius) {
      this.settings.circleRadius.next(radius);
    }
  }

  themeChangeHandler(event: MatSelectionListChange) {
    if (event.options[0]) {
      this.themeService.setTheme(event.options[0].value);
    }
  }
}
