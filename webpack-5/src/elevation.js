import {
  Math as CesiumMath,
  defined,
  Color,
  Cartesian2,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
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
    // const altitude = viewer.scene.globe
    //   .getHeight(
    //     Cartographic.fromDegrees(parseFloat(longitude), parseFloat(latitude)),
    //   )
    //   ?.toFixed(2);

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
        label: {
          text: `${longitude} ${latitude} ${elevation}`,
          font: "14px sans-serif",
          fillColor: Color.RED,
          outlineColor: Color.BLACK,
          showBackground: true,
          pixelOffset: new Cartesian2(0, -20),
        },
      });
    }
  }
}
