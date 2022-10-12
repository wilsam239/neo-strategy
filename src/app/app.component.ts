import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { KonvaEventObject } from 'konva/lib/Node';
import { Circle } from 'konva/lib/shapes/Circle';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import { Stage } from 'konva/lib/Stage';
import { debounceTime, fromEvent, interval, Subscription, tap } from 'rxjs';
import { KonvaHelper } from './konva-helper';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

const FLOATING_INPUT_WIDTH = 250;
const FLOATING_INPUT_HEIGHT = 80;

class LOCAL_STORAGE_KEYS {
  static PRIORITIES = 'priorities';
  static CONFIG = 'config';
}
interface Position {
  x: number;
  y: number;
}

interface PriorityItem {
  id: string;
  title: string;
  icon?: string;
  position: Position;
}

const AXES_PERCENTAGE = 0.9;
const AXES_START = 50;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  darkMode = true;

  stageDiv!: HTMLElement;
  floatingInputDiv!: HTMLElement;
  subs: Subscription[] = [];
  title = 'neo-strategy';

  priorities: PriorityItem[] = [];

  priorityLayer!: Layer;

  @ViewChild('priorityList')
  priorityListElement!: MatSelectionList;

  newPriorityItem?: string;
  newPriority?: number;
  newResource?: number;

  helper!: KonvaHelper;

  xAxisLength = window.innerWidth * AXES_PERCENTAGE;
  yAxisHeight = window.innerHeight * AXES_PERCENTAGE;

  constructor(
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private themeService: ThemeService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    this.initStage();

    this.subs.push(
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(100),
          tap(() => {
            this.helper.resizeStage(window.innerWidth - 32, window.innerHeight - 32);
            this.xAxisLength = this.helper.stage.width() * AXES_PERCENTAGE;
            this.yAxisHeight = this.helper.stage.height() * AXES_PERCENTAGE;
          })
        )
        .subscribe()
    );

    this.subs.push(
      // auto save every 2 minutes
      interval(2000 * 60)
        .pipe(
          tap(() => {
            this.saveToLocalStorage();
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  saveToLocalStorage() {
    this.snack.open('Priorities Saved!', undefined, {
      panelClass: 'green-snack',
      duration: 3000,
    });

    const drawnItems: (PriorityItem | undefined)[] = this.priorities
      .map((p) => {
        const drawn = this.helper.fetchDrawnItem(p.id);

        if (drawn) {
          return {
            id: p.id,
            title: p.title,
            position: {
              x: drawn.x(),
              y: drawn.y(),
            },
          };
        } else {
          return undefined;
        }
      })
      .filter((p) => !!p);

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.PRIORITIES, JSON.stringify(drawnItems));
  }
  private initStage() {
    const stage = new Stage({
      container: 'matrix', // id of container <div>
      width: window.innerWidth - 32,
      height: window.innerHeight - 32,
    });

    const stageDiv = document.getElementById('matrix');
    if (stageDiv !== null) this.stageDiv = stageDiv;

    const floatingInputDiv = document.getElementById('priority-input-box');
    if (floatingInputDiv !== null) this.floatingInputDiv = floatingInputDiv;

    this.helper = new KonvaHelper(stage);

    this.priorityLayer = new Layer();

    this.initAxes();

    this.helper.addToStage(this.priorityLayer);
    this.helper.refreshStage();
    this.fetchFromLocalStorage();
    // this.makeFakeList(15);

    stage.on('click', (e) => {
      if (!e.target.hasChildren()) {
        return;
      }
      const mouseX = e.evt.clientX;
      const mouseY = e.evt.clientY;

      let top = mouseY - FLOATING_INPUT_HEIGHT / 2;
      let left = mouseX;

      if (left + FLOATING_INPUT_WIDTH >= window.innerWidth || left <= 0) {
        if (left <= 0) {
        } else {
          left = window.innerWidth - FLOATING_INPUT_WIDTH;
        }
      }

      if (top + FLOATING_INPUT_HEIGHT >= window.innerHeight || top <= 0) {
        if (top <= 0) {
        } else {
          top = window.innerHeight - FLOATING_INPUT_HEIGHT * 2;
        }
      }

      this.floatingInputDiv.style.top = top + 'px';
      this.floatingInputDiv.style.left = left + 'px';
      this.floatingInputDiv.style.display = 'flex';
    });
  }

  private fetchFromLocalStorage() {
    const found = window.localStorage.getItem(LOCAL_STORAGE_KEYS.PRIORITIES);

    if (!!found) {
      const priorities: PriorityItem[] = JSON.parse(found);
      console.log('make ' + priorities.length + ' priorities');
      priorities.forEach((p) => this.addPriority(p));
    }
  }

  private makeFakeList(length = 5) {
    for (let i = 0; i < length; i++) {
      this.newPriorityItem = this.helper.generateId(15);
      this.addListItem({ x: i * 50 + 100, y: i * 50 + 100 });
    }
  }
  private initAxes() {
    const axisLayer = new Layer();

    const xAxis = new Line({
      points: [
        AXES_START,
        this.helper.stage.height() * AXES_PERCENTAGE,
        this.helper.stage.width() * AXES_PERCENTAGE,
        this.helper.stage.height() * AXES_PERCENTAGE,
      ],
      stroke: 'white',
      strokeWidth: 5,
      id: 'xAxisLine',
      exclude: true,
    });

    const yAxis = new Line({
      points: [AXES_START, this.helper.stage.height() * 0.1, AXES_START, this.helper.stage.height() * AXES_PERCENTAGE],
      stroke: 'white',
      strokeWidth: 5,
      id: 'yAxisLine',
      exclude: true,
    });

    const yAxisLabel = new Text({
      text: `Priority`,
      fontSize: this.settings.fontSize.getValue(),
      width: AXES_START + this.helper.stage.width() * AXES_PERCENTAGE,
      fontFamily: 'Calibri',
      fill: 'white',
      align: 'center',
      y: this.helper.stage.height() * AXES_PERCENTAGE + this.helper.stage.height() * 0.025,
    });

    const xAxisLabel = new Text({
      text: `Resources Required`,
      fontSize: this.settings.fontSize.getValue(),
      width: this.helper.stage.height() * 0.1 + this.helper.stage.height() * AXES_PERCENTAGE,
      rotationDeg: 270,
      fontFamily: 'Calibri',
      fill: 'white',
      align: 'center',
      x: AXES_START - this.helper.stage.width() * 0.025,
      y: this.helper.stage.height() * 0.1 + this.helper.stage.height() * AXES_PERCENTAGE,
    });

    this.helper.addDrawnItem(xAxis, yAxis, yAxisLabel, xAxisLabel);

    this.helper.addTo(axisLayer, xAxis);
    this.helper.addTo(axisLayer, yAxis);
    this.helper.addTo(axisLayer, yAxisLabel, xAxisLabel);

    this.helper.addToStage(axisLayer);
  }

  hideFloater() {
    this.floatingInputDiv.style.display = 'none';
    this.newPriorityItem = undefined;
  }

  addListItemFromFloat() {
    const pos: Position = {
      x: parseInt(this.floatingInputDiv.style.left, 10),
      y: parseInt(this.floatingInputDiv.style.top, 10),
    };

    this.addListItem(pos);
    this.hideFloater();
  }

  addListItem(pos?: Position) {
    if (!this.newPriorityItem) {
      console.error('No priority entered');
      return;
    }

    pos = this.getPosOfNewItem(pos);

    const newId = this.helper.generateId();

    const newItem: PriorityItem = {
      title: this.newPriorityItem,
      id: newId,
      position: { x: pos.x, y: pos.y },
    };

    this.addPriority(newItem);

    this.newPriority = undefined;
    this.newPriorityItem = undefined;
    this.newResource = undefined;
  }

  addPriority(p: PriorityItem) {
    const elementNum = this.priorities.push(p);
    console.log(p);

    const priorityGroup = new Group({
      x: p.position.x,
      y: p.position.y,
      id: p.id,
      draggable: true,
    });

    const newCircle = new Circle({
      radius: this.settings.circleRadius.getValue(),
      fill: 'white',
      stroke: 'black',
      strokeWidth: 4,
    });

    const priorityLabel = new Text({
      text: `${elementNum}`,
      fontSize: this.settings.fontSize.getValue(),
      width: this.settings.circleRadius.getValue(),
      fontFamily: 'Calibri',
      fill: 'green',
      align: 'center',
      offsetX: this.settings.circleRadius.getValue() / 2,
      offsetY: this.settings.circleRadius.getValue() / 2 - 2, // arbitrary - 2 here, looked more centered
    });

    const tooltip = this.helper.createTooltip(p.title);

    priorityGroup.on('mouseover', () => {
      this.stageDiv!.classList.add('pointer');
      tooltip.show();
      newCircle.fill('green');
    });
    priorityGroup.on('mouseout', () => {
      this.stageDiv!.classList.remove('pointer');
      tooltip.hide();
      newCircle.fill('white');
    });

    this.helper.addTo(priorityGroup, newCircle);
    this.helper.addTo(priorityGroup, priorityLabel);
    this.helper.addTo(priorityGroup, tooltip);

    priorityGroup.on('dragend', (e) => {
      this.recalculatePriorities(e);
    });

    this.helper.addDrawnItem(priorityGroup);
    this.helper.addTo(this.priorityLayer, priorityGroup);

    this.priorityLayer.draw();
  }

  private getPosOfNewItem(pos?: Position) {
    if (!pos) {
      pos = {
        x: this.helper.stage.width() / 2,
        y: this.helper.stage.height() / 2,
      };
    }

    if (this.newPriority) {
      this.newPriority = this.newPriority > 10 ? 10 : this.newPriority;
      pos.x = AXES_START + (this.xAxisLength / 10) * this.newPriority;
    }

    if (this.newResource) {
      // resources are on y axis (for now), so we need to flip the value (if 2, it becomes 8 etc)
      // Done by doing 10 - value, then taking the absolute value
      // So if val is 8, 10 - 2 == 8
      this.newResource = this.newResource > 10 ? 10 : this.newResource;
      const flippedResource = 10 - this.newResource;
      pos.y = AXES_START + (this.yAxisHeight / 10) * flippedResource;
    }

    return pos;
  }

  removeListItem(i: number) {
    const deletedProp = this.priorities[i];
    this.priorities.splice(i, 1);

    this.helper.removeDrawnItem(deletedProp.id);

    this.helper.priorityChildren.forEach((item) => {
      if (item instanceof Group) {
        item
          .getChildren((child) => child.className === 'Text')
          .forEach((_textChild) => {
            const textChild = _textChild as Text;
            const newIndex = this.priorities.findIndex((p) => p.id === item.id()) + 1;

            if (newIndex > 0) {
              textChild.text(newIndex.toString());
            }
          });
      }
    });
  }

  recalculatePriorities(e: KonvaEventObject<DragEvent>) {
    console.log('Recalc priorities here');
  }

  handleKey(event: any) {
    console.log(event);
  }

  handleHover(id: string, over: boolean) {
    const group = this.helper.fetchDrawnItem(id);

    if (group && group instanceof Group) {
      const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];

      if (circles.length > 0) {
        circles.forEach((circle) => {
          if (over) {
            circle.fill('green');
          } else {
            circle.fill('white');
          }
        });
      }
    }
  }

  handleOptionSelect() {
    console.log('Option selected');
    this.priorityListElement.deselectAll();
  }

  showInfoCard() {}
}
