import { ApiKeyManager } from "@esri/arcgis-rest-request";
import { serviceArea } from "@esri/arcgis-rest-routing";
import {
  Math as CesiumMath,
  defined,
  Color,
  GeoJsonDataSource,
  ConstantProperty,
  ColorMaterialProperty,
  ConstantPositionProperty,
  Cartographic,
  ScreenSpaceEventType,
} from "cesium";

// ArcGIS location services REST API KEY
const authentication = ApiKeyManager.fromKey(
  "AAPT3NKHt6i2urmWtqOuugvr9SZ2lQsIKWCKGUFYqC7k4zWYj4L7KghRPfM9GrAtIfKJIvtDkHEFmaegJXtSIw9oemOsBLfOKcB9gtiJ1nYwqkptFjbT6ZbeaLLP3qrAs7n6HY4QS359bd0YC6jwrd1VcpqGnW79kX195lcH_go06CYLWW7bYcYtmMvKs6CcvT0AbAZU4h2EPd54qVvOQMEzWupbRNk4TVlVlp1vzbhBuOc.",
);

export function AnalysisServiceArea(viewer, marker) {
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
}

// Service Area 추출
async function getServiceArea(viewer, cartographic) {
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

// Service Area 분석 결과 표시
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
