import { Area } from "../area";
import { HalfPlane } from "./half-plane";
import { Point } from "../../geometry/point";
import { PolygonVertex } from "./polygon-vertex";
import { plane } from "../plane";
import { Transformation } from "../../transformation";
import { HalfPlaneLineIntersection } from "./half-plane-line-intersection";
import { LineSegment } from "../line/line-segment";
import { Ray } from "../line/ray";
import { Line } from "../line/line";

export class ConvexPolygon implements Area{
    public readonly vertices: PolygonVertex[];
    public readonly halfPlanes: HalfPlane[];
    constructor(halfPlanes: HalfPlane[]){
        this.halfPlanes = halfPlanes;
        this.vertices = ConvexPolygon.getVertices(this.halfPlanes);
    }
    private findVertex(point: Point): PolygonVertex{
        for(let vertex of this.vertices){
            if(vertex.point.equals(point)){
                return vertex;
            }
        }
        return undefined;
    }
    public intersects(other: Area): boolean{
        return other.intersectsConvexPolygon(this);
    }
    public intersectWith(area: Area): Area {
        return area.intersectWithConvexPolygon(this);
    }
    public intersectWithRay(ray: Ray): Area{
        return ray.intersectWithConvexPolygon(this);
    }
    public intersectWithLine(line: Line): Area{
        return line.intersectWithConvexPolygon(this);
    }
    public intersectWithLineSegment(other: LineSegment): Area{
        return other.intersectWithConvexPolygon(this);
    }
    public contains(other: Area): boolean{
        return other.isContainedByConvexPolygon(this);
    }
    private containsHalfPlane(halfPlane: HalfPlane): boolean{
        for(let _halfPlane of this.halfPlanes){
            if(!halfPlane.isContainedByHalfPlane(_halfPlane)){
                return false;
            }
        }
        return true;
    }
    public isContainedByHalfPlane(halfPlane: HalfPlane): boolean{
        for(let vertex of this.vertices){
            if(!halfPlane.containsPoint(vertex.point)){
                return false;
            }
        }
        const complement: HalfPlane = halfPlane.complement();
        for(let _halfPlane of this.halfPlanes){
            if(_halfPlane.isContainedByHalfPlane(halfPlane)){
                return true;
            }
        }
        for(let _halfPlane of this.halfPlanes){
            if(this.hasAtMostOneVertex(_halfPlane) && (_halfPlane.isContainedByHalfPlane(complement) || complement.isContainedByHalfPlane(_halfPlane))){
                return false;
            }
            const intersection: PolygonVertex = _halfPlane.getIntersectionWith(halfPlane);
            const vertexAtIntersection: PolygonVertex = this.findVertex(intersection.point);
            if(vertexAtIntersection){
                if(!vertexAtIntersection.isContainedByHalfPlaneWithNormal(halfPlane.normalTowardInterior)){
                    return false;
                }
            }else if(this.containsPoint(intersection.point)){
                return false;
            }
        }
        if(this.containsHalfPlane(halfPlane)){
            return false;
        }
        return true;
    }
    public getPointInFrontInDirection(point: Point, direction: Point): Point{
        let along: number = 0;
        let frontMostVertex: Point;
        for(let vertex of this.vertices){
            const newAlong: number = vertex.point.minus(point).dot(direction);
            if(newAlong > along){
                frontMostVertex = vertex.point;
                along = newAlong;
            }
        }
        if(frontMostVertex){
            return point.plus(frontMostVertex.minus(point).projectOn(direction));
        }
        return point;
    }
    public expandToIncludePolygon(other: ConvexPolygon): Area{
        return ConvexPolygon.combinePolygons(this, other);
    }
    public expandToIncludePoint(point: Point): ConvexPolygon{
        let halfPlanes: HalfPlane[] = this.halfPlanes.filter(hp => hp.containsPoint(point)).concat(this.getTangentPlanesThroughPoint(point));
        halfPlanes = ConvexPolygon.getHalfPlanesNotContainingAnyOther(halfPlanes);
        return new ConvexPolygon(halfPlanes);
    }
    public expandToIncludeInfinityInDirection(direction: Point): Area{
        if(this.containsInfinityInDirection(direction)){
            return this;
        }
        let halfPlanes: HalfPlane[] = this.halfPlanes.filter(hp => hp.containsInfinityInDirection(direction)).concat(this.getTangentPlanesThroughInfinityInDirection(direction));
        halfPlanes = ConvexPolygon.getHalfPlanesNotContainingAnyOther(halfPlanes);
        if(halfPlanes.length === 0){
            return plane;
        }
        return new ConvexPolygon(halfPlanes);
    }
    public getIntersectionsWithLine(point: Point, direction: Point): HalfPlaneLineIntersection[]{
        const result: HalfPlaneLineIntersection[] = [];
        for(let halfPlane of this.halfPlanes){
            if(halfPlane.isParallelToLine(point, direction)){
                continue;
            }
            const intersection: HalfPlaneLineIntersection = halfPlane.intersectWithLine(point, direction);
            const vertexAtIntersection: PolygonVertex = this.findVertex(intersection.point);
            if(vertexAtIntersection && !vertexAtIntersection.containsLineSegmentWithDirection(direction)){
                continue;
            }
            if(this.containsPoint(intersection.point)){
                result.push(intersection);
            }
        }
        return result;
    }
    public expandToInclude(area: Area): Area{
        return area.expandToIncludePolygon(this);
    }
    public transform(transformation: Transformation): ConvexPolygon{
        return new ConvexPolygon(this.halfPlanes.map(hp => hp.transform(transformation)));
    }
    public intersectWithConvexPolygon(convexPolygon: ConvexPolygon): ConvexPolygon{
        if(convexPolygon.isContainedByConvexPolygon(this)){
            return convexPolygon;
        }
        if(this.isContainedByConvexPolygon(convexPolygon)){
            return this;
        }
        if(this.isOutsideConvexPolygon(convexPolygon)){
            return undefined;
        }
        const allHalfPlanes: HalfPlane[] = ConvexPolygon.getHalfPlanesNotContainingAnyOther(this.halfPlanes.concat(convexPolygon.halfPlanes));
        const verticesGroupedByPoint: PolygonVertex[][] = ConvexPolygon.groupVerticesByPoint(ConvexPolygon.getVertices(allHalfPlanes));
        const notConainingAnyOtherByPoint: PolygonVertex[][] = verticesGroupedByPoint.map(g => ConvexPolygon.getVerticesNotContainingAnyOther(g));
        const allVertices: PolygonVertex[] = notConainingAnyOtherByPoint.reduce((a, b) => a.concat(b), []);
        if(allVertices.length === 0){
            return new ConvexPolygon(allHalfPlanes);
        }
        const halfPlanes: HalfPlane[] = ConvexPolygon.getHalfPlanes(allVertices);
        return new ConvexPolygon(halfPlanes);
    }
    public containsInfinityInDirection(direction: Point): boolean{
        for(let halfPlane of this.halfPlanes){
            if(!halfPlane.containsInfinityInDirection(direction)){
                return false;
            }
        }
        return true;
    }
    public containsPoint(point: Point): boolean {
        for(let halfPlane of this.halfPlanes){
            if(!halfPlane.containsPoint(point)){
                return false;
            }
        }
        return true;
    }
    public intersectsRay(ray: Ray): boolean{
        return ray.intersectsConvexPolygon(this);
    }
    public intersectsLineSegment(lineSegment: LineSegment): boolean{
        return lineSegment.intersectsConvexPolygon(this);
    }
    public intersectsLine(line: Line): boolean{
        return line.intersectsConvexPolygon(this);
    }
    public intersectsConvexPolygon(other: ConvexPolygon): boolean{
        if(this.isContainedByConvexPolygon(other) || other.isContainedByConvexPolygon(this)){
            return true;
        }
        return !this.isOutsideConvexPolygon(other);
    }
    private isOutsideConvexPolygon(other: ConvexPolygon): boolean{
        for(let otherHalfPlane of other.halfPlanes){
            if(this.isContainedByHalfPlane(otherHalfPlane.complement())){
                return true;
            }
        }
        for(let thisHalfPlane of this.halfPlanes){
            if(other.isContainedByHalfPlane(thisHalfPlane.complement())){
                return true;
            }
        }
        return false;
    }
    private hasAtMostOneVertex(halfPlane: HalfPlane): boolean{
        let count: number = 0;
        for(let vertex of this.vertices){
            if(vertex.halfPlane1 === halfPlane || vertex.halfPlane2 === halfPlane){
                count++;
                if(count > 1){
                    return false;
                }
            }
        }
        return true;
    }
    private getTangentPlanesThroughInfinityInDirection(direction: Point): HalfPlane[]{
        const result: HalfPlane[] = [];
        for(let vertex of this.vertices){
            const throughVertex: HalfPlane[] = HalfPlane.withBorderPointAndInfinityInDirection(vertex.point, direction);
            for(let planeThroughVertex of throughVertex){
                if(this.isContainedByHalfPlane(planeThroughVertex)){
                    result.push(planeThroughVertex);
                }
            }
        }
        return result;
    }
    private getTangentPlanesThroughPoint(point: Point): HalfPlane[]{
        const result: HalfPlane[] = [];
        if(this.containsPoint(point)){
            for(let halfPlane of this.halfPlanes){
                if(halfPlane.containsPoint(point)){
                    result.push(halfPlane);
                }
            }
            return result;
        }
        for(let vertex of this.vertices){
            const throughVertex: HalfPlane[] = HalfPlane.withBorderPoints(vertex.point, point);
            for(let planeThroughVertex of throughVertex){
                if(this.isContainedByHalfPlane(planeThroughVertex)){
                    result.push(planeThroughVertex);
                }
            }
        }
        for(let halfPlane of this.halfPlanes){
            if(this.hasAtMostOneVertex(halfPlane) && !halfPlane.containsPoint(point)){
                result.push(halfPlane.expandToIncludePoint(point));
            }
        }
        return result;
    }
    public isContainedByRay(ray: Ray): boolean{
        return false;
    }
    public isContainedByLineSegment(other: LineSegment): boolean{
        return false;
    }
    public isContainedByLine(line: Line): boolean{
        return false;
    }
    public isContainedByConvexPolygon(other: ConvexPolygon){
        for(let halfPlane of other.halfPlanes){
            if(!this.isContainedByHalfPlane(halfPlane)){
                return false;
            }
        }
        return true;
    }
    private static getHalfPlanes(vertices: PolygonVertex[]): HalfPlane[]{
        const result: HalfPlane[] = [];
        for(let vertex of vertices){
            if(result.indexOf(vertex.halfPlane1) === -1){
                result.push(vertex.halfPlane1);
            }
            if(result.indexOf(vertex.halfPlane2) === -1){
                result.push(vertex.halfPlane2);
            }
        }
        return result;
    }

