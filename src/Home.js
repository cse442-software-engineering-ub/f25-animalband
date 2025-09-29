import { Link } from "react-router-dom";
import ostrich from "./ostrich.jpeg";
import "./App.css";

function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={ostrich} className="App-logo" alt="logo" />
        <p>[imagine a stage]</p>

        <a
          className="App-link"
          href="https://github.com/cse442-software-engineering-ub/f25-animalband"
          target="_blank"
          rel="noopener noreferrer"
        >
          ANIMALBAND coming soon...
        </a>

        <Link to="/stage" className="App-link">
          Go to Stage 🎤
        </Link>
      </header>
    </div>
  );
}

export default Home;

