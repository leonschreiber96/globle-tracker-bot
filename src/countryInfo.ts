export default interface CountryInfo {
   properties: {
      shapeGroup: string, 
      shapeType: "ADM0",
      shapeName: string
   },
   geometry: {
      type: "Polygon" | "MultiPolygon",
      coordinates: number[][][] | number[][][][];
   };
}