import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

/**
 * ChartCard
 * props: { param, traces, onLegendToggle, applyRangeToAll(min,max) }
 *
 * Exposes method applyRange(min,max) and resetZoom()
 */
const ChartCard = forwardRef(
  ({ param, traces, onLegendToggle, applyRangeToAll }, ref) => {
    const chartRef = useRef(null);
    const containerRef = useRef(null);
    const [linked, setLinked] = useState(false);

    // expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      applyRange: (min, max) => {
        const chart = chartRef.current;
        if (!chart) return;
        try {
          chart.options.scales.x.min = min;
          chart.options.scales.x.max = max;
          chart.update();
        } catch (err) {
          // ignore
        }
      },
      resetZoom: () => {
        chartRef.current?.resetZoom?.();
      },
    }));

    const datasets = traces.map((t) => ({
      label: t.name,
      data: t.data.map((p) => ({ x: p.time, y: p.value })),
      borderColor: t.color,
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.2,
      hidden: !t.visible,
    }));

    const data = { datasets };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          onClick: (e, legendItem, legend) => {
            const ci = legend.chart;
            const datasetIndex = legendItem.datasetIndex;
            const meta = ci.getDatasetMeta(datasetIndex);
            const id = traces[datasetIndex]?.id;
            const currentlyHidden = meta.hidden;
            meta.hidden = !meta.hidden;
            ci.update();
            if (onLegendToggle && id) onLegendToggle(id, !currentlyHidden);
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              // ctx.parsed.x or ctx.raw.x depending on chartjs version
              const xVal = ctx.raw?.x ?? ctx.parsed?.x;
              const yVal = ctx.raw?.y ?? ctx.parsed?.y;
              return `X: ${Number(xVal).toFixed(2)} s, Y: ${Number(
                yVal
              ).toFixed(2)}`;
            },
          },
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Time (s)",
          },
          ticks: {
            maxTicksLimit: 10,
          },
          // min/max can be set programmatically
        },
        y: {
          title: {
            display: true,
            text: param,
          },
        },
      },
    };

    // toolbar actions
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [measurePoints, setMeasurePoints] = useState([]);
    const onFullscreen = async () => {
      if (!containerRef.current) return;
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          containerRef.current.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn("fullscreen failed", err);
      }
    };

    const onExitFullscreen = async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    };

    useEffect(() => {
      const handler = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
      };
      document.addEventListener("fullscreenchange", handler);
      return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const onResetZoom = () => {
      chartRef.current?.resetZoom?.();
    };

    const onApplyRangeToAll = () => {
      // get current scale min/max
      const chart = chartRef.current;
      if (!chart) return;
      const scale = chart.scales?.x;
      const min = scale?.min ?? null;
      const max = scale?.max ?? null;
      if (min == null || max == null) return;
      applyRangeToAll(min, max);
    };

    const onDownloadImage = () => {
      const chart = chartRef.current;
      if (!chart) return;

      // TARGET RESOLUTION (FHD+)
      const TARGET_WIDTH = 1920;
      const TARGET_HEIGHT = 1080;
      const TARGET_DPR = 2; // ultra crisp

      // save original values
      const originalWidth = chart.width;
      const originalHeight = chart.height;
      const originalDPR =
        chart.options.devicePixelRatio || window.devicePixelRatio;

      // force high-res
      chart.options.devicePixelRatio = TARGET_DPR;
      chart.resize(TARGET_WIDTH, TARGET_HEIGHT);

      // redraw
      chart.update("none");

      // export
      const url = chart.toBase64Image("image/png", 1);

      // download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${param.replace(/\s+/g, "_")}_FHD.png`;
      a.click();

      // restore
      chart.options.devicePixelRatio = originalDPR;
      chart.resize(originalWidth, originalHeight);
      chart.update("none");
    };

    const whiteBackgroundPlugin = {
      id: "whiteBackground",
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    };
    ChartJS.register(whiteBackgroundPlugin);

    const onChartClick = (evt) => {
      const chart = chartRef.current;
      if (!chart) return;
      console.log(evt.nativeEvent);

      // Ctrl (Windows/Linux) or Cmd (Mac)
      if (!(evt.nativeEvent.ctrlKey || evt.native.metaKey)) return;

      const canvasPosition = ChartJS.helpers.getRelativePosition(
        evt.native,
        chart
      );

      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      const xValue = xScale.getValueForPixel(canvasPosition.x);
      const yValue = yScale.getValueForPixel(canvasPosition.y);

      setMeasurePoints((prev) => {
        if (prev.length === 2) return [{ x: xValue, y: yValue }];
        return [...prev, { x: xValue, y: yValue }];
      });
    };

    const measurementPlugin = {
      id: "measurementPlugin",
      afterDraw: (chart) => {
        const points = chart.$measurePoints;
        if (!points || points.length < 2) return;

        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        const p1 = points[0];
        const p2 = points[1];

        const x1 = xScale.getPixelForValue(p1.x);
        const y1 = yScale.getPixelForValue(p1.y);
        const x2 = xScale.getPixelForValue(p2.x);
        const y2 = yScale.getPixelForValue(p2.y);

        ctx.save();
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        // line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // points
        ctx.setLineDash([]);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      },
    };
    ChartJS.register(measurementPlugin);
    if (chartRef.current) {
      chartRef.current.$measurePoints = measurePoints;
    }

    return (
      <div ref={containerRef} className="relative h-[360px] bg-white">
        <div className="absolute right-2 top-2 z-10 flex gap-2">
          {!isFullscreen ? (
            <button
              onClick={onFullscreen}
              className="px-2 py-1 text-xs bg-slate-200 rounded shadow"
            >
              Full
            </button>
          ) : (
            <button
              onClick={onExitFullscreen}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded shadow"
            >
              Exit
            </button>
          )}

          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs bg-slate-200 rounded shadow"
            title="Reset zoom"
          >
            Reset
          </button>
          <button
            onClick={onApplyRangeToAll}
            className="px-2 py-1 text-xs bg-slate-200 rounded shadow"
            title="Apply current X range to all charts"
          >
            Apply→All
          </button>
          <button
            onClick={onDownloadImage}
            className="px-2 py-1 text-xs bg-emerald-500 text-white rounded shadow"
          >
            Download
          </button>
        </div>

        {measurePoints.length === 2 &&
          (() => {
            const [p1, p2] = measurePoints;
            const dt = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const slope = dy / dt;

            const text = `Δt=${dt.toFixed(3)} s, Δy=${dy.toFixed(
              3
            )}, slope=${slope.toFixed(3)}`;

            return (
              <div className="absolute left-2 bottom-2 z-10 bg-white border rounded shadow px-3 py-2 text-xs">
                <div className="font-semibold mb-1">Measurement</div>
                <div>{text}</div>

                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(text)}
                    className="text-blue-600 underline"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setMeasurePoints([])}
                    className="text-red-600 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })()}

        <div className="h-full pt-8">
          <Line
            ref={chartRef}
            data={data}
            options={options}
            onClick={onChartClick}
          />
        </div>
      </div>
    );
  }
);

export default ChartCard;
