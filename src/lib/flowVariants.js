/** Mermaid classDef palette — neutral / action / success / risk */
export const FLOW_CLASSES = {
  neutral: {
    fill: '#F1EFE8',
    stroke: '#5F5E5A',
    text: '#2C2C2A',
    muted: '#5F5E5A',
  },
  action: {
    fill: '#EEEDFE',
    stroke: '#534AB7',
    text: '#26215C',
    muted: '#534AB7',
  },
  success: {
    fill: '#EAF3DE',
    stroke: '#3B6D11',
    text: '#173404',
    muted: '#3B6D11',
  },
  risk: {
    fill: '#FAECE7',
    stroke: '#993C1D',
    text: '#4A1B0C',
    muted: '#993C1D',
  },
};

export const FLOW_CLASS_IDS = Object.keys(FLOW_CLASSES);

export function resolveFlowClass(value) {
  const key = (value || '').toLowerCase();
  return FLOW_CLASSES[key] ? key : null;
}

export function flowClassStyles(flowClass, { selected = false } = {}) {
  const palette = FLOW_CLASSES[flowClass];
  if (!palette) return null;
  return {
    backgroundColor: palette.fill,
    borderColor: palette.stroke,
    color: palette.text,
    boxShadow: selected
      ? `0 0 0 2px ${palette.stroke}44, 0 2px 6px ${palette.stroke}22`
      : `0 1px 3px ${palette.stroke}18`,
  };
}

export function customFlowStyles(customStyle, { selected = false } = {}) {
  if (!customStyle?.fill) return null;
  const stroke = customStyle.stroke || customStyle.fill;
  return {
    backgroundColor: customStyle.fill,
    borderColor: stroke,
    color: customStyle.text || '#2C2C2A',
    boxShadow: selected
      ? `0 0 0 2px ${stroke}44, 0 2px 6px ${stroke}22`
      : `0 1px 3px ${stroke}18`,
  };
}
