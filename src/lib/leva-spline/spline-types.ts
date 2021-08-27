import { InputWithSettings, LevaInputProps, ColorVectorInput } from 'leva/plugin'

export type Format = 'hex' | 'rgb' | 'hsl' | 'hsv'

export type Color = string | ColorVectorInput
export type InternalColorSettings = { format: Format; hasAlpha: boolean; isString: boolean }


export type SplinePoint = [string, number];
export type SplineInternalPoint = [{ value: string, settings: InternalColorSettings }, number];
export type Spline = SplinePoint[]
// export type InternalSplinePoint = { format: Format; hasAlpha: boolean; isString: boolean }

export type ColorInput = InputWithSettings<Color>
export type SplineInput = InputWithSettings<Spline>

export type ColorProps = LevaInputProps<Color, InternalColorSettings, string>
export type SplineProps = LevaInputProps<SplineInternalPoint[], {}, Spline>
