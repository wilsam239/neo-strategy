import { MatFabMenu } from '@angular-material-extensions/fab-menu';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import html2canvas from 'html2canvas';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { KonvaEventObject } from 'konva/lib/Node';
import { Circle } from 'konva/lib/shapes/Circle';
import { Label } from 'konva/lib/shapes/Label';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';
import { Stage } from 'konva/lib/Stage';

import {
  catchError,
  debounceTime,
  filter,
  from,
  fromEvent,
  interval,
  map,
  mergeMap,
  of,
  Subject,
  Subscription,
  take,
  tap,
  throwError,
} from 'rxjs';
import { KonvaHelper } from './konva-helper';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

class QuantileKeys {
  static BOTTOM_RIGHT = 'br';
  static BOTTOM_LEFT = 'bl';
  static TOP_RIGHT = 'tr';
  static TOP_LEFT = 'tl';
}

const QUANTILE_ORDER = ['br', 'tr', 'bl', 'tl'];

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

class ImportantIds {
  static X_AXIS = 'xAxisLine';
  static Y_AXIS = 'yAxisLine';
  static X_MID_AXIS = 'midxAxisLine';
  static Y_MID_AXIS = 'midyAxisLine';
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  /** this is the actual div used as the Konva stage */
  stageDiv!: HTMLElement;
  /** This is the floating priority card that appears when clicking on the canvas */
  floatingInputDiv!: HTMLElement;
  /** list of subscriptions, unsubscribed from in the ngOnDestroy */
  subs: Subscription[] = [];
  title = 'neo-strategy';

  /** stores the actual priorities as they are created */
  priorities: PriorityItem[] = [];

  /** stores the order of the priorities  after moving them*/
  prioritiesOrder: PriorityItem[] = [];

  /** Stores the priorities in a local copy of the Konva layer */
  priorityLayer!: Layer;

  /** The title input for a new priority */
  newPriorityItem?: string;
  /** the x axis input for a new priority */
  newPriority?: number;
  /** the y axis input for a new priority */
  newResource?: number;

  helper!: KonvaHelper;

  xAxisLength = window.innerWidth * AXES_PERCENTAGE;
  yAxisHeight = window.innerHeight * AXES_PERCENTAGE;

  /**
   * Determines which rhs menu to open
   */
  activeRhs!: 'help' | 'settings' | 'order';

  /** This is the priority that has been clicked on the screen
   * set by the click event on the priority item group on canvas
   */
  activePriority?: string;

  titles = {
    help: 'Neo Strategy Help',
    settings: 'Canvas Settings',
    order: 'Priority Order',
  };

  exportMenu: MatFabMenu[] = [
    { id: 1, icon: 'add_a_photo', color: 'primary', tooltip: 'Save as PNG', tooltipPosition: 'left' },
    { id: 2, icon: 'picture_as_pdf', color: 'primary', tooltip: 'Save as PDF', tooltipPosition: 'left' },
  ];

  @ViewChild('rhs')
  rightNav!: MatSidenav;

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

