import { Transformation } from "./transformation";
import { Point } from "./geometry/point";
import { ConvexPolygon } from "./areas/polygons/convex-polygon";
import { Rectangle } from "./areas/polygons/rectangle";

export class ViewBoxInfinity{
    private viewBoxRectangle: ConvexPolygon;
    constructor(private viewBoxWidth: number, private viewBoxHeight: number, private infiniteContextTransformation: Transformation){
        this.viewBoxRectangle = Rectangle.create(0, 0, viewBoxWidth, viewBoxHeight);
    }
    private getTransformedViewbox(viewBoxTransformation: Transformation): ConvexPolygon{
        return this.viewBoxRectangle.transform(viewBoxTransformation.inverse().before(this.infiniteContextTransformation.inverse()));
    }
    public getInfinitiesFromDirectionFromPointToDirectionFromPoint(direction1: Point, point1: Point, direction2: Point, point2: Point): Point[]{
        return undefined;
    }
    public getInfinityFromPointInDirection(fromPoint: Point, direction: Point, viewBoxTransformation: Transformation): Point{
        const transformedViewbox: ConvexPolygon = this.getTransformedViewbox(viewBoxTransformation);
        return viewBoxTransformation.apply(transformedViewbox.getPointInFrontInDirection(fromPoint, direction));
    }
}