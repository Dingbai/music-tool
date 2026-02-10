// pitchService.ts
export const detectPitchYIN = (buffer: Float32Array, sampleRate: number): number | null => {
  const threshold = 0.15;
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(halfBufferSize);

  for (let tau = 0; tau < halfBufferSize; tau++) {
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  let tau = -1;
  for (let t = 1; t < halfBufferSize; t++) {
    if (yinBuffer[t] < threshold) {
      while (t + 1 < halfBufferSize && yinBuffer[t + 1] < yinBuffer[t]) t++;
      tau = t;
      break;
    }
  }

  return tau === -1 ? null : sampleRate / tau;
};

export const freqToMidi = (f: number) => Math.round(12 * (Math.log(f / 440) / Math.log(2))) + 69;

export const midiToNoteName = (midi: number) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
};