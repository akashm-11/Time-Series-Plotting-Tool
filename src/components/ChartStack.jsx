import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

export default function ChartStack({ stacks, onLegendToggle }) {
  const containerRef = useRef(null);
  const chartsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // clear previous children and charts
    chartsRef.current.forEach((c) => {
      try {
        c.remove();
      } catch (e) {}
    });
    chartsRef.current = [];
    while (container.firstChild) container.removeChild(container.firstChild);

    // create a stacked chart per stack.param
    stacks.forEach((stack, idx) => {
      // wrapper card (white)
      const wrapper = document.createElement("div");
      wrapper.style.background = "#ffffff";
      wrapper.style.border = "1px solid #e6e6e6";
      wrapper.style.borderRadius = "8px";
      wrapper.style.padding = "12px";
      wrapper.style.marginBottom = "12px";
      wrapper.style.boxSizing = "border-box";
      container.appendChild(wrapper);

      // title row
      const title = document.createElement("div");
      title.style.display = "flex";
      title.style.justifyContent = "space-between";
      title.style.alignItems = "center";
      title.style.marginBottom = "8px";
      const titleLeft = document.createElement("div");
      titleLeft.textContent = stack.param;
      titleLeft.style.fontWeight = "600";
      titleLeft.style.color = "#0f172a";
      titleLeft.style.fontSize = "14px";
      title.appendChild(titleLeft);
      wrapper.appendChild(title);

      // chart div
      const chartDiv = document.createElement("div");
      chartDiv.style.width = "100%";
      chartDiv.style.height = idx === 0 ? "360px" : "260px";
      wrapper.appendChild(chartDiv);

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
        timeScale: { borderColor: "#e6e6e6", timeVisible: true },
      });

      // Add traces for this stack
      stack.traces.forEach((t) => {
        const series = chart.addSeries(LineSeries, {
          color: t.color,
          lineWidth: 2,
        });
        series.setData(t.data);
        series.applyOptions({ visible: t.visible !== false });
        // chart._seriesForId = chart._seriesForId || {};
        // chart._seriesForId[t.id] = series;
      });

      const unsub = chart
        .timeScale()
        .subscribeVisibleTimeRangeChange((newRange) => {
          if (!newRange) return;
          chartsRef.current.forEach((otherChart) => {
            if (otherChart && otherChart !== chart) {
              try {
                otherChart.timeScale().setVisibleRange(newRange);
              } catch (e) {
                /* ignore */
              }
            }
          });
        });

      chart._unsub = unsub;
      chartsRef.current.push(chart);
    });

    // responsiveness
    const ro = new ResizeObserver(() => {
      chartsRef.current.forEach((c) => {
        try {
          c.applyOptions({ width: container.clientWidth - 24 });
        } catch (e) {}
      });
    });
    ro.observe(container);

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
  }, [stacks]);

  // simple legend below (click toggles)
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
