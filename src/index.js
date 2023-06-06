import "./styles.css";
import "./leaflet/leaflet.css";
import "./leaflet/leaflet.js";

let positiveMigration = null;
let negativeMigration = null;

const fetchData = async () => {
  const urlGeoData =
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
  const urlPositiveMigration =
    "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f";
  const urlNegativeMigration =
    "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e";

  try {
    const responses = await Promise.all([
      fetch(urlGeoData),
      fetch(urlPositiveMigration),
      fetch(urlNegativeMigration)
    ]);
    const values = await Promise.all(
      responses.map((response) => response.json())
    );
    positiveMigration = values[1];
    negativeMigration = values[2];

    initMap(values[0]);
  } catch (e) {
    console.log(e);
  }
};

const initMap = (geoData) => {
  let map = L.map("map", {
    minZoom: -3
  });

  let geoJson = L.geoJSON(geoData, {
    onEachFeature: getFeature,
    style: getStyle
  }).addTo(map);

  let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  /* let baseMaps = {
    OpenStreetMap: osm
  };
  let overlayMaps = {
    "Net positive and negative migration": geoJson
  };

  let layerControl = L.control.layers(baseMaps, overlayMaps); */

  map.fitBounds(geoJson.getBounds());
};

const getFeature = (feature, layer) => {
  const positiveMigrationIndex =
    positiveMigration.dataset.dimension.Tuloalue.category.index[
      "KU" + feature.properties.kunta
    ];
  const negativeMigrationIndex =
    negativeMigration.dataset.dimension["Lähtöalue"].category.index[
      "KU" + feature.properties.kunta
    ];
  layer.bindPopup(
    `
      <h3>${feature.properties.name}</h3>
      <ul>
        <li>Positive migration: ${positiveMigration.dataset.value[positiveMigrationIndex]}</li>
        <li>Negative migration: ${negativeMigration.dataset.value[negativeMigrationIndex]}</li>
      </ul>
    `
  );
  layer.bindTooltip(`${feature.properties.name}`);
};

const getStyle = (feature) => {
  const positiveMigrationIndex =
    positiveMigration.dataset.dimension.Tuloalue.category.index[
      "KU" + feature.properties.kunta
    ];
  const negativeMigrationIndex =
    negativeMigration.dataset.dimension["Lähtöalue"].category.index[
      "KU" + feature.properties.kunta
    ];
  let hue =
    Math.pow(
      positiveMigration.dataset.value[positiveMigrationIndex] /
        negativeMigration.dataset.value[negativeMigrationIndex],
      3
    ) * 60;
  hue = hue > 120 ? 120 : hue;

  return {
    weight: 2,
    color: `hsl(${hue}, 75%, 50%)`
  };
};

fetchData();
