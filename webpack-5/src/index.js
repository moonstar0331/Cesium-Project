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
  IonResource,
  ClassificationType,
  createOsmBuildingsAsync,
  Cesium3DTileStyle,
  Cesium3DTileset,
  Terrain,
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
  "AAPT3NKHt6i2urmWtqOuugvr9SZ2lQsIKWCKGUFYqC7k4zWYj4L7KghRPfM9GrAtIfKJIvtDkHEFmaegJXtSIw9oemOsBLfOKcB9gtiJ1nYwqkptFjbT6ZbeaLLP3qrAs7n6HY4QS359bd0YC6jwrd1VcpqGnW79kX195lcH_go06CYLWW7bYcYtmMvKs6CcvT0AbAZU4h2EPd54qVvOQMEzWupbRNk4TVlVlp1vzbhBuOc.",
);

// 2차원 거리 계산
function calculatePlaneDistance(position1, position2) {
  const dx = position2.x - position1.x;
  const dy = position2.y - position1.y;
  const planeDistance = (Math.sqrt(dx * dx + dy * dy) / 1000).toFixed(3);

  return planeDistance;
}

// 3차원 거리 계산
function calculateSpaceDistance(position1, position2) {
  const spaceDistance = (
    Cartesian3.distance(position1, position2) / 1000
  ).toFixed(3);

  return spaceDistance;
}

// const viewer = new Viewer("cesiumContainer", {
//   timeline: true,
//   animation: true,
//   geocoder: IonGeocodeProviderType.GOOGLE,
//   globe: false,
// });

const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
});
viewer.scene.globe.depthTestAgainstTerrain = false;

// Add a global base layer using the Google Maps Platform Map Tiles API
var buildingsTileset;
try {
  // @ts-ignore
  // const tileset = await createGooglePhotorealistic3DTileset();
  // viewer.scene.primitives.add(tileset);
  buildingsTileset = await createOsmBuildingsAsync();
  viewer.scene.primitives.add(buildingsTileset);
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
      // @ts-ignore
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
  const serviceAreaInfo = {
    "0-5 minutes": { count: 0, color: "rgba(149, 223, 255, 0.5)" },
    "5-10 minutes": { count: 0, color: "rgba(102, 204, 255, 0.5)" },
    "10+ minutes": { count: 0, color: "rgba(51, 153, 255, 0.5)" },
  };

  for (let i = 0; i < entities.length; i++) {
    const feature = entities[i];
    feature.polygon.outline = new ConstantProperty(false);

    let color, description;
    if (feature.properties.FromBreak === 0) {
      color = Color.fromHsl(0.5833, 0.8, 0.9, 0.5);
      description = "0-5 minutes";
    } else if (feature.properties.FromBreak === 5) {
      color = Color.fromHsl(0.5833, 0.9, 0.7, 0.5);
      description = "5-10 minutes";
    } else {
      color = Color.fromHsl(0.5833, 1.0, 0.4, 0.5);
      description = "10+ minutes";
    }
    feature.polygon.material = new ColorMaterialProperty(color);
    serviceAreaInfo[description].count++;
  }

  const scene = viewer.scene;
  scene.invertClassification = true;
  scene.invertClassificationColor = new Color(0.4, 0.4, 0.4, 1.0);

  displayServiceAreaInfo(serviceAreaInfo);
}

function displayServiceAreaInfo(serviceAreaInfo) {
  const modal = document.createElement("div");
  modal.className = "service-area-modal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.right = "20px";
  modal.style.transform = "translateY(-50%)";
  modal.style.width = "300px";
  modal.style.padding = "20px";
  modal.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  modal.style.border = "1px solid #ccc";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
  modal.style.zIndex = "1000";
  modal.style.fontFamily = "Arial, sans-serif";

  const title = document.createElement("h3");
  title.textContent = "Service Area Information";
  title.style.marginTop = "0";
  modal.appendChild(title);

  for (const [description, info] of Object.entries(serviceAreaInfo)) {
    const infoText = document.createElement("p");
    infoText.innerHTML = `<span style="background-color: ${info.color}; padding: 2px 5px; border-radius: 3px;">&nbsp;&nbsp;&nbsp;&nbsp;</span> ${description}: ${info.count} areas`;
    modal.appendChild(infoText);
  }

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
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

// Travel Time 계산
document.getElementById("travel-time").addEventListener("click", () => {
  // 여행 시간 구분 기능 OFF
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    viewer.dataSources.removeAll();
    viewer.scene.invertClassification = false;
    marker.show = false;
    // viewer.screenSpaceEventHandler.destroy();
    viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
    );
  }, ScreenSpaceEventType.RIGHT_CLICK);

  // 마커 엔티티 생성
  const marker = viewer.entities.add({
    name: "pickedPosition",
    billboard: {
      verticalOrigin: VerticalOrigin.BOTTOM,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      image: "./marker.svg",
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scale: 1,
    },
  });

  // 마커 위치 및 여행 시간 분석 추가
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    viewer.dataSources.removeAll();
    viewer.scene.invertClassification = false;
    marker.show = false;

    const pickedPosition = viewer.scene.pickPosition(movement.position);

    if (!defined(pickedPosition)) {
      return;
    }

    marker.position = new ConstantPositionProperty(pickedPosition);
    marker.show = true;
    viewer.scene.invertClassification = true;

    const cartographic = Cartographic.fromCartesian(pickedPosition);
    getServiceArea(cartographic);
  }, ScreenSpaceEventType.LEFT_CLICK);
});

