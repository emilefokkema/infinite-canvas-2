import { Point } from "../geometry/point";
import { HalfPlane } from "./half-plane";

export class PolygonVertex{
    public readonly normal1: Point;
    public readonly normal2: Point;
    constructor(public readonly point: Point, public halfPlane1: HalfPlane, public halfPlane2: HalfPlane){
        this.normal1 = halfPlane1.normalTowardInterior;
        this.normal2 = halfPlane2.normalTowardInterior;
    }
    public isContainedByHalfPlaneWithNormal(normal: Point): boolean{
        if(this.normal1.cross(this.normal2) > 0){
            return this.normal1.cross(normal) >= 0 && normal.cross(this.normal2) >= 0;
        }
        return this.normal1.cross(normal) <= 0 && normal.cross(this.normal2) <= 0;
    }
    public isContainedByVertex(other: PolygonVertex): boolean{
        return this.isContainedByHalfPlaneWithNormal(other.normal1) && this.isContainedByHalfPlaneWithNormal(other.normal2);
    }
}