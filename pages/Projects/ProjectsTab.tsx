import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types";
import { DeleteIcon, EditIcon } from "@/components/icons";
import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/authUtils';

interface ProjectsTabProps {
  projects: Project[];
  onDeleteProject: (project: Project) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  onDeleteProject,
}) => {
  const { openCreateProjectModal, openEditProjectModal } = useUI();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const userIsAdmin = isAdmin(user);

  // Filter projects based on search query first
  const filteredProjects = useMemo(() => {
    if (!searchQuery) {
      return projects;
    }
    return projects.filter(p =>
      p.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  // Then, sort the filtered projects by priority
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => a.Priority - b.Priority);
  }, [filteredProjects]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          โปรเจกต์ทั้งหมด ({sortedProjects.length})
        </h1>
        {/* สิทธิ์การสร้างโปรเจกต์เปิดกว้างใน Backend จึงแสดงปุ่มได้ */}
        <button
          onClick={openCreateProjectModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150"
        >
          + สร้างโปรเจกต์
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col">
          <label htmlFor="project-search" className="text-sm font-medium text-gray-700 mb-2">
            ค้นหาโปรเจกต์
          </label>
          <input
            id="project-search"
            type="text"
            placeholder="พิมพ์ชื่อโปรเจกต์ที่ต้องการค้นหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((p) => (
          <div
            key={p.ProjectID}
            className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => navigate(`/tasks/${p.Name}`)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800 flex-1 pr-4">
                {p.Name}
              </h3>
              {/* <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                Priority: {p.Priority}
              </span> */}
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 font-mono">{p.ProjectID}</p>
              {/* [✅ แก้ไข] แสดงปุ่มเฉพาะ Admin เท่านั้น */}
              {userIsAdmin && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditProjectModal(p);
                    }}
                    className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100"
                    aria-label="Edit Project"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p);
                    }}
                    className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100"
                    aria-label="Delete Project"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {sortedProjects.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">
          ไม่พบโปรเจกต์ที่ตรงกับคำค้นหา
        </div>
      )}
    </div>
  );
};
