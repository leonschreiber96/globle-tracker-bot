const germany = require('../avgSubSections.json');
const rawGermany = require("../germany.json")
// Function to calculate the distance between two points
function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Function to calculate the center of a circle given two points
function circleFromTwoPoints(p1, p2) {
  const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const radius = distance(p1, p2) / 2;
  return { center, radius };
}

// Function to calculate the center of a circle given three points
function circleFromThreePoints(p1, p2, p3) {
  const offset = Math.pow(p2.x, 2) + Math.pow(p2.y, 2);
  const bc = (Math.pow(p1.x, 2) + Math.pow(p1.y, 2) - offset) / 2.0;
  const cd = (offset - Math.pow(p3.x, 2) - Math.pow(p3.y, 2)) / 2.0;
  const det = (p1.x - p2.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p2.y);

  // If the determinant is zero, the points are collinear and do not form a circle
  if (Math.abs(det) < 1e-14) {
    return null;
  }

  const centerX = (bc * (p2.y - p3.y) - cd * (p1.y - p2.y)) / det;
  const centerY = ((p1.x - p2.x) * cd - (p2.x - p3.x) * bc) / det;
  const radius = distance({ x: centerX, y: centerY }, p1);
  return { center: { x: centerX, y: centerY }, radius };
}

// Helper function to check if a point is inside a circle
function isPointInCircle(p, circle) {
  return distance(p, circle.center) <= circle.radius;
}

// Welzl's algorithm implementation to find the minimum enclosing circle
function welzl(points, boundaryPoints = []) {
  // Base case: if no points are left or boundary points form a circle
  if (points.length === 0 || boundaryPoints.length === 3) {
    switch (boundaryPoints.length) {
      case 0:
        // No points, return a degenerate circle
        return { center: { x: 0, y: 0 }, radius: 0 };
      case 1:
        // Single point, circle with zero radius
        return { center: boundaryPoints[0], radius: 0 };
      case 2:
        // Two points, form circle using both points as diameter ends
        return circleFromTwoPoints(boundaryPoints[0], boundaryPoints[1]);
      case 3:
        // Three points, form the circle that passes through all three
        return circleFromThreePoints(
          boundaryPoints[0],
          boundaryPoints[1],
          boundaryPoints[2]
        );
    }
  }

  // Select a random point from the remaining points
  const [p, ...rest] = points;
  const circle = welzl(rest, boundaryPoints);

  // If the circle already includes the point, return the circle
  if (isPointInCircle(p, circle)) {
    return circle;
  }

  // Otherwise, add the point to the boundary and recurse
  return welzl(rest, [...boundaryPoints, p]);
}

function getCountryCircle(country) {
  const countryPoints = germany.filter(({ name }) => name === country);
  return welzl(countryPoints);
}

const circle = welzl(germany.map(({ x, y }) => ({ x: y, y: x })));
console.log(`Center: (${circle.center.x}, ${circle.center.y}), Radius: ${circle.radius * 54.6}`);

const rawCircle = welzl(rawGermany.map(({ x, y }) => ({ x: x*69, y: y*54.6 })));
console.log(`Raw Center: (${rawCircle.center.x / 69}, ${rawCircle.center.y / 54.6}), Radius: ${rawCircle.radius}`);