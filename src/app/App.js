import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./routes/landing/landing.js";
import Forum from "./routes/forum/forum.js";
import Looping from "./routes/looping/looping.js";
import Stage from "./routes/stage/stage.js";
import "../App.css";

function NotFound() {
  return <h2>404 – Page not found</h2>;
}

export default function App() {
  return (
    <BrowserRouter basename="/CSE442/2025-Fall/cse-442h">
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stage" element={<Stage />} />
          <Route path="/looping" element={<Looping />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
