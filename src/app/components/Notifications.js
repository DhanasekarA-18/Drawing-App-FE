"use client";
import { useEffect } from "react";
import { toast } from "react-toastify";
import socket from "../utils/index";

export default function Notifications() {
  useEffect(() => {
    socket.on("user-joined", ({ userId }) => {
      toast.info(`Designer ${userId.slice(0, 4)} joined the session`, { 
        position: "bottom-right",
        icon: "🎨"
      });
    });

    socket.on("user-left", ({ userId }) => {
      toast.warn(`Designer ${userId.slice(0, 4)} left`, { 
        position: "bottom-right" 
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  return null;
}
