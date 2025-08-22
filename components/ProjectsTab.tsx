
import React from 'react';
import type { Project } from '../types';

interface ProjectsTabProps {
    projects: Project[];
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ projects }) => {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
                <div key={p.ProjectID} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-800 flex-1 pr-4">{p.Name}</h3>
                        <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">Priority: {p.Priority}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 font-mono">{p.ProjectID}</p>
                </div>
            ))}
            </div>
        </div>
    );
};