import {
  Cartesian3,
  Math as CesiumMath,
  defined,
  Color,
  Cartesian2,
} from "cesium";

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
          text: spaceDistance + "km",
          font: "20px sans-serif",
          fillColor: Color.RED,
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

export function measureArea(viewer, handler, areaPositions, click) {
  let pickedPosition = viewer.scene.pickPosition(click.position);

  // 클릭한 좌표가 유효한지 확인
  if (defined(pickedPosition)) {
    areaPositions.push(pickedPosition);

    if (areaPositions.length >= 10) {
      areaPositions.push(areaPositions[0]);

      // polyline 생성
      for (let i = 0; i < areaPositions.length - 1; i++) {
        viewer.entities.add({
          polyline: {
            positions: [areaPositions[i], areaPositions[i + 1]],
            material: Color.RED,
            width: 3,
            clampToGround: false,
            zIndex: Number.POSITIVE_INFINITY,
          },
        });
      }

      // polygon 생성
      viewer.entities.add({
        polygon: {
          hierarchy: areaPositions,
          material: Color.RED.withAlpha(0.5),
          perPositionHeight: true,
        },
      });

      // 초기화
      areaPositions = [];
      handler.destroy();
    }
  }
}
