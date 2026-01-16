import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
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

export default function ChartStack({ stacks }) {
  return (
    <div className="space-y-6">
      {stacks.map((stack) => {
        const datasets = stack.traces.map((t) => ({
          label: t.name,
          data: t.data.map((p) => ({
            x: p.time, // REAL seconds
            y: p.value,
          })),
          borderColor: t.color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
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
            },
            tooltip: {
              callbacks: {
                label(ctx) {
                  return `X: ${ctx.parsed.x.toFixed(
                    2
                  )} s, Y: ${ctx.parsed.y.toFixed(2)}`;
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
            },
            y: {
              title: {
                display: true,
                text: stack.param,
              },
            },
          },
        };

        return (
          <div
            key={stack.param}
            className="bg-white border rounded-lg p-4 h-[320px]"
          >
            <div className="text-center font-semibold mb-2">{stack.param}</div>
            <Line data={data} options={options} />
          </div>
        );
      })}
    </div>
  );
}
