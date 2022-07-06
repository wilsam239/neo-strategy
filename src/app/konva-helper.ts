import { Group } from "konva/lib/Group";
import { Shape } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";

export class KonvaHelper {
  private drawnItems: { [key: string]: Shape | Group } = {};
  constructor(private _stage: Stage) {}

  addToStage(child: any) {
    this.stage.add(child);
  }

  addTo(parent: any, child: any) {
    parent.add(child);
  }

  addDrawnItem(...items: any[]) {
    items.forEach((item) => {
      if (item.id()) {
        this.drawnItems[item.id()] = item;
      }
    });
  }

  removeDrawnItem(id: string) {
    if(this.drawnItems[id]) {
        this.drawnItems[id].remove();
        delete this.drawnItems[id];
    } else {
        throw new Error('No Drawn Item with id' + id);
    }
  }

  refreshStage() {
    this.stage.draw();
  }

  generateId(length = 10) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public get priorityChildren() {
    return Object.values(this.drawnItems).filter(item => !item.getAttr('exclude'))
  }
  public get stage() {
    return this._stage;
  }
}
