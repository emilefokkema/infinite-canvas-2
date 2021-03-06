import { StateAndInstruction } from "./state-and-instruction";
import { StateChangingInstructionSetWithArea } from "../interfaces/state-changing-instruction-set-with-area";
import { InfiniteCanvasState } from "../state/infinite-canvas-state";
import { Instruction } from "./instruction";
import { Area } from "../areas/area";
import { CanvasRectangle } from "../rectangle/canvas-rectangle";

export class RectangularDrawing extends StateAndInstruction implements StateChangingInstructionSetWithArea{
    constructor(initialState: InfiniteCanvasState, state: InfiniteCanvasState, instruction: Instruction, combinedInstruction: Instruction, public area: Area, rectangle: CanvasRectangle){
        super(initialState, state, instruction, combinedInstruction, rectangle);
    }
    public hasDrawingAcrossBorderOf(area: Area): boolean{
        return this.intersects(area) && !this.isContainedBy(area);
    }
    public intersects(area: Area): boolean{
        return this.area.intersects(area);
    }
    public isContainedBy(area: Area): boolean {
        return area.contains(this.area);
    }
    public static createDrawing(initialState: InfiniteCanvasState, instruction: Instruction, area: Area, rectangle: CanvasRectangle): RectangularDrawing{
        return new RectangularDrawing(initialState, initialState, instruction, () => {}, area, rectangle);
    }
}