import React from "react";
import type { Project } from "../types";
import { DeleteIcon } from "./icons";
import { on } from "events";

interface ProjectsTabProps {
  projects: Project[];
  onDeleteProject: (project: Project) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  onDeleteProject,
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.ProjectID}
            className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800 flex-1 pr-4">
                {p.Name}
              </h3>
              <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                Priority: {p.Priority}
              </span>
            </div>
            <button onClick={() => onDeleteProject(p)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 mt-4" aria-label="Delete Project">
              <DeleteIcon />
            </button>
            <p className="text-sm text-gray-500 mt-2 font-mono">
              {p.ProjectID}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
