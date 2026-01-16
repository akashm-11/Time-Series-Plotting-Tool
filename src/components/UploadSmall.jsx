import React, { useRef } from "react";
import { LuCloudUpload } from "react-icons/lu";

/**
 * mergeFiles(files)
 * - receives a FileList or array and calls parent mergeFiles
 */
export default function UploadSmall({ mergeFiles }) {
  const folderRef = useRef(null);
  const fileRef = useRef(null);

  const process = (files) => {
    if (!files || files.length === 0) return;
    mergeFiles(files);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center">
          <LuCloudUpload className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-sm text-slate-300">
          Add .out files (folder or files)
        </div>
      </div>

      <div className="flex gap-2">
        <input
          ref={folderRef}
          type="file"
          multiple
          webkitdirectory="true"
          directory=""
          hidden
          onChange={(e) => process(e.target.files)}
        />
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".out"
          hidden
          onChange={(e) => process(e.target.files)}
        />

        <button
          onClick={() => folderRef.current.click()}
          className="px-3 py-1 rounded bg-rose-500 text-white text-xs"
        >
          Folder
        </button>
        <button
          onClick={() => fileRef.current.click()}
          className="px-3 py-1 rounded bg-slate-700 text-white text-xs"
        >
          Files
        </button>
      </div>
    </div>
  );
}
