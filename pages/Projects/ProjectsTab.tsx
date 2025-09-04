import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types";
import { DeleteIcon, EditIcon, MenuIcon } from "@/components/icons";
import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/authUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectsTabProps {
  projects: Project[];
  onDeleteProject: (project: Project) => void;
}

interface ProjectCardProps {
  project: Project;
  onDeleteProject: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDeleteProject }) => {
  const { openEditProjectModal } = useUI();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin(user);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.ProjectID });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-800 flex-1 pr-4 cursor-pointer" onClick={() => navigate(`/tasks/${project.Name}`)}>
          {project.Name}
        </h3>
        {userIsAdmin && (
            <button {...listeners} className="cursor-grab p-2 text-gray-400 hover:text-gray-600">
                <MenuIcon />
            </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500 font-mono">{project.ProjectID}</p>
        {userIsAdmin && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => openEditProjectModal(project)}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100"
              aria-label="Edit Project"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDeleteProject(project)}
              className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100"
              aria-label="Delete Project"
            >
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  onDeleteProject,
}) => {
  const { openCreateProjectModal } = useUI();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedProjects, setSortedProjects] = useState<Project[]>([]);

  useEffect(() => {
    const filtered = projects.filter(p =>
      p.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => a.Priority - b.Priority);
    setSortedProjects(sorted);
  }, [projects, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortedProjects((items) => {
        const oldIndex = items.findIndex((item) => item.ProjectID === active.id);
        const newIndex = items.findIndex((item) => item.ProjectID === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          โปรเจกต์ทั้งหมด ({sortedProjects.length})
        </h1>
        <button
          onClick={openCreateProjectModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150"
        >
          + สร้างโปรเจกต์
        </button>
      </div>

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedProjects.map(p => p.ProjectID)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((p) => (
              <ProjectCard key={p.ProjectID} project={p} onDeleteProject={onDeleteProject} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedProjects.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">
          ไม่พบโปรเจกต์ที่ตรงกับคำค้นหา
        </div>
      )}
    </div>
  );
};