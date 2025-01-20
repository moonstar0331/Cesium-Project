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
  Cartesian2,
  IonGeocodeProviderType,
  ConstantProperty,
  ColorMaterialProperty,
  ConstantPositionProperty,
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

// ArcGIS location services REST API
const authentication = ApiKeyManager.fromKey(
  "AAPT3NKHt6i2urmWtqOuugvr9SZ2lQsIKWCKGUFYqC7k4zUdWNz6owUHH0JUGk3Vj1qYd6XiUR9_t7xkJW4QYCYzlZ-vXzWnpSFegS4DoowtKFvOVnDGtsYtT075j53m2LsPfeYYH9sPgnXKuOAHFuAFx44KG8S3Uq6GALYgx2asCEF5GFJp8mY5QOcfMyurhxc8LUzUeIjXqhSmdI3Jmyh4fPRJAXiD4jOpxt9tDhQ5gUU.",
);

function calculateSpaceDistance(position1, position2) {
  var spaceDistance = (
    Cartesian3.distance(position1, position2) / 1000
  ).toFixed(3);

  return spaceDistance;
}

function calculatePlaneDistance(position1, position2) {
  const dx = position2.x - position1.x;
  const dy = position2.y - position1.y;
  var planeDistance = (Math.sqrt(dx * dx + dy * dy) / 1000).toFixed(3);

  return planeDistance;
}

const viewer = new Viewer("cesiumContainer", {
  timeline: true,
  animation: true,
  geocoder: IonGeocodeProviderType.GOOGLE,
  globe: false,
});

// Add a global base layer using the Google Maps Platform Map Tiles API
try {
  // @ts-ignore
  const tileset = await createGooglePhotorealistic3DTileset();
  viewer.scene.primitives.add(tileset);
} catch (error) {
  console.log(`Failed to load tileset: ${error}`);
}

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
    // feature.polygon.outline = false;
    feature.polygon.outline = new ConstantProperty(false);

    if (feature.properties.FromBreak == 0) {
      // feature.polygon.material = Color.fromHsl(0.5833, 0.8, 0.9, 0.5);
      feature.polygon.material = new ColorMaterialProperty(
        Color.fromHsl(0.5833, 0.8, 0.9, 0.5),
      );
    } else if (feature.properties.FromBreak == 5) {
      // feature.polygon.material = Color.fromHsl(0.5833, 0.9, 0.7, 0.5);
      feature.polygon.material = new ColorMaterialProperty(
        Color.fromHsl(0.5833, 0.9, 0.7, 0.5),
      );
    } else {
      // feature.polygon.material = Color.fromHsl(0.5833, 1.0, 0.4, 0.5);
      feature.polygon.material = new ColorMaterialProperty(
        Color.fromHsl(0.5833, 1.0, 0.4, 0.5),
      );
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

// marker.position = cartesian;
marker.position = new ConstantPositionProperty(cartesian);

// Add utility to our app by allowing the user to choose the position used as input for the spatial query.
viewer.screenSpaceEventHandler.setInputAction((movement) => {
  viewer.dataSources.removeAll();
  viewer.scene.invertClassification = false;
  marker.show = false;

  const pickedPosition = viewer.scene.pickPosition(movement.position);

  if (!defined(pickedPosition)) {
    return;
  }

  // marker.position = pickedPosition;
  marker.position = new ConstantPositionProperty();
  marker.show = true;
  viewer.scene.invertClassification = true;

  const cartographic = Cartographic.fromCartesian(pickedPosition);
  getServiceArea(cartographic);
}, ScreenSpaceEventType.LEFT_CLICK);

// 두 좌표 간의 거리 계산
var positions = [];
var handler = new ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function (click) {
  var pickedPosition = viewer.scene.pickPosition(click.position);

  // 클릭한 좌표가 유효한지 확인
  if (defined(pickedPosition)) {
    positions.push(pickedPosition);

    // 두 번째 좌표가 선택되었을 때 Polyline 생성
    if (positions.length === 2) {
      var spaceDistance = calculateSpaceDistance(positions[0], positions[1]);
      var planeDistance = calculatePlaneDistance(positions[0], positions[1]);

      // polyline 생성
      viewer.entities.add({
        polyline: {
          positions: positions,
          material: Color.RED,
          width: 5,
          clampToGround: false,
          zIndex: Number.POSITIVE_INFINITY,
        },
      });

      // label 생성
      viewer.entities.add({
        position: Cartesian3.midpoint(
          positions[0],
          positions[1],
          new Cartesian3(),
        ),
        label: {
          text: spaceDistance + "km",
          font: "20px sans-serif",
          fillColor: Color.RED,
          outlineColor: Color.BLACK,
          showBackground: true,
          pixelOffset: new Cartesian2(0, -20),
        },
      });

      displayDistances(spaceDistance, planeDistance, click.position);

      // 위치 초기화
      positions = [];
    }
  }
}, ScreenSpaceEventType.LEFT_CLICK);

function displayDistances(spaceDistance, planeDistance, clickPosition) {
  // Create a modal to display distances
  const modal = document.createElement("div");
  modal.className = "distance-modal ";
  modal.style.position = "absolute";
  modal.style.top = `${clickPosition.y}px`;
  modal.style.left = `${clickPosition.x}px`;
  modal.style.padding = "20px";
  modal.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  modal.style.border = "1px solid #ccc";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
  modal.style.zIndex = "1000";
  modal.style.fontFamily = "Arial, sans-serif";

  const title = document.createElement("h3");
  title.textContent = "Distance Information";
  title.style.marginTop = "0";
  modal.appendChild(title);

  const spaceDistanceText = document.createElement("p");
  spaceDistanceText.textContent = `Space Distance: ${spaceDistance} km`;
  modal.appendChild(spaceDistanceText);

  const planeDistanceText = document.createElement("p");
  planeDistanceText.textContent = `Plane Distance: ${planeDistance} km`;
  modal.appendChild(planeDistanceText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.marginTop = "10px";
  closeButton.style.padding = "5px 10px";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.backgroundColor = "#007bff";
  closeButton.style.color = "white";
  closeButton.style.cursor = "pointer";
  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };
  modal.appendChild(closeButton);

  document.body.appendChild(modal);
}

// Clear all polylines when the clear button is clicked
document.getElementById("clear-btn").addEventListener("click", () => {
  viewer.entities.removeAll();
  const modals = document.querySelectorAll(".distance-modal");
  modals.forEach((modal) => {
    document.body.removeChild(modal);
  });
});
