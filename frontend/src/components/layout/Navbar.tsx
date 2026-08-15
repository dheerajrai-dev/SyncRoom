import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks';
import { Plus, LayoutDashboard, User, LogOut, Menu, X, Radio, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E1D3] bg-[#FFFDF8]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        
        {/* Brand with proper spacing & icon */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 py-1 px-0.5 group cursor-pointer shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] bg-[#FBE9D6] border border-[#D9720F]/20 flex items-center justify-center text-[#D9720F] shrink-0 transition-transform group-hover:scale-105">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-[#1A1815]">
            SyncRoom
          </span>
        </Link>

        {/* Center / Left Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/create"
            className="text-sm font-medium text-[#38352F] hover:text-[#D9720F] flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#D9720F]" />
            Create Room
          </Link>
          <Link
            to="/join"
            className="text-sm font-medium text-[#38352F] hover:text-[#1A1815] transition-colors"
          >
            Join Room
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-[#38352F] hover:text-[#1A1815] flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#8A8375]" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right Side: Guest indicator vs. Signed-In User Menu (§9.3) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] hover:bg-[#F6F2E9] border border-[#E7E1D3] transition-all cursor-pointer"
              >
                {/* Circular Avatar Initial (§9.3) */}
                <div className="w-6 h-6 rounded-full bg-[#1A1815] text-[#FFFDF8] flex items-center justify-center text-xs font-bold font-mono">
                  {(user.display_name || user.username).charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[#1A1815]">
                  {user.display_name || user.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8375]" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-48 surface-modal p-1.5 z-20 shadow-md"
                    >
                      <div className="px-3 py-2 border-b border-[#E7E1D3] mb-1">
                        <p className="text-xs text-[#8A8375]">Signed in as</p>
                        <p className="text-xs font-semibold text-[#1A1815] font-mono truncate">@{user.username}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] rounded-[8px] transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#8A8375]" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] rounded-[8px] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#8A8375]" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#C23B2E] hover:bg-[#FBEAE6] rounded-[8px] transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Neutral --fog-tint "Guest" pill (§9.3) */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#5C574C] bg-[#E7E1D3] select-none tracking-wide">
                Guest
              </span>
              <Link
                to="/login"
                className="btn btn-ghost text-xs py-1.5 px-3 font-semibold text-[#1A1815] hover:text-[#D9720F] hover:bg-[#F6F2E9] transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-[8px] text-[#5C574C] hover:text-[#1A1815] hover:bg-[#F6F2E9] transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#E7E1D3] bg-[#FFFDF8] px-4 py-3 flex flex-col gap-2"
          >
            <Link
              to="/create"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#D9720F]" />
              Create Room
            </Link>
            <Link
              to="/join"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] text-sm font-medium block"
            >
              Join Room
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] text-sm font-medium flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#8A8375]" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] text-sm font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#8A8375]" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#C23B2E] hover:bg-[#FBEAE6] flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-[#E7E1D3] flex items-center justify-between px-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#5C574C] bg-[#E7E1D3]">
                  Guest
                </span>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#D9720F] hover:underline"
                >
                  Sign In →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
