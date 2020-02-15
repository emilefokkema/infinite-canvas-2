import { Area } from "./area";
import { ConvexPolygon } from "./convex-polygon";
import { Point } from "../geometry/point";
import { Transformation } from "../transformation";
import { LineSegment } from "./line-segment";

class Empty implements Area{
    public intersectWith(area: Area): Area {
        return this;
    }
    public intersectWithConvexPolygon(convexPolygon: ConvexPolygon): Area {
        return this;
    }
    public intersects(area: Area): boolean{
        return false;
    }
    public intersectWithLineSegment(other: LineSegment): Area{
        return this;
    }
    public expandToInclude(area: Area): Area{
        return area;
    }
    public transform(transformation: Transformation): Area{
        return this;
    }
    public contains(other: Area): boolean{
        return false;
    }
    public isContainedByConvexPolygon(other: ConvexPolygon): boolean{
        return true;
    }
    public isContainedByLineSegment(other: LineSegment): boolean{
        return true;
    }
    public intersectsConvexPolygon(other: ConvexPolygon): boolean{
        return false;
    }
    public intersectsLineSegment(lineSegment: LineSegment): boolean{
        return false;
    }
    public expandToIncludePoint(point: Point): Area {
        return this;
    }
    public expandToIncludePolygon(polygon: ConvexPolygon): Area {
        return polygon;
    }
}
export const empty: Empty = new Empty();