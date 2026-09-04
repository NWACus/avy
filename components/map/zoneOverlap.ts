import {featureBounds, pointInFeature, RegionBounds, regionBoundsOverlap, toPositionList} from 'components/helpers/geographicCoordinates';
import {MapViewZone} from 'components/map/ZoneMap';
import {AvalancheCenterID, Position} from 'types/nationalAvalancheCenter';

interface BoundedZone {
  zone: MapViewZone;
  bounds: RegionBounds;
  // Outer rings only, which is all toPositionList returns. Holes are deliberately not sampled: pointInFeature
  // is hole-aware, so a vertex landing in a hole still reads as outside.
  vertices: Position[];
}

// featureBounds throws for anything that isn't a Polygon or MultiPolygon and the map layer schema does admit
// other geometries, so a zone we can't bound is dropped rather than assumed to overlap. The filter has to run
// before the map for that reason.
const boundedZonesFor = (zones: MapViewZone[], centerId: AvalancheCenterID): BoundedZone[] =>
  zones
    .filter(zone => zone.center_id === centerId && (zone.feature.geometry.type === 'Polygon' || zone.feature.geometry.type === 'MultiPolygon'))
    .map(zone => ({zone: zone, bounds: featureBounds(zone.feature), vertices: toPositionList(zone.feature.geometry).flat()}));

// A vertex outside the target's bounding box can't be inside its polygon, and the box test is far cheaper than
// the ray cast. This prefilter is what makes it affordable to walk CAIC's thousands of vertices.
const anyVertexInside = (vertices: Position[], target: BoundedZone): boolean =>
  vertices.some(
    position =>
      position[0] >= target.bounds.bottomLeft.longitude &&
      position[0] <= target.bounds.topRight.longitude &&
      position[1] >= target.bounds.bottomLeft.latitude &&
      position[1] <= target.bounds.topRight.latitude &&
      pointInFeature(position, target.zone.feature),
  );

// Both directions are tested because a zone drawn entirely inside another is only visible from the inner zone's
// vertices, and either zone can be the inner one. Two polygons whose edges cross without either putting a vertex
// inside the other read as not overlapping; that shape can't arise between real forecast zone boundaries, which
// carry vertices every few hundred metres along the terrain they follow.
//
// booleanPointInPolygon counts boundary points as inside, so zones sharing an exact edge count as overlapping.
// That's deliberate: ignoring the boundary would make two identical polygons — every vertex on the boundary in
// both directions — report no overlap at all.
const zonesOverlap = (a: BoundedZone, b: BoundedZone): boolean => regionBoundsOverlap(a.bounds, b.bounds) && (anyVertexInside(a.vertices, b) || anyVertexInside(b.vertices, a));

// Ids of the baseCenterId zones that any overlayCenterId zone sits on top of.
export const zoneIdsOverlappingCenter = (zones: MapViewZone[], baseCenterId: AvalancheCenterID, overlayCenterId: AvalancheCenterID): Set<number> => {
  const overlayZones = boundedZonesFor(zones, overlayCenterId);
  if (overlayZones.length === 0) {
    return new Set();
  }
  return new Set(
    boundedZonesFor(zones, baseCenterId)
      .filter(base => overlayZones.some(overlay => zonesOverlap(base, overlay)))
      .map(base => base.zone.zone_id),
  );
};
