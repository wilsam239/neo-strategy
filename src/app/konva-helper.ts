import { Group } from 'konva/lib/Group';
import { Shape, ShapeConfig } from 'konva/lib/Shape';
import { Label, Tag } from 'konva/lib/shapes/Label';
import { Text } from 'konva/lib/shapes/Text';
import { Stage } from 'konva/lib/Stage';

export class KonvaHelper {
  private drawnItems: { [key: string]: Shape | Group } = {};
  constructor(private _stage: Stage) {}

  addToStage(child: any) {
    this.stage.add(child);
  }

  addTo(parent: any, ...children: any[]) {
    children.forEach((child) => {
      parent.add(child);
    });
  }

  addDrawnItem(...items: any[]) {
    items.forEach((item) => {
      if (item.id()) {
        this.drawnItems[item.id()] = item;
      }
    });
  }

  removeDrawnItem(id: string) {
    if (this.drawnItems[id]) {
      this.drawnItems[id].remove();
      delete this.drawnItems[id];
    } else {
      throw new Error('No Drawn Item with id' + id);
    }
  }

  refreshStage() {
    this.stage.draw();
  }

  fetchItemsOfType(className: string): (Group | Shape<ShapeConfig> | Text)[] {
    return Object.values(this.drawnItems).filter((i) => i.className === className || i.getType() === className);
  }

  fetchDrawnItem(id: string) {
    return this.drawnItems[id];
  }

  fetchChildrenOfType(item: Group, className: string): (Group | Shape<ShapeConfig> | Text)[] {
    return item.getChildren((child) => child.className === className);
  }

  resizeStage(width: number, height: number) {
    console.log(width);
    console.log(height);
    this.stage.width(width);
    this.stage.height(height);
  }

  generateId(length = 10) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  createTooltip(textString: string) {
    const tooltip = new Label({});
    tooltip.hide();

    const tooltipTag = new Tag({
      fill: 'black',
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      shadowOpacity: 0.5,
    });

    const tooltipText = new Text({
      text: textString,
      fontFamily: 'Calibri',
      fontSize: 18,
      padding: 5,
      fill: 'white',
    });

    this.addTo(tooltip, tooltipTag, tooltipText);
    return tooltip;
  }

  createPriority() {}

  public get priorityChildren() {
    return Object.values(this.drawnItems).filter((item) => !item.getAttr('exclude'));
  }
  public get stage() {
    return this._stage;
  }
}
