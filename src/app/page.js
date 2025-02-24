import Canvas from "../../src/app/components/Canvas";
import Notifications from "../../src/app/components/Notifications";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <Notifications />
      <Canvas />
    </main>
  );
}
