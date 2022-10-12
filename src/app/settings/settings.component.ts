import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSlider } from '@angular/material/slider';
import { Group } from 'konva/lib/Group';
import { Circle } from 'konva/lib/shapes/Circle';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import { Subscription, tap } from 'rxjs';
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

  @ViewChild('radiusSlider')
  radiusSlider!: MatSlider;

  @ViewChild('circleFontSlider')
  circleFontSlider!: MatSlider;

  @ViewChild('axisFontSlider')
  axisFontSlider!: MatSlider;

  constrainSizeAndRadius = true;
  showMiddleAxes = false;

  constructor(private themeService: ThemeService, public settings: SettingsService) {}

  ngOnInit(): void {
    this.themes = this.themeService.themes;

    this.initSettingsSubscriptions();
  }

  ngAfterViewInit() {
    const activeTheme = this.themeList.options.find((o) => o.value.value === this.themeService.activeTheme.getValue());
    if (activeTheme) {
      this.themeList.selectedOptions.select(activeTheme);
    }

    const curRadius = this.settings.circleRadius.getValue();
    this.radiusSlider.value = curRadius;

    const curcircleFontSize = this.settings.circleFontSize.getValue();
    this.circleFontSlider.value = curcircleFontSize;

    const curAxisFontSize = this.settings.axisLabelFontSize.getValue();
    this.axisFontSlider.value = curAxisFontSize;

    this.showMiddleAxes = this.settings.showMidAxis.getValue();
  }

  initSettingsSubscriptions() {
    this.subs.push(
      this.settings.circleRadius
        .pipe(
          tap((radius) => {
            const groups = this.helper.fetchItemsOfType('Group') as Group[];
            groups.forEach((group) => {
              const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];
              circles.forEach((circle) => circle.radius(radius));
              const labels = this.helper.fetchChildrenOfType(group, 'Text') as Text[];
              labels.forEach((l) => {
                l.width(radius);
                l.height(radius);
                l.offsetX(radius / 2);
                l.offsetY(radius / 2 - 2);
              });
            });
          })
        )
        .subscribe(),

      this.settings.circleFontSize
        .pipe(
          tap((size) => {
            // change font size of axis labels and priority items here

            const groups = this.helper.fetchItemsOfType('Group') as Group[];
            groups.forEach((group) => {
              const labels = this.helper.fetchChildrenOfType(group, 'Text') as Text[];
              labels.forEach((l) => {
                l.fontSize(size);
              });
            });
          })
        )
        .subscribe(),

      this.themeService.activeTheme
        .pipe(
          tap((theme) => {
            if (theme.isDark !== this.currentlyDark) {
              this.currentlyDark = theme.isDark;

              const axisLines = this.helper.fetchItemsOfType('Line') as Line[];
              axisLines.forEach((line) => line.stroke(this.currentlyDark ? 'white' : 'black'));

              const axisLabels = this.helper.fetchItemsOfType('Text') as Text[];
              axisLabels.forEach((label) => label.fill(this.currentlyDark ? 'white' : 'black'));
            }
            const groups = this.helper.fetchItemsOfType('Group') as Group[];
            groups.forEach((group) => {
              const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];
              circles.forEach((circle) => {
                circle.fill(theme.buttonColor);
              });
              const labels = this.helper.fetchChildrenOfType(group, 'Text') as Text[];
              labels.forEach((l) => {
                l.fill(theme.buttonTextColor);
              });
            });
          })
        )
        .subscribe(),

      this.settings.axisLabelFontSize
        .pipe(
          tap((size) => {
            const axisLabels = this.helper.fetchItemsOfType('Text') as Text[];
            axisLabels.forEach((label) => label.fontSize(size));
          })
        )
        .subscribe()
    );
  }

  updateRadius(radius: number | null) {
    if (!!radius) {
      this.settings.circleRadius.next(radius);

      if (this.constrainSizeAndRadius && this.settings.circleFontSize.getValue() !== radius) {
        this.updateCircleFontSize(radius);
        this.circleFontSlider.value = radius;
      }
    }
  }

  updateCircleFontSize(size: number | null) {
    if (!!size) {
      this.settings.circleFontSize.next(size);

      if (this.constrainSizeAndRadius && this.settings.circleRadius.getValue() !== size) {
        this.updateRadius(size);
        this.radiusSlider.value = size;
      }
    }
  }

  updateAxisFontSize(size: number | null) {
    if (!!size) {
      this.settings.axisLabelFontSize.next(size);
    }
  }

  themeChangeHandler(event: MatSelectionListChange) {
    if (event.options[0]) {
      this.themeService.setTheme(event.options[0].value);
    }
  }
}
