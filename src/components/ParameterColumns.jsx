import ParameterList from "./ParameterList";

export default function ParameterColumn({
  availableColumns,
  columnUnits,
  filteredAvailableColumns,
  selectedParams,
  toggleParam,
  paramSearch,
  setParamSearch,
}) {
  return (
    <div className="bg-slate-900 rounded p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Select Parameters</h3>
        <div className="text-xs text-slate-400">Click to add parameter</div>
      </div>

      <div className="mb-3">
        <input
          className="w-full px-2 py-2 rounded bg-slate-800 text-slate-300"
          placeholder="Search params (use * as wildcard)"
          value={paramSearch}
          onChange={(e) => setParamSearch(e.target.value)}
        />
      </div>

      <ParameterList
        params={availableColumns}
        unitsMap={columnUnits}
        filteredParams={filteredAvailableColumns}
        selectedParams={selectedParams}
        toggleParam={toggleParam}
      />
    </div>
  );
}
