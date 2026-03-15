"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEraser, FaPalette, FaPencilAlt, FaDownload, FaTrash, FaUsers } from "react-icons/fa";
import socket from "../utils";
import getUserId from "../utils/helper";

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [color, setColor] = useState("#6366f1");
  const [size, setSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState("pencil"); // pencil or eraser
  const [userId, setUserId] = useState(null);
  const strokeBatch = useRef([]);

  useEffect(() => {
    const init = () => {
      const id = getUserId();
      setUserId(id);
    };
    init();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on container
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas(strokes);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    ctxRef.current = canvas.getContext("2d");
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";

    socket.on("connect", () => {
      console.log("Connected to WebSocket server.");
    });

    socket.on("load-drawing", (savedStrokes) => {
      setStrokes(savedStrokes);
      redrawCanvas(savedStrokes);
    });

    socket.on("draw", (dataBatch) => {
      setStrokes((prevStrokes) => [...prevStrokes, ...dataBatch]);
      dataBatch.forEach(draw);
    });

    socket.on("reset-user", ({ userId: resetUserId, updatedStrokes }) => {
      setStrokes(updatedStrokes);
      redrawCanvas(updatedStrokes);
    });

    socket.on("user-reset", ({ userId: resetUserId, message, toastType }) => {
      if (toastType === "success") {
        return toast.success(message, { position: "bottom-right" });
      }
      toast.info(message, { position: "bottom-right" });
    });

    return () => {
      socket.off("draw");
      socket.off("reset-user");
      socket.off("load-drawing");
      socket.off("user-reset");
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [strokes]);

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const redrawCanvas = (updatedStrokes) => {
    clearCanvas();
    updatedStrokes.forEach(draw);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    // Draw initial point
    const stroke = {
      x: offsetX,
      y: offsetY,
      color: tool === "eraser" ? "#ffffff" : color,
      size,
      userId
    };
    draw(stroke);
    strokeBatch.current.push(stroke);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (strokeBatch.current.length > 0) {
      socket.emit("draw", strokeBatch.current);
      strokeBatch.current = [];
    }
  };

  const draw = ({ x, y, color, size }) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current || !userId) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent ?? {};

    const stroke = {
      x,
      y,
      color: tool === "eraser" ? "#ffffff" : color,
      size,
      userId
    };
    strokeBatch.current.push(stroke);

    if (strokeBatch.current.length >= 5) {
      socket.emit("draw", strokeBatch.current);
      strokeBatch.current = [];
    }

    draw(stroke);
  };

  const handleReset = () => {
    const hasUserDrawn = strokes.some((stroke) => stroke.userId === userId);

    if (hasUserDrawn) {
      socket.emit("reset");
    } else {
      toast.error("You haven't contributed yet, so you can't reset.", {
        position: "bottom-right",
      });
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "masterpiece.png";
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Artwork downloaded! 🎨");
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 glass border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-float">
            <FaPencilAlt className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight"> DS Drawing Board</h1>
            <p className="text-xs text-slate-400 font-medium">Real-time collaboration</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <FaUsers className="text-slate-400 text-sm" />
            <span className="text-sm font-semibold text-slate-300">Live</span>
          </div>

          <button
            onClick={downloadDrawing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all transform active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 relative overflow-hidden">
        {/* Sidebar - Tools */}
        <aside className="w-20 glass border-r border-slate-800 flex flex-col items-center py-8 gap-6 z-10">
          <button
            onClick={() => setTool("pencil")}
            className={`p-4 rounded-2xl transition-all ${tool === "pencil" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
            title="Pencil"
          >
            <FaPencilAlt size={24} />
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`p-4 rounded-2xl transition-all ${tool === "eraser" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
            title="Eraser"
          >
            <FaEraser size={24} />
          </button>

          <div className="h-px w-8 bg-slate-800 my-2" />

          <button
            onClick={handleReset}
            className="p-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
            title="Clear My Strokes"
          >
            <FaTrash size={24} />
          </button>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] overflow-hidden p-8 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden relative group">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={handleMouseMove}
              onMouseLeave={stopDrawing}
            />
          </div>

          {/* Floating Property Bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-2xl flex items-center gap-10 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <FaPalette className="text-slate-400" />
                <div className="relative group">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                  />
                  <div className="absolute inset-0 rounded-lg ring-2 ring-slate-700 group-hover:ring-indigo-500 transition-all pointer-events-none" />
                </div>
              </div>

              <div className="hide-input-color-swatch flex gap-2">
                {["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#000000"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 border-transparent transition-all hover:scale-110 ${color === c ? "border-white scale-110" : "border-slate-800"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-400">Brush Size</span>
              <input
                type="range"
                min="1"
                max="50"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-40 accent-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-mono font-bold text-indigo-400 w-8">{size}px</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
