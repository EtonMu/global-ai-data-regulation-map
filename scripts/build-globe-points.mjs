import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoContains } from "d3-geo";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  projectRoot,
  "data",
  "geo",
  "natural-earth-land-110m.json",
);
const outputPath = path.join(
  projectRoot,
  "data",
  "geo",
  "natural-earth-land-points.json",
);
const sampleStep = 2.55;

function anchorToVector(latitude, longitude) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const latitudeScale = Math.cos(latitudeRadians);
  return [
    Number((latitudeScale * Math.sin(longitudeRadians)).toFixed(6)),
    Number((-Math.sin(latitudeRadians)).toFixed(6)),
    Number((latitudeScale * Math.cos(longitudeRadians)).toFixed(6)),
  ];
}

const collection = JSON.parse(await readFile(sourcePath, "utf8"));
const polygons = collection.features.flatMap(({ geometry }) =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates,
);
const points = [];
let row = 0;

for (
  let latitude = -87;
  latitude <= 85;
  latitude += sampleStep, row += 1
) {
  const latitudeScale = Math.max(
    0.34,
    Math.cos((latitude * Math.PI) / 180),
  );
  const longitudeStep = sampleStep / latitudeScale;
  const rowOffset = ((row * 0.61803398875) % 1) * longitudeStep;
  for (
    let longitude = -180 + rowOffset;
    longitude < 180;
    longitude += longitudeStep
  ) {
    if (geoContains(collection, [longitude, latitude])) {
      points.push(anchorToVector(latitude, longitude));
    }
  }
}

for (const rings of polygons) {
  const coastline = rings[0];
  for (let index = 0; index < coastline.length; index += 2) {
    const [longitude, latitude] = coastline[index];
    points.push(anchorToVector(latitude, longitude));
  }
}

await writeFile(outputPath, JSON.stringify(points));
process.stdout.write(`Generated ${points.length} precomputed globe land points.\n`);
