import React, { useState, useMemo, useEffect } from "react";
import {
  ownerOptions,
  phaseOptions,
  statusOptions,
  impactScoreOptions,
  timelinessOptions,
} from "./constants";
import type { Project, Task, TasksByOwner, TasksByStatus } from "./types";
import { Sidebar } from "./components/Sidebar";
import { AarTab } from "./components/AarTab";
import { TasksTab } from "./components/TasksTab";
import { ProjectsTab } from "./components/ProjectsTab";
import { SettingsTab } from "./components/SettingsTab";
import { EditTaskModal } from "./components/EditTaskModal";

/**
 * IMPORTANT: Replace this placeholder with your actual Google Apps Script Web App URL.
 */
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyeFXgcSG1D02uyLNYYPCafvKEhNjcM95suqFQ8qEhy6sgow-WbqhCQll14eACy3iIZ/exec";

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
  const [activeTab, setActiveTab] = useState("aar");
  const [filterTeam, setFilterTeam] = useState("ALL");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        setError("กรุณาตั้งค่า URL ของ Google Apps Script ในไฟล์ App.tsx");
        return;
      }
      setLoadingMessage("กำลังโหลดโปรเจกต์...");
      setError(null);
      try {
        const res = await fetch(`${SCRIPT_URL}?op=getProjects`);
        if (!res.ok)
          throw new Error(`ไม่สามารถโหลดโปรเจกต์ได้ (HTTP ${res.status})`);
        const data = await res.json();

        if (!Array.isArray(data))
          throw new Error("ข้อมูลโปรเจกต์ที่ได้รับไม่ถูกต้อง");

        const formattedProjects: Project[] = data.map((p: any) => ({
          ProjectID: p.projectId,
          Name: p.projectName,
          Priority: p.priority,
        }));

        setProjects(formattedProjects);
        if (formattedProjects.length > 0) {
          setSelectedProjectId(formattedProjects[0].ProjectID);
        } else {
          setTasks([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchTasks = async () => {
      setLoadingMessage(`กำลังโหลด Task ของ ${selectedProjectId}...`);
      setError(null);
      setTasks([]); // Clear existing tasks before fetching new ones

      try {
        const res = await fetch(
          `${SCRIPT_URL}?op=getTasks&projectId=${selectedProjectId}`
        );
        if (!res.ok)
          throw new Error(`ไม่สามารถโหลด Task ได้ (HTTP ${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data))
          throw new Error("ข้อมูล Task ที่ได้รับไม่ถูกต้อง");

        // --- เพิ่มส่วนนี้เข้ามาเพื่อจัดเรียงลำดับ ---

        // 1. สร้าง Array แม่แบบสำหรับเรียงลำดับ Phase
        const phaseOrder = [
          "Research & Planning",
          "Strategy & Positioning",
          "Content Preparation",
          "Pre-Launch",
          "Launch Day",
          "Post-Launch",
          "Measurement & Optimization",
        ];

        // 2. จัดเรียงข้อมูล (data) ที่ได้รับมาใหม่
        const sortedData = data.sort((a, b) => {
          const phaseAIndex = phaseOrder.indexOf(a.Phase);
          const phaseBIndex = phaseOrder.indexOf(b.Phase);

          // ถ้า Phase เหมือนกัน ให้คงลำดับเดิมไว้ (หรือจะเรียงตาม Task name ก็ได้)
          if (phaseAIndex === phaseBIndex) {
            return 0;
          }

          return phaseAIndex - phaseBIndex;
        });

        // --- จบส่วนที่เพิ่มเข้ามา ---

        // ใช้ sortedData แทน data เดิมในการ map ข้อมูล
        const formattedTasks: Task[] = sortedData.map(
          (t: any, index: number) => ({
            _id: `${t.ProjectID}-${t.rowIndex}-${index}`,
            rowIndex: t.rowIndex,
            ProjectID: t.ProjectID,
            Check:
              t["Check ✅"] === true ||
              String(t["Check ✅"]).toLowerCase() === "true",
            Phase: t.Phase,
            Task: t.Task,
            Owner: t.Owner,
            Deadline: t.Deadline
              ? new Date(t.Deadline).toISOString().split("T")[0]
              : "",
            Status: t.Status,
            "Est. Hours": Number(t["Est. Hours"]) || 0,
            "Actual Hours": t["Actual Hours"]
              ? Number(t["Actual Hours"])
              : null,
            "Impact Score": Number(t["Impact Score"]) || 0,
            Timeliness: t.Timeliness,
            "Notes / Result": t["Notes / Result"],
            "Feedback to Team": t["Feedback to Team"],
            "Owner Feedback": t["Owner Feedback"],
            "Project Feedback": t["Project Feedback"],
            MilestoneID: t.MilestoneID,
          })
        );

        setTasks(formattedTasks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    };

    fetchTasks();
  }, [selectedProjectId]);
  const {
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
  } = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.Status === "Done");
    if (completedTasks.length === 0) {
      const emptyStatusCounts: TasksByStatus = statusOptions.map((status) => ({
        name: status,
        Tasks: tasks.filter((t) => t.Status === status).length,
      }));
      const ownerCounts: TasksByOwner = ownerOptions
        .map((owner) => ({
          name: owner,
          value: tasks.filter((t) => t.Owner === owner).length,
        }))
        .filter((o) => o.value > 0);

      return {
        operationScore: "0.00",
        efficiencyRatio: "0.0",
        onTimePerformance: "0.0",
        tasksByStatus: emptyStatusCounts,
        tasksByOwner: ownerCounts,
      };
    }

    const totalImpact = completedTasks.reduce(
      (sum, task) => sum + task["Impact Score"],
      0
    );
    const opScore = totalImpact / completedTasks.length;

    const totalEst = completedTasks.reduce(
      (sum, task) => sum + task["Est. Hours"],
      0
    );
    const totalActual = completedTasks.reduce(
      (sum, task) => sum + (task["Actual Hours"] || 0),
      0
    );
    const effRatio = totalActual > 0 ? (totalEst / totalActual) * 100 : 0;

    const onTimeCount = completedTasks.filter(
      (t) => t.Timeliness === "On-Time" || t.Timeliness === "Early"
    ).length;
    const onTimePerf = (onTimeCount / completedTasks.length) * 100;

    const statusCounts: TasksByStatus = statusOptions.map((status) => ({
      name: status,
      Tasks: tasks.filter((t) => t.Status === status).length,
    }));

    const ownerCounts: TasksByOwner = ownerOptions
      .map((owner) => ({
        name: owner,
        value: tasks.filter((t) => t.Owner === owner).length,
      }))
      .filter((o) => o.value > 0);

    return {
      operationScore: opScore.toFixed(2),
      efficiencyRatio: effRatio.toFixed(1),
      onTimePerformance: onTimePerf.toFixed(1),
      tasksByStatus: statusCounts,
      tasksByOwner: ownerCounts,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterTeam === "ALL") return tasks;
    return tasks.filter(
      (task) =>
        task["Feedback to Team"] &&
        task["Feedback to Team"].includes(`@${filterTeam}`)
    );
  }, [tasks, filterTeam]);

  const handleEditClick = (task: Task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (task: Task) => {
        const findIndex = tasks.findIndex(t => t._id === task._id);
        setCurrentIndex(findIndex);
        setCurrentTask(task);
        setIsViewModalOpen(true);
    };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setCurrentTask(null);
    setCurrentIndex(null);
  };

  const handleNavigateTask = (direction: 'next' | 'previous') => {
        if (currentIndex === null || !tasks) return;

        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        // เช็คว่า index ใหม่ยังอยู่ในขอบเขตของ Array
        if (newIndex >= 0 && newIndex < tasks.length) {
            setCurrentIndex(newIndex);
            setCurrentTask(tasks[newIndex]);
        }
    };

  const handleSaveTask = async (updatedTask: Task) => {
    if (!currentTask) return;
    setLoadingMessage("กำลังบันทึกการเปลี่ยนแปลง...");
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        redirect: "follow",
        body: JSON.stringify({ op: "updateTask", task: updatedTask }),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      });

      // Optimistic UI update using the stable client-side _id
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      handleCloseModal();
    } catch (err: any) {
      setError(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
    } finally {
      setLoadingMessage(null);
    }
  };

  const tabTitles: { [key: string]: string } = {
    aar: `สรุปผล: ${
      projects.find((p) => p.ProjectID === selectedProjectId)?.Name || ""
    }`,
    tasks: `รายการ Task: ${
      projects.find((p) => p.ProjectID === selectedProjectId)?.Name || ""
    }`,
    projects: "โปรเจกต์ทั้งหมด",
    config: "ตั้งค่า",
  };

  const renderContent = () => {
    if (loadingMessage && !isEditModalOpen)
      return <LoadingIndicator message={loadingMessage} />;
    if (error) return <ErrorDisplay message={error} />;
    if (projects.length === 0 && !loadingMessage) {
      return (
        <div className="text-center text-gray-500 mt-10">ไม่พบโปรเจกต์</div>
      );
    }
    if (projects.length > 0 && !selectedProjectId) {
      return (
        <div className="text-center text-gray-500 mt-10">
          กรุณาเลือกโปรเจกต์
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
            filteredTasks={filteredTasks}
            onEditTask={handleEditClick}
            onTaskView={handleViewClick}
          />
        );
      case "projects":
        return <ProjectsTab projects={projects} />;
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
      />
      
      <main className="w-3/4 p-8 overflow-y-auto flex flex-col">
        <header className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-3xl font-bold text-gray-800 truncate pr-4">
            {tabTitles[activeTab]}
          </h2>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <label
              htmlFor="project-selector"
              className="text-sm font-medium text-gray-700"
            >
              Select Operation:
            </label>
            <select
              id="project-selector"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={!projects.length}
              className="w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              {projects.length === 0 && !loadingMessage && (
                <option>ไม่พบโปรเจกต์</option>
              )}
              {projects.map((p) => (
                <option key={p.ProjectID} value={p.ProjectID}>
                  {p.Name}
                </option>
              ))}
            </select>
          </div>
        </header>
        <div className="flex-grow relative">
          {loadingMessage && isEditModalOpen && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-20 flex items-center justify-center">
              <LoadingIndicator message={loadingMessage} />
            </div>
          )}
          {renderContent()}
        </div>
      </main>
      {(isEditModalOpen || isViewModalOpen) && currentTask && (
        <EditTaskModal
          isOpen={isEditModalOpen || isViewModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          task={currentTask}
          isViewOnly={isViewModalOpen}
          onNavigate={handleNavigateTask}
          canNavigatePrev={currentIndex !== null && currentIndex > 0}
          canNavigateNext={currentIndex !== null && currentIndex < tasks.length - 1}
        />
      )}
    </div>
  );
};

export default App;
