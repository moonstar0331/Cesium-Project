import {
  Math as CesiumMath,
  defined,
  Color,
  Cartesian2,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
} from "cesium";

// Elavation Coordinate Label Display Function
export function updateDisplay(viewer, event) {
  const cartesian = viewer.camera.pickEllipsoid(
    new Cartesian2(event.clientX, event.clientY),
    viewer.scene.globe.ellipsoid,
  );
  if (cartesian) {
    const cartographic = Cartographic.fromCartesian(cartesian);

    const longitude = CesiumMath.toDegrees(cartographic.longitude)?.toFixed(4);
    const latitude = CesiumMath.toDegrees(cartographic.latitude)?.toFixed(4);
    const elevation = viewer.scene.globe?.getHeight(cartographic)?.toFixed(2);

    const coord = viewer.entities.getById("coordinate");

    if (defined(coord) && viewer.entities.contains(coord)) {
      coord.position = new ConstantPositionProperty(cartesian);
      coord.label.text = new ConstantProperty(
        `${longitude} ${latitude} ${elevation}`,
      );
    } else {
      viewer.entities.add({
        id: "coordinate",
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Color.RED,
        },
        label: {
          text: `${longitude} ${latitude} ${elevation}`,
          font: "16px Arial",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          showBackground: true,
          backgroundColor: new Color(0.165, 0.165, 0.165, 0.8),
          backgroundPadding: new Cartesian2(7, 5),
          pixelOffset: new Cartesian2(0, -25),
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
        },
      });
    }
  }
}
