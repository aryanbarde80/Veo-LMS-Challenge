import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Menu, X, BookOpen, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2E2E4A] bg-[#0F0F1A]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#6C47FF] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Veo<span className="text-[#6C47FF]">LMS</span></span>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B98B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-sm text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors"
              />
            </div>
          </form>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/courses" className="px-3 py-2 text-sm text-[#9B98B8] hover:text-white transition-colors">
              Courses
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1A1A2E] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#6C47FF] flex items-center justify-center text-white text-sm font-semibold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{user.name.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl shadow-xl overflow-hidden z-50">
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#F0EFF8] hover:bg-[#242438] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#F0EFF8] hover:bg-[#242438] transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        My Learning
                      </Link>
                    )}
                    <div className="border-t border-[#2E2E4A]" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-[#242438] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm text-[#9B98B8] hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white text-sm rounded-lg font-medium transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[#9B98B8] hover:text-white"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#2E2E4A] py-4 space-y-2">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B98B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-sm text-white placeholder-[#9B98B8] focus:outline-none"
                />
              </div>
            </form>
            <Link to="/courses" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-[#9B98B8] hover:text-white">Courses</Link>
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-[#9B98B8] hover:text-white">
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Learning'}
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-400">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-[#9B98B8] hover:text-white">Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="block px-3 py-2 bg-[#6C47FF] text-white rounded-lg text-center">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </nav>
  );
}
