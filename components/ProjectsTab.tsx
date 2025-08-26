import React from "react";
import type { Project } from "../types";
import { DeleteIcon, EditIcon } from "./icons";
import { useUI } from '../contexts/UIContext';


interface ProjectsTabProps {
  projects: Project[];
  onDeleteProject: (project: Project) => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  onDeleteProject,
  onSelectProject,
}) => {
  const { openCreateProjectModal, openEditProjectModal, openDeleteModal } = useUI();
  const getPriorityBadge = (priority: number) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    let text = 'N/A';

    if (priority >= 0 && priority <= 3) {
        colorClass = 'bg-red-100 text-red-800';
        text = `P${priority}`;
    } else if (priority >= 4 && priority <= 7) {
        colorClass = 'bg-yellow-100 text-yellow-800';
        text = `P${priority}`;
    } else if (priority >= 8 && priority <= 10) {
        colorClass = 'bg-green-100 text-green-800';
        text = `P${priority}`;
    }

    return <span className={`px-3 py-1 text-sm font-medium rounded-full ml-4 flex-shrink-0 ${colorClass}`}>{text}</span>;
  };
  
  return (
    <div  className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">โปรเจกต์ทั้งหมด ({projects.length})</h1>
        <button
            onClick={openCreateProjectModal}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150"
        >
            + สร้างโปรเจกต์
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.ProjectID}
            className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300"
            onClick={() => onSelectProject(p.ProjectID)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800 flex-1 pr-4">
                {p.Name}
              </h3>
              <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                Priority: {p.Priority}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(p);
              }}
              className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 mt-4"
              aria-label="Delete Project"
            >
              <DeleteIcon />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditProjectModal(p);
              }}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 mt-4"
              aria-label="Edit Project"
            >
              <EditIcon />
            </button>
            <div className="flex justify-between items-end mt-4">
              <p className="text-sm text-gray-500 font-mono">{p.ProjectID}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
