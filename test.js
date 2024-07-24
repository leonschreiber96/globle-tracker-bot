const { exit } = require('process');
const geoData = require('./data/geoData.json');
const countryMetadata = require('./data/countryMetadata.json');

const minimizedCountries = [];
let countries = geoData.features;

const invalidCountries = [
  "Senkakus",
  "Koualou",
  "Demchok",
  "Sanafir & Tiran Is.",
  "Kalapani",
  "Siachen-Saltoro",
  "Gaza Strip",
  "Antarctica",
  "Aksai Chin",
  "Falkland Islands (UK)",
  "No Man's Land",
  "Spratly Is",
  "Paracel Is",
  "CH-IN",
  "Dragonja",
  "Dramana-Shakatoe",
  "Isla Brasilera",
  "Liancourt Rocks",
];
const wronglyNamedCountriesMapping = {
  "Turkey": "Türkiye",
  "Trinidad & Tobago": "Trinidad and Tobago",
  "St Vincent & the Grenadines": "Saint Vincent and the Grenadines",
  "Micronesia, Fed States of": "Micronesia",
  "St Kitts & Nevis": "Saint Kitts and Nevis",
  "Bahamas, The": "Bahamas",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Antigua & Barbuda": "Antigua and Barbuda",
  "Korea, South": "South Korea",
  "Korea, North": "North Korea",
  "Gambia, The": "Gambia",
  "Sao Tome & Principe": "São Tomé and Príncipe",
  "Congo, Dem. Rep.": "Democratic Republic of the Congo",
  "Congo, Rep.": "Republic of the Congo",
};

countries = countries.filter((country) => {
  return !invalidCountries.includes(country.properties.shapeName);
});

countries = countries.map((country) => {
  const shapeName = wronglyNamedCountriesMapping[country.properties.shapeName] || country.properties.shapeName;
  return {
    ...country,
    properties: {
      ...country.properties,
      shapeName,
    }
  };
});

let minimized = require("./data/minimizedCountries.json");

// add metadata to countries
minimized = minimized.map((country) => {
  const metadata = countryMetadata.find((metadata) => metadata.name === country.metadata.name);
  return {
    ...country,
    metadata: {
      name: metadata.name,
      isoCode: metadata["alpha-3"],
      region: metadata.region,
      subRegion: metadata["sub-region"],
      intermediateRegion: metadata["intermediate-region"],
      size: metadata.size
    }
  };
});

require("fs").writeFileSync("minimizedCountries.json", JSON.stringify(minimized, null, 2));

exit(0);

for (const country of countries) {
  const metadata = {
    name: country.properties.shapeName,
    isoCode: country.properties.shapeGroup,
  }

  const shape = country.geometry.type;

  let countryParts = shape === 'MultiPolygon' ? country.geometry.coordinates : [country.geometry.coordinates];  
  countryParts = countryParts.map((a) => {
    return a.map((b) => {
      return b.map((c) =>  {
        return {
          lat: c[1],
          lng: c[0],
        };
      });
    });
  });
  const borderSegments = countryParts.flat();
  const borderPoints = borderSegments.flat();

  if (borderPoints.length > 1000) {
    const shrinkingFactor = Math.floor(Math.pow(1000 / borderPoints.length, -1));

    const minimizedSegments = borderSegments.map((segment) => {
      if (segment.length <= shrinkingFactor) {
        if (shrinkingFactor > 100) {
          return segment.filter((_, i) => i % 100 === 0);
        }
        return segment;
      }

      return segment.filter((_, i) => i % shrinkingFactor === 0);
    });

    let minimizedPoints = minimizedSegments.flat();
    minimizedCountries.push({
      metadata,
      minimizedPoints: minimizedPoints.map(point => ({ lat: +point.lat.toFixed(3), lng: +point.lng.toFixed(3) })),
    });
    // console.log("Country: ", metadata.name, "Original points: ", borderPoints.length, "Minimized points: ", minimizedPoints.length, "(Shrinking factor: ", shrinkingFactor, ")");
  } else {
    minimizedCountries.push({
      metadata,
      minimizedPoints: borderPoints.map(point => ({ lat: +point.lat.toFixed(3), lng: +point.lng.toFixed(3) }))
    });
  }

  const minimized = minimizedCountries[minimizedCountries.length - 1];
  const geoJsonMinimized = {
    type: "Feature",
    properties: {
      shapeName: minimized.metadata.name,
      shapeGroup: minimized.metadata.isoCode,
    },
    geometry: {
      type: shape,
      coordinates: [[[...minimized.minimizedPoints.map((point) => [point.lng, point.lat]), [minimized.minimizedPoints[0].lng, minimized.minimizedPoints[0].lat]]]],
    }
  };

  // require("fs").writeFileSync(`${metadata.isoCode}-min.geojson`, JSON.stringify(geoJsonMinimized, null, 2));
  if (minimized.minimizedPoints.length > 2000) {
    console.log("Country: ", metadata.name, "Original points: ", borderPoints.length, "Minimized points: ", minimized.minimizedPoints.length);
  }
}

require("fs").writeFileSync("minimizedCountries.json", JSON.stringify(minimizedCountries, null, 2));
// console.log(minimizedCountries.find((country) => country.metadata.name === "China"));