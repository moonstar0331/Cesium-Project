// @ts-nocheck
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
  Fullscreen,
  createWorldTerrainAsync,
  sampleTerrainMostDetailed,
  Cartesian3,
  Color,
  MaterialProperty,
  ColorMaterialProperty,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import { measureArea, measurePlanar, measureVertical } from "./measure";
import { AnalysisServiceArea } from "./serviceArea";
import { setReferenceHeight, updateDisplay } from "./elevation";
import { addEventListenerById, hideAllModals } from "./modal";
import {
  drawingCircle,
  drawingLine,
  drawingPoint,
  drawingPolygon,
  drawingRectangle,
} from "./drawing";
import { loadShapefile } from "./file-upload";
import { feature } from "@turf/turf";
import { analyzeSlope, analyzeSlope2 } from "./analysis";

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
  selectionIndicator: false,
  infoBox: false,
});
viewer.scene.globe.depthTestAgainstTerrain = false;

// Terrain Analysis 버튼 클릭
document.getElementById("terrain").addEventListener("click", () => {
  hideAllModals();

  const terrainModal = document.getElementById("terrain-modal");

  if (terrainModal.classList.contains("hidden")) {
    terrainModal.classList.remove("hidden");
  } else {
    terrainModal.classList.add("hidden");
  }
});

// Terrain Analysis - Slope Analysis
document.getElementById("slope").addEventListener("click", () => {
  hideAllModals();

  const slopeModal = document.getElementById("slope-modal");

  if (slopeModal.classList.contains("hidden")) {
    slopeModal.classList.remove("hidden");
  } else {
    slopeModal.classList.add("hidden");
  }

  const handler = new ScreenSpaceEventHandler(viewer.canvas);

  // Select Cadastral Map

  // Select Area
  addEventListenerById("slope-select-area", "click", () => {
    drawingPolygon(viewer, handler);
  });

  // Upload shp.zip File
  let fileInput = document.getElementById("slope-file");
  let geojson;
  fileInput.addEventListener("change", function (e) {
    if (fileInput.value.length) {
      document.getElementById("slope-upload-name").textContent =
        fileInput.files[0].name;

      let container = document.getElementById("slope-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        loadShapefile(viewer, e.target.files[0]).then((result) => {
          geojson = result;
        });
      } else {
        container.classList.add("hidden");
      }
    }
  });

  // Run Analysis
  addEventListenerById("slope-btn", "click", () => {
    analyzeSlope(viewer, geojson);
  });
});

// Terrain Analysis - Slope Direction Analysis
document.getElementById("slope-direction").addEventListener("click", () => {
  hideAllModals();

  const slopeDirectionModal = document.getElementById("slope-direction-modal");

  if (slopeDirectionModal.classList.contains("hidden")) {
    slopeDirectionModal.classList.remove("hidden");
  } else {
    slopeDirectionModal.classList.add("hidden");
  }

  const handler = new ScreenSpaceEventHandler(viewer.canvas);

  // Select Cadastral Map

  // Select Area
  addEventListenerById("direction-select-area", "click", () => {
    drawingPolygon(viewer, handler);
  });

  // Upload shp.zip file
  let fileInput = document.getElementById("direction-file");
  let geojson;
  fileInput.addEventListener("change", function (e) {
    if (fileInput.value.length) {
      document.getElementById("direction-upload-name").textContent =
        fileInput.files[0].name;

      let container = document.getElementById("direction-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        geojson = loadShapefile(viewer, e.target.files[0]);
      } else {
        container.classList.add("hidden");
      }
    }
  });

  // Run Analysis
});

// Terrain Analysis - Terrain Profile Analysis
document.getElementById("terrain-profile").addEventListener("click", () => {
  hideAllModals();

  const terrainProfileModal = document.getElementById("terrain-profile-modal");

  if (terrainProfileModal.classList.contains("hidden")) {
    terrainProfileModal.classList.remove("hidden");
  } else {
    terrainProfileModal.classList.add("hidden");
  }

  const handler = new ScreenSpaceEventHandler(viewer.canvas);

  // Draw Line
  addEventListenerById("profile-draw-line", "click", () => {
    drawingLine(viewer, handler);
  });
});

