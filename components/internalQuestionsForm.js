export function splitLinesToParts(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function partsToTextarea(parts) {
  return Array.isArray(parts) ? parts.join('\n') : '';
}
