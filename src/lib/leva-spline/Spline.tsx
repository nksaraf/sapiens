import { useControls } from "leva";
import {
  Components,
  useInputContext,
  useCanvas2d,
  debounce,
  createPlugin,
  useTh,
  colord,
} from "leva/plugin";
import React from "react";
import * as props from "./spline-plugin";
import { Color } from "./Color";
import { PickerContainer } from "./StyledColor";
import { SplineInternalPoint, SplinePoint, SplineProps } from "./spline-types";
import { RangeSlider } from "./RangeSlider";

const { Label, Row, String, Number } = Components;

export function ColorComponent() {
  const { value, displayValue, label, onChange, onUpdate, settings } =
    useInputContext<SplineProps>();
  console.log(displayValue);

  const accentColor = useTh("colors", "accent1");

  const drawSpline = React.useCallback(
    (_canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D) => {
      // fixes unmount potential bug
      if (!_canvas) return;
      const { width, height } = _canvas;

      _ctx.clearRect(0, 0, width, height);
      let gradient = _ctx.createLinearGradient(5, 0, width - 10, 0);
      displayValue.forEach(([d, i]) => {
        gradient.addColorStop(i, d);
      });
      _ctx.fillStyle = gradient;
      _ctx.fillRect(5, 0, width - 10, height - 20);
      _ctx.fillStyle = accentColor;
      displayValue.forEach(([d, i]) => {
        _ctx.fillRect((width - 10) * i, height - 12, 10, 10);
      });
    },
    [displayValue, accentColor]
  );
  const [canvas, ctx] = useCanvas2d(drawSpline);
  const updateSpline = React.useMemo(
    () => debounce(() => drawSpline(canvas.current!, ctx.current!), 250),
    [canvas, ctx, drawSpline]
  );

  // const onSplineChange = React.useCallback((v, i) => {
  //   let val = [...value];
  // });

  React.useEffect(() => updateSpline(), [updateSpline]);
  return (
    <Row dir="column">
      <canvas className="h-full w-full" ref={canvas} />
      {value.map(([v, i], index) => (
        <Row input key={index}>
          <Label>{label}</Label>
          <Row dir="column">
            <PickerContainer>
              <Color
                value={v.value}
                displayValue={displayValue[index][0]}
                onChange={(v) => {
                  onChange((val: SplinePoint[]) => {
                    val[index][0] = v;
                    return [...val];
                  });
                }}
                onUpdate={(v) => {
                  onUpdate((val: SplineInternalPoint[]) => {
                    val[index][0].value = props.convert(colord(v), {
                      // ...a.settings,
                      hasAlpha: false,
                      isString: true,
                      format: "hex",
                    });
                    return [...val.map(([pt, i]) => [{ ...pt }, i])];
                  });
                }}
                settings={v.settings}
              />
              <String
                displayValue={displayValue[index][0]}
                onChange={(v) => {
                  onChange((val: SplinePoint[]) => {
                    val[index][0] = v;
                    return [...val];
                  });
                }}
                onUpdate={(v) => {
                  onUpdate((val: SplineInternalPoint[]) => {
                    val[index][0].value = props.convert(colord(v), {
                      // ...a.settings,
                      hasAlpha: false,
                      isString: true,
                      format: "hex",
                    });
                    return [...val.map(([pt, i]) => [{ ...pt }, i])];
                  });
                }}
              />
            </PickerContainer>
            <RangeSlider
              onDrag={(v) => {
                onUpdate((val: SplineInternalPoint[]) => {
                  val[index][1] = v;
                  return [...val.map(([pt, i]) => [{ ...pt }, i])];
                });
              }}
              pad={0.01}
              initialValue={value[index][1]}
              min={0}
              max={1}
              step={0.01}
              value={value[index][1]}
            />
          </Row>
        </Row>
      ))}
    </Row>
  );
}

export const spline = createPlugin({
  component: ColorComponent,
  ...props,
});

export function Spline() {
  const controls = useControls("spline", {
    spline: spline({
      value: [
        ["#abcdef", 0],
        ["#000000", 0.5],
        ["#abcd10", 1.0],
      ],
    }),
  });
  return null;
}
