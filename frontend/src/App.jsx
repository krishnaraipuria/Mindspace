import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoomProvider } from './context/RoomContext'
import Toast from './components/Toast'
import Home from './pages/Home'
import Room from './pages/Room'

export default function App() {
  return (
    <BrowserRouter>
      <RoomProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </RoomProvider>
    </BrowserRouter>
  )
}
