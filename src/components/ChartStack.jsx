import React, { useRef } from "react";
import ChartCard from "./ChartCard";

/**
 * ChartStack
 * - stacks: [{ param, traces: [{id,name,color,data,visible}...] }]
 *
 * ChartCard handles its own ChartJS instance and exposes functions via refs
 * ChartStack keeps a map of refs so we can "apply range to all"
 */

export default function ChartStack({ stacks, onLegendToggle }) {
  // map param -> ref
  const chartRefs = useRef({});

  // when a ChartCard calls applyToAll, we iterate other refs and set their x range
  const applyRangeToAll = (fromParam, min, max) => {
    Object.entries(chartRefs.current).forEach(([param, ref]) => {
      if (!ref || param === fromParam) return;
      try {
        ref.applyRange(min, max);
      } catch (err) {
        // ignore
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      {stacks.map((s) => (
        <div key={s.param} className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">{s.param}</div>
            <div className="text-sm text-slate-500">
              traces: {s.traces.length}
            </div>
          </div>

          <ChartCard
            ref={(r) => {
              if (r) chartRefs.current[s.param] = r;
              else delete chartRefs.current[s.param];
            }}
            param={s.param}
            traces={s.traces}
            onLegendToggle={onLegendToggle}
            applyRangeToAll={(min, max) => applyRangeToAll(s.param, min, max)}
          />
        </div>
      ))}
    </div>
  );
}
