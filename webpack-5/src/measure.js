import {
  Cartesian3,
  Math as CesiumMath,
  defined,
  Color,
  Cartesian2,
  PolygonGeometry,
  Cartographic,
  Ellipsoid,
  ScreenSpaceEventHandler,
  CallbackProperty,
  ScreenSpaceEventType,
  PolygonHierarchy,
} from "cesium";

// 2차원 거리 계산
export function calculatePlaneDistance(position1, position2) {
  const dx = position2.x - position1.x;
  const dy = position2.y - position1.y;
  const planeDistance = (Math.sqrt(dx * dx + dy * dy) / 1000).toFixed(3);

  return planeDistance.toLocaleString();
}

// 3차원 거리 계산
export function calculateSpaceDistance(position1, position2) {
  const spaceDistance = (
    Cartesian3.distance(position1, position2) / 1000
  )?.toFixed(3);

  return spaceDistance.toLocaleString();
}

// 면적 계산
export function calculateArea(areaPositions) {
  // Cartesian3 -> Cartographic 변환
  const cartographicPositions = areaPositions.map((position) =>
    Cartographic.fromCartesian(position),
  );

  // 면적 계산에 필요한 좌표 배열 생성
  const coordinates = cartographicPositions.map((pos) => [
    pos.longitude,
    pos.latitude,
  ]);

  // 지구 타원체 (WGS84) 정의
  const ellipsoid = Ellipsoid.WGS84;

  let area = 0;

  // 면적 계산 (지구 타원체 고려)
  for (let i = 0; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[(i + 1) % coordinates.length];

    const lambda1 = lon1;
    const phi1 = lat1;
    const lambda2 = lon2;
    const phi2 = lat2;

    area += lambda2 - (lambda1 * (2 + Math.sin(phi1) + Math.sin(phi2))) / 2;

    // 면적을 절대값으로 변환하고 지구 타원체 반지름으로 스케일링
    area = Math.abs(area) * ellipsoid.maximumRadius ** 2;

    return area.toLocaleString(); // 결과는 평방미터 단위
  }
}

export function analysisDistance(viewer, handler, positions, click) {
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
          width: 3,
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
          text: planeDistance + "km",
          font: "20px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          showBackground: true,
          pixelOffset: new Cartesian2(0, -20),
        },
      });

      // displayDistances(spaceDistance, planeDistance);

      // 위치 초기화
      positions = [];
      handler.destroy();
    }
  }
}

// Create a modal to display distances
function displayDistances(spaceDistance, planeDistance) {
  const modal = document.createElement("div");
  modal.className = "result-modal modal";

  const title = document.createElement("div");
  title.className = "modal-title";

  const titleText = document.createElement("h3");
  titleText.textContent = "Distance Information";
  title.appendChild(titleText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.className = "close-btn";
  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };
  title.appendChild(closeButton);

  modal.appendChild(title);

  const content = document.createElement("div");
  content.className = "modal-content";

  const spaceDistanceText = document.createElement("p");
  spaceDistanceText.textContent = `Space Distance: ${spaceDistance} km`;
  content.appendChild(spaceDistanceText);

  const planeDistanceText = document.createElement("p");
  planeDistanceText.textContent = `Plane Distance: ${planeDistance} km`;
  content.appendChild(planeDistanceText);

  modal.appendChild(content);

  document.body.appendChild(modal);
}

export function analysisTerrainProfile(viewer, handler, positions, click) {
  let pickedPosition = viewer.scene.pickPosition(click.position);

  // 클릭한 좌표가 유효한지 확인
  if (defined(pickedPosition)) {
    positions.push(pickedPosition);

    // 두 번째 좌표가 선택되었을 때 Polyline 생성
    if (positions.length === 2) {
      var planeDistance = calculatePlaneDistance(positions[0], positions[1]);

      // polyline 생성
      viewer.entities.add({
        polyline: {
          positions: positions,
          material: Color.RED,
          width: 4,
          clampToGround: false,
          zIndex: Number.POSITIVE_INFINITY,
        },
      });

      displayTerrainProfileResult(planeDistance);

      // 위치 초기화
      positions = [];
      handler.destroy();
    }
  }
}

function displayTerrainProfileResult(planeDistance) {
  const modal = document.createElement("div");
  modal.className = "result-modal modal";

  const title = document.createElement("div");
  title.className = "modal-title";

  const titleText = document.createElement("h3");
  titleText.textContent = "Terrain Profile Analysis";
  title.appendChild(titleText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.className = "close-btn";
  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };
  title.appendChild(closeButton);
  modal.appendChild(title);

  const content = document.createElement("div");
  content.className = "modal-content";

  const spaceDistanceText = document.createElement("p");
  spaceDistanceText.textContent = `Section length : ${planeDistance} km`;
  content.appendChild(spaceDistanceText);

  modal.appendChild(content);

  document.body.appendChild(modal);
}

