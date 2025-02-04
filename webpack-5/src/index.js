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
    // @ts-ignore
    if (fileInput.value.length) {
      document.getElementById("slope-upload-name").textContent =
        // @ts-ignore
        fileInput.files[0].name;

      let container = document.getElementById("slope-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        // @ts-ignore
        loadShapefile(viewer, e.target.files[0]).then((result) => {
          geojson = result;
        });
        // geojson = loadShapefile(viewer, e.target.files[0]);
      } else {
        container.classList.add("hidden");
      }
    }
  });

  // Run Analysis
  addEventListenerById("slope-btn", "click", () => {
    analyzeSlope(geojson);
  });
});

async function analyzeSlope(geojson) {
  // GeoJSON에서 유효한 좌표들을 추출
  const positions = geojson?.features
    ?.filter((feature) => feature.geometry !== null)
    ?.flatMap((feature) => feature.geometry.coordinates[0]);

  // 위도, 경도 좌표를 Cartographic 객체로 변환
  const cartographicPositions = positions?.map((coord) =>
    Cartographic.fromDegrees(coord[0], coord[1]),
  );

  // Cesium Terrain Provider 생성 및 가장 정밀한 지형 샘플링
  const terrainProvider = await createWorldTerrainAsync();
  const updatedPositions = await sampleTerrainMostDetailed(
    terrainProvider,
    cartographicPositions,
  );

  // 경사도를 계산
  const slopes = [];
  let totalArea = 0;
  const slopeRanges = {
    "0-5": {
      area: 0,
      color: Color.GREEN,
      percentage: 0.0,
      rangeStart: 0,
      rangeEnd: 5,
    },
    "5-15": {
      area: 0,
      color: Color.YELLOW,
      percentage: 0.0,
      rangeStart: 5,
      rangeEnd: 15,
    },
    "15-30": {
      area: 0,
      color: Color.ORANGE,
      percentage: 0.0,
      rangeStart: 15,
      rangeEnd: 30,
    },
    "30-45": {
      area: 0,
      color: Color.RED,
      percentage: 0.0,
      rangeStart: 30,
      rangeEnd: 45,
    },
    "45+": {
      area: 0,
      color: Color.PURPLE,
      percentage: 0.0,
      rangeStart: 45,
      rangeEnd: 100,
    },
  };

  for (let i = 1; i < updatedPositions.length; i++) {
    const prev = updatedPositions[i - 1];
    const curr = updatedPositions[i];

    // 두 점 간의 거리 계산
    const distance = Math.abs(
      Cartesian3.distance(
        Cartesian3.fromRadians(prev.longitude, prev.latitude, prev.height),
        Cartesian3.fromRadians(curr.longitude, curr.latitude, curr.height),
      ),
    );

    // 고도 변환 계산
    const elevationChange = Math.abs(curr.height - prev.height);

    // 경사도 계산 (단위: 도)
    const slope = Math.atan2(elevationChange, distance) * (180 / Math.PI); // Convert to degrees
    slopes.push(slope);

    // 면적 계산 (단순화된 방법)
    const area = distance * elevationChange;
    totalArea += area;

    // 경사도 범위에 따라 영역 추가
    if (slope <= 5) {
      slopeRanges["0-5"].area += area;
    } else if (slope <= 15) {
      slopeRanges["5-15"].area += area;
    } else if (slope <= 30) {
      slopeRanges["15-30"].area += area;
    } else if (slope <= 45) {
      slopeRanges["30-45"].area += area;
    } else {
      slopeRanges["45+"].area += area;
    }
  }

  // 경사도 분석 결과 계산
  const averageSlope = slopes.reduce((a, b) => a + b, 0) / slopes.length;
  const minSlope = Math.min(...slopes);
  const maxSlope = Math.max(...slopes);

  // GeoJSON의 location 명 추출
  const locationName = geojson?.features[0]?.properties?.name || "Unknown";

  // 분석 결과 출력
  console.log("Location:", locationName);
  console.log("Total Area:", totalArea);
  console.log("Average Slope:", averageSlope);
  console.log("Minimum Slope:", minSlope);
  console.log("Maximum Slope:", maxSlope);

  // 경사도 범위 별 영역과 비율 출력
  Object.keys(slopeRanges).forEach((range) => {
    const area = slopeRanges[range].area;
    const percentage = ((area / totalArea) * 100).toFixed(3);
    slopeRanges[range].percentage = percentage;
    console.log(`Slope ${range}°: ${area.toFixed(3)} ( ${percentage}% )`);
  });

  // 색상으로 구분하여 시각화
  // geojson.features
  //   ?.filter((feature) => feature.geometry !== null)
  //   .forEach((feature) => {
  //     const coordinates = feature.geometry.coordinates[0];
  //     const polygon = viewer.entities.add({
  //       polygon: {
  //         hierarchy: Cartesian3.fromDegreesArray(coordinates.flat()),
  //         material: Color.GREEN,
  //       },
  //     });
  //   });
  // 🚀 경사도 별 색상 구분을 적용한 폴리곤 생성
  geojson.features
    ?.filter((feature) => feature.geometry !== null)
    .forEach((feature) => {
      const coordinates = feature.geometry.coordinates[0];

      // 해당 feature의 평균 경사도를 계산
      let featureSlopes = [];
      for (let i = 1; i < coordinates.length; i++) {
        const prevCoord = coordinates[i - 1];
        const currCoord = coordinates[i];

        const prev = updatedPositions.find(
          (p) =>
            p.longitude === CesiumMath.toRadians(prevCoord[0]) &&
            p.latitude === CesiumMath.toRadians(prevCoord[1]),
        );
        const curr = updatedPositions.find(
          (p) =>
            p.longitude === CesiumMath.toRadians(currCoord[0]) &&
            p.latitude === CesiumMath.toRadians(currCoord[1]),
        );

        if (prev && curr) {
          const distance = Math.abs(
            Cartesian3.distance(
              Cartesian3.fromRadians(
                prev.longitude,
                prev.latitude,
                prev.height,
              ),
              Cartesian3.fromRadians(
                curr.longitude,
                curr.latitude,
                curr.height,
              ),
            ),
          );
          const elevationChange = Math.abs(curr.height - prev.height);
          const slope = Math.atan2(elevationChange, distance) * (180 / Math.PI);
          featureSlopes.push(slope);
        }
      }

      // 해당 feature의 평균 경사도 계산
      const featureAvgSlope =
        featureSlopes.length > 0
          ? featureSlopes.reduce((a, b) => a + b, 0) / featureSlopes.length
          : 0;

      // 적절한 색상 선택
      let fillColor = Color.GRAY;
      if (featureAvgSlope <= 5) {
        fillColor = Color.GREEN;
      } else if (featureAvgSlope <= 15) {
        fillColor = Color.YELLOW;
      } else if (featureAvgSlope <= 30) {
        fillColor = Color.ORANGE;
      } else if (featureAvgSlope <= 45) {
        fillColor = Color.RED;
      } else {
        fillColor = Color.PURPLE;
      }

      // Polygon 추가 (경사도 색상 적용)
      viewer.entities.add({
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(coordinates.flat()),
          material: new ColorMaterialProperty(fillColor),
        },
      });
    });
}

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
    // @ts-ignore
    if (fileInput.value.length) {
      document.getElementById("direction-upload-name").textContent =
        // @ts-ignore
        fileInput.files[0].name;

      let container = document.getElementById("direction-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        // @ts-ignore
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
    // @ts-ignore
    if (fileInput.value.length) {
      document.getElementById("earthwork-upload-name").textContent =
        // @ts-ignore
        fileInput.files[0].name;
      let container = document.getElementById("earthwork-upload-list");
      if (container.classList.contains("hidden")) {
        container.classList.remove("hidden");
        // @ts-ignore
        // loadShapefile(viewer, fileInput.files[0]);
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
  // @ts-ignore
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