    this.subs.push(
      this.settings.showMidAxis
        .pipe(
          tap((b) => {
            if (b) {
              console.log('redraw them now');
              this.initMiddleAxes();
            } else {
              [ImportantIds.X_MID_AXIS, ImportantIds.Y_MID_AXIS].forEach((mid) => this.helper.removeDrawnItem(mid));
            }
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
  /**
   * Fetch the saved priorities from local storage
   * this lets the user resume a session
   */
  private fetchFromLocalStorage() {
    const found = window.localStorage.getItem(LOCAL_STORAGE_KEYS.PRIORITIES);

    if (!!found) {
      const priorities: PriorityItem[] = JSON.parse(found);
      priorities.forEach((p) => this.addPriority(p));
      this.recalculatePriorities();
    }
  }

  /**
   * Save the stringifed priorities to local storage
   */
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

  /**
   * Inits the Konva stage
   */
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

    this.helper = new KonvaHelper(stage, this.settings);

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
      this.activePriority = undefined;
      this.newPriorityItem = undefined;

      this.showInfoCard(e);
    });
  }

  /**
   * Inits the main x and y axes
   */
  private initAxes() {
    const axisLayer = new Layer();

    const xAxis = new Line({
      points: [
        AXES_START,
        this.helper.stage.height() * AXES_PERCENTAGE,
        this.helper.stage.width() * AXES_PERCENTAGE,
        this.helper.stage.height() * AXES_PERCENTAGE,
      ],
      stroke: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      strokeWidth: 3,
      id: ImportantIds.X_AXIS,
      exclude: true,
    });

    const yAxis = new Line({
      points: [AXES_START, this.helper.stage.height() * 0.1, AXES_START, this.helper.stage.height() * AXES_PERCENTAGE],
      stroke: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      strokeWidth: 3,
      id: ImportantIds.Y_AXIS,
      exclude: true,
    });

    const yAxisLabel = new Text({
      id: 'yAxisLabel',
      text: `Priority`,
      fontSize: this.settings.circleFontSize.getValue(),
      width: AXES_START + this.helper.stage.width() * AXES_PERCENTAGE,
      fontFamily: 'Calibri',
      fill: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      align: 'center',
      y: this.helper.stage.height() * AXES_PERCENTAGE + this.helper.stage.height() * 0.025,
      exclude: true,
    });

    const xAxisLabel = new Text({
      id: 'xAxisLabel',
      text: `Resources Required`,
      fontSize: this.settings.circleFontSize.getValue(),
      width: this.helper.stage.height() * 0.1 + this.helper.stage.height() * AXES_PERCENTAGE,
      rotationDeg: 270,
      fontFamily: 'Calibri',
      fill: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      align: 'center',
      x: AXES_START - this.helper.stage.width() * 0.025,
      y: this.helper.stage.height() * 0.1 + this.helper.stage.height() * AXES_PERCENTAGE,
      exclude: true,
    });

    this.helper.addDrawnItem(xAxis, yAxis, yAxisLabel, xAxisLabel);

    this.helper.addTo(axisLayer, xAxis);
    this.helper.addTo(axisLayer, yAxis);
    this.helper.addTo(axisLayer, yAxisLabel, xAxisLabel);

    this.helper.addToStage(axisLayer);
  }

  /**
   * Initialise the location of the middle axes
   * @returns no return, but does exit early if xAxis or yAxis is not found
   */
  private initMiddleAxes() {
    const midAxesLayer = new Layer();

    const axes = this.helper.fetchItemsOfType('Line') as Line[];

    const xAxis = axes.find((axis) => axis.id() === ImportantIds.X_AXIS);
    const yAxis = axes.find((axis) => axis.id() === ImportantIds.Y_AXIS);

    if (!xAxis) {
      console.error('No axis line found for x axis with id: xAxisLine');
      return;
    }
    if (!yAxis) {
      console.error('No axis line found for y axis with id: yAxisLine');
      return;
    }

    const lastX = xAxis.points().at(-2);
    if (!lastX) {
      console.error('2nd last point in xAxis is not defined');
      return;
    }
    const lastY = yAxis.points().at(-1);
    if (!lastY) {
      console.error('Last point in yAxis is not defined');
      return;
    }

    const middleX = (AXES_START + lastX) / 2;
    const middleY = (this.helper.stage.height() * 0.1 + lastY) / 2;

    const xMid = new Line({
      points: [AXES_START, middleY, this.helper.stage.width() * AXES_PERCENTAGE, middleY],
      stroke: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      strokeWidth: 1,
      id: ImportantIds.X_MID_AXIS,
      exclude: true,
    });

    const yMid = new Line({
      points: [middleX, this.helper.stage.height() * 0.1, middleX, this.helper.stage.height() * AXES_PERCENTAGE],
      stroke: this.themeService.activeTheme.getValue().isDark ? 'white' : 'black',
      strokeWidth: 1,
      id: ImportantIds.Y_MID_AXIS,
      exclude: true,
    });

    this.helper.addDrawnItem(xMid, yMid);
    this.helper.addTo(midAxesLayer, xMid, yMid);
    this.helper.addToStage(midAxesLayer);
    midAxesLayer.moveToBottom();
  }

  /**
   * Shows the floating priority card
   * @param e The mouse event that triggered the card to open
   */
  private showInfoCard(e: KonvaEventObject<MouseEvent>) {
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
    document.getElementById('floating-input')?.click();
  }

  /**
   * Hides the floating priority menu
   */
  hideFloater() {
    this.floatingInputDiv.style.display = 'none';
    this.newPriorityItem = undefined;
    this.activePriority = undefined;
  }

  /**
   * Renames a priority, including its title and tooltip
   */
  renamePriority() {
    if (!this.activePriority) {
      console.error('No active priority, cannot rename something that doesnt exist');
      return;
    }
    const activeP = this.priorities.find((p) => p.id === this.activePriority);

    if (activeP && this.newPriorityItem) {
      activeP.title = this.newPriorityItem;
      const drawn = this.helper.fetchDrawnItem(this.activePriority) as Group;
      const [tooltip] = this.helper.fetchChildrenOfType(drawn, 'Label') as Label[];
      const tooltipText = tooltip.getChildren().filter((c) => c.className === 'Text');
      tooltipText.forEach((t) => (t as Text).text(this.newPriorityItem!));
    }
    this.hideFloater();
  }

  /**
   * Adds a new priority from the floating menu that appears on the canvas
   */
  addListItemFromFloat() {
    const pos: Position = {
      x: parseInt(this.floatingInputDiv.style.left, 10),
      y: parseInt(this.floatingInputDiv.style.top, 10),
    };

    this.addListItem(pos);
    this.hideFloater();
  }

  /**
   * Adds a new priority from the left sidenav
   * @param pos
   * @returns
   */
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

  /**
   * Draws a new priority item to the screen, including tooltip, and circle, as well as assign click events
   * @param p
   */
  addPriority(p: PriorityItem) {
    const elementNum = this.priorities.push(p);

    const priorityGroup = new Group({
      x: p.position.x,
      y: p.position.y,
      id: p.id,
      draggable: true,
    });

    const newCircle = new Circle({
      radius: this.settings.circleRadius.getValue(),
      fill: this.themeService.activeTheme.getValue().buttonColor,
      stroke: 'black',
      strokeWidth: 2,
    });

    const priorityLabel = new Text({
      text: `${elementNum}`,
      fontSize: this.settings.circleFontSize.getValue(),
      width: this.settings.circleRadius.getValue(),
      fontFamily: 'Calibri',
      fill: this.themeService.activeTheme.getValue().buttonTextColor,
      align: 'center',
      offsetX: this.settings.circleRadius.getValue() / 2,
      offsetY: this.settings.circleRadius.getValue() / 2 - 2, // arbitrary - 2 here, looked more centered
    });

    const tooltip = this.helper.createTooltip(p.title);

    priorityGroup.on('mouseover', () => {
      this.stageDiv!.classList.add('pointer');
      tooltip.show();
      newCircle.fill(this.themeService.activeTheme.getValue().headingColor);
    });
    priorityGroup.on('mouseout', () => {
      this.stageDiv!.classList.remove('pointer');
      if (!this.settings.alwaysShowTooltips.getValue()) tooltip.hide();
      newCircle.fill(this.themeService.activeTheme.getValue().buttonColor);
    });

    this.helper.addTo(priorityGroup, newCircle);
    this.helper.addTo(priorityGroup, priorityLabel);
    this.helper.addTo(priorityGroup, tooltip);

    priorityGroup.on('click', (e) => {
      this.activePriority = priorityGroup.id();
      this.newPriorityItem = p.title;
      this.showInfoCard(e);
    });

    priorityGroup.on('dragstart', (e) => {
      priorityGroup.moveToTop();
    });
    priorityGroup.on('dragend', (e) => {
      this.recalculatePriorities();
    });

    this.helper.addDrawnItem(priorityGroup);
    this.helper.addTo(this.priorityLayer, priorityGroup);

    this.priorityLayer.draw();
  }

  /**
   * Returns the x and y position of the item based on the values entered in the input boxes in the left menu
   * @param pos
   * @returns The updated position
   */
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

  /**
   * Removes the list item at the given index
   * @param i index of the item
   */
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

  deleteActivePriority() {
    const i = this.priorities.findIndex((p) => p.id === this.activePriority);

    if (i > -1) {
      this.removeListItem(i);
      this.hideFloater();
      this.recalculatePriorities();
    }
  }

  /**
   * Recalcuates the priorities after a dragend event has happened or on fetch from local storage
   */
  recalculatePriorities() {
    const order: { [key: string]: PriorityItem[] } = {};

    QUANTILE_ORDER.forEach((k) => (order[k] = []));

    this.helper.priorityChildren.forEach((p) => {
      const _p = this.priorities.find((pi) => pi.id === p.id());
      if (!_p) {
        console.error('No Priority found with id: ' + p.id());
        return;
      }
      if (p.x() <= this.helper.stage.width() / 2) {
        // left side of screen
        if (p.y() <= this.helper.stage.height() / 2) {
          order[QuantileKeys.TOP_LEFT].push(_p);
        } else {
          order[QuantileKeys.BOTTOM_LEFT].push(_p);
        }
      } else {
        // right side of screen
        if (p.y() <= this.helper.stage.height() / 2) {
          order[QuantileKeys.TOP_RIGHT].push(_p);
        } else {
          order[QuantileKeys.BOTTOM_RIGHT].push(_p);
        }
      }
    });

    this.prioritiesOrder = QUANTILE_ORDER.map((k) => {
      return order[k].sort((a, b) => {
        const drawnA = this.helper.fetchDrawnItem(a.id);
        const drawnB = this.helper.fetchDrawnItem(b.id);
        if (drawnA.x() === drawnB.x()) {
          return drawnA.y() < drawnB.y() ? 0 : 1;
        }
        return drawnA.x() > drawnB.x() ? 0 : 1;
      });
    }).flat();
  }

  /**
   * Handles the hover of a list item in the sidenav
   * @param id The drawn item id
   * @param over whether the mouse is over the item or has left the item
   */
  handleHover(id: string, over: boolean) {
    const group = this.helper.fetchDrawnItem(id);

    if (group && group instanceof Group) {
      const circles = this.helper.fetchChildrenOfType(group, 'Circle') as Circle[];

      if (circles.length > 0) {
        circles.forEach((circle) => {
          if (over) {
            circle.fill(this.themeService.activeTheme.getValue().headingColor);
          } else {
            circle.fill(this.themeService.activeTheme.getValue().buttonColor);
          }
        });
      }
    }
  }

  handleFabMenuSelection(e: any) {
    switch (e) {
      case 1: {
        // png
        this.captureImage();
        return;
      }

      case 2: {
        //pdf
        return;
      }

      default: {
        // unsupported
      }
    }
  }

  captureImage() {
    const canvas = document.getElementById('canvas-container');

    if (canvas) {
      from(html2canvas(canvas, { allowTaint: true }))
        .pipe(
          tap(() => {
            this.activeRhs = 'order';
            this.rightNav.toggle();
          }),
          mergeMap((img) => {
            return this.rightNav._animationEnd.pipe(
              take(1),
              mergeMap(() => {
                const list = document.getElementById('rhs-sidenav');
                if (list) {
                  return from(html2canvas(list)).pipe(
                    map((listImg) => {
                      return [img, listImg];
                    }),
                    tap(() => {
                      this.rightNav.toggle();
                    })
                  );
                }
                return throwError(() => {
                  return 'No rhs-sidenav element found.';
                });
              })
            );
          }),
          mergeMap((imgs) => {
            return this.mergeImages(imgs.map((img) => img.toDataURL()));
          }),
          catchError((err) => {
            console.error(err);
            return of(err);
          })
        )
        .subscribe();
    }
  }

  mergeImages(imgs: string[]) {
    let numLoaded = 0;
    const subject = new Subject();

    // imgs = ['https://via.placeholder.com/100x100/FFFFaa', 'https://via.placeholder.com/100x100/ccccFF'];
    var c = document.getElementById('result-canvas') as HTMLCanvasElement;

    if (!c) {
      return throwError(() => 'No result-canvas');
    }

    c.style.display = 'block';
    c.width = window.innerWidth + 330;
    c.height = window.innerHeight;
    var ctx = c.getContext('2d');

    if (ctx === null) {
      return throwError(() => 'No ctx');
    }

    let imgObjs: HTMLImageElement[] = [];
    imgs.forEach((img, i, list) => {
      let imgObj = new Image();

      imgObj.src = img;

      imgObj.onload = () => {
        if (i > 0) {
          ctx!.drawImage(imgObj, imgObjs[i - 1].width, 0);
        } else {
          ctx!.drawImage(imgObj, 0, 0);
        }
        subject.next(true);
      };
      imgObjs.push(imgObj);
    });

    return subject.pipe(
      tap(() => {
        numLoaded = numLoaded + 1;
      }),
      filter(() => numLoaded === imgs.length),
      mergeMap(() => {
        // return of(null);
        return from(html2canvas(c, { allowTaint: true, logging: false })).pipe(
          tap((img) => {
            document.body.appendChild(img);
            const uri = img.toDataURL();
            const filename = `Prioritiy Matrix ${new Date().toDateString()}.png`;
            var link = document.createElement('a');

            if (typeof link.download === 'string') {
              link.href = uri;
              link.download = filename;

              //Firefox requires the link to be in the body
              document.body.appendChild(link);

              //simulate click
              link.click();

              //remove the link when done
              document.body.removeChild(link);
            } else {
              window.open(uri);
            }

            document.body.removeChild(img);
            c.style.display = 'none';
          })
        );
      })
    );
  }
}
