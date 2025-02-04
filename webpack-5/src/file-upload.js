import JSZip from "jszip";
import { GeoJsonDataSource } from "cesium";
import * as shapefile from "shapefile";

export async function loadShapefile(viewer, zipFile) {
  // 1. JSZip을 사용하여 압축 해제
  const zip = await JSZip.loadAsync(zipFile);

  // 2. Shapefile components
  const shpFile = zip.file(/\.shp$/i)[0];
  const dbfFile = zip.file(/\.dbf$/i)[0];

  if (!shpFile || !dbfFile) {
    throw new Error("Missing .shp or .dbf file in the ZIP archive");
  }

  // 3. 개별 파일을 ArrayBuffer로 변환
  const shpBuffer = await shpFile.async("arraybuffer");
  const dbfBuffer = await dbfFile.async("arraybuffer");

  // 4. ShapefileLoader를 사용하여 GeoJSON 변환
  const geojson = await shapefile.read(shpBuffer, dbfBuffer);

  // 5. Cesium에 로드
  const dataSource = await GeoJsonDataSource.load(geojson);
  viewer.dataSources.add(dataSource);
  viewer.zoomTo(dataSource);

  return geojson;
}
