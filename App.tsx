// App.tsx
import React from "react";
import { ownerOptions, phaseOptions, statusOptions } from "./constants";
// Import Context Hooks (ปรับ Path ตามโครงสร้างโปรเจกต์ของคุณ)
import { useUI } from "./contexts/UIContext";
import { useData } from "./contexts/DataContext";
import { Sidebar } from "./components/Sidebar";
import { AarTab } from "./components/AarTab";
import { TasksTab } from "./components/TasksTab";
import { ProjectsTab } from "./components/ProjectsTab";
import { SettingsTab } from "./components/SettingsTab";
import { EditTaskModal } from "./components/EditTaskModal";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { CreateTaskModal } from "./components/CreateTaskModal";
import { MenuIcon } from "./components/icons";
import { EditProjectModal } from "./components/EditProjectModal";
import type { Project } from "./types";
import { OwnerViewTab } from './components/OwnerViewTab';
import { AllTasksTeamViewTab } from './components/AllTasksTeamViewTab';
import { DashboardTab } from "./components/DashboardTab";



// Helper Components (ย้ายมาจากโค้ดเดิม)
const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <svg
      className="animate-spin -ml-1 mr-3 h-10 w-10 text-orange-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <p className="mt-4 text-lg text-gray-600">{message}</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
    role="alert"
  >
    <strong className="font-bold">เกิดข้อผิดพลาด: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);



