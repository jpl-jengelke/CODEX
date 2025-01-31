import * as types from "../constants/actionTypes";

export function setWindowDataBounds(id, bounds) {
    return { type: types.WINDOW_SET_DATA_BOUNDS, id, bounds };
}

export function setWindowDataBinSize(id, binSize) {
    return { type: types.WINDOW_SET_BIN_SIZE, id, binSize };
}

export function setWindowDataNeedsResetToDefault(id, needsResetToDefault) {
    return { type: types.WINDOW_SET_NEEDS_RESET_TO_DEFAULT, id, needsResetToDefault };
}

export function setWindowAxisLabels(id, axisLabels) {
    return { type: types.WINDOW_SET_AXIS_LABELS, id, axisLabels };
}

export function setWindowAxisFeature(id, axis, featureName) {
    return { type: types.WINDOW_SET_AXIS_FEATURE, id, axis, featureName };
}

export function setWindowFeatureInfo(id, featureInfo) {
    return { type: types.WINDOW_SET_FEATURE_INFO, id, featureInfo };
}

export function setWindowShowGridLines(id, showGridLines) {
    return { type: types.WINDOW_SHOW_GRID_LINES, id, showGridLines };
}

export function setWindowDataScale(id, scaleOptions) {
    return { type: types.WINDOW_SET_DATA_SCALE, id, scaleOptions };
}

export function setWindowDataMapType(id, mapType) {
    return { type: types.WINDOW_SET_DATA_MAP_TYPE, id, mapType };
}

export function setWindowDataTrendLineStyle(id, trendLineStyle) {
    return { type: types.WINDOW_SET_DATA_TREND_LINE_STYLE, id, trendLineStyle };
}

export function setWindowDataDotSize(id, dotSize) {
    return { type: types.WINDOW_SET_DATA_DOT_SIZE, id, dotSize };
}

export function setWindowDataDotOpacity(id, dotOpacity) {
    return { type: types.WINDOW_SET_DATA_DOT_OPACITY, id, dotOpacity };
}

export function setWindowDataDotShape(id, dotShape) {
    return { type: types.WINDOW_SET_DATA_DOT_SHAPE, id, dotShape };
}

export function setWindowNeedsAutoscale(id, needsAutoscale) {
    return { type: types.WINDOW_SET_NEEDS_AUTOSCALE, id, needsAutoscale };
}

export function setWindowNeedsPlotImage(id, needs) {
    return { type: types.WINDOW_SET_NEEDS_PLOT_IMAGE, id, needs };
}
