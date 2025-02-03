import {
  CallbackProperty,
  Cartesian3,
  Color,
  defined,
  PolygonHierarchy,
  Rectangle,
  ScreenSpaceEventType,
} from "cesium";

// 그리기 도구 - 점 그리기
export function drawingPoint(viewer, handler) {
  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Color.RED,
        },
      });
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction(() => {
    // handler.destroy();
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 그리기 도구 - 선 그리기
export function drawingLine(viewer, handler) {
  let positions = [];
  let polylineEntity;

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
    positions.pop();
    polylineEntity = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 그리기 도구 - 면 그리기
export function drawingPolygon(viewer, handler) {
  let positions = [];
  let polylineEntity;
  let polygonEntity;

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
    polylineEntity = undefined;
    polygonEntity = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 그리기 도구 - 사각형 그리기
export function drawingRectangle(viewer, handler) {
  let startPosition;
  let endPosition;
  let rectangleEntity;

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      if (!startPosition) {
        startPosition = cartesian;
        rectangleEntity = viewer.entities.add({
          rectangle: {
            coordinates: new CallbackProperty(() => {
              if (defined(endPosition)) {
                const rectangle = Rectangle.fromCartesianArray([
                  startPosition,
                  endPosition,
                ]);
                return rectangle;
              }
              return undefined;
            }, false),
            material: Color.RED.withAlpha(0.5),
          },
        });
      } else {
        endPosition = cartesian;
        handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    endPosition = viewer.scene.pickPosition(movement.endPosition);
  }, ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    startPosition = undefined;
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 그리기 도구 - 원 그리기
export function drawingCircle(viewer, handler) {
  let center;
  let radius;
  let circleEntity;

  handler.setInputAction((click) => {
    const cartesian = viewer.scene.pickPosition(click.position);
    if (defined(cartesian)) {
      if (!center) {
        center = cartesian;
        circleEntity = viewer.entities.add({
          position: center,
          ellipse: {
            semiMajorAxis: new CallbackProperty(() => radius, false),
            semiMinorAxis: new CallbackProperty(() => radius, false),
            material: Color.RED.withAlpha(0.5),
          },
        });
      } else {
        // handler.destroy();
        handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
      }
    }
  }, ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement) => {
    const endPosition = viewer.scene.pickPosition(movement.endPosition);
    if (defined(endPosition) && defined(center)) {
      radius = Cartesian3.distance(center, endPosition);
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    center = undefined;
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
  }, ScreenSpaceEventType.RIGHT_CLICK);
}
