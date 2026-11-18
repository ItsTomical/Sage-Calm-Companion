import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import Focus from './pages/Focus.jsx'
import Reflect from './pages/Reflect.jsx'
import Progress from './pages/Progress.jsx'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/reflect" element={<Reflect />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </AppLayout>
  )
}
