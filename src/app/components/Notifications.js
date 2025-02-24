"use client";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import socket from "../utils/index";

export default function Notifications() {
  useEffect(() => {
    socket.on("user-joined", ({ userId }) => {
      toast.info(`User ${userId} has joined!`, { position: "top-right" });
    });

    socket.on("user-left", ({ userId }) => {
      toast.warn(`User ${userId} has left.`, { position: "top-right" });
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  return <ToastContainer />;
}
