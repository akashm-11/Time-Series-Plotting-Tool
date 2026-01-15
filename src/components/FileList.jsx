import React from "react";

/**
 * Props:
 * - uploadedFiles: { filename: [File,...] }
 * - filteredKeys: [filename,...]
 * - activeFileKeys: [filename,...]  // which keys are "selected"
 * - toggleFile(fileKey)             // function to toggle selection (keeps your logic)
 */
export default function FileList({
  uploadedFiles,
  filteredKeys,
  activeFileKeys,
  toggleFile,
}) {
  return (
    <div className="space-y-3">
      {filteredKeys.length === 0 && (
        <div className="text-slate-400 text-sm">No files uploaded yet.</div>
      )}

      {filteredKeys.map((key) => {
        const isActive = activeFileKeys.includes(key);
        return (
          <div
            key={key}
            onClick={() => toggleFile(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") toggleFile(key);
            }}
            className={`cursor-pointer select-none transition
               ${
                 isActive
                   ? "bg-rose-600/15 border-rose-500"
                   : "bg-slate-800/50 hover:bg-slate-800"
               }
               border rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {/* nice file icon */}
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  isActive ? "bg-rose-600/30" : "bg-slate-700"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isActive ? "text-rose-300" : "text-slate-300"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>
              </div>
              <div className="text-left">
                <div
                  className={`text-sm font-medium truncate ${
                    isActive ? "text-rose-200" : "text-slate-100"
                  }`}
                >
                  {key}
                </div>
                <div className="text-xs text-slate-400">
                  {uploadedFiles[key]?.length > 1
                    ? `${uploadedFiles[key].length} versions`
                    : "1 file"}
                </div>
              </div>
            </div>

            {/* right-side quick info */}
            <div className="text-xs">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isActive
                    ? "text-rose-100 bg-rose-600/30"
                    : "text-slate-300 bg-slate-700/30"
                }`}
              >
                {uploadedFiles[key]?.length > 1
                  ? `${uploadedFiles[key].length}`
                  : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
