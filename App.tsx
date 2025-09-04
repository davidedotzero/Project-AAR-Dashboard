import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { useData } from "@/contexts/DataContext";
import { Header } from "@/components/Header";
import { DashboardTab } from "@/pages/Dashboard/DashboardTab";
import { ProjectsTab } from "@/pages/Projects/ProjectsTab";
import { TasksTab } from "@/pages/Tasks/TasksTab";
import { ProfileTab } from "@/pages/Profile/ProfileTab";
import { LoginScreen } from "@/pages/Login/LoginScreen";
import { EditTaskModal } from "@/components/EditTaskModal";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { EditProjectModal } from "@/components/EditProjectModal";

// A simple loading component
const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen">
    {/* You can add a spinner SVG here if you like */}
    <p className="mt-4 text-lg text-gray-600">{message}</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4 text-center text-red-700 bg-red-100 rounded-lg">
    <p>
      <strong>เกิดข้อผิดพลาด:</strong> {message}
    </p>
  </div>
);

const AppContent = () => {
  // All data and UI hooks are called here, unconditionally.
  const {
    isEditModalOpen,
    isViewModalOpen,
    isCreateProjectModalOpen,
    isEditProjectModalOpen,
    isDeleteModalOpen,
    isCreateTaskModalOpen,
    currentTask,
    currentIndex,
    itemToDelete,
    currentEditingProject,
    newTaskDefaults,
    closeModals,
    openEditModal,
    openViewModal,
    navigateTask,
    openDeleteModal,
    openCreateTaskModal,
    openEditProjectModal,
  } = useUI();

  const {
    projects,
    tasks,
    initialTasks,
    loadingMessage,
    error,
    selectedProjectId,
    setSelectedProjectId,
    saveTask,
    createProject,
    updateProject,
    createTask,
    confirmDelete,
    bulkUpdateDeadline,
    isOperating,
  } = useData();

  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header
        user={user}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />
      <main className="w-full p-4 md:p-8 overflow-y-auto flex-grow relative">
        {loadingMessage ? (
          <LoadingIndicator message={loadingMessage} />
        ) : error ? (
          <ErrorDisplay message={error} />
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardTab onBulkUpdateDeadline={bulkUpdateDeadline} />} />
            <Route path="/projects" element={<ProjectsTab projects={projects} onDeleteProject={(project) => openDeleteModal("project", project)} />} />
            <Route path="/tasks/:projectName" element={<TasksTab tasks={tasks} onEditTask={openEditModal} onTaskView={(task) => openViewModal(task, tasks)} onDeleteTask={(task) => openDeleteModal("task", task)} onBulkUpdateDeadline={bulkUpdateDeadline} />} />
            <Route path="/tasks" element={<TasksTab tasks={tasks} onEditTask={openEditModal} onTaskView={(task) => openViewModal(task, tasks)} onDeleteTask={(task) => openDeleteModal("task", task)} onBulkUpdateDeadline={bulkUpdateDeadline} />} />
            <Route path="/profile" element={<ProfileTab />} />
          </Routes>
        )}
      </main>

      {/* All Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={closeModals}
        onCreate={createProject}
        initialTasks={initialTasks}
        isLoading={isOperating}
      />
      {isEditProjectModalOpen && currentEditingProject && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={closeModals}
          onUpdate={updateProject}
          onDeleteInitiate={(project) => openDeleteModal("project", project)}
          isLoading={!!loadingMessage}
          project={currentEditingProject}
        />
      )}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={closeModals}
        onCreate={createTask}
        initialData={newTaskDefaults}
        isLoading={isOperating}
      />
      {(isEditModalOpen || isViewModalOpen) && currentTask && (
        <EditTaskModal
          isOpen={isEditModalOpen || isViewModalOpen}
          isLoading={isOperating}
          onClose={closeModals}
          onSave={saveTask}
          task={currentTask}
          isViewOnly={isViewModalOpen}
          onNavigate={(direction) => navigateTask(direction, tasks)}
          canNavigatePrev={currentIndex !== null && currentIndex > 0}
          canNavigateNext={
            currentIndex !== null && currentIndex < tasks.length - 1
          }
        />
      )}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        isLoading={isOperating}
        onClose={closeModals}
        onConfirm={confirmDelete}
        title={`ยืนยันการลบ ${
          itemToDelete?.type === "project" ? "โปรเจกต์" : "Task"
        }`}
        message={
          itemToDelete?.type === "project"
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์ "${itemToDelete?.data.Name}"? การกระทำนี้จะลบ Task ทั้งหมดที่เกี่ยวข้องและไม่สามารถย้อนกลับได้`
            : `คุณแน่ใจหรือไม่ว่าต้องการลบ Task "${itemToDelete?.data.Task}"?`
        }
      />
    </div>
  );
};

const App = () => {
  // The useAuth hook is the only one called in this top-level component.
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingIndicator message="Authenticating..." />;
  }

  // The conditional rendering happens here, BEFORE other hooks would have been called.
  if (!user) {
    return <LoginScreen />;
  }

  // If the user exists, we render the main app content.
  // AppContent will then call all the other necessary hooks.
  return <AppContent />;
};

export default App;
