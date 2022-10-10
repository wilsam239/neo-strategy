import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { KonvaEventObject } from 'konva/lib/Node';
import { Circle } from 'konva/lib/shapes/Circle';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import { Stage } from 'konva/lib/Stage';
import { debounceTime, fromEvent, Subscription, tap } from 'rxjs';
import { KonvaHelper } from './konva-helper';

const FLOATING_INPUT_WIDTH = 250;
interface Position {
  x: number;
  y: number;
}

interface PriorityItem {
  id: string;
  title: string;
  icon?: string;
}

const AXES_PERCENTAGE = 0.9;
const AXES_START = 50;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
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

  options: {
    circleRadius: number;
    fontSize: number;
  } = {
    circleRadius: 25,
    fontSize: 25,
  };

  xAxisLength = window.innerWidth * AXES_PERCENTAGE;
  yAxisHeight = window.innerHeight * AXES_PERCENTAGE;

  constructor(private dialog: MatDialog) {}
  ngOnInit() {
    this.initStage();

    this.subs.push(
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(100),
          tap(() => {
            this.helper.resizeStage(window.innerWidth, window.innerHeight);
            this.xAxisLength = this.helper.stage.width() * AXES_PERCENTAGE;
            this.yAxisHeight = this.helper.stage.height() * AXES_PERCENTAGE;
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private initStage() {
    const stage = new Stage({
      container: 'matrix', // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
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
    this.makeFakeList(15);

    stage.on('click', (e) => {
      if (!e.target.hasChildren()) {
        return;
      }
      const mouseX = e.evt.clientX;
      const mouseY = e.evt.clientY;

      let top = mouseY;
      let left = mouseX;

      if (top >= window.innerHeight || top <= 0) {
      }

      if (left + FLOATING_INPUT_WIDTH >= window.innerWidth || left <= 0) {
        if (left <= 0) {
        } else {
          left = window.innerWidth - FLOATING_INPUT_WIDTH;
        }
      }

      this.floatingInputDiv.style.top = top + 'px';
      this.floatingInputDiv.style.left = left + 'px';
      this.floatingInputDiv.style.display = 'flex';
    });
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

    this.helper.addDrawnItem(xAxis, yAxis);

    this.helper.addTo(axisLayer, xAxis);
    this.helper.addTo(axisLayer, yAxis);

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

    const elementNum = this.priorities.push({
      title: this.newPriorityItem,
      id: newId,
    });

    const priorityGroup = new Group({
      x: pos.x,
      y: pos.y,
      id: newId,
      draggable: true,
    });

    const newCircle = new Circle({
      radius: this.options.circleRadius,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 4,
    });

    const priorityLabel = new Text({
      text: `${elementNum}`,
      fontSize: this.options.fontSize,
      width: this.options.circleRadius,
      fontFamily: 'Calibri',
      fill: 'green',
      align: 'center',
      offsetX: this.options.circleRadius / 2,
      offsetY: this.options.circleRadius / 2 - 2, // arbitrary - 2 here, looked more centered
    });

    const tooltip = this.helper.createTooltip(this.newPriorityItem);

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
    this.newPriority = undefined;
    this.newPriorityItem = undefined;
    this.newResource = undefined;
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

  updateRadius() {
    const groups = this.helper.fetchItemsOfType('Group') as Group[];
    groups.forEach((group) => {
      const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];
      circles.forEach((circle) => circle.radius(this.options.circleRadius));
    });
  }

  handleOptionSelect() {
    console.log('Option selected');
    this.priorityListElement.deselectAll();
  }
}
