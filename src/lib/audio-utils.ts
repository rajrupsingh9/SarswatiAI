/**
 * Converts Float32Array audio buffer to Int16Array (PCM16).
 */
export function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const buffer = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return buffer;
}

/**
 * Converts base64 PCM16 data to Float32Array for playback.
 */
export function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Buffer = new Int16Array(bytes.buffer);
  const float32Buffer = new Float32Array(int16Buffer.length);
  for (let i = 0; i < int16Buffer.length; i++) {
    float32Buffer[i] = int16Buffer[i] / 0x8000;
  }
  return float32Buffer;
}

/**
 * Encodes Int16Array to base64.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
