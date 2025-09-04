import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChartBarIcon,
  FolderKanbanIcon,
  MenuIcon,
  CloseIcon,
  UserCircleIcon,
} from "@/components/icons";
import type { Project } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem: React.FC<NavLinkProps> = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "bg-orange-100 text-orange-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      }`
    }
  >
    <div className="mr-2">{icon}</div>
    <span>{label}</span>
  </NavLink>
);

interface HeaderProps {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const activeTab = location.pathname;

  const navLinks = (
    <>
      <NavItem
        to="/profile"
        label={user?.name || "Profile"}
        icon={<UserCircleIcon />}
      />
      <NavItem
        to="/dashboard"
        label="รายการทั้งหมด"
        icon={<ChartBarIcon />}
      />
      <NavItem
        to="/projects"
        label="โปรเจกต์"
        icon={<FolderKanbanIcon />}
      />
      <NavItem
        to="/tasks"
        label="รายการ Task"
        icon={<FolderKanbanIcon />}
      />
    </>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo & Main Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <nav className="hidden md:flex md:ml-10 md:space-x-4">
                {navLinks}
              </nav>
            </div>
          </div>

          {/* Right Section: Project Selector (Conditional) */}
          {activeTab === "/tasks" && (
            <div className="hidden md:block ml-4">
              <select
                id="project-selector"
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={!projects.length}
                className="w-48 md:w-64 block px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                {projects.length === 0 ? (
                  <option value="">ไม่พบโปรเจกต์</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.ProjectID} value={p.ProjectID}>
                      {p.Name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            {navLinks}
            {/* Mobile Project Selector (Conditional) */}
            {activeTab === "/tasks" && (
              <div className="pt-4 pb-2 px-2">
                <label className="text-xs font-semibold text-gray-500">
                  SELECT OPERATION
                </label>
                <select
                  id="mobile-project-selector"
                  value={selectedProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={!projects.length}
                  className="w-full mt-1 block px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  {projects.length === 0 ? (
                    <option value="">ไม่พบโปรเจกต์</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.ProjectID} value={p.ProjectID}>
                        {p.Name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
