import {
  Cartesian3,
  Ion,
  Viewer,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Color,
  createGooglePhotorealistic3DTileset,
  GeoJsonDataSource,
  Cartographic,
  VerticalOrigin,
  HeightReference,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { serviceArea } from "@esri/arcgis-rest-routing";

// Math as CesiumMath

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhNzQ0OWUzMS1lMTdiLTQ4ZWYtOTYwMi1kYjZkNjE4MjE2MzQiLCJpZCI6MjY3MDE5LCJpYXQiOjE3MzYxNDg2ODR9.FZHYOYD25Snz3ZYimh5wNaATYbXHoB6p79gshGItaek";

function calculateSpaceDistance(position1, position2) {
  var spaceDistance = (
    Cartesian3.distance(positions[0], positions[1]) / 1000
  ).toFixed(3);

  return spaceDistance;
}

function calculatePlaneDistance(position1, position2) {
  const dx = Math.abs(positions[1].x - positions[0].x);
  const dy = Math.abs(positions[1].y - positions[0].y);
  var planeDistance = (Math.sqrt(dx * dx + dy * dy) / 1000).toFixed(3);

  return planeDistance;
}

// const viewer = new Viewer("cesiumContainer", {
//   terrain: Terrain.fromWorldTerrain(),
// });
const viewer = new Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  globe: false,
});

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-15.0),
  },
});

// Add Cesium OSM Buildings, a global 3D buildings layer.
// @ts-ignore
// const buildingTileset = await createOsmBuildingsAsync();
// viewer.scene.primitives.add(buildingTileset);

// Add a global base layer using the Google Maps Platform Map Tiles API
try {
  // @ts-ignore
  const tileset = await createGooglePhotorealistic3DTileset();
  viewer.scene.primitives.add(tileset);
} catch (error) {
  console.log(`Failed to load tileset: ${error}`);
}

// ArcGIS location services REST API
const authentication = ApiKeyManager.fromKey(
  "AAPT3NKHt6i2urmWtqOuugvr9SZ2lQsIKWCKGUFYqC7k4zVVscopv4hDV_cr72qNTv_VHqlkffhYEElHgIGai2Sul5LqciKBoE90HGcnGb-SxuiPHWYrsWwXml7qEBF0pPZzFVmo86RKwQVn62g1BD854USesrBDYH8mjNFcascbodpg17ba4h45eoD9qLJa316Wr1xAT14DjLqm8r2vLzBWOevGbQCBPvlJnarblatDblA.",
);

async function getServiceArea(cartographic) {
  const coordinates = [
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude),
  ];

  let geojson;
  try {
    const response = await serviceArea({
      facilities: [coordinates],
      authentication,
    });

    geojson = response.saPolygons.geoJson;
  } catch (error) {
    console.log(`Failed to load service area: ${error}`);
  }

  if (!defined(geojson)) {
    return;
  }

  let dataSource;
  try {
    dataSource = await GeoJsonDataSource.load(geojson, {
      clampToGround: true,
    });
    viewer.dataSources.add(dataSource);
  } catch (error) {
    console.log(`Failed to load geojson: ${error}`);
  }

  if (!defined(dataSource)) {
    return;
  }

  // Style the results
  const entities = dataSource.entities.values;

  for (let i = 0; i < entities.length; i++) {
    const feature = entities[i];
    feature.polygon.outline = false;

    if (feature.properties.FromBreak == 0) {
      feature.polygon.material = Color.fromHsl(0.5833, 0.8, 0.9, 0.5);
    } else if (feature.properties.FromBreak == 5) {
      feature.polygon.material = Color.fromHsl(0.5833, 0.9, 0.7, 0.5);
    } else {
      feature.polygon.material = Color.fromHsl(0.5833, 1.0, 0.4, 0.5);
    }
  }

  const scene = viewer.scene;
  scene.invertClassification = true;
  scene.invertClassificationColor = new Color(0.4, 0.4, 0.4, 1.0);
}

// At a location in San Francisco
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(-122.38329, 37.74015, 16000),
  orientation: {
    pitch: CesiumMath.toRadians(-70.0),
  },
});
const cartesian = Cartesian3.fromDegrees(-122.39429, 37.78988);
getServiceArea(Cartographic.fromCartesian(cartesian));

const marker = viewer.entities.add({
  name: "start",
  billboard: {
    verticalOrigin: VerticalOrigin.BOTTOM,
    heightReference: HeightReference.CLAMP_TO_GROUND,
    image: "./marker.svg",
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    scale: 1,
  },
});

marker.position = cartesian;

// Add utility to our app by allowing the user to choose the position used as input for the spatial query.
viewer.screenSpaceEventHandler.setInputAction((movement) => {
  viewer.dataSources.removeAll();
  viewer.scene.invertClassification = false;
  marker.show = false;

  const pickedPosition = viewer.scene.pickPosition(movement.position);

  if (!defined(pickedPosition)) {
    return;
  }

  marker.position = pickedPosition;
  marker.show = true;
  viewer.scene.invertClassification = true;

  const cartographic = Cartographic.fromCartesian(pickedPosition);
  getServiceArea(cartographic);
}, ScreenSpaceEventType.LEFT_CLICK);

var positions = [];
var handler = new ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function (click) {
  var pickedPosition = viewer.scene.pickPosition(click.position);

  // 클릭한 좌표가 유효한지 확인
  if (defined(pickedPosition)) {
    positions.push(pickedPosition);

    // 두 번째 좌표가 선택되었을 때 Polyline 생성
    if (positions.length === 2) {
      // polyline 생성
      viewer.entities.add({
        polyline: {
          // positions: Cartesian3.fromRadiansArray(positions),
          positions: positions,
          material: Color.RED,
          width: 3,
        },
      });

      // var spaceDistance = (
      //   Cartesian3.distance(positions[0], positions[1]) / 1000
      // ).toFixed(3);
      var spaceDistance = calculateSpaceDistance(positions[0], positions[1]);
      console.log("spaceDistance", spaceDistance);

      // const dx = positions[1].x - positions[0].x;
      // const dy = positions[1].y - positions[0].y;
      // var planeDistance = (Math.sqrt(dx * dx + dy * dy) / 1000).toFixed(3);
      var planeDistance = calculatePlaneDistance(positions[0], positions[1]);
      console.log("planeDistance", planeDistance);

      // 위치 초기화
      positions = [];
    }
  }
}, ScreenSpaceEventType.LEFT_CLICK);
