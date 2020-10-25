import {InfiniteCanvasRenderingContext2D} from "./infinite-context/infinite-canvas-rendering-context-2d"
import {InfiniteContext} from "./infinite-context/infinite-context"
import {ViewBox} from "./interfaces/viewbox";
import {InfiniteCanvasViewBox} from "./infinite-canvas-viewbox";
import {Transformer} from "./transformer/transformer"
import {InfiniteCanvasTransformer} from "./transformer/infinite-canvas-transformer";
import {InfiniteCanvasEvents} from "./events/infinite-canvas-events";
import {InfiniteCanvasConfig} from "./config/infinite-canvas-config";
import {AnimationFrameDrawingIterationProvider} from "./animation-frame-drawing-iteration-provider";
import {InfiniteCanvasEventMap} from "./custom-events/infinite-canvas-event-map";
import {InfiniteCanvasAddEventListenerOptions} from "./custom-events/infinite-canvas-add-event-listener-options";
import {InfiniteCanvasEventListener} from "./custom-events/infinite-canvas-event-listener";
import {DrawingIterationProviderWithCallback} from "./drawing-iteration-provider-with-callback";
import {LockableDrawingIterationProvider} from "./lockable-drawing-iteration-provider";
import {CanvasRectangle} from "./rectangle/canvas-rectangle";
import {HTMLCanvasRectangle} from "./rectangle/html-canvas-rectangle";
import {HtmlCanvasMeasurementProvider} from "./rectangle/html-canvas-measurement-provider";
import {InfiniteCanvasUnits} from "./infinite-canvas-units";
import {CanvasResizeObserver} from "./canvas-resize-observer";
import {HtmlCanvasResizeObserver} from "./html-canvas-resize-observer";
import {EventDispatcher} from "./custom-events/event-dispatcher";
import {InfiniteCanvasDrawEvent} from "./custom-events/infinite-canvas-draw-event";
import {EventDispatcherCollection} from "./custom-events/event-dispatcher-collection";

export class InfiniteCanvas implements InfiniteCanvasConfig{
	private context: InfiniteCanvasRenderingContext2D;
	private viewBox: ViewBox;
	private transformer: Transformer;
	private config: InfiniteCanvasConfig;
	private eventDispatchers: EventDispatcherCollection;
	private drawEventDispatcher: EventDispatcher<InfiniteCanvasDrawEvent>;
	private rectangle: CanvasRectangle;
	private canvasResizeObserver: CanvasResizeObserver;
	private canvasResizeListener: () => void;
	constructor(private readonly canvas: HTMLCanvasElement, config?: InfiniteCanvasConfig){
		this.config = {rotationEnabled: true, greedyGestureHandling: false, units: InfiniteCanvasUnits.CANVAS};
		if(config){
			Object.assign(this.config, config)
		}
		this.canvasResizeObserver = new HtmlCanvasResizeObserver(canvas);
		this.canvasResizeListener = () => {
			if(this.canvas.parentElement === null){
				return;
			}
			this.viewBox.draw();
		};
		const drawingIterationProvider: DrawingIterationProviderWithCallback = new DrawingIterationProviderWithCallback(new AnimationFrameDrawingIterationProvider());
		drawingIterationProvider.onDraw(() => this.dispatchDrawEvent());
		const lockableDrawingIterationProvider: LockableDrawingIterationProvider = new LockableDrawingIterationProvider(drawingIterationProvider);
		this.rectangle = new HTMLCanvasRectangle(new HtmlCanvasMeasurementProvider(canvas), this.config);
		this.viewBox = new InfiniteCanvasViewBox(
			this.rectangle,
			canvas.getContext("2d"),
			lockableDrawingIterationProvider,
			() => lockableDrawingIterationProvider.getLock(),
			() => this.transformer.isTransforming);
		this.transformer = new InfiniteCanvasTransformer(this.viewBox, this.config);
		const events: InfiniteCanvasEvents = new InfiniteCanvasEvents(canvas, this.transformer, this.config, this.rectangle);
		this.drawEventDispatcher = new EventDispatcher();
		this.eventDispatchers = new EventDispatcherCollection(
			this.drawEventDispatcher,
			this.transformer.transformationStart,
			this.transformer.transformationChange,
			this.transformer.transformationEnd);
		this.transformer.transformationStart.addListener(() => this.rectangle.measure());
		if(config && config.units === InfiniteCanvasUnits.CSS){
			this.canvasResizeObserver.addListener(this.canvasResizeListener);
		}
	}
	private setUnits(units: InfiniteCanvasUnits): void{
		if(units === InfiniteCanvasUnits.CSS && this.config.units !== InfiniteCanvasUnits.CSS){
			this.canvasResizeObserver.addListener(this.canvasResizeListener);
		}
		if(units !== InfiniteCanvasUnits.CSS && this.config.units === InfiniteCanvasUnits.CSS){
			this.canvasResizeObserver.removeListener(this.canvasResizeListener);
		}
		this.config.units = units;
		this.rectangle.measure();
		this.viewBox.draw();
	}
	public getContext(): InfiniteCanvasRenderingContext2D{
		if(!this.context){
			this.context = new InfiniteContext(this.canvas, this.viewBox);
		}
		return this.context;
	}
	public get rotationEnabled(): boolean{
		return this.config.rotationEnabled;
	}
	public set rotationEnabled(value: boolean){
		this.config.rotationEnabled = value;
	}
	public get units(): InfiniteCanvasUnits{
		return this.config.units;
	}
	public set units(value: InfiniteCanvasUnits){
		this.setUnits(value)
	}
	public get greedyGestureHandling(): boolean{
		return this.config.greedyGestureHandling;
	}
	public set greedyGestureHandling(value: boolean){
		this.config.greedyGestureHandling = value;
	}
	public addEventListener<K extends keyof InfiniteCanvasEventMap>(type: K, listener: InfiniteCanvasEventListener<K>, options?: InfiniteCanvasAddEventListenerOptions): void{
		this.eventDispatchers.addEventListener(type, listener, options);
	}
	public removeEventListener<K extends keyof InfiniteCanvasEventMap>(type: K, listener: InfiniteCanvasEventListener<K>): void{
		this.eventDispatchers.removeEventListener(type, listener);
	}
	private dispatchDrawEvent(): void{
		this.drawEventDispatcher.dispatchEvent({});
	}
	public static CANVAS_UNITS: InfiniteCanvasUnits = InfiniteCanvasUnits.CANVAS;
	public static CSS_UNITS: InfiniteCanvasUnits = InfiniteCanvasUnits.CSS;
}
