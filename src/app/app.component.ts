import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Group } from "konva/lib/Group";
import { Layer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Circle } from "konva/lib/shapes/Circle";
import { Line } from "konva/lib/shapes/Line";
import { Text } from "konva/lib/shapes/Text";
import { Stage } from "konva/lib/Stage";
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

  options: {
    circleRadius: number;
  } = {
    circleRadius: 25,
  };

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
    this.makeFakeList();
  }

  private makeFakeList(length = 5) {
    for (let i = 0; i < length; i++) {
      this.newPriority = this.helper.generateId(15);
      this.addListItem({ x: i * 50 + 100, y: i * 50 + 100 });
    }
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
  addListItem(pos?: { x: number; y: number }) {
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
      x: pos?.x ?? this.helper.stage.width() / 2,
      y: pos?.y ?? this.helper.stage.height() / 2,
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
}
