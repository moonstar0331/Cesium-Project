import {
  Cartesian3,
  Ion,
  Viewer,
  Terrain,
  Math as CesiumMath,
  createOsmBuildingsAsync,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Color,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";

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

const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
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
const buildingTileset = await createOsmBuildingsAsync();
viewer.scene.primitives.add(buildingTileset);

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
