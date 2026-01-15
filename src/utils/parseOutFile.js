export async function parseOutFile(file) {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

  const headerIndex = lines.findIndex(l => l.startsWith("Time"));
  if (headerIndex === -1) return null;

  const headers = lines[headerIndex].trim().split(/\s+/);
  const units = lines[headerIndex + 1].trim().split(/\s+/);
  const dataLines = lines.slice(headerIndex + 2);

  const data = {};
  headers.forEach(h => (data[h] = []));

  for (const line of dataLines) {
    const values = line.trim().split(/\s+/);
    if (values.length !== headers.length) continue;

    headers.forEach((h, i) => {
      const v = parseFloat(values[i]);
      if (!isNaN(v)) data[h].push(v);
    });
  }

  return { headers, units, data };
}
