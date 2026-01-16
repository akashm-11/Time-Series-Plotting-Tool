import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import ChartStack from "../components/ChartStack";
import { readLineStream, downsampleLTTB } from "../utils/streamParser";
import Header from "../components/Header";
import FileColumn from "../components/FileColumn";
import ParameterColumn from "../components/ParameterColumns";
import UploadSmall from "../components/UploadSmall";
import { getFileColor } from "../utils/colorMap";

export default function PlotPage({ uploadedFiles, setUploadedFiles }) {
  const navigate = useNavigate();

  // state
  const [fileDataMap, setFileDataMap] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnUnits, setColumnUnits] = useState({});
  const [activeFileKeys, setActiveFileKeys] = useState([]);
  const [selectedParams, setSelectedParams] = useState([]);

  const [fileSearch, setFileSearch] = useState("");
  const [paramSearch, setParamSearch] = useState("");

  // left panel vertical splitter state (percent)
  const [leftTopPercent, setLeftTopPercent] = useState(60); // files:params split

  useEffect(() => {
    if (!uploadedFiles || Object.keys(uploadedFiles).length === 0) {
      // allow them to still stay but navigate them back if you wish:
      // navigate("/");
      // I'll allow staying so upload small on page can add files
    }
  }, [uploadedFiles, navigate]);

  // wildcard -> regexp helper (kept)
  const wildcardToRegExp = useCallback((pattern) => {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    let regexString;
    if (pattern.includes("*")) regexString = escaped.replace(/\*/g, ".*");
    else regexString = `.*${escaped}.*`;
    return new RegExp(regexString, "i");
  }, []);

  const filteredFileKeys = useMemo(() => {
    const keys = Object.keys(uploadedFiles || {});
    if (!fileSearch) return keys;
    try {
      const re = wildcardToRegExp(fileSearch);
      return keys.filter((k) => re.test(k));
    } catch {
      return keys;
    }
  }, [uploadedFiles, fileSearch, wildcardToRegExp]);

  const filteredAvailableColumns = useMemo(() => {
    if (!paramSearch) return availableColumns;
    try {
      const re = wildcardToRegExp(paramSearch);
      return availableColumns.filter((c) => re.test(c));
    } catch {
      return availableColumns;
    }
  }, [availableColumns, paramSearch, wildcardToRegExp]);

  // loadFile (kept, unchanged except we reference setUploadedFiles outside)
  const loadFile = useCallback(async (file, fileKey) => {
    const DOWNSAMPLE_THRESHOLD = 2000;
    let headers = [];
    let unitMap = {};
    const columnData = {};
    let headerLineNumber = -1;
    let unitLineNumber = -1;
    let lineCounter = 0;

    try {
      const stream = file.stream();
      const reader = readLineStream(stream);

      for await (const line of reader) {
        lineCounter++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (headerLineNumber === -1 && /\bTime\b/.test(trimmed)) {
          headerLineNumber = lineCounter;
          headers = trimmed.split(/\s+/);
          headers.forEach((h) => {
            columnData[h] = [];
          });
          continue;
        }

        if (
          headerLineNumber !== -1 &&
          unitLineNumber === -1 &&
          lineCounter === headerLineNumber + 1
        ) {
          unitLineNumber = lineCounter;
          const units = trimmed.split(/\s+/);
          headers.forEach((h, i) => {
            unitMap[h] = units[i] || "";
          });
          headers = headers.filter((h) => h !== "Time");
          continue;
        }

        if (unitLineNumber !== -1 && lineCounter > unitLineNumber) {
          const tokens = trimmed.split(/\s+/).map((v) => {
            const n = parseFloat(v);
            return isNaN(n) ? null : n;
          });
          if (tokens.length !== headers.length + 1) continue;
          const timeVal = tokens[0];
          if (timeVal === null || isNaN(timeVal)) continue;
          columnData["Time"].push(timeVal);
          headers.forEach((col, i) => {
            columnData[col].push(tokens[i + 1]);
          });
        }
      }

      const timeData = columnData["Time"] || [];
      if (timeData.length === 0) {
        console.warn("no data in file", file.name);
        return;
      }

      const downsampledData = {};
      headers.forEach((col) => {
        const y = columnData[col] || [];
        if (y.length > 0)
          downsampledData[col] = downsampleLTTB(
            timeData,
            y,
            DOWNSAMPLE_THRESHOLD
          );
      });

      const allHeaders = ["Time", ...headers];
      const newSource = file.webkitRelativePath
        ? `${file.webkitRelativePath}_${file.lastModified}`
        : `${file.name}_${file.lastModified}`;

      setFileDataMap((prev) => {
        const existing = prev[fileKey] || [];
        if (existing.some((v) => v.source === newSource)) return prev;
        return {
          ...prev,
          [fileKey]: [
            ...existing,
            {
              headers: allHeaders,
              units: unitMap,
              downsampledData,
              source: newSource,
            },
          ],
        };
      });

      setAvailableColumns((prev) => {
        const s = new Set(prev);
        headers.forEach((h) => s.add(h));
        return [...s];
      });

      setColumnUnits((prev) => ({ ...prev, ...unitMap }));
    } catch (err) {
      console.error("loadFile error", err);
    }
  }, []);

  // toggle file: load versions if activating
  const toggleFile = async (fileKey) => {
    if (activeFileKeys.includes(fileKey)) {
      setActiveFileKeys((p) => p.filter((k) => k !== fileKey));
      return;
    }
    setActiveFileKeys((p) => [...p, fileKey]);
    const versions = uploadedFiles[fileKey] || [];
    for (const f of versions) {
      await loadFile(f, fileKey);
    }
  };

  const toggleParam = (p) => {
    setSelectedParams((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // stacks building (unchanged)
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return h;
  }

  const stacks = useMemo(() => {
    const out = [];
    selectedParams.forEach((param) => {
      const traces = [];
      activeFileKeys.forEach((fileKey) => {
        const versions = fileDataMap[fileKey] || [];
        versions.forEach((v, idx) => {
          const ds = v.downsampledData[param];
          if (!ds || !ds.x || ds.x.length === 0) return;
          const data = ds.x.map((t, i) => ({
            time: Number(t),
            value: Number(ds.y[i]),
          }));
          const name = `${fileKey}${
            versions.length > 1 ? ` (${idx + 1})` : ""
          }`;
          const color = getFileColor(fileKey);
          const id = `${fileKey}__${idx}__${param}`;
          traces.push({ id, name, color, data, visible: true });
        });
      });
      out.push({ param, traces });
    });
    return out;
  }, [selectedParams, activeFileKeys, fileDataMap]);

  const [visibleMap, setVisibleMap] = useState({});
  const visibleStacks = useMemo(
    () =>
      stacks.map((s) => ({
        param: s.param,
        traces: s.traces.map((t) => ({
          ...t,
          visible: visibleMap.hasOwnProperty(t.id) ? visibleMap[t.id] : true,
        })),
      })),
    [stacks, visibleMap]
  );

  const onLegendToggle = (id, visible) => {
    setVisibleMap((p) => ({ ...p, [id]: visible }));
  };

  // UI: left vertical splitter dragging for files/params
  const leftDraggingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => {
      if (!leftDraggingRef.current) return;
      const container = document.getElementById("left-panel");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      const percent = Math.max(
        20,
        Math.min(80, ((y - rect.top) / rect.height) * 100)
      );
      setLeftTopPercent(percent);
    };
    const onUp = () => (leftDraggingRef.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // called from UploadSmall to merge new files
  const mergeFiles = (files) => {
    const outs = [...files].filter((f) =>
      f.name.toLowerCase().endsWith(".out")
    );
    if (outs.length === 0) return;

    setUploadedFiles((prev) => {
      const copy = { ...prev };
      outs.forEach((f) => {
        if (!copy[f.name]) copy[f.name] = [];
        const key = `${f.name}_${f.lastModified}`;
        if (
          !copy[f.name].some((ef) => `${ef.name}_${ef.lastModified}` === key)
        ) {
          copy[f.name].push(f);
        }
      });
      return copy;
    });
    // optionally auto-load newly selected file(s) — keep passive for now
  };

  // expose "apply range to all" from ChartStack -> we will forward this to ChartStack via prop
  const chartRangeRef = useRef(null); // not used here, ChartStack manages internal refs

  return (
    <div className="min-h-screen">
      <Header />

      <div className="p-4 flex gap-4" style={{ height: "calc(100vh - 64px)" }}>
        {/* LEFT: narrow side (files + params stacked vertically with draggable horizontal splitter) */}
        <div
          id="left-panel"
          className="w-80 bg-slate-900 rounded-md p-2 flex flex-col"
          style={{ minWidth: 260 }}
        >
          {/* small upload controls */}
          <div className="mb-2">
            <UploadSmall mergeFiles={mergeFiles} />
          </div>

          {/* Files area (resizable height) */}
          <div
            className="overflow-auto bg-slate-800 rounded p-2"
            style={{ height: `${leftTopPercent}%` }}
          >
            <FileColumn
              uploadedFiles={uploadedFiles}
              filteredFileKeys={filteredFileKeys}
              activeFileKeys={activeFileKeys}
              toggleFile={toggleFile}
              fileSearch={fileSearch}
              setFileSearch={setFileSearch}
            />
          </div>

          {/* draggable splitter */}
          <div
            onMouseDown={() => (leftDraggingRef.current = true)}
            onTouchStart={() => (leftDraggingRef.current = true)}
            className="h-2 my-2 bg-slate-700 cursor-row-resize rounded"
            title="Drag to resize Files / Parameters"
          />

          {/* Parameters area */}
          <div
            className="overflow-auto bg-slate-800 rounded p-2"
            style={{ height: `${100 - leftTopPercent - 4}%` }}
          >
            <ParameterColumn
              availableColumns={availableColumns}
              columnUnits={columnUnits}
              filteredAvailableColumns={filteredAvailableColumns}
              selectedParams={selectedParams}
              toggleParam={toggleParam}
              paramSearch={paramSearch}
              setParamSearch={setParamSearch}
            />
          </div>
        </div>

        {/* RIGHT: charts area */}
        <div className="flex-1 bg-transparent rounded p-0 h-full overflow-auto">
          {selectedParams.length === 0 ? (
            <div className="bg-white text-slate-900 rounded p-6 m-6">
              <h2 className="text-lg font-semibold">Start Plotting</h2>
              <ol className="text-sm text-slate-600 mt-2">
                <li>1. Upload files on this page (or Upload page).</li>
                <li>2. Select files on the left.</li>
                <li>3. Pick parameters below the files panel.</li>
              </ol>
            </div>
          ) : (
            <ChartStack
              stacks={visibleStacks}
              onLegendToggle={onLegendToggle}
              // allow ChartStack to access uploadedFiles if needed
              uploadedFiles={uploadedFiles}
            />
          )}
        </div>
      </div>
    </div>
  );
}
