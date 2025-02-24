"use client";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEraser, FaPalette } from "react-icons/fa";
import socket from "../utils";
import getUserId from "../utils/helper";

// Get User ID
let userId = await getUserId();

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const strokeBatch = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.6;
    ctxRef.current = canvas.getContext("2d");

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

    // ✅ Fix for Reset Functionality
    socket.on("reset-user", ({ userId: resetUserId, updatedStrokes }) => {
      console.log(`Received reset-user event from ${resetUserId}`);

      if (resetUserId === userId) {
        setStrokes([]);
        clearCanvas();
      } else {
        setStrokes(updatedStrokes);
        redrawCanvas(updatedStrokes);
      }
    });

    socket.on("user-reset", ({ userId: resetUserId, message, toastType }) => {
      if (toastType === "success") {
        return toast.success(message, { position: "top-right" });
      }
      toast.info(message, { position: "top-right" });
    });

    return () => {
      socket.off("draw");
      socket.off("reset-user");
      socket.off("load-drawing");
      socket.off("user-reset");
    };
  }, []);

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const redrawCanvas = (updatedStrokes) => {
    clearCanvas();
    updatedStrokes.forEach(draw);
  };

  const startDrawing = () => setIsDrawing(true);

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
    if (!isDrawing || !canvasRef.current) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent ?? {};

    const stroke = { x, y, color, size, userId };
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
      console.log(`Sending reset request for user ${userId}`);
      socket.emit("reset", { userId });
    } else {
      toast.error("You haven't contributed yet, so you can't reset it.", {
        position: "top-right",
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6 bg-gray-50 rounded-lg">
      <ToastContainer />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        🎨 Real-Time Collaborative Drawing Board
      </h1>
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-200 rounded-lg shadow-lg max-w-full"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={handleMouseMove}
      />

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <FaPalette className="text-gray-700" />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 border-2 border-gray-200 rounded-full cursor-pointer"
          />
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-gray-700">Size:</span>
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

        <button
          onClick={handleReset}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          <FaEraser />
          Reset
        </button>
      </div>
    </div>
  );
}
