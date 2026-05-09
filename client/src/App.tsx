import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Explore from './pages/Explore';
import Create from './pages/Create';

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 border-b border-gray-800 flex justify-between items-center bg-black text-white">
        <Link to="/" className="text-xl font-bold tracking-tighter">VISIONSTREAM</Link>
        <div className="space-x-6">
          <Link to="/" className="hover:text-blue-400">Explore</Link>
          <Link to="/create" className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700">Create</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;