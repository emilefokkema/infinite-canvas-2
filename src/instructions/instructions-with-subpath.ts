import {StateChangingInstructionSequence} from "./state-changing-instruction-sequence";
import {PathInstructionWithState} from "./path-instruction-with-state";
import {InfiniteCanvasState} from "../state/infinite-canvas-state";
import {ViewboxInfinity} from "../interfaces/viewbox-infinity";
import {Position} from "../geometry/position";
import {Transformation} from "../transformation";
import {isPointAtInfinity} from "../geometry/is-point-at-infinity";
import {DrawingPathInstructionWithState} from "./drawing-path-instruction-with-state";
import {ClippingPathInstructionWithState} from "./clipping-path-instruction-with-state";
import {transformPosition} from "../geometry/transform-position";
import {PathInstruction} from "../interfaces/path-instruction";
import {Area} from "../areas/area";

export class InstructionsWithSubpath extends StateChangingInstructionSequence<PathInstructionWithState>{
    private currentPosition: Position;
    constructor(private _initiallyWithState: PathInstructionWithState, private readonly initialPosition: Position, private readonly infinityFactory: (state: InfiniteCanvasState) => ViewboxInfinity) {
        super(_initiallyWithState);
        this.currentPosition = initialPosition;
    }
    public addDrawingInstruction(drawingInstruction: DrawingPathInstructionWithState): void{
        drawingInstruction.setInitialState(this.state);
        this.add(drawingInstruction);
    }
    public addClippingInstruction(clippingInstruction: ClippingPathInstructionWithState): void{
        clippingInstruction.setInitialState(this.state);
        this.add(clippingInstruction);
    }
    public closePath(): void{
        const toAdd: PathInstructionWithState = PathInstructionWithState.create(this.state, (context: CanvasRenderingContext2D) => {context.closePath();});
        toAdd.setInitialState(this.state);
        this.add(toAdd);
    }
    public copy(): InstructionsWithSubpath{
        const result: InstructionsWithSubpath = new InstructionsWithSubpath(this._initiallyWithState.copy(), this.initialPosition, this.infinityFactory);
        for(const added of this.added){
            result.add(added.copy());
        }
        result.removeAll(i => (i instanceof DrawingPathInstructionWithState));
        return result;
    }
    public lineTo(position: Position, state: InfiniteCanvasState): void{
        const transformedPosition: Position = transformPosition(position, state.current.transformation);
        const previousPosition: Position = this.currentPosition;
        this.currentPosition = transformedPosition;
        let toAdd: PathInstructionWithState = this.getInstructionToDrawLineFromTo(state, transformPosition(previousPosition, state.current.transformation.inverse()), position);
        toAdd.setInitialState(this.state);
        this.add(toAdd);
    }
    public clearContentsInsideArea(area: Area): void{
        this.removeAll(i => i instanceof DrawingPathInstructionWithState && area.contains(i.drawnArea));
    }
    public addPathInstruction(pathInstruction: PathInstruction, pathInstructionWithState: PathInstructionWithState, state: InfiniteCanvasState): void{
        if(pathInstruction.positionChange){
            this.currentPosition = transformPosition(pathInstruction.positionChange, state.current.transformation);
        }
        pathInstructionWithState.setInitialState(this.state);
        this.add(pathInstructionWithState);
    }
    private getInstructionToDrawLineFromTo(state: InfiniteCanvasState, from: Position, to: Position): PathInstructionWithState{
        if(isPointAtInfinity(to)){
            if(isPointAtInfinity(from)){

            }else{
                const infinity = this.infinityFactory(state);
                return PathInstructionWithState.create(state, (context: CanvasRenderingContext2D, transformation: Transformation) => {
                    const {x, y} = infinity.getInfinityFromPointInDirection(from, to.direction, transformation);
                    context.lineTo(x, y);
                });
            }
        }else{
            return PathInstructionWithState.create(state, (context: CanvasRenderingContext2D, transformation: Transformation) => {
                const {x, y} = transformation.apply(to);
                context.lineTo(x, y);
            });
        }
    }
    public static create(initialState: InfiniteCanvasState, initialPosition: Position, infinityFactory: (state: InfiniteCanvasState) => ViewboxInfinity): InstructionsWithSubpath{
        let initialInstruction: PathInstructionWithState;
        if(isPointAtInfinity(initialPosition)){

        }else{
            initialInstruction = PathInstructionWithState.create(initialState, (context: CanvasRenderingContext2D, transformation: Transformation) => {
                const {x, y} = transformation.apply(initialPosition);
                context.moveTo(x, y);
            });
        }
        return new InstructionsWithSubpath(initialInstruction, transformPosition(initialPosition, initialState.current.transformation), infinityFactory);
    }
}