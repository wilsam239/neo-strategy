import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatSelectionList } from "@angular/material/list";
import { Group } from "konva/lib/Group";
import { Layer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Circle } from "konva/lib/shapes/Circle";
import { Line } from "konva/lib/shapes/Line";
import { Text } from "konva/lib/shapes/Text";
import { Stage } from "konva/lib/Stage";
import { debounceTime, fromEvent, Subscription, tap } from "rxjs";
import { KonvaHelper } from "./konva-helper";

interface PriorityItem {
  id: string;
  title: string;
  icon?: string;
}

const AXES_PERCENTAGE = 0.9;
const AXES_START = 50;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  title = "neo-strategy";

  priorities: PriorityItem[] = [];

  priorityLayer!: Layer;

  @ViewChild("priorityList")
  priorityListElement!: MatSelectionList;

  newPriorityItem?: string;
  newPriority?: number;
  newResource?: number;

  helper!: KonvaHelper;

  options: {
    circleRadius: number;
  } = {
    circleRadius: 25,
  };

  xAxisLength = window.innerWidth * AXES_PERCENTAGE;
  yAxisHeight = window.innerHeight * AXES_PERCENTAGE;

  ngOnInit() {
    this.initStage();

    this.subs.push(
      fromEvent(window, "resize")
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
      container: "matrix", // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
    });

    this.helper = new KonvaHelper(stage);

    this.priorityLayer = new Layer();

    this.initAxes();

    this.helper.addToStage(this.priorityLayer);
    this.helper.refreshStage();
    this.makeFakeList();
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
      stroke: "white",
      strokeWidth: 5,
      id: "xAxisLine",
      exclude: true,
    });

    const yAxis = new Line({
      points: [
        AXES_START,
        this.helper.stage.height() * 0.1,
        AXES_START,
        this.helper.stage.height() * AXES_PERCENTAGE,
      ],
      stroke: "white",
      strokeWidth: 5,
      id: "yAxisLine",
      exclude: true,
    });

    this.helper.addDrawnItem(xAxis, yAxis);

    this.helper.addTo(axisLayer, xAxis);
    this.helper.addTo(axisLayer, yAxis);

    this.helper.addToStage(axisLayer);
  }
  addListItem(pos?: { x: number; y: number }) {
    if (!this.newPriorityItem) {
      console.error("No priority entered");
      return;
    }

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
      fill: "white",
      stroke: "black",
      strokeWidth: 4,
    });

    const priorityLabel = new Text({
      text: `${elementNum}`,
      fontSize: 30,
      fontFamily: "Calibri",
      fill: "green",
    });

    priorityGroup.on("mouseover", function () {
      document.body.style.cursor = "pointer";
      newCircle.fill("green");
    });
    priorityGroup.on("mouseout", function () {
      document.body.style.cursor = "default";
      newCircle.fill("white");
    });

    this.helper.addTo(priorityGroup, newCircle);
    this.helper.addTo(priorityGroup, priorityLabel);

    priorityGroup.on("dragend", (e) => {
      this.recalculatePriorities(e);
    });

    this.helper.addDrawnItem(priorityGroup);
    this.helper.addTo(this.priorityLayer, priorityGroup);

    this.priorityLayer.draw();
    this.newPriority = undefined;
    this.newPriorityItem = undefined;
    this.newResource = undefined;
  }

  removeListItem(i: number) {
    const deletedProp = this.priorities[i];
    this.priorities.splice(i, 1);

    this.helper.removeDrawnItem(deletedProp.id);

    this.helper.priorityChildren.forEach((item) => {
      if (item instanceof Group) {
        item
          .getChildren((child) => child.className === "Text")
          .forEach((_textChild) => {
            const textChild = _textChild as Text;
            const newIndex =
              this.priorities.findIndex((p) => p.id === item.id()) + 1;

            if (newIndex > 0) {
              textChild.text(newIndex.toString());
            }
          });
      }
    });
  }

  recalculatePriorities(e: KonvaEventObject<DragEvent>) {
    console.log("Recalc priorities here");
  }

  handleKey(event: any) {
    console.log(event);
  }

  hoverHandle(id: string, over: boolean) {
    const group = this.helper.fetchDrawnItem(id);

    if (group && group instanceof Group) {
      const circles = this.helper.getChildrenOfType(
        group,
        "Circle"
      ) as Circle[];

      if (circles.length > 0) {
        circles.forEach((circle) => {
          if (over) {
            circle.fill("green");
          } else {
            circle.fill("white");
          }
        });

        // this.helper.refreshStage();
      }
    }
  }

  updateRadius() {
    const groups = this.helper.fetchItemsOfType("Group") as Group[];
    groups.forEach((group) => {
      const circles = this.helper.getChildrenOfType(
        group,
        "Circle"
      ) as Circle[];
      circles.forEach((circle) => circle.radius(this.options.circleRadius));
    });
  }

  handleOptionSelect() {
    console.log("Option selected");
    this.priorityListElement.deselectAll();
  }
}
