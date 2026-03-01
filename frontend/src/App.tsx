import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

// Public pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Student pages
import Dashboard from './pages/Dashboard'
import PYQs from './pages/PYQs'
import ExamSimulation from './pages/ExamSimulation'
import AIHelper from './pages/AIHelper'
import Results from './pages/Results'
import Community from './pages/Community'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminContent from './pages/admin/AdminContent'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public routes (no layout) ─────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected student routes (with sidebar layout) ────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pyqs"
            element={
              <ProtectedRoute>
                <Layout><PYQs /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam"
            element={
              <ProtectedRoute>
                <Layout><ExamSimulation /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-helper"
            element={
              <ProtectedRoute>
                <Layout><AIHelper /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Layout><Results /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Layout><Community /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── Admin routes ──────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout><AdminDashboard /></Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Layout><AdminUsers /></Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <AdminRoute>
                <Layout><AdminContent /></Layout>
              </AdminRoute>
            }
          />

          {/* ── Fallback ──────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App