// export function measureArea(viewer, areaPositions) {
//   areaPositions.push(areaPositions[0]);

//   // polyline 생성
//   for (let i = 0; i < areaPositions.length - 1; i++) {
//     viewer.entities.add({
//       polyline: {
//         positions: [areaPositions[i], areaPositions[i + 1]],
//         material: Color.RED,
//         width: 3,
//         clampToGround: false,
//         zIndex: Number.POSITIVE_INFINITY,
//       },
//     });
//   }

//   // polygon 생성
//   viewer.entities.add({
//     polygon: {
//       hierarchy: areaPositions,
//       material: Color.RED.withAlpha(0.5),
//       perPositionHeight: true,
//     },
//   });

//   var area = calculateArea(areaPositions);
//   console.log(area);

//   viewer.entities.add({
//     position: Cartesian3.midpoint(
//       areaPositions[areaPositions.length - 2],
//       areaPositions[areaPositions.length - 1],
//       new Cartesian3(),
//     ),
//     label: {
//       text: area + " m²",
//       font: "20px sans-serif",
//       fillColor: Color.WHITE,
//       outlineColor: Color.BLACK,
//       showBackground: true,
//       pixelOffset: new Cartesian2(0, -20),
//     },
//   });
// }

// 우측 툴바 (측정) - 평면 거리 측정
export function measurePlanar(viewer) {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  let positions = [];
  let polylineEntity;
  let distance;

  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      positions.push(cartesian);
      if (distance !== undefined) {
        viewer.entities.add({
          position: cartesian,
          label: {
            text: distance + "km",
            font: "20px sans-serif",
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            showBackground: true,
            pixelOffset: new Cartesian2(0, -20),
          },
        });
      }
      if (!polylineEntity) {
        polylineEntity = viewer.entities.add({
          polyline: {
            positions: new CallbackProperty(() => positions, false),
            material: Color.RED,
            width: 2,
            clampToGround: false,
          },
        });
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.endPosition);
    if (defined(cartesian) && positions.length > 0) {
      if (positions.length === 1) {
        positions[1] = cartesian;
      } else {
        positions[positions.length - 1] = cartesian;
      }
      distance = calculatePlaneDistance(
        positions[positions.length - 2],
        positions[positions.length - 1],
      );
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    positions.pop();
    polylineEntity = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 우측 툴바 (측정) - 수직 거리 측정
export function measureVertical(viewer) {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  let positions = [];
  let polylineEntity;
  let distance;

  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      positions.push(cartesian);
      if (distance !== undefined) {
        viewer.entities.add({
          position: cartesian,
          label: {
            text: distance + "km",
            font: "20px sans-serif",
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            showBackground: true,
            pixelOffset: new Cartesian2(0, -20),
          },
        });
      }
      if (!polylineEntity) {
        polylineEntity = viewer.entities.add({
          polyline: {
            positions: new CallbackProperty(() => positions, false),
            material: Color.RED,
            width: 2,
            clampToGround: false,
          },
        });
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.endPosition);
    if (defined(cartesian) && positions.length > 0) {
      if (positions.length === 1) {
        positions[1] = cartesian;
      } else {
        positions[positions.length - 1] = cartesian;
      }
      distance = calculateSpaceDistance(
        positions[positions.length - 2],
        positions[positions.length - 1],
      );
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    positions.pop();
    polylineEntity = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 우측 툴바 (측정) - 면적 측정
export function measureArea(viewer) {
  const measureModal = document.getElementById("measure-modal");
  measureModal.style.display = "none";

  var handler = new ScreenSpaceEventHandler(viewer.canvas);

  let positions = [];
  let polylineEntity;
  let polygonEntity;
  let area = "0";

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      positions.push(cartesian);
      if (!polylineEntity) {
        polylineEntity = viewer.entities.add({
          polyline: {
            positions: new CallbackProperty(() => positions, false),
            material: Color.RED,
            width: 2,
            clampToGround: false,
          },
        });
      }
    }
    if (!polygonEntity && positions.length >= 3) {
      polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy: new CallbackProperty(
            () => new PolygonHierarchy(positions),
            false,
          ),
          material: Color.RED.withAlpha(0.5),
          perPositionHeight: true,
        },
      });
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    const cartesian = viewer.scene.pickPosition(movement.endPosition);
    if (defined(cartesian) && positions.length > 0) {
      if (positions.length === 1) {
        positions[1] = cartesian;
      } else {
        positions[positions.length - 1] = cartesian;
      }
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    positions[positions.length - 1] = positions[0];
    area = calculateArea(positions);
    viewer.entities.add({
      position: positions[0],
      label: {
        text: area + " m²",
        font: "20px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        showBackground: true,
        pixelOffset: new Cartesian2(0, -20),
      },
    });
    polylineEntity = undefined;
    polygonEntity = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}
