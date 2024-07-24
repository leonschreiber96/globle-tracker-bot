interface countryMetadata {
   name: string;
   isoCode: string;
   region: string;
   subRegion: string;
   intermediateRegion: string;
   size: number;
}

export default interface CountryInfo {
   metadata: countryMetadata;
   minimizedPoints: {lat: number, lng: number}[];
}