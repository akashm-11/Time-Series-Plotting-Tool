import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

function niceStep(x) {
  // Round x to a "nice" step: 1,2,5,10,15,30,60,100,200...
  if (x <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(x)));
  const d = x / pow;
  if (d <= 1) return 1 * pow;
  if (d <= 2) return 2 * pow;
  if (d <= 5) return 5 * pow;
  return 10 * pow;
}

export default function ChartStack({ stacks, onLegendToggle }) {
  const containerRef = useRef(null);
  const chartsRef = useRef([]);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    // cleanup previous
    chartsRef.current.forEach((c) => {
      try {
        c._unsub && c._unsub();
      } catch (e) {}
      try {
        c.remove();
      } catch (e) {}
    });
    chartsRef.current = [];
    while (parent.firstChild) parent.removeChild(parent.firstChild);

    stacks.forEach((stack, idx) => {
      // wrapper card for each chart (white)
      const wrapper = document.createElement("div");
      wrapper.style.background = "#ffffff";
      wrapper.style.border = "1px solid #e6e6e6";
      wrapper.style.borderRadius = "8px";
      wrapper.style.padding = "12px";
      wrapper.style.marginBottom = "12px";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.position = "relative";
      parent.appendChild(wrapper);

      // title (centered)
      const titleRow = document.createElement("div");
      titleRow.style.display = "flex";
      titleRow.style.justifyContent = "center";
      titleRow.style.alignItems = "center";
      titleRow.style.marginBottom = "8px";
      const title = document.createElement("div");
      title.textContent = `${stack.param}${
        stack.unit ? ` (${stack.unit})` : ""
      }`;
      title.style.fontWeight = "700";
      title.style.color = "#0f172a";
      title.style.fontSize = "14px";
      titleRow.appendChild(title);
      wrapper.appendChild(titleRow);

      // chart container
      const chartDiv = document.createElement("div");
      chartDiv.style.width = "100%";
      chartDiv.style.height = idx === 0 ? "360px" : "260px";
      chartDiv.style.position = "relative";
      wrapper.appendChild(chartDiv);

      // x-axis label row
      const xLabelRow = document.createElement("div");
      xLabelRow.style.display = "flex";
      xLabelRow.style.justifyContent = "center";
      xLabelRow.style.alignItems = "center";
      xLabelRow.style.marginTop = "6px";
      const xLabel = document.createElement("div");
      xLabel.textContent = "Time (s)";
      xLabel.style.color = "#334155";
      xLabel.style.fontSize = "12px";
      xLabelRow.appendChild(xLabel);
      wrapper.appendChild(xLabelRow);

      // small centered tooltip element below chart for showing formatted time on hover
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.left = "50%";
      tooltip.style.transform = "translateX(-50%)";
      tooltip.style.bottom = "6px";
      tooltip.style.padding = "6px 10px";
      tooltip.style.borderRadius = "6px";
      tooltip.style.background = "rgba(15,23,42,0.95)";
      tooltip.style.color = "white";
      tooltip.style.fontSize = "12px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.opacity = "0";
      tooltip.style.transition = "opacity 120ms ease";
      wrapper.appendChild(tooltip);

      // create chart with white background and numeric time axis
      const chart = createChart(chartDiv, {
        width: chartDiv.clientWidth,
        height: chartDiv.clientHeight,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#0f172a",
        },
        grid: {
          vertLines: { color: "#f1f5f9" },
          horzLines: { color: "#f1f5f9" },
        },
        rightPriceScale: { borderColor: "#e6e6e6" },
        timeScale: {
          borderColor: "#e6e6e6",
          timeVisible: true,
          secondsVisible: true,
        },
        crosshair: { mode: 1 },
      });

      // add traces using v4+ API
      stack.traces.forEach((t) => {
        try {
          const series = chart.addSeries(LineSeries, {
            color: t.color,
            lineWidth: 2,
          });
          series.setData(t.data || []);
          series.applyOptions({ visible: t.visible !== false });
          // store series reference
          chart._seriesForId = chart._seriesForId || {};
          chart._seriesForId[t.id] = series;
        } catch (e) {
          // do not break whole chart if one trace fails
          // console.error("add series failed", e);
        }
      });

      // compute global visible range for this stack (min/max times across traces)
      const computeRange = (traces) => {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        traces.forEach((t) => {
          if (!t.data || t.data.length === 0) return;
          // data should be sorted; but compute robustly
          for (let i = 0; i < t.data.length; i++) {
            const tv = Number(t.data[i].time);
            if (!isFinite(tv)) continue;
            if (tv < min) min = tv;
            if (tv > max) max = tv;
          }
        });
        if (
          min === Number.POSITIVE_INFINITY ||
          max === Number.NEGATIVE_INFINITY
        )
          return null;
        if (min === max) {
          const delta = Math.max(1, Math.abs(min) * 0.001);
          return { from: min - delta, to: max + delta };
        }
        return { from: min, to: max };
      };

      // compute and set full visible range (force fully zoomed out)
      const fullRange = computeRange(stack.traces);
      if (fullRange) {
        try {
          chart.timeScale().setVisibleRange(fullRange);
        } catch (err) {
          try {
            chart.timeScale().fitContent();
          } catch (e) {}
        }
      } else {
        try {
          chart.timeScale().fitContent();
        } catch (e) {}
      }

      // now set a dynamic tickMarkFormatter that rounds ticks to "nice" multiples
      chart.timeScale().applyOptions({
        tickMarkFormatter: (t) => {
          // t is numeric time in seconds (or business-day-like), try to treat as number
          const val = Number(t);
          if (!isFinite(val)) return String(t);

          // compute current visible range
          const vr = chart.timeScale().getVisibleRange();
          if (!vr || vr.from == null || vr.to == null) {
            return String(Math.round(val));
          }

          const from = Number(vr.from);
          const to = Number(vr.to);
          const span = Math.max(1, to - from);
          // target ~ 6-9 ticks
          const rawStep = span / 8;
          const step = niceStep(rawStep);
          // round the tick value to nearest multiple of step
          const nearest = Math.round(val / step) * step;
          // display integers if step >=1 else show with 2 decimals
          if (step >= 1) return String(Math.round(nearest));
          // small step case
          return nearest.toFixed(2);
        },
      });

      // crosshair move: show formatted time in tooltip
      const unsubCross = chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || !param.point) {
          tooltip.style.opacity = "0";
          return;
        }
        // param.time may be a number or string - convert to number when possible
        const timeVal = Number(param.time);
        const vr = chart.timeScale().getVisibleRange();
        // Format as integer seconds if span large enough, otherwise show decimals
        let disp;
        if (vr && vr.to != null && vr.from != null) {
          const span = Number(vr.to) - Number(vr.from);
          if (Math.abs(span) >= 8) {
            disp = String(Math.round(timeVal)) + " s";
          } else if (Math.abs(span) >= 1) {
            disp = timeVal.toFixed(2) + " s";
          } else {
            // very dense; show milliseconds-ish
            disp = timeVal.toFixed(3) + " s";
          }
        } else {
          disp = isFinite(timeVal)
            ? String(Math.round(timeVal)) + " s"
            : String(param.time);
        }

        tooltip.textContent = disp;
        tooltip.style.opacity = "1";
      });

      // sync visible range across charts on user zoom/pan
      const unsubVisible = chart
        .timeScale()
        .subscribeVisibleTimeRangeChange((newRange) => {
          if (!newRange) return;
          chartsRef.current.forEach((other) => {
            if (!other || other === chart) return;
            try {
              other.timeScale().setVisibleRange(newRange);
            } catch (e) {}
          });
        });

      chart._unsub = () => {
        try {
          unsubCross();
        } catch (e) {}
        try {
          unsubVisible();
        } catch (e) {}
      };

      chartsRef.current.push(chart);
    });

    // responsiveness
    const ro = new ResizeObserver(() => {
      chartsRef.current.forEach((c) => {
        try {
          c.applyOptions({ width: parent.clientWidth - 24 });
        } catch (e) {}
      });
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
      chartsRef.current.forEach((c) => {
        try {
          c._unsub && c._unsub();
        } catch (e) {}
        try {
          c.remove();
        } catch (e) {}
      });
      chartsRef.current = [];
    };
  }, [stacks, onLegendToggle]);

  // simple legend beneath the charts (keeps previous UI)
  return (
    <div>
      <div ref={containerRef} />
      <div className="mt-3 flex flex-wrap gap-2">
        {stacks
          .flatMap((s) => s.traces)
          .map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded border"
            >
              <input
                type="checkbox"
                checked={t.visible !== false}
                onChange={(e) => onLegendToggle(t.id, e.target.checked)}
              />
              <span
                className="inline-block w-3 h-2 rounded-sm"
                style={{ background: t.color }}
              />
              <span className="text-xs text-slate-800">{t.name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
