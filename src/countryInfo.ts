export default interface CountryInfo {
   metadata: {
      name: string;
      isoCode: string;
   },
   minimizedPoints: {lat: number, lng: number}[];
}