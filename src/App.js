import logo from './logo.svg';
import ostrich from './ostrich.jpeg'
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={ostrich} className="App-logo" alt="logo" />
        <p> </p>
        <p>
          [imagine a stage]
        </p>
        <a
          className="App-link"
          href="https://github.com/cse442-software-engineering-ub/f25-animalband"
          target="_blank"
          rel="noopener noreferrer"
        >
          ANIMALBAND coming soon...
        </a>
      </header>
    </div>
  );
}

export default App;
