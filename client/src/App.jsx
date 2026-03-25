import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Board from './components/Board'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </BrowserRouter>
  )
}
