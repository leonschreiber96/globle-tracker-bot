const germany = require('../ger.json');
const geodata = require('../geodata.json');

const ger = geodata.features.find(x => x.properties.shapeName === "Germany");
const gerBorder = ger.geometry.coordinates.flat().flat()
console.log(gerBorder.length);

const borderSections = germany.features[0].geometry.coordinates.map(x => {
   return x.map(subSection => {
      return subSection.map(([x, y]) => ({ x, y }));
   });
});
const borderSubSections = borderSections.flat();
const borderPoints = borderSubSections.flat();

console.log("Border sections: ", borderSections.length);
console.log("Border subsections: ", borderSubSections.length);
console.log("Border points: ", borderPoints.length);

const skip = 10;

const foo = borderSubSections.map(subSection => {
   if (subSection.length < skip) {
      return [{
         x: subSection.map(p => p.x).reduce((a, b) => a + b) / subSection.length,
         y: subSection.map(p => p.y).reduce((a, b) => a + b) / subSection.length
      }];
   } else {
      const everyNth = subSection.filter((_, i) => i % skip === 0);
      return everyNth;
   }
});

// console.log("Avg subsections: ", foo.flat().length);
// require('fs').writeFileSync('germany1.json', JSON.stringify(foo.flat().map(({ x, y }) => {

// }), null, 2));