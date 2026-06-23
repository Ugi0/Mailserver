import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Register from './routes/Register';
import Instructions from './routes/Instructions';
import Manage from './routes/Manage';
import Login from './routes/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/manage" element={<Manage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