// 두 좌표 간의 거리 계산
let positions = [];
document.getElementById("distance").addEventListener("click", () => {
  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  // 거리 계산 기능 OFF
  handler.setInputAction(function (click) {
    positions = [];
    handler.destroy();
  }, ScreenSpaceEventType.RIGHT_CLICK);

  handler.setInputAction(function (click) {
    let pickedPosition = viewer.scene.pickPosition(click.position);

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
        handler.destroy();
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
});

function displayDistances(spaceDistance, planeDistance, clickPosition) {
  // Create a modal to display distances
  const modal = document.createElement("div");
  modal.className = "distance-modal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.right = "20px";
  modal.style.transform = "translateY(-50%)";
  modal.style.width = "300px";
  modal.style.height = "500px";
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
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
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
document.getElementById("clear").addEventListener("click", () => {
  viewer.entities.removeAll();
  closeModal();
});

// 모달 창 닫기 함수
function closeModal() {
  const modals = document.querySelectorAll(".distance-modal");
  modals.forEach((modal) => {
    document.body.removeChild(modal);
  });
}

// Toggle Buildings
var isToggleBuilding = false;
document
  .getElementById("toggle-building")
  .addEventListener("click", async () => {
    buildingsTileset.style = new Cesium3DTileStyle({
      show: {
        conditions: [
          ["${elementId} === 332469316", false],
          ["${elementId} === 332469317", false],
          ["${elementId} === 235368665", false],
          ["${elementId} === 530288180", false],
          ["${elementId} === 530288179", false],
          [true, true],
        ],
      },
      color:
        "Boolean(${feature['cesium#color']}) ? color(${feature['cesium#color']}) : color('#ffffff')",
    });

    const newBuildingTileset = await Cesium3DTileset.fromIonAssetId(2970538);
    viewer.scene.primitives.add(newBuildingTileset);
    viewer.flyTo(newBuildingTileset);
  });

const box = document.getElementById("cesiumContainer");
const lat = document.getElementById("lat");
const lng = document.getElementById("lng");

// 화면 우측 하단 위경도 표시
box.addEventListener(
  "mousemove",
  function (event) {
    const canvas = viewer.scene.canvas;
    const cartesian = viewer.camera.pickEllipsoid(
      new Cartesian2(event.clientX, event.clientY),
      viewer.scene.globe.ellipsoid,
    );
    if (cartesian) {
      const cartographic = Cartographic.fromCartesian(cartesian);
      const longitude = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
      const latitude = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
      lat.innerHTML = latitude;
      lng.innerHTML = longitude;
    }
  },
  false,
);

// Elevation 버튼 이벤트 이벤트
var isElevation = false;
document.getElementById("elevation").addEventListener("click", () => {
  if (isElevation) {
    box.removeEventListener("mousemove", updateDisplay, false);
    viewer.entities.removeById("coordinate");
    isElevation = false;
  } else {
    box.addEventListener("mousemove", updateDisplay, false);
    isElevation = true;
  }
});

// Elavation Coordinate Label Display Function
function updateDisplay(event) {
  const canvas = viewer.scene.canvas;
  const cartesian = viewer.camera.pickEllipsoid(
    new Cartesian2(event.clientX, event.clientY),
    viewer.scene.globe.ellipsoid,
  );
  if (cartesian) {
    const cartographic = Cartographic.fromCartesian(cartesian);
    const longitude = CesiumMath.toDegrees(cartographic.longitude).toFixed(4);
    const latitude = CesiumMath.toDegrees(cartographic.latitude).toFixed(4);
    lat.innerHTML = latitude;
    lng.innerHTML = longitude;

    const coord = viewer.entities.getById("coordinate");
    if (defined(coord) && viewer.entities.contains(coord)) {
      viewer.entities.removeById("coordinate");
    }

    viewer.entities.add({
      id: "coordinate",
      position: cartesian,
      label: {
        text: `${latitude}, ${longitude}`,
        font: "20px sans-serif",
        fillColor: Color.RED,
        outlineColor: Color.BLACK,
        showBackground: true,
        pixelOffset: new Cartesian2(0, -20),
      },
    });
  }
}