    private static combinePolygons(one: ConvexPolygon, other: ConvexPolygon): Area{
        if(one.isContainedByConvexPolygon(other)){
            return other;
        }
        if(other.isContainedByConvexPolygon(one)){
            return one;
        }
        let halfPlanes: HalfPlane[] = one.halfPlanes.concat(other.halfPlanes).filter(hp => one.isContainedByHalfPlane(hp) && other.isContainedByHalfPlane(hp));
        for(let vertex1 of one.vertices){
            const tangentPlanes: HalfPlane[] = other.getTangentPlanesThroughPoint(vertex1.point);
            for(let tangentPlane of tangentPlanes){
                if(one.isContainedByHalfPlane(tangentPlane)){
                    halfPlanes.push(tangentPlane);
                }
            }
        }
        for(let vertex2 of other.vertices){
            const tangentPlanes: HalfPlane[] = one.getTangentPlanesThroughPoint(vertex2.point);
            for(let tangentPlane of tangentPlanes){
                if(other.isContainedByHalfPlane(tangentPlane)){
                    halfPlanes.push(tangentPlane);
                }
            }
        }
        halfPlanes = ConvexPolygon.getHalfPlanesNotContainingAnyOther(halfPlanes);
        if(halfPlanes.length === 0){
            return plane;
        }
        return new ConvexPolygon(halfPlanes);
    }
    private static getVerticesNotContainingAnyOther(vertices: PolygonVertex[]): PolygonVertex[]{
        const result: PolygonVertex[] = [];
        for(let i: number = 0; i < vertices.length; i++){
            let include: boolean = true;
            for(let j: number = 0; j < vertices.length; j++){
                if(i === j){
                    continue;
                }
                if(vertices[j].isContainedByVertex(vertices[i])){
                    include = false;
                    break;
                }
            }
            if(include){
                result.push(vertices[i]);
            }
        }
        return result;
    }
    private static getHalfPlanesNotContainingAnyOther(halfPlanes: HalfPlane[]): HalfPlane[]{
        const result: HalfPlane[] = [];
        for(let halfPlane of halfPlanes){
            let include: boolean = true;
            for(let _halfPlane of result){
                if(_halfPlane.isContainedByHalfPlane(halfPlane)){
                    include = false;
                    break;
                }
            }
            if(include){
                result.push(halfPlane);
            }
        }
        return result;
    }

