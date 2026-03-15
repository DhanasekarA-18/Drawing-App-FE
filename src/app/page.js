import Canvas from "../../src/app/components/Canvas";
import Notifications from "../../src/app/components/Notifications";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  return (
    <>
      <ToastContainer theme="dark" pauseOnFocusLoss={false} />
      <Notifications />
      <Canvas />
    </>
  );
}
