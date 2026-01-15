import FileList from "./FileList";

export default function FileColumn({
  uploadedFiles,
  filteredFileKeys,
  activeFileKeys,
  toggleFile,
  fileSearch,
  setFileSearch,
}) {
  return (
    <div className="bg-slate-900 rounded p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Select Files</h3>
        <div className="text-xs text-slate-400">Click a file to activate</div>
      </div>

      <div className="mb-3">
        <input
          className="w-full px-2 py-2 rounded bg-slate-800 text-slate-300"
          placeholder="Search files (use * as wildcard)"
          value={fileSearch}
          onChange={(e) => setFileSearch(e.target.value)}
        />
      </div>

      <FileList
        uploadedFiles={uploadedFiles}
        filteredKeys={filteredFileKeys}
        activeFileKeys={activeFileKeys}
        toggleFile={toggleFile}
      />
    </div>
  );
}
