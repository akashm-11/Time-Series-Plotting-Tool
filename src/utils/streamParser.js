// streamParser.js
export const textDecoder = new TextDecoder();

export async function* readLineStream(stream) {
  const reader = stream.getReader();
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? textDecoder.decode(chunk, { stream: true }) : "";

  let re = /\r?\n/g;
  let startIndex = 0;

  while (true) {
    let match = re.exec(chunk);
    if (!match) {
      if (readerDone) {
        if (startIndex < chunk.length) yield chunk.substring(startIndex);
        break;
      }
      const remaining = chunk.substring(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remaining + (chunk ? textDecoder.decode(chunk, { stream: true }) : "");
      startIndex = 0;
      re.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, match.index);
    startIndex = match.index + match[0].length;
  }
  reader.releaseLock();
}

// Largest Triangle Three Buckets (LTTB) downsample implementation
export function downsampleLTTB(x, y, threshold = 1000) {
  if (!x || !y || x.length !== y.length) return { x, y };
  const n = x.length;
  if (threshold >= n || threshold === 0) return { x, y };

  const data = x.map((xi, i) => ({ x: xi, y: y[i] }));
  const sampled = [];
  sampled.push(data[0]);

  const bucketSize = (n - 2) / (threshold - 2);
  let a = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const start = Math.floor(1 + i * bucketSize);
    const end = Math.floor(1 + (i + 1) * bucketSize);
    const bucket = data.slice(start, end || start + 1);

    const nextStart = Math.floor(1 + (i + 1) * bucketSize);
    const nextEnd = Math.floor(1 + (i + 2) * bucketSize);
    const nextBucket = data.slice(nextStart, nextEnd || nextStart + 1);

    const avgX = nextBucket.reduce((s, p) => s + p.x, 0) / (nextBucket.length || 1);
    const avgY = nextBucket.reduce((s, p) => s + p.y, 0) / (nextBucket.length || 1);

    let maxArea = -1;
    let maxPoint = bucket[0] || data[start];

    const pointA = data[a];

    for (const point of bucket) {
      const area = Math.abs(
        (pointA.x - avgX) * (point.y - pointA.y) - (pointA.x - point.x) * (avgY - pointA.y)
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxPoint = point;
      }
    }

    sampled.push(maxPoint);
    a = data.indexOf(maxPoint);
  }

  sampled.push(data[n - 1]);
  return {
    x: sampled.map((p) => p.x),
    y: sampled.map((p) => p.y),
  };
}
