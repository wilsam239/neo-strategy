import { Component, ElementRef, ViewChild } from "@angular/core";
import { Observable, of, BehaviorSubject, fromEvent, map, scan, pairwise, combineLatest, startWith } from "rxjs";

import * as Konva from 'konva';

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

}
