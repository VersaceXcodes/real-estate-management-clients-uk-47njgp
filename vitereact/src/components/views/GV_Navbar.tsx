import React, { useState, useEffect, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppStore } from "@/store/main";

const GV_Navbar: React.FC = () => {
  // Local state variables
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Access global auth state and actions from Zustand store
  const auth = useAppStore((state) => state.auth);
  const reset_auth = useAppStore((state) => state.reset_auth);

  // React Router navigate hook
  const navigate = useNavigate();

  // Action: Toggle mobile menu state
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Action: Handle search on Enter key press
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchQuery.trim() !== "") {
        navigate(`/clients?query=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
      }
    }
  };

  // Action: Toggle the profile dropdown visibility
  const toggleProfileDropdown = () => {
    setProfileDropdownOpen((prev) => !prev);
  };

  // Action: Handle user logout (calls /api/auth/logout)
  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    }
    reset_auth();
    navigate("/login");
  };

  // On window resize, if screen width >= md and mobile menu is open, close the mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  return (
    <>
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50" role="navigation" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                UK EstateHub
              </Link>
            </div>
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:space-x-4 md:items-center">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/clients"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Clients
              </Link>
              <Link
                to="/properties"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Properties
              </Link>
              <Link
                to="/appointments"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Appointments
              </Link>
              {(auth.user.role === "admin" || auth.user.role === "manager") && (
                <Link
                  to="/reports"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Reports
                </Link>
              )}
              <Link
                to={`/user-settings/${auth.user.id}`}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Settings
              </Link>
              {/* Search Input (Desktop) */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  aria-label="Search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleProfileDropdown}
                  className="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
                  aria-label="Toggle user menu"
                >
                  <span className="mr-2">{auth.user.username}</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to={`/user-settings/${auth.user.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {menuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/dashboard"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/clients"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                Clients
              </Link>
              <Link
                to="/properties"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                Properties
              </Link>
              <Link
                to="/appointments"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                Appointments
              </Link>
              {(auth.user.role === "admin" || auth.user.role === "manager") && (
                <Link
                  to="/reports"
                  className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Reports
                </Link>
              )}
              <Link
                to={`/user-settings/${auth.user.id}`}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                Settings
              </Link>
              {/* Mobile Search Input */}
              <div className="mt-2 px-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  aria-label="Search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer div to prevent content from being hidden behind the fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_Navbar;