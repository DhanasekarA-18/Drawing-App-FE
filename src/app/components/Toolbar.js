export default function Toolbar({
  color,
  setColor,
  size,
  setSize,
  isErasing,
  setIsErasing,
  handleReset,
}) {
  return (
    <div className="fixed bottom-6 flex flex-wrap gap-4 items-center justify-center p-4 bg-white shadow-lg rounded-lg">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="range"
        min="1"
        max="20"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="w-24"
      />
      <button
        onClick={() => setIsErasing(!isErasing)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        {isErasing ? "Disable Eraser" : "Enable Eraser"}
      </button>
      <button
        onClick={handleReset}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Reset
      </button>
    </div>
  );
}
