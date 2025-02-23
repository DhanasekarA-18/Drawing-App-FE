"use client";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import socket from "../utils/index";

export default function Notifications() {
  useEffect(() => {
    socket.on("user-joined", ({ id }) => {
      console.log(`User ${id} joined`);
      toast.info(`User ${id} joined the session`, { position: "top-right" });
    });

    socket.on("user-left", ({ id }) => {
      console.log(`User ${id} left`);
      toast.warn(`User ${id} left the session`, { position: "top-right" });
    });

    socket.on("welcome", (data) => {
      console.log(data?.message);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  return <ToastContainer />;
}
