import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

const GV_Sidebar: React.FC = () => {
  const auth = useAppStore((state) => state.auth);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>("");

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarVisible(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Hamburger menu for mobile */}
      <div className="md:hidden p-2">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block bg-gray-100 w-64 p-4">
        <nav className="space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setActiveSection("dashboard")}
            className={`block p-2 rounded ${
              activeSection === "dashboard" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/clients"
            onClick={() => setActiveSection("clients")}
            className={`block p-2 rounded ${
              activeSection === "clients" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Clients
          </Link>
          <Link
            to="/appointments"
            onClick={() => setActiveSection("appointments")}
            className={`block p-2 rounded ${
              activeSection === "appointments" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Appointments
          </Link>
          <Link
            to="/properties"
            onClick={() => setActiveSection("properties")}
            className={`block p-2 rounded ${
              activeSection === "properties" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Properties
          </Link>
          {auth.user.role === "admin" && (
            <Link
              to="/users"
              onClick={() => setActiveSection("user_management")}
              className={`block p-2 rounded ${
                activeSection === "user_management" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              User Management
            </Link>
          )}
          {(auth.user.role === "admin" || auth.user.role === "manager") && (
            <Link
              to="/reports"
              onClick={() => setActiveSection("reports")}
              className={`block p-2 rounded ${
                activeSection === "reports" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Reports
            </Link>
          )}
          {(auth.user.role === "admin" || auth.user.role === "support") && (
            <Link
              to="/clients/import"
              onClick={() => setActiveSection("data_import_export")}
              className={`block p-2 rounded ${
                activeSection === "data_import_export"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Data Import/Export
            </Link>
          )}
          <Link
            to="/user-settings"
            onClick={() => setActiveSection("settings")}
            className={`block p-2 rounded ${
              activeSection === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Mobile Off-canvas Sidebar */}
      {sidebarVisible && (
        <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-gray-100 p-4 z-50 shadow-lg">
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              onClick={() => {
                setActiveSection("dashboard");
                toggleSidebar();
              }}
              className={`block p-2 rounded ${
                activeSection === "dashboard" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/clients"
              onClick={() => {
                setActiveSection("clients");
                toggleSidebar();
              }}
              className={`block p-2 rounded ${
                activeSection === "clients" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Clients
            </Link>
            <Link
              to="/appointments"
              onClick={() => {
                setActiveSection("appointments");
                toggleSidebar();
              }}
              className={`block p-2 rounded ${
                activeSection === "appointments" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Appointments
            </Link>
            <Link
              to="/properties"
              onClick={() => {
                setActiveSection("properties");
                toggleSidebar();
              }}
              className={`block p-2 rounded ${
                activeSection === "properties" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Properties
            </Link>
            {auth.user.role === "admin" && (
              <Link
                to="/users"
                onClick={() => {
                  setActiveSection("user_management");
                  toggleSidebar();
                }}
                className={`block p-2 rounded ${
                  activeSection === "user_management" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                User Management
              </Link>
            )}
            {(auth.user.role === "admin" || auth.user.role === "manager") && (
              <Link
                to="/reports"
                onClick={() => {
                  setActiveSection("reports");
                  toggleSidebar();
                }}
                className={`block p-2 rounded ${
                  activeSection === "reports" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                Reports
              </Link>
            )}
            {(auth.user.role === "admin" || auth.user.role === "support") && (
              <Link
                to="/clients/import"
                onClick={() => {
                  setActiveSection("data_import_export");
                  toggleSidebar();
                }}
                className={`block p-2 rounded ${
                  activeSection === "data_import_export"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                Data Import/Export
              </Link>
            )}
            <Link
              to="/user-settings"
              onClick={() => {
                setActiveSection("settings");
                toggleSidebar();
              }}
              className={`block p-2 rounded ${
                activeSection === "settings" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>
      )}

      {/* Mobile overlay when sidebar is open */}
      {sidebarVisible && (
        <div className="md:hidden fixed inset-0 bg-black opacity-50 z-40" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default GV_Sidebar;