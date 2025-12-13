import { Link, useLocation } from 'react-router-dom'
import { Zap, Menu, X, LayoutDashboard, Code2, Settings } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { path: '/', label: '首页', icon: null },
  { path: '/dashboard', label: '控制台', icon: LayoutDashboard },
  { path: '/functions', label: '函数', icon: Code2 },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexo-500 to-nexo-600 flex items-center justify-center glow-green group-hover:glow-green-intense transition-all duration-300">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Nexo<span className="text-nexo-400">Serverless</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path || 
                  (link.path !== '/' && location.pathname.startsWith(link.path))
                    ? 'text-nexo-400'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/functions/new"
              className="px-5 py-2.5 bg-nexo-500 hover:bg-nexo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 glow-green hover:glow-green-intense"
            >
              新建函数
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-surface-700 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-nexo-400'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
              <Link 
                to="/functions/new"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-5 py-2.5 bg-nexo-500 hover:bg-nexo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 text-center"
              >
                新建函数
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
