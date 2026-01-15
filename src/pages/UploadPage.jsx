import React, { useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { LuCloudUpload } from "react-icons/lu";

export default function UploadPage({ setUploadedFiles }) {
  const navigate = useNavigate();

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const processFiles = (files) => {
    const outs = [...files].filter((f) =>
      f.name.toLowerCase().endsWith(".out")
    );
    if (outs.length === 0) return;

    setUploadedFiles((prev) => {
      const copy = { ...prev };
      outs.forEach((f) => {
        if (!copy[f.name]) copy[f.name] = [];
        const key = `${f.name}_${f.lastModified}`;
        if (
          !copy[f.name].some((ef) => `${ef.name}_${ef.lastModified}` === key)
        ) {
          copy[f.name].push(f);
        }
      });
      return copy;
    });

    navigate("/plot");
  };

  const onDrop = React.useCallback((acceptedFiles) => {
    processFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true, // IMPORTANT: disable auto click
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative bg-gradient-to-r from-black via-rose-950 to-black border-b border-rose-900">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center gap-4">
          {/* Icon */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl
                    bg-rose-600/20 border border-rose-500/40
                    shadow-[0_0_20px_rgba(244,63,94,0.35)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-7 h-7 text-rose-400"
            >
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 3 3 5-6" />
            </svg>
          </div>

          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight
                   bg-clip-text text-transparent
                   bg-gradient-to-r from-rose-400 via-rose-300 to-rose-500"
          >
            Time Series Plotting Tool
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div
          {...getRootProps()}
          className={`
            max-w-3xl w-full
            border-2 border-dashed
            ${isDragActive ? "border-emerald-500" : "border-slate-700"}
            rounded-xl
            p-12
            bg-slate-900
            cursor-pointer
            hover:bg-slate-800
            flex flex-col items-center justify-center gap-6
          `}
        >
          {/* DROPZONE INPUT (drag & drop only) */}
          <input {...getInputProps()} />

          {/* FILE INPUT */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".out"
            hidden
            onChange={(e) => processFiles(e.target.files)}
          />

          {/* FOLDER INPUT */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            webkitdirectory="true"
            directory=""
            hidden
            onChange={(e) => processFiles(e.target.files)}
          />

          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
            <LuCloudUpload className="w-12 h-12 text-emerald-500" />
          </div>

          <h3 className="text-2xl font-semibold text-white">
            Click to upload or drag & drop
          </h3>

          <p className="text-slate-400 max-w-lg text-center">
            Drag folders or files here, or use the buttons below.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => folderInputRef.current.click()}
              className="px-6 py-4 rounded-2xl bg-rose-400 text-white"
            >
              Select Folder
            </button>

            <button
              onClick={() => fileInputRef.current.click()}
              className="px-6 py-4 rounded-2xl bg-slate-700 text-white"
            >
              Select Files
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
