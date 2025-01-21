import {
  Ion,
  Viewer,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Color,
  Cartographic,
  VerticalOrigin,
  HeightReference,
  Cartesian2,
  ConstantProperty,
  ConstantPositionProperty,
  createOsmBuildingsAsync,
  Cesium3DTileStyle,
  Cesium3DTileset,
  Terrain,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import { analysisDistance } from "./distance";
import { getServiceArea } from "./serviceArea";
import { updateDisplay } from "./elevation";

// Math as CesiumMath

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhNzQ0OWUzMS1lMTdiLTQ4ZWYtOTYwMi1kYjZkNjE4MjE2MzQiLCJpZCI6MjY3MDE5LCJpYXQiOjE3MzYxNDg2ODR9.FZHYOYD25Snz3ZYimh5wNaATYbXHoB6p79gshGItaek";

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

// Travel Time 계산
document.getElementById("travel-time").addEventListener("click", () => {
  // 여행 시간 구분 기능 OFF
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    viewer.dataSources.removeAll();
    viewer.scene.invertClassification = false;
    marker.show = false;
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
    getServiceArea(viewer, cartographic);
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

  handler.setInputAction((click) => {
    analysisDistance(viewer, handler, positions, click);
  }, ScreenSpaceEventType.LEFT_CLICK);
});

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
    box.removeEventListener(
      "mousemove",
      (event) => updateDisplay(viewer, event),
      false,
    );
    viewer.entities.removeById("coordinate");
    isElevation = false;
  } else {
    box.addEventListener(
      "mousemove",
      (event) => updateDisplay(viewer, event),
      false,
    );
    isElevation = true;
  }
});
