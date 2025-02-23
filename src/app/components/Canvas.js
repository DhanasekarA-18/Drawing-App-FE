"use client";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../utils";

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.7;
    ctxRef.current = canvas.getContext("2d");

    // Store socket ID when connected
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("load-drawing", (savedStrokes) => {
      setStrokes(savedStrokes);
      redrawCanvas(savedStrokes);
    });

    socket.on("draw", (data) => {
      setStrokes((prevStrokes) => [...prevStrokes, data]);
      draw(data);
    });

    socket.on("reset-user", ({ socketId, updatedStrokes }) => {
      if (socketId === socketId) {
        setStrokes((prevStrokes) =>
          prevStrokes.filter((stroke) => stroke.socketId !== socketId)
        );
      } else {
        setStrokes(updatedStrokes);
      }
      redrawCanvas(updatedStrokes);
    });

    socket.on("user-reset", ({ id, message }) => {
      if (id === socketId) {
        toast.success(message, { position: "top-right" });
      } else {
        toast.info(message, { position: "top-right" });
      }
    });

    return () => {
      socket.off("draw");
      socket.off("reset-user");
      socket.off("load-drawing");
      socket.off("user-reset");
    };
  }, []);

  const redrawCanvas = (updatedStrokes) => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    updatedStrokes.forEach(draw);
  };

  const startDrawing = () => setIsDrawing(true);
  const stopDrawing = () => setIsDrawing(false);

  const draw = ({ x, y, color, size }) => {
    const ctx = ctxRef.current;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent ?? {};
    const stroke = {
      x,
      y,
      color,
      size,
      socketId,
    };

    setStrokes((prevStrokes) => [...prevStrokes, stroke]);
    draw(stroke);
    socket.emit("draw", stroke);
  };

  const handleReset = () => {
    const isCurrentUserEditExistingDrawing = strokes?.some(
      (stroke) => stroke.socketId === socketId
    );
    if (isCurrentUserEditExistingDrawing) {
      socket.emit("reset", { socketId: socket.id });
    } else {
      return toast.error(
        "You can't reset the drawing as you haven't contributed to it yet.",
        { position: "top-right" }
      );
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6 bg-[#fff] shadow-lg rounded-lg">
      <ToastContainer />
      <h1 className="text-2xl font-bold text-gray-700 mb-4">
        Real-Time Collaborative Drawing Dashboard 🎨
      </h1>
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded shadow-md"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={handleMouseMove}
      />
      <div className="mt-4 flex  gap-6 justify-center shadow-lg p-4 rounded-lg bg-white w-full  max-w-[50%]">
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-700">Color:</label>
          <div
            className="w-8 h-8 border rounded-full"
            style={{ backgroundColor: color }}
          ></div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border p-1 rounded cursor-pointer"
          />
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-700">Brush Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-24 cursor-pointer"
          />
          <span className="font-medium text-gray-600">{size}px</span>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
