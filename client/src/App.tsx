import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Explore from './pages/Explore';
import Create from './pages/Create';

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 flex justify-between items-center text-white cartoon-nav">
        <Link to="/" className="text-xl font-bold tracking-tighter cartoon-heading">VISIONSTREAM</Link>
        <div className="space-x-6">
          <Link to="/" className="hover:text-blue-300">Explore</Link>
          <Link to="/create" className="cartoon-btn">Create</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;