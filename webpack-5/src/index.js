import {
  Ion,
  Viewer,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  VerticalOrigin,
  HeightReference,
  createOsmBuildingsAsync,
  Cartesian2,
  Cesium3DTileStyle,
  Cesium3DTileset,
  Terrain,
  Color,
  defined,
  Fullscreen,
  Cartesian3,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import {
  analysisDistance,
  analysisTerrainProfile,
  calculateArea,
  measureArea,
} from "./measure";
import { AnalysisServiceArea } from "./serviceArea";
import { updateDisplay } from "./elevation";
import {
  addEventListenerById,
  closeToolModal,
  closeModal,
  displayTerrainAnalysisModal,
} from "./modal";

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

// Terrain Analysis 버튼 클릭
document.getElementById("terrain").addEventListener("click", () => {
  displayTerrainAnalysisModal();

  addEventListenerById("distance", "click", () => {
    let positions = [];

    var handler = new ScreenSpaceEventHandler(viewer.canvas);

    // 거리 계산 기능 OFF
    handler.setInputAction(function (click) {
      positions = [];
      handler.destroy();
    }, ScreenSpaceEventType.RIGHT_CLICK);

    // 거리 계산 기능 ON
    handler.setInputAction((click) => {
      analysisDistance(viewer, handler, positions, click);
    }, ScreenSpaceEventType.LEFT_CLICK);
  });

  addEventListenerById("terrain-profile", "click", () => {
    let positions = [];

    var handler = new ScreenSpaceEventHandler(viewer.canvas);

    // 거리 계산 기능 OFF
    handler.setInputAction(function (click) {
      positions = [];
      handler.destroy();
    }, ScreenSpaceEventType.RIGHT_CLICK);

    // 거리 계산 기능 ON
    handler.setInputAction((click) => {
      analysisTerrainProfile(viewer, handler, positions, click);
    }, ScreenSpaceEventType.LEFT_CLICK);
  });

  addEventListenerById("slope", "click", async () => {
    const geocoder = viewer.geocoder.viewModel;
    geocoder.searchText = "Vienna";
    geocoder.flightDuration = 0.0;
    // @ts-ignore
    geocoder.search();

    try {
      const tileset = await Cesium3DTileset.fromIonAssetId(5737);
      viewer.scene.primitives.add(tileset);

      tileset.style = new Cesium3DTileStyle({
        color: "rgba(255, 255, 255, 0.5)",
      });
    } catch (error) {
      console.log(`Error loading tileset: ${error}`);
    }

    const highlighted = {
      feature: undefined,
      originalColor: new Color(),
    };

    // Color a feature yellow on hover.
    viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(
      movement,
    ) {
      // If a feature was previously highlighted, undo the highlight
      if (defined(highlighted.feature)) {
        highlighted.feature.color = highlighted.originalColor;
        highlighted.feature = undefined;
      }

      // Pick a new feature
      const pickedFeature = viewer.scene.pick(movement.endPosition);
      if (!defined(pickedFeature)) {
        return;
      }

      // Highlight the feature
      highlighted.feature = pickedFeature;
      Color.clone(pickedFeature.color, highlighted.originalColor);
      pickedFeature.color = Color.YELLOW;
    }, ScreenSpaceEventType.MOUSE_MOVE);
  });
});

// Toggle Buildings
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

// Travel Time 계산
document.getElementById("travel-time").addEventListener("click", () => {
  // 여행 시간 구분 기능 OFF
  viewer.screenSpaceEventHandler.setInputAction(() => {
    viewer.dataSources.removeAll();
    viewer.scene.invertClassification = false;
    marker.show = false;
    viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
    );
  }, ScreenSpaceEventType.RIGHT_CLICK);

  // 여행 시간 분석 기능 ON
  AnalysisServiceArea(viewer, marker);
});

// Elevation 버튼 이벤트 이벤트
// var isElevation = false;
// const updateDisplayHandler = (event) => updateDisplay(viewer, event);

// document.getElementById("elevation").addEventListener("click", () => {
//   if (isElevation) {
//     box.removeEventListener("mousemove", updateDisplayHandler, false);
//     viewer.entities.removeById("coordinate");
//     isElevation = false;
//   } else {
//     box.addEventListener("mousemove", updateDisplayHandler, false);
//     isElevation = true;
//   }

//   viewer.screenSpaceEventHandler.setInputAction(() => {
//     box.removeEventListener("mousemove", updateDisplayHandler, false);
//     viewer.entities.removeById("coordinate");
//     isElevation = false;
//   }, ScreenSpaceEventType.RIGHT_CLICK);
// });

// Clear all polylines when the clear button is clicked
document.getElementById("clear").addEventListener("click", () => {
  viewer.entities.removeAll();
  closeModal();
});

const box = document.getElementById("cesiumContainer");
const lat = document.getElementById("lat");
const lng = document.getElementById("lng");
const elev = document.getElementById("elev");

// 화면 우측 하단 위경도 및 높이 표시
box.addEventListener(
  "mousemove",
  function (event) {
    const cartesian = viewer.camera.pickEllipsoid(
      new Cartesian2(event.clientX, event.clientY),
      viewer.scene.globe.ellipsoid,
    );
    if (cartesian) {
      const cartographic = Cartographic.fromCartesian(cartesian);
      const longitude = CesiumMath.toDegrees(cartographic.longitude)?.toFixed(
        4,
      );
      const latitude = CesiumMath.toDegrees(cartographic.latitude)?.toFixed(4);

      // const altitude = viewer.scene.globe
      //   ?.getHeight(
      //     Cartographic.fromDegrees(parseFloat(longitude), parseFloat(latitude)),
      //   )
      //   ?.toFixed(2);
      const elevation = viewer.scene.globe?.getHeight(cartographic)?.toFixed(2);

      lat.innerHTML = latitude;
      lng.innerHTML = longitude;
      elev.innerHTML = elevation;
    }
  },
  false,
);

