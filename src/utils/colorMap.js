const PALETTE = [
  "#2563eb", "#dc2626", "#16a34a", "#7c3aed",
  "#ea580c", "#0891b2", "#ca8a04", "#db2777",
  "#65a30d", "#0f766e", "#9333ea", "#be123c",
];

const fileColorMap = {};
let colorIndex = 0;

export function getFileColor(fileKey) {
  if (!fileColorMap[fileKey]) {
    fileColorMap[fileKey] = PALETTE[colorIndex % PALETTE.length];
    colorIndex++;
  }
  return fileColorMap[fileKey];
}
