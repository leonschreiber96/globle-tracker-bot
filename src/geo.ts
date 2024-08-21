// TypeScript interfaces for type safety
export interface Point {
  x: number; // latitude
  y: number; // longitude
}

export interface Circle {
  center: Point;
  radius: number; // in kilometers
}

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

// Function to convert degrees to radians
function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Function to convert radians to degrees
function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

// Haversine formula to calculate the great circle distance between two points
function haversineDistance(p1: Point, p2: Point) {
  const dLat = toRadians(p2.x - p1.x);
  const dLon = toRadians(p2.y - p1.y);
  const lat1 = toRadians(p1.x);
  const lat2 = toRadians(p2.x);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// Function to calculate a circle that passes through two points on the globe
function circleFromTwoPoints(p1: Point, p2: Point): Circle {
  const center = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
  const radius = haversineDistance(p1, p2) / 2;
  return { center, radius };
}

// Function to calculate a circle from three points on a sphere
function circleFromThreePoints(
  p1: Point,
  p2: Point,
  p3: Point
): Circle | null {
  // Convert Points to Cartesian coordinates
  const toCartesian = (p: Point) => {
    const latRad = toRadians(p.x);
    const lonRad = toRadians(p.y);
    return {
      x: Math.cos(latRad) * Math.cos(lonRad),
      y: Math.cos(latRad) * Math.sin(lonRad),
      z: Math.sin(latRad),
    };
  };

  const a = toCartesian(p1);
  const b = toCartesian(p2);
  const c = toCartesian(p3);

  // Calculate vectors
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };

  // Cross product of AB and AC
  const cross = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };

  const crossMagnitude = Math.sqrt(
    cross.x ** 2 + cross.y ** 2 + cross.z ** 2
  );

  // If cross product is zero, points are collinear
  if (crossMagnitude < 1e-14) {
    // console.error("Points are collinear");
    return null;
  }

  // Normalize the cross product to get the normal vector of the plane
  const normal = {
    x: cross.x / crossMagnitude,
    y: cross.y / crossMagnitude,
    z: cross.z / crossMagnitude,
  };

  // Calculate midpoint of a, b, and c
  const mid = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    z: (a.z + b.z + c.z) / 3,
  };

  // Calculate center on sphere
  const centerMagnitude = Math.sqrt(
    mid.x ** 2 + mid.y ** 2 + mid.z ** 2
  );

  const center = {
    x: toDegrees(Math.asin(mid.z / centerMagnitude)),
    y: toDegrees(Math.atan2(mid.y, mid.x)),
  };

  // Calculate radius
  const radius = haversineDistance(p1, center);

  return { center, radius };
}

// Helper function to check if a point is inside a circle
export function isPointInCircle(p: Point, circle: Circle) {
  return haversineDistance(p, circle.center) <= circle.radius;
}

// Welzl's algorithm implementation to find the minimum enclosing circle
export function minimumBoundingCircle(
  points: Point[],
  boundaryPoints: Point[] = []
): Circle | null {
  if (points.length === 0 || boundaryPoints.length === 3) {
    switch (boundaryPoints.length) {
      case 0:
        return { center: { x: 0, y: 0 }, radius: 0 };
      case 1:
        return { center: boundaryPoints[0], radius: 0 };
      case 2:
        return circleFromTwoPoints(boundaryPoints[0], boundaryPoints[1]);
      case 3:
        return circleFromThreePoints(
          boundaryPoints[0],
          boundaryPoints[1],
          boundaryPoints[2]
        );
    }
  }

  const [p, ...rest] = points;
  const circle = minimumBoundingCircle(rest, boundaryPoints);

  if (!circle) {
    return null;
  }

  if (isPointInCircle(p, circle)) {
    return circle;
  }

  return minimumBoundingCircle(rest, [...boundaryPoints, p]);
}

// Example usage
const germanyPoints: Point[] = [
  { x: 52.5200, y: 13.4050 }, // Berlin
  { x: 48.1351, y: 11.5820 }, // Munich
  { x: 50.1109, y: 8.6821 },  // Frankfurt
];

const circle = minimumBoundingCircle(germanyPoints);
console.log(
  `Center: (${circle?.center.x}, ${circle?.center.y}), Radius: ${circle?.radius} km`
);
