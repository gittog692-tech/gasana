import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, FileText, Brain, BarChart3, Menu,
  GraduationCap, LogOut, Shield, ChevronDown, Search, Bell, Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoc from '../assets/logoc.svg'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/pyqs', label: 'Study Material', icon: FileText },
    { path: '/exam', label: 'Mock Tests', icon: BookOpen },
    { path: '/ai-helper', label: 'AI Tutor', icon: Brain },
    { path: '/results', label: 'Performance', icon: GraduationCap },
    { path: '/community', label: 'Community', icon: Users },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleSearch = () => {
    const query = searchQuery.trim()
    if (!query) {
      navigate('/pyqs')
      return
    }
    navigate(`/pyqs?q=${encodeURIComponent(query)}`)
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white p-1 rounded-2xl shadow-xl shadow-slate-200 border border-slate-200">
        <img
        src={logoc}
        alt="Gasana Logo"
        className="h-10 w-auto object-contain"
      />
      </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Gasana</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Menu</p>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="mt-8 mb-2 px-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname.startsWith('/admin')
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Shield className={`w-5 h-5 ${location.pathname.startsWith('/admin') ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="text-sm">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f4f7fb] flex font-sans text-slate-900">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:h-full flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        {/* Header */}
        <header className="shrink-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-600 transition-all w-64 lg:w-96">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for subjects, questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-slate-900"
              />
              <button
                onClick={handleSearch}
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 px-2"
              >
                Go
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold border border-slate-800">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{isAdmin ? 'Administrator' : 'Student'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 animate-fade-in origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-auto p-4 lg:p-8 bg-[#f4f7fb]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
