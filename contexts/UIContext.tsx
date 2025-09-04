import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import type { Task, Project } from "../types";

type itemToDelete = {
  type: "task" | "project";
  data: any;
} | null;

interface UIContextType {
  // Navigation & Filters
  filterTeam: string;
  setFilterTeam: (team: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;

  //Modal States
  isEditModalOpen: boolean;
  isViewModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isCreateTaskModalOpen: boolean;
  newTaskDefaults: { Owner: string; Status: string } | null;

  //Modal Data
  currentTask: Task | null;
  currentIndex: number | null;
  itemToDelete: itemToDelete;
  phaseForNewTask: string | null;
  currentEditingProject: Project | null;

  // Actions
  openEditModal: (task: Task) => void;

  // all Task Modal Actions
  openViewModal: (task: Task, allTasks: Task[]) => void;
  closeModals: () => void;
  openCreateProjectModal: () => void;
  openEditProjectModal: (project: Project) => void;
  openDeleteModal: (type: "task" | "project", data: any) => void;
  openCreateTaskModal: (defaults: { phase?: string; owner?: string }) => void;

  // allTasks Navigation
  navigateTask: (direction: "next" | "previous", allTasks: Task[]) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState<{
    phase?: string;
    owner?: string;
  } | null>(null);

  // Modal Data
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<itemToDelete>(null);
  const [phaseForNewTask, setPhaseForNewTask] = useState<string | null>(null);
  const [currentEditingProject, setCurrentEditingProject] =
    useState<Project | null>(null);

  // --- Actions ---

  const closeModals = useCallback(() => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsCreateProjectModalOpen(false);
    setIsEditProjectModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsCreateTaskModalOpen(false);
    setCurrentTask(null);
    setCurrentIndex(null);
    setItemToDelete(null);
    setPhaseForNewTask(null);
    setCurrentEditingProject(null);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
    setIsViewModalOpen(false);
    setCurrentIndex(null);
  }, []);

  const openViewModal = useCallback((task: Task, allTasks: Task[]) => {
    const findIndex = allTasks.findIndex((t) => t._id === task._id);
    setCurrentIndex(findIndex);
    setCurrentTask(task);
    setIsViewModalOpen(true);
    setIsEditModalOpen(false);
  }, []);

  const openCreateProjectModal = useCallback(() => {
    setIsCreateProjectModalOpen(true);
    setCurrentEditingProject(null);
  }, []);

  const openEditProjectModal = useCallback((project: Project) => {
    setCurrentEditingProject(project);
    setIsEditProjectModalOpen(true);
  }, []);

  const openDeleteModal = useCallback((type: "task" | "project", data: any) => {
    setItemToDelete({ type, data });
    setIsDeleteModalOpen(true);
  }, []);

  const openCreateTaskModal = useCallback((defaults: {phase?: string; owner?: string}) => {
    setNewTaskDefaults(defaults);
    setIsCreateTaskModalOpen(true);
  }, []);

  const navigateTask = useCallback(
    (direction: "next" | "previous", allTasks: Task[]) => {
      if (currentIndex === null) return;

      const newIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;

      if (newIndex >= 0 && newIndex < allTasks.length) {
        setCurrentIndex(newIndex);
        setCurrentTask(allTasks[newIndex]);
      }
    },
    [currentIndex]
  );

  const value = {
    filterTeam,
    setFilterTeam,
    isSidebarOpen,
    setIsSidebarOpen,

    isEditModalOpen,
    isViewModalOpen,
    isCreateProjectModalOpen,
    isDeleteModalOpen,
    isCreateTaskModalOpen,

    currentTask,
    currentIndex,
    itemToDelete,
    phaseForNewTask,

    openEditModal,
    openViewModal,
    closeModals,
    openCreateProjectModal,
    openEditProjectModal,
    openDeleteModal,
    newTaskDefaults,
    openCreateTaskModal,
    navigateTask,

    isEditProjectModalOpen, 
    currentEditingProject,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
