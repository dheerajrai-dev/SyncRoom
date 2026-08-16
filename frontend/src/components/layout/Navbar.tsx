import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks';
import { Plus, LayoutDashboard, User, LogOut, Menu, X, Radio, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
          userMenuButtonRef.current?.focus();
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      } else if (
        isUserMenuOpen &&
        (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')
      ) {
        const menu = userMenuRef.current?.querySelector<HTMLElement>('[role="menu"]');
        if (!menu) return;
        const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
        if (items.length === 0) return;

        e.preventDefault();
        const activeEl = document.activeElement as HTMLElement | null;
        const currentIndex = items.indexOf(activeEl!);

        if (e.key === 'ArrowDown') {
          const nextIndex = currentIndex === -1 || currentIndex === items.length - 1 ? 0 : currentIndex + 1;
          items[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
          const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          items[prevIndex]?.focus();
        } else if (e.key === 'Home') {
          items[0]?.focus();
        } else if (e.key === 'End') {
          items[items.length - 1]?.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMobileMenuOpen]);

  const initialLetter = (user?.display_name?.trim() || user?.username?.trim() || 'U').charAt(0).toUpperCase() || 'U';

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full border-b border-[#E7E1D3] bg-[#FFFDF8]">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 py-1 group cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-[8px] bg-[#FBE9D6] border border-[#D9720F]/20 flex items-center justify-center text-[#D9720F] shrink-0 transition-transform group-hover:scale-105">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1A1815]">
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
              <LayoutDashboard className="w-4 h-4 text-[#8A8375]" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right Side: Guest indicator vs. Signed-In User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              {/* Profile Trigger Button (§R3: vertically centered initial avatar, name, chevron) */}
              <button
                type="button"
                ref={userMenuButtonRef}
                id="user-menu-button"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-controls="user-menu-dropdown"
                aria-label={`User menu for ${user.display_name || user.username}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && !isUserMenuOpen) {
                    e.preventDefault();
                    setIsUserMenuOpen(true);
                  }
                }}
                className="h-10 inline-flex items-center gap-2.5 px-3 rounded-[10px] border border-[#E7E1D3] bg-[#FFFDF8] hover:bg-[#F6F2E9] focus-visible:outline-2 focus-visible:outline-[#D9720F] focus-visible:outline-offset-2 transition-all cursor-pointer select-none shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#1A1815] text-[#FFFDF8] flex items-center justify-center text-xs font-bold font-mono shrink-0">
                  {initialLetter}
                </div>
                <span className="text-sm font-semibold text-[#1A1815] leading-none max-w-[120px] truncate">
                  {user.display_name || user.username}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8A8375] transition-transform duration-150 shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu (§R3: anchored directly below trigger, distinct rows, icon/text common axis) */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    id="user-menu-dropdown"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#FFFDF8] border border-[#E7E1D3] rounded-[12px] p-1.5 z-50 shadow-lg"
                  >
                    <div className="px-3 py-2.5 border-b border-[#E7E1D3] mb-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#8A8375]">Signed in as</p>
                      {user.display_name ? (
                        <div className="flex flex-col min-w-0 mt-0.5">
                          <p className="text-sm font-semibold text-[#1A1815] truncate">{user.display_name}</p>
                          <p className="text-xs text-[#8A8375] font-mono truncate">@{user.username}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[#1A1815] font-mono truncate mt-0.5">@{user.username}</p>
                      )}
                    </div>

                    <Link
                      to="/dashboard"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] focus:bg-[#F6F2E9] focus:text-[#1A1815] focus:outline-hidden rounded-[8px] transition-colors w-full"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#8A8375] shrink-0" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/profile"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#38352F] hover:text-[#1A1815] hover:bg-[#F6F2E9] focus:bg-[#F6F2E9] focus:text-[#1A1815] focus:outline-hidden rounded-[8px] transition-colors w-full"
                    >
                      <User className="w-4 h-4 text-[#8A8375] shrink-0" />
                      <span>Profile Settings</span>
                    </Link>

                    <div className="pt-1 mt-1 border-t border-[#E7E1D3]">
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={0}
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#C23B2E] hover:bg-[#FBEAE6] focus:bg-[#FBEAE6] focus:outline-hidden rounded-[8px] transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#C23B2E] shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="mobile-menu-toggle"
            aria-haspopup="true"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
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
            id="mobile-navigation-menu"
            role="region"
            aria-label="Mobile navigation"
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
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 border-b border-[#E7E1D3] mb-1 flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#1A1815] text-[#FFFDF8] flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    {initialLetter}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-[#1A1815] truncate">
                      {user.display_name || user.username}
                    </span>
                    <span className="text-xs text-[#8A8375] font-mono truncate">
                      @{user.username}
                    </span>
                  </div>
                </div>
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
                  type="button"
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