// 우측 툴바 (측정)
document.getElementById("measure").addEventListener("click", () => {
  closeToolModal();
  const measureModal = document.getElementById("measure-modal");

  if (
    measureModal.style.display === "none" ||
    measureModal.style.display === ""
  ) {
    measureModal.style.display = "block";
  } else {
    measureModal.style.display = "none";
  }
});

// 우측 툴바 (측정) - 거리 측정
addEventListenerById("measure-planar", "click", () => {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  let positions = [];

  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  // 거리 계산 기능 OFF
  handler.setInputAction(function (click) {
    positions = [];
    handler.destroy();
  }, ScreenSpaceEventType.RIGHT_CLICK);

  // 거리 계산 기능 ON
  handler.setInputAction((click) => {
    analysisDistance(viewer, handler, positions, click);
  }, ScreenSpaceEventType.LEFT_CLICK);
});

// 우측 툴바 (측정) - 면적 측정
addEventListenerById("measure-area", "click", () => {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  let areaPositions = [];
  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  // 면적 계산 기능 OFF
  handler.setInputAction(function (click) {
    if (areaPositions.length >= 3) {
      measureArea(viewer, areaPositions);
    }
    areaPositions = [];
    handler.destroy();
  }, ScreenSpaceEventType.RIGHT_CLICK);

  // 면적 계산 기능 ON
  handler.setInputAction((click) => {
    let pickedPosition = viewer.scene.pickPosition(click.position);

    // 클릭한 좌표가 유효한지 확인
    if (defined(pickedPosition)) {
      areaPositions.push(pickedPosition);

      if (areaPositions.length >= 10) {
        measureArea(viewer, areaPositions);

        // 초기화
        areaPositions = [];
        handler.destroy();
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
});

// 우측 툴바 (측정) - Elevation 측정
var isElevation = false;
const updateDisplayHandler = (event) => updateDisplay(viewer, event);
addEventListenerById("measure-elevation", "click", () => {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  if (isElevation) {
    box.removeEventListener("mousemove", updateDisplayHandler, false);
    viewer.entities.removeById("coordinate");
    isElevation = false;
  } else {
    box.addEventListener("mousemove", updateDisplayHandler, false);
    isElevation = true;
  }

  viewer.screenSpaceEventHandler.setInputAction(() => {
    box.removeEventListener("mousemove", updateDisplayHandler, false);
    viewer.entities.removeById("coordinate");
    isElevation = false;
  }, ScreenSpaceEventType.RIGHT_CLICK);
});

// 우측 툴바 (화면 분할) - 추가구현필요
var isScreenSplit = false;
document.getElementById("splitScreen").addEventListener("click", () => {
  const layers = viewer.imageryLayers;

  const slider = document.getElementById("slider");

  if (isScreenSplit) {
    slider.style.display = "none";
    isScreenSplit = false;
    return;
  }

  slider.style.display = "block";
  isScreenSplit = true;
  viewer.scene.splitPosition =
    slider.offsetLeft / slider.parentElement.offsetWidth;

  // @ts-ignore
  const handler = new ScreenSpaceEventHandler(slider);

  let moveActive = false;

  function sliderMove(movement) {
    if (!moveActive) {
      return;
    }

    const relativeOffset = movement.endPosition.x;
    const splitPosition =
      (slider.offsetLeft + relativeOffset) / slider.parentElement.offsetWidth;
    slider.style.left = `${100.0 * splitPosition}%`;
    viewer.scene.splitPosition = splitPosition;
  }

  handler.setInputAction(function () {
    moveActive = true;
  }, ScreenSpaceEventType.LEFT_DOWN);
  handler.setInputAction(function () {
    moveActive = true;
  }, ScreenSpaceEventType.PINCH_START);

  handler.setInputAction(sliderMove, ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(sliderMove, ScreenSpaceEventType.PINCH_MOVE);

  handler.setInputAction(function () {
    moveActive = false;
  }, ScreenSpaceEventType.LEFT_UP);
  handler.setInputAction(function () {
    moveActive = false;
  }, ScreenSpaceEventType.PINCH_END);
});

// 우측 툴바 (Other Tools)
document.getElementById("otherTools").addEventListener("click", () => {
  closeToolModal();
  const otherToolModal = document.getElementById("other-tools");

  if (
    otherToolModal.style.display === "none" ||
    otherToolModal.style.display === ""
  ) {
    otherToolModal.style.display = "block";
  } else {
    otherToolModal.style.display = "none";
  }
});

// 우측 툴바 (Other Tools) - 스크린샷
document.getElementById("screenshot").addEventListener("click", () => {
  closeToolModal();

  viewer.render();
  const canvas = viewer.canvas;
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenshot.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});

// 우측 툴바 (Other Tools) - 그리기 도구
document.getElementById("drawing-tool").addEventListener("click", () => {
  closeToolModal();

  // 그리기 도구 모달 창 생성

  // 점

  // 선

  // 면

  // 사각형

  // 원
});

// 우측 툴바 (줌 인)
document.getElementById("zoomIn").addEventListener("click", () => {
  viewer.camera.zoomIn();
});

// 우측 툴바 (줌 아웃)
document.getElementById("zoomOut").addEventListener("click", () => {
  viewer.camera.zoomOut();
});

// 우측 툴바 (풀스크린)
var isFullScreen = false;
document.getElementById("fullScreen").addEventListener("click", () => {
  if (isFullScreen) {
    Fullscreen.exitFullscreen();
    isFullScreen = false;
  } else {
    Fullscreen.requestFullscreen(document.body);
    isFullScreen = true;
  }
});
