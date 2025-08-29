// contexts/DataContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Project, Task, TasksByOwner, TasksByStatus } from "../types";
import { v4 as uuidv4 } from "uuid";
import { statusOptions, ownerOptions } from "../constants";
import { useUI } from "./UIContext"; // Import useUI

const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

interface DataContextType {
  // Data State
  projects: Project[];
  tasks: Task[];
  initialTasks: Task[];
  selectedProjectId: string | null;
  allTsks: Task[];
  isLoadingAllTasks: boolean;

  // Status State
  loadingMessage: string | null;
  error: string | null;

  // Derived Data
  filteredTasks: Task[];
  operationScore: string;
  efficiencyRatio: string;
  onTimePerformance: string;
  tasksByStatus: TasksByStatus;
  tasksByOwner: TasksByOwner;

  // Actions
  setSelectedProjectId: (id: string | null) => void;
  handleProjectSelect: (projectId: string) => void;
  saveTask: (updatedTask: Task) => Promise<void>;
  createProject: (
    projectName: string,
    priority: number,
    selectedTasks: Task[]
  ) => Promise<void>;
  updateProject: (
    projectId: string,
    updatedData: { Name: string; Priority: number }
  ) => Promise<void>;
  createTask: (
    newTaskData: Omit<Task, "rowIndex" | "_id" | "Check">
  ) => Promise<void>;
  confirmDelete: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // เข้าถึง UI Context
  const { filterTeam, itemToDelete, closeModals, setActiveTab } = useUI();

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [initialTasks, setInitialTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Status States
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Utility Functions & Constants ---
  const phaseOrder = useMemo(
    () => [
      "Research & Planning",
      "Strategy & Positioning",
      "Content Preparation",
      "Pre-Launch",
      "Launch Day",
      "Post-Launch",
      "Measurement & Optimization",
    ],
    []
  );

  const formatAndSortTasks = useCallback(
    (data: any[]): Task[] => {
      const sortedData = [...data].sort((a, b) => {
        const phaseAIndex = phaseOrder.indexOf(a.Phase);
        const phaseBIndex = phaseOrder.indexOf(b.Phase);
        if (phaseAIndex === phaseBIndex) return 0;
        return phaseAIndex - phaseBIndex;
      });

      return sortedData.map((t: any, index: number) => ({
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
        "Actual Hours": t["Actual Hours"] ? Number(t["Actual Hours"]) : null,
        "Impact Score": Number(t["Impact Score"]) || 0,
        Timeliness: t.Timeliness,
        "Notes / Result": t["Notes / Result"],
        "Feedback to Team": t["Feedback to Team"],
        "Owner Feedback": t["Owner Feedback"],
        "Project Feedback": t["Project Feedback"],
        MilestoneID: t.MilestoneID,
      }));
    },
    [phaseOrder]
  );

  // --- API Calls ---

  const fetchProjects = useCallback(async () => {
    if (
      !SCRIPT_URL ||
      SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")
    ) {
      setError("กรุณาตั้งค่า URL ของ Google Apps Script (VITE_APP_SCRIPT_URL)");
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

      formattedProjects.sort((a, b) => {
        return a.Priority - b.Priority;
      });

      setProjects(formattedProjects);

      // Auto-select logic
      if (formattedProjects.length > 0) {
        // ตรวจสอบว่า ID ที่เลือกไว้ปัจจุบันยังคงมีอยู่หรือไม่ ถ้าไม่มี ให้เลือกโปรเจกต์แรก
        setSelectedProjectId((currentId) => {
          if (
            !currentId ||
            !formattedProjects.find((p) => p.ProjectID === currentId)
          ) {
            return formattedProjects[0].ProjectID;
          }
          return currentId;
        });
      } else {
        setSelectedProjectId(null);
        setTasks([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMessage(null);
    }
  }, []);

  const fetchTasks = useCallback(
    async (projectId: string) => {
      setLoadingMessage(`กำลังโหลด Task...`);
      setError(null);
      setTasks([]); // Clear existing tasks

      try {
        const res = await fetch(
          `${SCRIPT_URL}?op=getTasks&projectId=${projectId}`
        );
        if (!res.ok)
          throw new Error(`ไม่สามารถโหลด Task ได้ (HTTP ${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data))
          throw new Error("ข้อมูล Task ที่ได้รับไม่ถูกต้อง");

        const formattedTasks = formatAndSortTasks(data);
        setTasks(formattedTasks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    },
    [formatAndSortTasks]
  );

  const fetchInitialTasks = useCallback(async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?op=getInitialTasks`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((t, i) => ({ ...t, _id: `init-${i}` }));
        setInitialTasks(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch initial tasks:", err);
    }
  }, []);

  const fetchAllTasks = useCallback(() => {
    setLoadingMessage("กำลังรีเฟรชข้อมูล Task ทั้งหมด...");
    fetch(`${SCRIPT_URL}?op=getAllTasks`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAllTasks(data); // สมมติว่ามี state ชื่อ allTasks
        }
      })
      .catch((error) => {
        console.error("Error fetching all tasks:", error);
        setError("ไม่สามารถโหลดข้อมูล Task ทั้งหมดได้");
      })
      .finally(() => {
        setLoadingMessage(null);
      });
  }, []);

  // --- Effects ---

  useEffect(() => {
    fetchProjects();
    fetchInitialTasks();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    } else {
      setTasks([]);
    }
  }, [selectedProjectId, fetchTasks]);

  useEffect(() => {
    if (!selectedProjectId || allTasks.length === 0) {
      setTasks([]);
      return;
    }
    if (selectedProjectId === "ALL") {
      setTasks(allTasks);
      setLoadingMessage("");
    } else {
      setLoadingMessage("กำลังโหลด Task...");

      const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;
      fetch(`${SCRIPT_URL}?op=getTasks&projectId=${selectedProjectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTasks(data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch tasks for selected project:", err);
          setError("ไม่สามารถโหลดข้อมูล Task ได้");
        })
        .finally(() => {
          setLoadingMessage("");
        });
    }
  }, [selectedProjectId, allTasks]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // --- Data Mutations & Actions ---

  // Action สำหรับเลือกโปรเจกต์และเปลี่ยน Tab (ใช้ใน ProjectsTab)
  const handleProjectSelect = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setActiveTab("tasks");
    },
    [setActiveTab]
  );

  const saveTask = useCallback(
    async (updatedTask: Task) => {
      setLoadingMessage("กำลังบันทึกการเปลี่ยนแปลง...");
      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          redirect: "follow",
          body: JSON.stringify({ op: "updateTask", task: updatedTask }),
          headers: { "Content-Type": "text/plain;charset=utf-8" },
        });

        // Optimistic UI update
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
        closeModals(); // ปิด Modal เมื่อสำเร็จ (จาก UIContext)
      } catch (err: any) {
        setError(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
      } finally {
        setLoadingMessage(null);
      }
    },
    [closeModals]
  );

  const createProject = useCallback(
    async (projectName: string, priority: number, selectedTasks: Task[]) => {
      setLoadingMessage("กำลังสร้างโปรเจกต์...");
      const newProjectId = `PROJ-${uuidv4().slice(0, 8).toUpperCase()}`;
      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            op: "createNewProject",
            project: {
              projectId: newProjectId,
              projectName: projectName,
              priority: priority,
              selectedTasks: selectedTasks,
            },
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" },
        });
        await fetchProjects();
        setSelectedProjectId(newProjectId);
        setActiveTab("dashboard"); // เปลี่ยน Tab (จาก UIContext)
        closeModals(); // ปิด Modal (จาก UIContext)
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    },
    [fetchProjects, setActiveTab, closeModals]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      updatedData: { Name: string; Priority: number }
    ) => {
      setLoadingMessage("กำลังอัปเดตโปรเจกต์...");
      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            op: "updateProject",
            projectId: projectId,
            updatedData: {
              projectName: updatedData.Name,
              priority: updatedData.Priority,
            },
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" },
        });

        // Refetch เพื่อให้ข้อมูลและการเรียงลำดับถูกต้อง
        await fetchProjects();
        closeModals();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    },
    [fetchProjects, closeModals]
  );

  const createTask = useCallback(
    async (newTaskData: Omit<Task, "rowIndex" | "_id" | "Check">) => {
      if (!selectedProjectId) return;

      setLoadingMessage("กำลังสร้าง Task ใหม่...");
      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            op: "createTask",
            taskData: { ...newTaskData, ProjectID: selectedProjectId },
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" },
        });
        await fetchTasks(selectedProjectId);
        closeModals(); // ปิด Modal (จาก UIContext)
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessage(null);
      }
    },
    [selectedProjectId, fetchTasks, closeModals]
  );

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return; // itemToDelete มาจาก UIContext

    setLoadingMessage("กำลังลบข้อมูล...");
    const { type, data } = itemToDelete;

    try {
      const op = type === "task" ? "deleteTask" : "deleteProject";
      const body =
        type === "task"
          ? { op, rowIndex: data.rowIndex }
          : { op, projectId: data.ProjectID };

      await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      });

      if (type === "task") {
        // Optimistic update for task
        setTasks((prev) => prev.filter((t) => t._id !== data._id));
      } else {
        // Refetch projects after deletion เพื่อความถูกต้องของข้อมูล
        await fetchProjects();
      }
      closeModals(); // ปิด Modal (จาก UIContext)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMessage(null);
    }
  }, [itemToDelete, fetchProjects, closeModals]);

  // --- Derived/Calculated Data (Memoized) ---

  // คำนวณ filteredTasks โดยใช้ filterTeam จาก UIContext
  const filteredTasks = useMemo(() => {
    if (filterTeam === "ALL") return tasks;
    return tasks.filter(
      (task) =>
        task["Feedback to Team"] &&
        task["Feedback to Team"].includes(`@${filterTeam}`)
    );
  }, [tasks, filterTeam]);

  const {
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
    incompleteCount,
    overdueCount,
    warningCount,
    doneCount,
  } = useMemo(() => {
    const today = new Date();
    const warningData = new Date();
    warningData.setDate(today.getDate() + 10); // กำหนดช่วงเวลาเตือน 10 วัน
    const incompleteTasks = allTasks.filter(
      (t) => t.Status !== "Done" && t.Status !== "Cancelled"
    );
    const overdueTasks = incompleteTasks.filter(
      (t) => t.Deadline && new Date(t.Deadline) < today
    );
    const warningTasks = incompleteTasks.filter((t) => {
      if (!tasks.Deadline) return false;
      const deadlineDate = new Date(tasks.Deadline);
      return deadlineDate >= today && deadlineDate <= warningData;
    });

    const completedTasks = allTasks.filter((t) => t.Status === "Done");

    // คำนวณสถิติพื้นฐาน
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

    if (completedTasks.length === 0) {
      return {
        operationScore: "0.00",
        efficiencyRatio: "0.0",
        onTimePerformance: "0.0",
        tasksByStatus: statusCounts,
        tasksByOwner: ownerCounts,
      };
    }

    // คำนวณคะแนน
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

    return {
      operationScore: opScore.toFixed(2),
      efficiencyRatio: effRatio.toFixed(1),
      onTimePerformance: onTimePerf.toFixed(1),
      tasksByStatus: statusCounts,
      tasksByOwner: ownerCounts,
      incompleteCount: incompleteTasks.length,
      overdueCount: overdueTasks.length,
      warningCount: warningTasks.length,
      doneCount: completedTasks.length,
    };
  }, [tasks, allTasks]);

  const value = {
    projects,
    tasks,
    initialTasks,
    selectedProjectId,
    loadingMessage,
    error,
    fetchAllTasks,

    filteredTasks,
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,

    setSelectedProjectId,
    handleProjectSelect,
    saveTask,
    createProject,
    updateProject,
    createTask,
    confirmDelete,
    allTasks,
    isLoadingAllTasks: loadingMessage === "กำลังโหลด Task...",
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
