import {
  Math as CesiumMath,
  Cartographic,
  createWorldTerrainAsync,
  sampleTerrainMostDetailed,
  Cartesian3,
  Color,
  ColorMaterialProperty,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";

export async function analyzeSlope(viewer, geojson) {
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

  let totalArea = 0;
  const slopeRanges = {
    "0-10": {
      area: 0,
      color: new Color(0, 255, 0),
      percentage: 0.0,
    },
    "10-15": {
      area: 0,
      color: new Color(173, 255, 47),
      percentage: 0.0,
    },
    "15-20": {
      area: 0,
      color: new Color(154, 205, 50),
      percentage: 0.0,
    },
    "20-25": {
      area: 0,
      color: new Color(255, 255, 0),
      percentage: 0.0,
    },
    "25-30": {
      area: 0,
      color: new Color(255, 215, 0),
      percentage: 0.0,
    },
    "30-35": {
      area: 0,
      color: new Color(255, 99, 71),
      percentage: 0.0,
    },
    "35-40": {
      area: 0,
      color: new Color(255, 0, 0),
      percentage: 0.0,
    },
    "45+": {
      area: 0,
      color: new Color(165, 42, 42),
      percentage: 0.0,
    },
  };

  // 해당 feature의 평균 경사도를 계산
  let featureSlopes = [];
  geojson.features
    ?.filter((feature) => feature.geometry != null)
    .forEach((feature) => {
      const coordinates = feature.geometry.coordinates[0];

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
      }

      // 해당 feature의 평균 경사도 계산
      const featureAvgSlope =
        featureSlopes.length > 0
          ? featureSlopes.reduce((a, b) => a + b, 0) / featureSlopes.length
          : 0;

      // 적절한 색상 선택
      let fillColor = Color.GRAY.withAlpha(0.5);
      if (featureAvgSlope <= 10) {
        fillColor = new Color(0, 255, 0, 0.5);
      } else if (featureAvgSlope <= 15) {
        fillColor = new Color(173, 255, 47, 0.5);
      } else if (featureAvgSlope <= 20) {
        fillColor = new Color(154, 205, 50, 0.5);
      } else if (featureAvgSlope <= 25) {
        fillColor = new Color(255, 255, 0, 0.5);
      } else if (featureAvgSlope <= 30) {
        fillColor = new Color(255, 215, 0, 0.5);
      } else if (featureAvgSlope <= 35) {
        fillColor = new Color(255, 99, 71, 0.5);
      } else if (featureAvgSlope <= 40) {
        new Color(255, 0, 0, 0.5);
      } else {
        fillColor = new Color(165, 42, 42, 0.5);
      }

      // Polygon 추가 (경사도 색상 적용)
      viewer.entities.add({
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(coordinates.flat()),
          material: new ColorMaterialProperty(fillColor),
        },
      });
    });

  // 경사도 분석 결과 계산
  const averageSlope =
    featureSlopes.reduce((a, b) => a + b, 0) / featureSlopes.length;
  const minSlope = Math.min(...featureSlopes);
  const maxSlope = Math.max(...featureSlopes);

  // GeoJSON의 location 명 추출
  const locationName = geojson?.features[0]?.properties?.name || "Unknown";

  // 경사도 범위 별 영역과 비율 출력
  Object.keys(slopeRanges).forEach((range) => {
    const area = slopeRanges[range].area;
    const percentage = ((area / totalArea) * 100).toFixed(3);
    slopeRanges[range].percentage = percentage;
    console.log(`Slope ${range}°: ${area.toFixed(3)} ( ${percentage}% )`);
  });

  // 분석 결과 출력
  console.log("Location:", locationName);
  console.log("Total Area:", totalArea);
  console.log("Average Slope:", averageSlope);
  console.log("Minimum Slope:", minSlope);
  console.log("Maximum Slope:", maxSlope);
}