// Terrain Analysis - Earthwork Volume Calculation
document.getElementById("earthwork-volume").addEventListener("click", () => {
  hideAllModals();

  const earthworkModal = document.getElementById("earthwork-modal");

  if (earthworkModal.classList.contains("hidden")) {
    earthworkModal.classList.remove("hidden");
  } else {
    earthworkModal.classList.add("hidden");
  }

  const handler = new ScreenSpaceEventHandler(viewer.canvas);

  // Select Cadastral Parcel

  // Select Area
  addEventListenerById("earthwork-select-area", "click", () => {
    drawingPolygon(viewer, handler);
  });

  // Upload shp.zip file
  let fileInput = document.getElementById("earthwork-file");
  fileInput.addEventListener("change", function (e) {
    if (fileInput.value.length) {
      document.getElementById("earthwork-upload-name").textContent =
        fileInput.files[0].name;
      let container = document.getElementById("earthwork-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        loadShapefile(viewer, e.target.files[0]);
      } else {
        container.classList.add("hidden");
      }
    }
  });

  // Elevation
  var isElevation = false;
  const setReferenceHeightHandler = (event) =>
    setReferenceHeight(viewer, event);
  addEventListenerById("earthwork-elevation", "click", () => {
    if (isElevation) {
      box.removeEventListener("mousemove", setReferenceHeightHandler, false);
      viewer.entities.removeById("coordinate");
      isElevation = false;
    } else {
      box.addEventListener("mousemove", setReferenceHeightHandler, false);
      isElevation = true;
    }

    viewer.screenSpaceEventHandler.setInputAction(() => {
      box.removeEventListener("mousemove", setReferenceHeightHandler, false);
      viewer.entities.removeById("coordinate");
      isElevation = false;
    }, ScreenSpaceEventType.RIGHT_CLICK);
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

// Clear all polylines when the clear button is clicked
Array.from(document.getElementsByClassName("clear")).forEach((element) => {
  element.addEventListener("click", () => {
    viewer.entities.removeAll();
  });
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
      const elevation = viewer.scene.globe?.getHeight(cartographic)?.toFixed(2);

      lat.innerHTML = latitude;
      lng.innerHTML = longitude;
      elev.innerHTML = elevation;
    }
  },
  false,
);

// 우측 툴바 (측정) - 모달 컨트롤
document.getElementById("measure").addEventListener("click", () => {
  hideAllModals();

  const measureModal = document.getElementById("measure-modal");

  if (measureModal.classList.contains("hidden")) {
    measureModal.classList.remove("hidden");
  } else {
    measureModal.classList.add("hidden");
  }
});

// 우측 툴바 (측정) - 평면 거리 측정
addEventListenerById("measure-planar", "click", () => {
  measurePlanar(viewer);
});

// 우측 툴바 (측정) - 수직 거리 측정
addEventListenerById("measure-vertical", "click", () => {
  measureVertical(viewer);
});

// 우측 툴바 (측정) - 면적 측정
addEventListenerById("measure-area", "click", () => {
  measureArea(viewer);
});

// 우측 툴바 (측정) - Elevation 측정
var isElevation = false;
const updateDisplayHandler = (event) => updateDisplay(viewer, event);
addEventListenerById("measure-elevation", "click", () => {
  hideAllModals();

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

// 우측 툴바 (화면 분할) - 분할선 이동 추가구현필요
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
  hideAllModals();

  const otherToolModal = document.getElementById("other-tools");

  if (otherToolModal.classList.contains("hidden")) {
    otherToolModal.classList.remove("hidden");
  } else {
    otherToolModal.classList.add("hidden");
  }
});

// 우측 툴바 (Other Tools) - 스크린샷
document.getElementById("screenshot").addEventListener("click", () => {
  hideAllModals();

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
  hideAllModals();

  // 그리기 도구 모달 창 생성
  const drawingModal = document.getElementById("drawing-modal");

  if (drawingModal.classList.contains("hidden")) {
    drawingModal.classList.remove("hidden");
  } else {
    drawingModal.classList.add("hidden");
  }

  const handler = new ScreenSpaceEventHandler(viewer.canvas);

  // 점 그리기
  addEventListenerById("draw-point", "click", () => {
    drawingPoint(viewer, handler);
  });

  // 선 그리기
  addEventListenerById("draw-line", "click", () => {
    drawingLine(viewer, handler);
  });

  // 면 그리기
  addEventListenerById("draw-polygon", "click", () => {
    drawingPolygon(viewer, handler);
  });

  // 사각형 그리기
  addEventListenerById("draw-rectangle", "click", () => {
    drawingRectangle(viewer, handler);
  });

  // 원 그리기
  addEventListenerById("draw-circle", "click", () => {
    drawingCircle(viewer, handler);
  });
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
