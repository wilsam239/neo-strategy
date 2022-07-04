import { Component, ElementRef, ViewChild } from "@angular/core";
import { Observable, of, BehaviorSubject, fromEvent, map, scan, pairwise, combineLatest, startWith } from "rxjs";
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Circle } from 'konva/lib/shapes/Circle';

interface PriorityItem {
    title: string;
    icon?: string;
}
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "neo-strategy";

  priorities: PriorityItem[] = [];

  @ViewChild("matrix", { static: false })
  myCanvas: ElementRef<HTMLCanvasElement> = {} as ElementRef<any>;

  matrixContext!: CanvasRenderingContext2D | null;

  addListItem() {
    this.priorities.push({title: 'item1'})
  }

  removeListItem(i: number) {
    this.priorities.splice(i, 1);
  }

  konvaTest() {
    // first we need to create a stage
var stage = new Stage({
    container: 'matrix',   // id of container <div>
    width: 500,
    height: 500
  });
  
  // then create layer
  var layer = new Layer();
  
  // create our shape
  var circle = new Circle({
    x: stage.width() / 2,
    y: stage.height() / 2,
    radius: 70,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 4,
    draggable: true
  });

  circle.on('dragend', (e) => {
    console.log(e)
  })
  
  // add the shape to the layer
  layer.add(circle);
  
  // add the layer to the stage
  stage.add(layer);
  
  // draw the image
  layer.draw();
  }
}
