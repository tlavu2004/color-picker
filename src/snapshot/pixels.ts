export function pixelPosition(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, width: number, height: number) {
  if (rect.width <= 0 || rect.height <= 0 || width <= 0 || height <= 0) throw new Error('Image is not ready.');
  return {
    x: Math.max(0, Math.min(width - 1, Math.floor((clientX - rect.left) * width / rect.width))),
    y: Math.max(0, Math.min(height - 1, Math.floor((clientY - rect.top) * height / rect.height))),
  };
}

export function pixelHex(red: number, green: number, blue: number): string {
  return '#' + [red, green, blue].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}
