export default function DropZone({ onFiles }) {
  return (
    <label className="cursor-pointer border-2 border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition">
      <input
        type="file"
        multiple
        webkitdirectory="true"
        className="hidden"
        onChange={(e) => {
          const outFiles = [...e.target.files].filter((f) =>
            f.name.toLowerCase().endsWith(".out")
          );
          onFiles(outFiles);
        }}
      />
      <span className="text-slate-300">
        Drag folder or select <span className="text-blue-400">.out</span> files
      </span>
    </label>
  );
}
