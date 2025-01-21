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

    console.log(positions);

    // 두 번째 좌표가 선택되었을 때 Polyline 생성
    if (positions.length === 2) {
      var spaceDistance = calculateSpaceDistance(positions[0], positions[1]);
      var planeDistance = calculatePlaneDistance(positions[0], positions[1]);

      console.log("2개");

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
}

// Create a modal to display distances
function displayDistances(spaceDistance, planeDistance, clickPosition) {
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
