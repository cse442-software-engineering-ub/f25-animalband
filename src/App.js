import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Stage from "./app/routes/stage/stage";

function App() {
  return (
    // Remove basename so everything is relative to root
    <Router basename={process.env.PUBLIC_URL || ""}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stage" element={<Stage />} />
      </Routes>
    </Router>
  );
}

export default App;

