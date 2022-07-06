import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import {
  Observable,
  of,
  BehaviorSubject,
  fromEvent,
  map,
  scan,
  pairwise,
  combineLatest,
  startWith,
} from "rxjs";
import { Stage } from "konva/lib/Stage";
import { Layer } from "konva/lib/Layer";
import { Circle } from "konva/lib/shapes/Circle";
import { Text } from "konva/lib/shapes/Text";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { KonvaEventObject } from "konva/lib/Node";
import { Line } from "konva/lib/shapes/Line";
import { Group } from "konva/lib/Group";
import { KonvaHelper } from "./konva-helper";

interface PriorityItem {
  id: string;
  title: string;
  icon?: string;
}
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "neo-strategy";

  priorities: PriorityItem[] = [];

  priorityLayer!: Layer;

  @ViewChild("matrix", { static: false })
  myCanvas: ElementRef<HTMLCanvasElement> = {} as ElementRef<any>;

  matrixContext!: CanvasRenderingContext2D | null;

  newPriority?: string;
  helper!: KonvaHelper;

  ngOnInit() {
    this.initStage();
  }

  private initStage() {
    const stage = new Stage({
      container: "matrix", // id of container <div>
      width: 500,
      height: 500,
    });

    this.helper = new KonvaHelper(stage);

    this.priorityLayer = new Layer();

    this.initAxes();

    this.helper.addToStage(this.priorityLayer);
    this.helper.refreshStage();
  }

  private initAxes() {
    const axisLayer = new Layer();

    const xAxis = new Line({
      points: [
        10,
        this.helper.stage.height() * 0.8,
        this.helper.stage.width() * 0.8,
        this.helper.stage.height() * 0.8,
      ],
      stroke: "white",
      strokeWidth: 5,
      id: "xAxisLine",
      exclude: true,
    });

    const yAxis = new Line({
      points: [10, 10, 10, this.helper.stage.height() * 0.8],
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
  addListItem() {
    if (!this.newPriority) {
      console.error("No priority entered");
      return;
    }

    const newId = this.helper.generateId();

    const elementNum = this.priorities.push({
      title: this.newPriority,
      id: newId,
    });

    const priorityGroup = new Group({
      x: this.helper.stage.width() / 2,
      y: this.helper.stage.height() / 2,
      id: newId,
      draggable: true,
    });

    const newCircle = new Circle({
      radius: 25,
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
    });
    priorityGroup.on("mouseout", function () {
      document.body.style.cursor = "default";
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
}