    private static groupVerticesByPoint(vertices: PolygonVertex[]): PolygonVertex[][]{
        const groups: PolygonVertex[][] = [];
        for(let vertex of vertices){
            let group: PolygonVertex[];
            for(let existingGroup of groups){
                if(existingGroup[0].point.equals(vertex.point)){
                    group = existingGroup;
                    break;
                }
            }
            if(group){
                group.push(vertex);
            }else{
                groups.push([vertex]);
            }
        }
        return groups;
    }
    private static getVertices(halfPlanes: HalfPlane[]): PolygonVertex[]{
        const result: PolygonVertex[] = [];
        for(let i: number = 0; i < halfPlanes.length; i++){
            for(let j: number = i + 1; j < halfPlanes.length; j++){
                if(halfPlanes[i].complement().isContainedByHalfPlane(halfPlanes[j])){
                    continue;
                }
                const candidate: PolygonVertex = halfPlanes[i].getIntersectionWith(halfPlanes[j]);
                let include: boolean = true;
                for(let k: number = 0; k < halfPlanes.length; k++){
                    if(k !== i && k !== j && !halfPlanes[k].containsPoint(candidate.point)){
                        include = false;
                        break;
                    }
                }
                if(include){
                    result.push(candidate);
                }
            }
        }
        return result;
    }
    public static createTriangleWithInfinityInTwoDirections(point: Point, direction1: Point, direction2: Point): ConvexPolygon{
        const thisPerpendicular: Point = direction1.getPerpendicular();
        const otherPerpendicular: Point = direction2.getPerpendicular();

        if(direction1.cross(direction2) < 0){
            return new ConvexPolygon([
                new HalfPlane(point, thisPerpendicular.scale(-1)),
                new HalfPlane(point, otherPerpendicular)
            ]);
        }
        return new ConvexPolygon([
            new HalfPlane(point, thisPerpendicular),
            new HalfPlane(point, otherPerpendicular.scale(-1))
        ]);
    }
    public static createTriangleWithInfinityInDirection(point1: Point, point2: Point, direction: Point): ConvexPolygon{
        const normalDirection: Point = point2.minus(point1).projectOn(direction.getPerpendicular());
        return new ConvexPolygon([
            new HalfPlane(point1, normalDirection),
            new HalfPlane(point2, normalDirection.scale(-1)),
            HalfPlane.throughPointsAndContainingPoint(point1, point2, point1.plus(direction))
        ]);
    }
    public static createTriangle(point1: Point, point2: Point, point3: Point): ConvexPolygon{
        return new ConvexPolygon([
            HalfPlane.throughPointsAndContainingPoint(point1, point2, point3),
            HalfPlane.throughPointsAndContainingPoint(point1, point3, point2),
            HalfPlane.throughPointsAndContainingPoint(point2, point3, point1),
        ])
    }
}