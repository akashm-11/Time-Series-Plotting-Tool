import React from "react";

/**
 * Props:
 * - params: all available params (unused directly, but kept for compatibility)
 * - unitsMap: { param: unit }
 * - filteredParams: array of params to render
 * - selectedParams: array of selected params
 * - toggleParam(param) -> toggle selection (keeps your logic)
 */
export default function ParameterList({
  params,
  unitsMap,
  filteredParams,
  selectedParams,
  toggleParam,
}) {
  if (!params || params.length === 0) {
    return (
      <div className="text-slate-400">Select files to list parameters.</div>
    );
  }

  return (
    <div className="grid gap-3">
      {filteredParams.map((p) => {
        const isSelected = selectedParams.includes(p);
        return (
          <div
            key={p}
            onClick={() => toggleParam(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") toggleParam(p);
            }}
            className={`cursor-pointer rounded-md p-3 flex items-center justify-between transition
                        ${
                          isSelected
                            ? "bg-emerald-600/10 border-emerald-500"
                            : "bg-slate-800 hover:bg-slate-700"
                        }
                        border`}
          >
            <div className="flex flex-col">
              <span
                className={`font-mono text-sm truncate ${
                  isSelected ? "text-emerald-100" : "text-slate-100"
                }`}
              >
                {p}
              </span>
              {unitsMap[p] && (
                <span className="text-xs text-slate-400">{unitsMap[p]}</span>
              )}
            </div>

            <div className="ml-3">
              <svg
                className={`w-5 h-5 ${
                  isSelected ? "text-emerald-300" : "text-slate-400"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