const App = () => {
  // --- UI Context ---
  const {
    activeTab,
    setActiveTab,
    filterTeam,
    setFilterTeam,
    isSidebarOpen,
    setIsSidebarOpen,
    isEditModalOpen,
    isViewModalOpen,
    isCreateProjectModalOpen,
    isEditProjectModalOpen,
    isDeleteModalOpen,
    newTaskDefaults,
    isCreateTaskModalOpen,
    currentTask,
    currentIndex,
    itemToDelete,
    phaseForNewTask,
    openEditModal,
    openViewModal,
    closeModals,
    openCreateProjectModal,
    currentEditingProject,
    openDeleteModal,
    openCreateTaskModal,
    navigateTask,
  } = useUI();

  // --- Data Context ---
  const {
    projects,
    tasks,
    initialTasks,
    selectedProjectId,
    setSelectedProjectId,
    handleProjectSelect,
    loadingMessage,
    error,
    filteredTasks,
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
    saveTask,
    createProject,
    updateProject,
    createTask,
    confirmDelete,
  } = useData();

  const handleModalDeleteInitiate = (project: Project) => {
    closeModals();
    setTimeout(() => {
      openDeleteModal("project", project);
    }, 150);
  };

  const tabTitles: { [key: string]: string } = {

    aar: `สรุปผล: ${projects.find((p) => p.ProjectID === selectedProjectId)?.Name || ""
      }`,
    tasks: `รายการ Task: ${projects.find((p) => p.ProjectID === selectedProjectId)?.Name || ""
      }`,
    'owner-view': `มุมมองทีม: ${projects.find(p => p.ProjectID === selectedProjectId)?.Name || ""}`,
    'all-tasks-team-view': "มุมมองทีม (ทุกโปรเจกต์)",
    dashboard: "Dashboard & Global Filters",
    projects: "โปรเจกต์ทั้งหมด",
    config: "ตั้งค่า",
  };

  // ตรวจสอบว่ามี Modal ใดเปิดอยู่หรือไม่ เพื่อจัดการการแสดง Loading
  const isAnyModalOpen =
    isEditModalOpen ||
    isViewModalOpen ||
    isCreateProjectModalOpen ||
    isCreateTaskModalOpen ||
    isDeleteModalOpen;

  const renderContent = () => {
    // Global Loading (แสดงเมื่อไม่มี Modal เปิด)
    if (loadingMessage && !isAnyModalOpen)
      return <LoadingIndicator message={loadingMessage} />;

    if (error) return <ErrorDisplay message={error} />;

    // if (projects.length === 0 && !loadingMessage) {
    //   return (
    //     <div className="text-center text-gray-500 mt-10">ไม่พบโปรเจกต์</div>
    //   );
    if (projects.length > 0 && !selectedProjectId && !["projects", "config", 'dashboard'].includes(activeTab)) {
      // ถ้ามีโปรเจกต์แต่ยังไม่ได้เลือก ให้เลือกโปรเจกต์แรกโดยอัตโนมัติ
      setSelectedProjectId(projects[0].ProjectID);
      return <LoadingIndicator message="กำลังโหลดข้อมูลโปรเจกต์..." />; 
    }

    // สถานะที่รอการเลือกโปรเจกต์ (เช่น ตอนโหลดครั้งแรก)
    if (
      projects.length > 0 &&
      !selectedProjectId &&
      activeTab !== "projects" &&
      activeTab !== "config" &&
      activeTab !== "all-tasks-team-view"
      && activeTab !== "dashboard"
    ) {
      return (
        <div className="text-center text-gray-500 mt-10">
          กำลังโหลดข้อมูลโปรเจกต์...
        </div>
      );
    }

    switch (activeTab) {
      case "aar":
        return (
          <AarTab
            operationScore={operationScore}
            efficiencyRatio={efficiencyRatio}
            onTimePerformance={onTimePerformance}
            tasksByStatus={tasksByStatus}
            tasksByOwner={tasksByOwner}
          />
        );
      case "tasks":
        return (
          <TasksTab
            tasks={tasks}
            filteredTasks={filteredTasks}
            onEditTask={openEditModal}
            // สำคัญ: ส่ง tasks ปัจจุบันไปให้ UIContext เพื่อคำนวณ Index
            onTaskView={(task) => openViewModal(task, tasks)}
            onDeleteTask={(taskId) =>
              openDeleteModal(
                "task",
                tasks.find((t) => t._id === taskId)
              )
            }
            onOpenCreateTask={openCreateTaskModal}
          />
        );
      case "projects":
        return (
          <ProjectsTab
            projects={projects}
            // ใช้ Action ที่รวมการเลือกโปรเจกต์และเปลี่ยน Tab
            onSelectProject={handleProjectSelect}
            onDeleteProject={(project) => openDeleteModal("project", project)}
          />
        );
      case "config":
        return (
          <SettingsTab
            ownerOptions={ownerOptions}
            statusOptions={statusOptions}
            phaseOptions={phaseOptions}
          />
        );
      default:
        return null;

      case "owner-view":
        return <OwnerViewTab />;

      case "all-tasks-view":
            return <AllTasksTeamViewTab />;

      case "dashboard":
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filterTeam={filterTeam}
        setFilterTeam={setFilterTeam}
        ownerOptions={ownerOptions}
        onOpenCreateProject={openCreateProjectModal}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="w-full p-4 md:p-8 overflow-y-auto flex flex-col">
        <header className="flex flex-wrap justify-between items-center mb-6 pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <button
              className="p-2 mr-2 text-gray-600 hover:text-orange-500 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon />
            </button>
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 truncate">
              {tabTitles[activeTab]}
            </h2>
          </div>

          {/* Project Selector */}
          {/* <div className="flex items-center space-x-2 flex-shrink-0">
            <label
              htmlFor="project-selector"
              className="hidden md:block text-sm font-medium text-gray-700"
            >
              Select Operation:
            </label>
            <select
              id="project-selector"
              value={selectedProjectId || ""}
              // ใช้ State Setter ปกติ เพื่อไม่ให้บังคับเปลี่ยน Tab เมื่อเลือกจาก Dropdown
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={!projects.length}
              className="w-48 md:w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              {projects.length === 0 && <option value="ALL">ไม่พบโปรเจกต์</option>}
              {projects.map((p) => (
                <option key={p.ProjectID} value={p.ProjectID}>
                  {p.Name}
                </option>
              ))}
            </select>
          </div> */}
        </header>

        <div className="flex-grow relative">
          {/* Overlay Loading Indicator (สำหรับตอนบันทึกข้อมูลใน Modal) */}
          {loadingMessage && isAnyModalOpen && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-20 flex items-center justify-center">
              <LoadingIndicator message={loadingMessage} />
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {/* หมายเหตุ: DataContext จะเป็นผู้สั่งปิด Modal เหล่านี้เอง (ผ่าน closeModals) เมื่อ Action สำเร็จ */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={closeModals}
        onCreate={createProject}
        initialTasks={initialTasks}
        isLoading={!!loadingMessage}
      />
      {isEditProjectModalOpen && currentEditingProject && (
        <EditProjectModal
            isOpen={isEditProjectModalOpen}
            onClose={closeModals}
            onUpdate={updateProject}
            onDeleteInitiate={handleModalDeleteInitiate}
            isLoading={!!loadingMessage}
            project={currentEditingProject}
        />
      )}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={closeModals}
        onCreate={createTask}
        initialData={newTaskDefaults}
        isLoading={!!loadingMessage}
      />
      {(isEditModalOpen || isViewModalOpen) && currentTask && (
        <EditTaskModal
          isOpen={isEditModalOpen || isViewModalOpen}
          onClose={closeModals}
          onSave={saveTask}
          task={currentTask}
          isViewOnly={isViewModalOpen}
          // สำคัญ: ส่ง tasks ปัจจุบันไปให้ UIContext เพื่อการนำทาง
          onNavigate={(direction) => navigateTask(direction, tasks)}
          canNavigatePrev={currentIndex !== null && currentIndex > 0}
          canNavigateNext={
            currentIndex !== null && currentIndex < tasks.length - 1
          }
        />
      )}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
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
        isLoading={!!loadingMessage}
      />
      
    </div>
  );
};

export default App;
