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
import type {
  Project,
  Task,
  TasksByOwner,
  TasksByStatus,
  HistoryEntry,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { statusOptions, ownerOptions } from "../constants";
import { useUI } from "./UIContext";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/services/api";

// --- Context Definition (ปรับปรุง Loading States) ---

interface DataContextType {
  // Data State
  projects: Project[];
  tasks: Task[];
  initialTasks: Task[];
  selectedProjectId: string | null;
  allTasks: Task[];

  // Status State
  isLoadingProjects: boolean;
  isLoadingTasks: boolean;
  isLoadingAllTasks: boolean;
  isOperating: boolean; // สำหรับ Create/Update/Delete
  error: string | null;

  //History State
  taskHistory: HistoryEntry[];
  isLoadingHistory: boolean;

  // Derived Data
  // filteredTasks: Task[]; -- remove
  operationScore: string;
  efficiencyRatio: string;
  onTimePerformance: string;
  totalCompletedTasks: number;
  totalImpactDelivered: number;
  workInProgressCount: number;
  overdueTaskCount: number;
  tasksByStatus: TasksByStatus;
  tasksByOwner: TasksByOwner;

  //Derived Data (Global - Aggregated)
  globalTasksByStatus: TasksByStatus;
  globalTasksByOwner: TasksByOwner;

  // Actions
  setSelectedProjectId: (id: string | null) => void;
  handleProjectSelect: (projectId: string) => void;
  saveTask: (updatedTask: Task) => Promise<void>;
  bulkUpdateDeadline: (taskIds: string[], newDeadline: string) => Promise<void>;
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
  refreshAllData: () => Promise<void>;
  fetchTaskHistory: (taskId: string) => Promise<void>;
  clearTaskHistory: () => void;
}

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
import { useUI } from "./UIContext";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/services/api";

// --- Context Definition (ปรับปรุง Loading States) ---

interface DataContextType {
  // Data State
  projects: Project[];
  tasks: Task[];
  initialTasks: Task[];
  selectedProjectId: string | null;
  allTasks: Task[];

  // Status State
  isLoadingProjects: boolean;
  isLoadingTasks: boolean;
  isLoadingAllTasks: boolean;
  isOperating: boolean; // สำหรับ Create/Update/Delete
  error: string | null;

  // Derived Data
  operationScore: string;
  efficiencyRatio: string;
  onTimePerformance: string;
  totalCompletedTasks: number;
  totalImpactDelivered: number;
  workInProgressCount: number;
  overdueTaskCount: number;
  tasksByStatus: TasksByStatus;
  tasksByOwner: TasksByOwner;

  //Derived Data (Global - Aggregated)
  globalTasksByStatus: TasksByStatus;
  globalTasksByOwner: TasksByOwner;

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
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Provider Component ---

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { itemToDelete, closeModals, setActiveTab } = useUI();

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // Task ของโปรเจกต์ปัจจุบัน
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Task ทั้งหมดในระบบ
  const [initialTasks, setInitialTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Status States (ปรับปรุงใหม่)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingAllTasks, setIsLoadingAllTasks] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!Array.isArray(data)) return [];

      const sortedData = [...data].sort((a, b) => {
        const phaseAIndex = phaseOrder.indexOf(a.Phase);
        const phaseBIndex = phaseOrder.indexOf(b.Phase);
        if (phaseAIndex === phaseBIndex) return 0;
        return phaseAIndex < phaseBIndex ? -1 : 1;
      });
      const formatToLocalISODate = (gasDate: any): string => {
        if (!gasDate) return "";
        const date = new Date(gasDate); // Browser ตีความตาม Local Time
        if (isNaN(date.getTime())) return "";

        // จัดรูปแบบ YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      return sortedData.map((t: any) => ({
        _id: t._id || `temp-${uuidv4()}`,
        rowIndex: t.rowIndex,
        ProjectID: t.ProjectID,
        Check:
          t["Check ✅"] === true ||
          String(t["Check ✅"]).toLowerCase() === "true",
        Phase: t.Phase,
        Task: t.Task,
        Owner: t.Owner,
        Deadline: formatToLocalISODate(t.Deadline),
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
        HelpAssignee: t.HelpAssignee || null,
        HelpDetails: t.HelpDetails || null,
        HelpRequestedAt: formatToLocalISODate(t.HelpRequestedAt) || null,
      }));
    },
    [phaseOrder]
  );

  // --- API Calls (Refactored) ---

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    setError(null);
    try {
      const data = await apiRequest<any[]>("/projects", "GET");

      const formattedProjects: Project[] = data.map((p: any) => ({
        ProjectID: p.projectId,
        Name: p.projectName,
        Priority: p.priority,
      }));
      formattedProjects.sort((a, b) => a.Priority - b.Priority);
      setProjects(formattedProjects);

      setSelectedProjectId((currentId) => {
        if (
          !currentId ||
          !formattedProjects.find((p) => p.ProjectID === currentId)
        ) {
          return formattedProjects.length > 0
            ? formattedProjects[0].ProjectID
            : null;
        }
        return currentId;
      });
    } catch (err: any) {
      setError(`โหลดโปรเจกต์ล้มเหลว: ${err.message}`);
      console.error("fetchProjects Error:", err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user]);

  const fetchAllTasks = useCallback(async () => {
    if (!user) return;
    setIsLoadingAllTasks(true);
    try {
      const data = await apiRequest<any[]>("/tasks", "GET");
      const formatted = formatAndSortTasks(data);
      setAllTasks(formatted);
    } catch (error: any) {
      console.error("Error fetching all tasks:", error);
    } finally {
      setIsLoadingAllTasks(false);
    }
  }, [user, formatAndSortTasks]);

  const fetchTasksForProject = useCallback(
    async (projectId: string) => {
      if (!user || projectId === "ALL") return;

      setIsLoadingTasks(true);
      setError(null);

      try {
        const data = await apiRequest<any[]>(
          `/tasks?projectId=${projectId}`,
          "GET"
        );
        const formattedTasks = formatAndSortTasks(data);
        setTasks(formattedTasks);
      } catch (err: any) {
        setError(`โหลด Task ล้มเหลว: ${err.message}`);
        console.error("fetchTasks Error:", err);
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [user, formatAndSortTasks]
  );

  const fetchInitialTasks = useCallback(async () => {
    try {
      const data = await apiRequest<any[]>("/tasks", "GET");
      const formatted = formatAndSortTasks(data);
      setInitialTasks(formatted);
    } catch (err) {
      console.error("Failed to fetch initial tasks:", err);
    }
  }, [formatAndSortTasks]);

  const refreshAllData = useCallback(async () => {
    if (user) {
      await Promise.all([fetchProjects(), fetchAllTasks()]);
    }
  }, [user, fetchProjects, fetchAllTasks]);

  // --- Effects ---

  useEffect(() => {
    fetchInitialTasks();

    if (user) {
      refreshAllData();
    } else {
      setProjects([]);
      setTasks([]);
      setAllTasks([]);
      setSelectedProjectId(null);
    }
  }, [user, refreshAllData, fetchInitialTasks]);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    if (selectedProjectId !== "ALL") {
      setTasks([]);
      fetchTasksForProject(selectedProjectId);
    }
  }, [selectedProjectId, fetchTasksForProject]);

  useEffect(() => {
    if (selectedProjectId === "ALL") {
      setTasks(allTasks);
    }
  }, [allTasks, selectedProjectId]);

  // --- Data Mutations & Actions ---

  const handleApiAction = useCallback(async (action: () => Promise<void>) => {
    setIsOperating(true);
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(`การดำเนินการล้มเหลว: ${err.message}`);
      console.error("API Action Error:", err);
      throw err;
    } finally {
      setIsOperating(false);
    }
  }, []);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setActiveTab("tasks");
    },
    [setActiveTab]
  );

  const saveTask = useCallback(
    async (updatedTask: Task) => {
      if (!user) return;

      let previousTasks: Task[] = [];
      let previousAllTasks: Task[] = [];

      const updateState = (prevTasks: Task[]) =>
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t));

      setTasks((prev) => {
        previousTasks = prev;
        return updateState(prev);
      });
      setAllTasks((prev) => {
        previousAllTasks = prev;
        return updateState(prev);
      });

      try {
        await handleApiAction(async () => {
          await apiRequest(`/tasks/${updatedTask._id}`, "PUT", updatedTask);
          closeModals();
        });
      } catch (err) {
        setTasks(previousTasks);
        setAllTasks(previousAllTasks);
        throw err;
      }
    },
    [user, closeModals, handleApiAction]
  );

  const createProject = useCallback(
    async (projectName: string, priority: number, selectedTasks: Task[]) => {
      if (!user) return;
      const newProjectId = `PROJ-${uuidv4().slice(0, 8).toUpperCase()}`;

      await handleApiAction(async () => {
        await apiRequest("/projects", "POST", {
          projectId: newProjectId,
          projectName: projectName,
          priority: priority,
          details: "", // Add a default value for details
        });

        // Create tasks for the new project
        for (const task of selectedTasks) {
          const newTask = {
            ...task,
            _id: uuidv4(),
            ProjectID: newProjectId,
          };
          await apiRequest("/tasks", "POST", newTask);
        }

        await refreshAllData();
        setSelectedProjectId(newProjectId);
        setActiveTab("dashboard");
        closeModals();
      });
    },
    [user, refreshAllData, setActiveTab, closeModals, handleApiAction]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      updatedData: { Name: string; Priority: number }
    ) => {
      if (!user) return;

      await handleApiAction(async () => {
        await apiRequest(`/projects/${projectId}`, "PUT", {
          projectName: updatedData.Name,
          priority: updatedData.Priority,
        });

        await fetchProjects();
        closeModals();
      });
    },
    [user, fetchProjects, closeModals, handleApiAction]
  );

  const createTask = useCallback(
    async (newTaskData: Omit<Task, "rowIndex" | "_id" | "Check">) => {
      if (!user || !selectedProjectId || selectedProjectId === "ALL") return;

      const newTask = {
        ...newTaskData,
        _id: uuidv4(),
        ProjectID: selectedProjectId,
      };

      await handleApiAction(async () => {
        await apiRequest("/tasks", "POST", newTask);

        await fetchTasksForProject(selectedProjectId);
        await fetchAllTasks();
        closeModals();
      });
    },
    [
      user,
      selectedProjectId,
      fetchTasksForProject,
      fetchAllTasks,
      closeModals,
      handleApiAction,
    ]
  );

  const confirmDelete = useCallback(async () => {
    if (!user || !itemToDelete) return;

    const { type, data } = itemToDelete;

    let previousTasks: Task[] = [];
    let previousAllTasks: Task[] = [];

    try {
      if (type === "task") {
        setTasks((prev) => {
          previousTasks = prev;
          return prev.filter((t) => t._id !== data._id);
        });
        setAllTasks((prev) => {
          previousAllTasks = prev;
          return prev.filter((t) => t._id !== data._id);
        });
      }

      await handleApiAction(async () => {
        if (type === "task") {
          await apiRequest(`/tasks/${data._id}`, "DELETE");
        } else {
          await apiRequest(`/projects/${data.ProjectID}`, "DELETE");
        }

        if (type !== "task") {
          await refreshAllData();
        }
        closeModals();
      });
    } catch (err) {
      if (type === "task") {
        setTasks(previousTasks);
        setAllTasks(previousAllTasks);
      }
    }
  }, [user, itemToDelete, refreshAllData, closeModals, handleApiAction]);

  // --- Derived/Calculated Data (Memoized) ---
  const {
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
    globalTasksByStatus,
    globalTasksByOwner,
    totalCompletedTasks,
    totalImpactDelivered,
    workInProgressCount,
    overdueTaskCount,
  } = useMemo(() => {
    const getTodayYYYYMMDD = () => {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${year}-${month}-${day}`; // YYYY-MM-DD
    };

    const today = getTodayYYYYMMDD();

    const globalStatusCounts: TasksByStatus = statusOptions.map((status) => ({
      name: status,
      Tasks: allTasks.filter((t) => t.Status === status).length,
    }));

    const ownerCountsMap = new Map<string, number>();
    allTasks.forEach((task) => {
      if (task.Owner) {
        ownerCountsMap.set(
          task.Owner,
          (ownerCountsMap.get(task.Owner) || 0) + 1
        );
      }
    });
    const globalOwnerCounts: TasksByOwner = Array.from(
      ownerCountsMap,
      ([name, value]) => ({ name, value })
    );
    globalOwnerCounts.sort((a, b) => b.value - a.value);

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

    const completedTasks = tasks.filter((t) => t.Status === "Done");
    const incompleteTasks = tasks.filter(
      (t) => t.Status !== "Done" && t.Status !== "Cancelled"
    );

    const completedCount = completedTasks.length;
    const impactDelivered = completedTasks.reduce(
      (sum, task) => sum + task["Impact Score"],
      0
    );
    const wipStatuses = ["In Progress", "Doing", "Reviewing", "Help Me"];
    const relevantWipStatuses = wipStatuses.filter((status) =>
      statusOptions.includes(status)
    );
    const wipCount = tasks.filter((t) =>
      relevantWipStatuses.includes(t.Status)
    ).length;

    const overdueCount = incompleteTasks.filter(
      (t) => t.Deadline && t.Deadline < today
    ).length;

    if (completedTasks.length === 0) {
      return {
        operationScore: "N/A",
        efficiencyRatio: "N/A",
        onTimePerformance: "N/A",
        tasksByStatus: statusCounts,
        tasksByOwner: ownerCounts,
        globalTasksByStatus: globalStatusCounts,
        globalTasksByOwner: globalOwnerCounts,
        totalCompletedTasks: 0,
        totalImpactDelivered: 0,
        workInProgressCount: wipCount,
        overdueTaskCount: overdueCount,
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

    return {
      operationScore: opScore.toFixed(2),
      efficiencyRatio: effRatio.toFixed(1) + "%",
      onTimePerformance: onTimePerf.toFixed(1) + "%",
      tasksByStatus: statusCounts,
      tasksByOwner: ownerCounts,
      globalTasksByStatus: globalStatusCounts,
      globalTasksByOwner: globalOwnerCounts,
      totalCompletedTasks: completedCount,
      totalImpactDelivered: impactDelivered,
      workInProgressCount: wipCount,
      overdueTaskCount: overdueCount,
    };
  }, [tasks, allTasks]);

  const value = {
    projects,
    tasks,
    initialTasks,
    selectedProjectId,
    allTasks,

    isLoadingProjects,
    isLoadingTasks,
    isLoadingAllTasks,
    isOperating,
    error,

    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
    globalTasksByStatus,
    globalTasksByOwner,
    totalCompletedTasks,
    totalImpactDelivered,
    workInProgressCount,
    overdueTaskCount,

    setSelectedProjectId,
    handleProjectSelect,
    saveTask,
    createProject,
    updateProject,
    createTask,
    confirmDelete,
    refreshAllData,
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

// --- Provider Component ---

// export const DataProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const { user } = useAuth();
//   const { itemToDelete, closeModals, setActiveTab } = useUI();

//   // Data States
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [tasks, setTasks] = useState<Task[]>([]); // Task ของโปรเจกต์ปัจจุบัน
//   const [allTasks, setAllTasks] = useState<Task[]>([]); // Task ทั้งหมดในระบบ
//   const [initialTasks, setInitialTasks] = useState<Task[]>([]);
//   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
//     null
//   );

//   // Status States (ปรับปรุงใหม่)
//   const [isLoadingProjects, setIsLoadingProjects] = useState(false);
//   const [isLoadingTasks, setIsLoadingTasks] = useState(false);
//   const [isLoadingAllTasks, setIsLoadingAllTasks] = useState(false);
//   const [isOperating, setIsOperating] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [taskHistory, setTaskHistory] = useState<HistoryEntry[]>([]);
//   const [isLoadingHistory, setIsLoadingHistory] = useState(false);

//   // --- Utility Functions & Constants ---
//   const fetchTaskHistory = useCallback(
//     async (taskId: string) => {
//       if (!user) return;
//       setIsLoadingHistory(true);
//       setTaskHistory([]); // เคลียร์ของเก่าก่อนโหลด
//       try {
//         const data = await apiRequest<HistoryEntry[]>({
//           op: "getTaskHistory",
//           user: user,
//           payload: { taskId: taskId },
//         });
//         setTaskHistory(data);
//       } catch (err: any) {
//         console.error("Failed to fetch task history:", err);
//         setError(`ไม่สามารถโหลดประวัติ Task ได้: ${err.message}`);
//       } finally {
//         setIsLoadingHistory(false);
//       }
//     },
//     [user]
//   );

//   const clearTaskHistory = useCallback(() => {
//     setTaskHistory([]);
//   }, []);

//   const phaseOrder = useMemo(
//     () => [
//       "Research & Planning",
//       "Strategy & Positioning",
//       "Content Preparation",
//       "Pre-Launch",
//       "Launch Day",
//       "Post-Launch",
//       "Measurement & Optimization",
//     ],
//     []
//   );

//   const formatAndSortTasks = useCallback(
//     (data: any[]): Task[] => {
//       if (!Array.isArray(data)) return [];

//       const sortedData = [...data].sort((a, b) => {
//         const phaseAIndex = phaseOrder.indexOf(a.Phase);
//         const phaseBIndex = phaseOrder.indexOf(b.Phase);
//         if (phaseAIndex === phaseBIndex) return 0;
//         return phaseAIndex < phaseBIndex ? -1 : 1;
//       });
//       const formatToLocalISODate = (gasDate: any): string => {
//         if (!gasDate) return "";
//         const date = new Date(gasDate); // Browser ตีความตาม Local Time
//         if (isNaN(date.getTime())) return "";

//         // จัดรูปแบบ YYYY-MM-DD
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, "0");
//         const day = String(date.getDate()).padStart(2, "0");
//         return `${year}-${month}-${day}`;
//       };

//       return sortedData.map((t: any) => ({
//         // สร้าง _id ที่เสถียร
//         _id:
//           t._id ||
//           (t.ProjectID && t.rowIndex
//             ? `${t.ProjectID}-${t.rowIndex}`
//             : `temp-${uuidv4()}`),
//         rowIndex: t.rowIndex,
//         ProjectID: t.ProjectID,
//         Check:
//           t["Check ✅"] === true ||
//           String(t["Check ✅"]).toLowerCase() === "true",
//         Phase: t.Phase,
//         Task: t.Task,
//         Owner: t.Owner,
//         Deadline: formatToLocalISODate(t.Deadline),
//         Status: t.Status,
//         "Est. Hours": Number(t["Est. Hours"]) || 0,
//         "Actual Hours": t["Actual Hours"] ? Number(t["Actual Hours"]) : null,
//         "Impact Score": Number(t["Impact Score"]) || 0,
//         Timeliness: t.Timeliness,
//         "Notes / Result": t["Notes / Result"],
//         "Feedback to Team": t["Feedback to Team"],
//         "Owner Feedback": t["Owner Feedback"],
//         "Project Feedback": t["Project Feedback"],
//         MilestoneID: t.MilestoneID,
//         HelpAssignee: t.HelpAssignee || null,
//         HelpDetails: t.HelpDetails || null,
//         HelpRequestedAt: formatToLocalISODate(t.HelpRequestedAt) || null,
//       }));
//     },
//     [phaseOrder]
//   );

//   // --- API Calls (Refactored) ---

//   const fetchProjects = useCallback(async () => {
//     if (!user) return;
//     setIsLoadingProjects(true);
//     setError(null);
//     try {
//       const data = await apiRequest<any[]>({ op: "getProjects", user: user });

//       const formattedProjects: Project[] = data.map((p: any) => ({
//         ProjectID: p.projectId,
//         Name: p.projectName,
//         Priority: p.priority,
//       }));
//       formattedProjects.sort((a, b) => a.Priority - b.Priority);
//       setProjects(formattedProjects);

//       // เลือกโปรเจกต์อัตโนมัติ
//       setSelectedProjectId((currentId) => {
//         if (
//           !currentId ||
//           !formattedProjects.find((p) => p.ProjectID === currentId)
//         ) {
//           return formattedProjects.length > 0
//             ? formattedProjects[0].ProjectID
//             : null;
//         }
//         return currentId;
//       });
//     } catch (err: any) {
//       setError(`โหลดโปรเจกต์ล้มเหลว: ${err.message}`);
//       console.error("fetchProjects Error:", err);
//     } finally {
//       setIsLoadingProjects(false);
//     }
//   }, [user]);

//   // [✅ แก้ไข] ลบ payload ที่ไม่จำเป็นออก (userRole)
//   const fetchAllTasks = useCallback(async () => {
//     if (!user) return;
//     setIsLoadingAllTasks(true);
//     try {
//       const data = await apiRequest<any[]>({
//         op: "getAllTasks",
//         user: user,
//         // payload: { userRole: user.role } // <-- ลบออก เพราะ Backend ตรวจสอบเอง
//       });

//       const formatted = formatAndSortTasks(data);
//       setAllTasks(formatted);
//     } catch (error: any) {
//       console.error("Error fetching all tasks:", error);
//       // ไม่จำเป็นต้องตั้ง Error หลัก หากเป็นการโหลดพื้นหลัง
//     } finally {
//       setIsLoadingAllTasks(false);
//     }
//   }, [user, formatAndSortTasks]);

//   // ฟังก์ชันสำหรับดึง Task ของโปรเจกต์ที่ระบุเท่านั้น
//   // [✅ แก้ไข] ลบ userRole ที่ไม่จำเป็นออกจาก payload
//   const fetchTasksForProject = useCallback(
//     async (projectId: string) => {
//       if (!user || projectId === "ALL") return;

//       setIsLoadingTasks(true);
//       setError(null);

//       try {
//         const data = await apiRequest<any[]>({
//           op: "getTasks",
//           user: user,
//           payload: { projectId: projectId }, // <-- ลบ userRole ออก
//         });

//         const formattedTasks = formatAndSortTasks(data);
//         setTasks(formattedTasks);
//       } catch (err: any) {
//         setError(`โหลด Task ล้มเหลว: ${err.message}`);
//         console.error("fetchTasks Error:", err);
//         setTasks([]); // ล้าง Task เมื่อเกิด Error
//       } finally {
//         setIsLoadingTasks(false);
//       }
//     },
//     [user, formatAndSortTasks]
//   );

//   const fetchInitialTasks = useCallback(async () => {
//     // getInitialTasks เป็น Public API ไม่จำเป็นต้องมี User ก็เรียกได้
//     try {
//       // ส่ง user ถ้ามี ถ้าไม่มีส่ง null
//       const data = await apiRequest<any[]>({
//         op: "getInitialTasks",
//         user: user || null,
//       });
//       const formatted = formatAndSortTasks(data);
//       setInitialTasks(formatted);
//     } catch (err) {
//       console.error("Failed to fetch initial tasks:", err);
//     }
//   }, [user, formatAndSortTasks]);

//   const refreshAllData = useCallback(async () => {
//     // โหลด Projects และ AllTasks พร้อมกัน
//     if (user) {
//       await Promise.all([fetchProjects(), fetchAllTasks()]);
//     }
//   }, [user, fetchProjects, fetchAllTasks]);

//   // --- Effects (ปรับโครงสร้างใหม่และมีประสิทธิภาพ) ---

//   // Effect 1: โหลดข้อมูลเริ่มต้นเมื่อ User Login และล้างข้อมูลเมื่อ Logout
//   useEffect(() => {
//     // โหลด Initial Tasks ทันที
//     fetchInitialTasks();

//     if (user) {
//       refreshAllData();
//     } else {
//       // ล้างข้อมูลเมื่อ Logout
//       setProjects([]);
//       setTasks([]);
//       setAllTasks([]);
//       setSelectedProjectId(null);
//     }
//   }, [user, refreshAllData, fetchInitialTasks]);

//   // Effect 2: จัดการการโหลด Task เมื่อโปรเจกต์ที่เลือกเปลี่ยนแปลง
//   useEffect(() => {
//     if (!selectedProjectId) {
//       setTasks([]);
//       return;
//     }

//     if (selectedProjectId !== "ALL") {
//       // ถ้าเลือกโปรเจกต์เฉพาะ ให้เคลียร์ Task เดิมและเรียก fetch
//       setTasks([]);
//       fetchTasksForProject(selectedProjectId);
//     }
//   }, [selectedProjectId, fetchTasksForProject]);

//   // Effect 3: อัปเดต tasks หาก allTasks เปลี่ยนแปลง (เช่น หลัง Edit) และกำลังเลือก "ALL" อยู่
//   useEffect(() => {
//     if (selectedProjectId === "ALL") {
//       setTasks(allTasks);
//     }
//   }, [allTasks, selectedProjectId]);

//   // --- Data Mutations & Actions ---

//   // Helper สำหรับจัดการสถานะ Loading/Error สำหรับการ Create/Update/Delete
//   const handleApiAction = useCallback(async (action: () => Promise<void>) => {
//     setIsOperating(true);
//     setError(null);
//     try {
//       await action();
//     } catch (err: any) {
//       setError(`การดำเนินการล้มเหลว: ${err.message}`);
//       console.error("API Action Error:", err);
//       throw err; // ส่งต่อ Error เพื่อให้ฟังก์ชันที่เรียกใช้ (เช่น saveTask) จัดการ Rollback ได้
//     } finally {
//       setIsOperating(false);
//     }
//   }, []);

//   const handleProjectSelect = useCallback(
//     (projectId: string) => {
//       setSelectedProjectId(projectId);
//       setActiveTab("tasks");
//     },
//     [setActiveTab]
//   );

//   // Save Task พร้อม Optimistic Update และ Rollback
//   const saveTask = useCallback(
//     async (updatedTask: Task) => {
//       if (!user) return;

//       // เก็บ State เก่าไว้เผื่อ Rollback
//       let previousTasks: Task[] = [];
//       let previousAllTasks: Task[] = [];

//       // 1. Optimistic UI update (อัปเดตหน้าจอทันที)
//       const updateState = (prevTasks: Task[]) =>
//         prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t));

//       setTasks((prev) => {
//         previousTasks = prev;
//         return updateState(prev);
//       });
//       setAllTasks((prev) => {
//         previousAllTasks = prev;
//         return updateState(prev);
//       });

//       // 2. ส่งข้อมูลไป Backend
//       try {
//         await handleApiAction(async () => {
//           await apiRequest({
//             op: "updateTask",
//             user: user,
//             payload: { task: updatedTask },
//           });
//           closeModals();
//         });
//       } catch (err) {
//         // 3. Rollback UI หาก Backend ทำงานล้มเหลว
//         setTasks(previousTasks);
//         setAllTasks(previousAllTasks);
//         throw err; // ส่งต่อ Error
//       }
//     },
//     [user, closeModals, handleApiAction]
//   );

//   const createProject = useCallback(
//     async (projectName: string, priority: number, selectedTasks: Task[]) => {
//       if (!user) return;
//       const newProjectId = `PROJ-${uuidv4().slice(0, 8).toUpperCase()}`;

//       // const selectedTaskNames = selectedTasks.map((task) => task.Task);
//       const tasksPayload = selectedTasks.map((task) => {
//         const {
//           _id,
//           rowIndex,
//           ProjectID,
//           Check,
//           // แยกฟิลด์ Help ออก เผื่อ Backend ยังไม่รองรับในการสร้างโปรเจกต์
//           HelpAssignee,
//           HelpDetails,
//           HelpRequestedAt,
//           ...taskDetails
//         } = task;
//         return {
//           ...taskDetails,
//           // ตรวจสอบให้แน่ใจว่าค่าสำคัญมีครบถ้วนตามที่กำหนดใน Modal
//           "Est. Hours": task["Est. Hours"] || 8,
//           "Impact Score": task["Impact Score"] || 3,
//           Status: task.Status || "Not Started",
//           // Deadline, Owner, Task name จะอยู่ใน taskDetails อยู่แล้ว
//         };
//       });

//       await handleApiAction(async () => {
//         await apiRequest({
//           op: "createNewProject",
//           user: user,
//           payload: {
//             projectId: newProjectId,
//             projectName: projectName,
//             priority: priority,
//             selectedTasks: tasksPayload,
//           },
//         });

//         // Refetch ข้อมูลใหม่
//         await refreshAllData();
//         setSelectedProjectId(newProjectId);
//         setActiveTab("dashboard");
//         closeModals();
//       });
//     },
//     [user, refreshAllData, setActiveTab, closeModals, handleApiAction]
//   );

//   // [✅ เพิ่มใหม่] Bulk Update Deadline พร้อม Optimistic Update และ Rollback
//   const bulkUpdateDeadline = useCallback(
//     async (taskIds: string[], newDeadline: string): Promise<void> => {
//       if (!user || taskIds.length === 0) return;

//       // 1. เก็บ State เก่าไว้เผื่อ Rollback
//       let previousAllTasks: Task[] = [];
//       let previousTasks: Task[] = [];

//       // 2. กำหนด Logic การอัปเดต
//       const optimisticUpdate = (prevTasks: Task[]) => {
//         return prevTasks.map((task) => {
//           if (taskIds.includes(task._id)) {
//             // สร้าง Object ใหม่พร้อม Deadline ที่อัปเดต
//             return { ...task, Deadline: newDeadline };
//           }
//           return task;
//         });
//       };

//       // 3. Optimistic UI update (อัปเดตหน้าจอทันที)
//       // อัปเดต allTasks เสมอ
//       setAllTasks((prev) => {
//         previousAllTasks = prev;
//         return optimisticUpdate(prev);
//       });

//       // อัปเดต tasks (current view) ถ้าไม่ได้เลือก "ALL"
//       // (ถ้าเลือก "ALL" อยู่แล้ว tasks จะอัปเดตอัตโนมัติตาม Effect 3 ด้านบน)
//       if (selectedProjectId !== "ALL") {
//         setTasks((prev) => {
//           previousTasks = prev;
//           return optimisticUpdate(prev);
//         });
//       }

//       // 4. ส่งข้อมูลไป Backend
//       try {
//         await handleApiAction(async () => {
//           // [✅ แก้ไข] เรียกใช้ apiRequest
//           await apiRequest({
//             op: "bulkUpdateTasks",
//             user: user, // ส่ง User ไปตรวจสอบสิทธิ์
//             payload: {
//               taskIds: taskIds,
//               updates: {
//                 Deadline: newDeadline,
//               },
//             },
//           });
//           // หากสำเร็จ ไม่ต้องทำอะไรเพิ่มเติม เพราะ UI อัปเดตไปแล้ว
//         });
//       } catch (err) {
//         // 5. Rollback UI หาก Backend ทำงานล้มเหลว
//         console.error("Bulk update failed, rolling back UI.");
//         setAllTasks(previousAllTasks);
//         if (selectedProjectId !== "ALL") {
//           setTasks(previousTasks);
//         }
//         // [สำคัญ] ต้อง Throw error กลับไปด้วย เพื่อให้ TasksTab.tsx รู้ว่าล้มเหลว
//         throw err;
//       }
//     },
//     [user, selectedProjectId, handleApiAction]
//   );

//   // [✅ แก้ไข] ปรับโครงสร้างการส่งข้อมูลให้ใช้ payload
//   const updateProject = useCallback(
//     async (
//       projectId: string,
//       updatedData: { Name: string; Priority: number }
//     ) => {
//       if (!user) return;

//       await handleApiAction(async () => {
//         await apiRequest({
//           op: "updateProject",
//           user: user,
//           // 👇 ย้ายข้อมูลทั้งหมดไปไว้ใน payload 👇
//           payload: {
//             projectId: projectId,
//             updatedData: {
//               projectName: updatedData.Name,
//               priority: updatedData.Priority,
//             },
//           },
//         });

//         // Refetch เพื่อให้ข้อมูลและการเรียงลำดับถูกต้อง
//         await fetchProjects();
//         closeModals();
//       });
//     },
//     [user, fetchProjects, closeModals, handleApiAction]
//   );

//   // [✅ แก้ไข] ปรับโครงสร้างการส่งข้อมูลให้ใช้ payload
//   const createTask = useCallback(
//     async (newTaskData: Omit<Task, "rowIndex" | "_id" | "Check">) => {
//       if (!user || !selectedProjectId || selectedProjectId === "ALL") return;

//       await handleApiAction(async () => {
//         await apiRequest({
//           op: "createTask",
//           user: user,
//           // 👇 ย้าย taskData ไปไว้ใน payload 👇
//           payload: {
//             taskData: { ...newTaskData, ProjectID: selectedProjectId },
//           },
//         });

//         // Refetch ข้อมูล Task ของโปรเจกต์นี้ และข้อมูล Task ทั้งหมด
//         await fetchTasksForProject(selectedProjectId);
//         await fetchAllTasks();
//         closeModals();
//       });
//     },
//     [
//       user,
//       selectedProjectId,
//       fetchTasksForProject,
//       fetchAllTasks,
//       closeModals,
//       handleApiAction,
//     ]
//   );

//   // [✅ แก้ไข] ปรับโครงสร้างการส่งข้อมูลให้ใช้ payload
//   const confirmDelete = useCallback(async () => {
//     if (!user || !itemToDelete) return;

//     const { type, data } = itemToDelete;

//     // เก็บ State เก่าไว้เผื่อ Rollback (สำหรับ Task)
//     let previousTasks: Task[] = [];
//     let previousAllTasks: Task[] = [];

//     try {
//       // Optimistic update for task deletion
//       if (type === "task") {
//         setTasks((prev) => {
//           previousTasks = prev;
//           return prev.filter((t) => t._id !== data._id);
//         });
//         setAllTasks((prev) => {
//           previousAllTasks = prev;
//           return prev.filter((t) => t._id !== data._id);
//         });
//       }

//       await handleApiAction(async () => {
//         const op = type === "task" ? "deleteTask" : "deleteProject";

//         // 👇 สร้าง Body ที่มีโครงสร้าง payload ที่ถูกต้อง 👇
//         const requestBody = {
//           op: op,
//           user: user,
//           payload:
//             type === "task"
//               ? { rowIndex: data.rowIndex }
//               : { projectId: data.ProjectID },
//         };

//         await apiRequest(requestBody);

//         if (type !== "task") {
//           // Refetch หลังจากลบโปรเจกต์
//           await refreshAllData();
//         }
//         closeModals();
//       });
//     } catch (err) {
//       // Rollback UI หากลบไม่สำเร็จ
//       if (type === "task") {
//         setTasks(previousTasks);
//         setAllTasks(previousAllTasks);
//       }
//     }
//   }, [user, itemToDelete, refreshAllData, closeModals, handleApiAction]);

//   // --- Derived/Calculated Data (Memoized) ---
//   // (ส่วนการคำนวณสถิติไม่มีการเปลี่ยนแปลง)

//   // const filteredTasks = useMemo(() => {
//   //   if (filterTeam === "ALL") return tasks;
//   //   return tasks.filter(
//   //     (task) =>
//   //       task["Feedback to Team"] &&
//   //       task["Feedback to Team"].includes(`@${filterTeam}`)
//   //   );
//   // }, [tasks, filterTeam]);

//   // การคำนวณสถิติ (Dashboard)
//   const {
//     operationScore,
//     efficiencyRatio,
//     onTimePerformance,
//     tasksByStatus,
//     tasksByOwner,
//     globalTasksByStatus,
//     globalTasksByOwner,
//     totalCompletedTasks,
//     totalImpactDelivered,
//     workInProgressCount,
//     overdueTaskCount,
//   } = useMemo(() => {
//     const getTodayYYYYMMDD = () => {
//       const date = new Date();
//       const day = String(date.getDate()).padStart(2, "0");
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const year = date.getFullYear();
//       return `${year}-${month}-${day}`; // YYYY-MM-DD
//     };

//     const today = getTodayYYYYMMDD();

//     // 1. Global Counts (ใช้ allTasks)
//     const globalStatusCounts: TasksByStatus = statusOptions.map((status) => ({
//       name: status,
//       Tasks: allTasks.filter((t) => t.Status === status).length,
//     }));

//     //คำนวณ Owner แบบ Dynamic และเรียงลำดับ
//     const ownerCountsMap = new Map<string, number>();
//     allTasks.forEach((task) => {
//       if (task.Owner) {
//         ownerCountsMap.set(
//           task.Owner,
//           (ownerCountsMap.get(task.Owner) || 0) + 1
//         );
//       }
//     });
//     const globalOwnerCounts: TasksByOwner = Array.from(
//       ownerCountsMap,
//       ([name, value]) => ({ name, value })
//     );
//     globalOwnerCounts.sort((a, b) => b.value - a.value);

//     // ใช้ 'tasks' (มุมมองปัจจุบัน) สำหรับสถิติเฉพาะหน้า
//     const statusCounts: TasksByStatus = statusOptions.map((status) => ({
//       name: status,
//       Tasks: tasks.filter((t) => t.Status === status).length,
//     }));

//     const ownerCounts: TasksByOwner = ownerOptions
//       .map((owner) => ({
//         name: owner,
//         value: tasks.filter((t) => t.Owner === owner).length,
//       }))
//       .filter((o) => o.value > 0);

//     // === 2. การคำนวณพื้นฐาน ===
//     const completedTasks = tasks.filter((t) => t.Status === "Done");
//     const incompleteTasks = tasks.filter(
//       (t) => t.Status !== "Done" && t.Status !== "Cancelled"
//     );

//     // === 3. คำนวณ Productivity Metrics ใหม่ (ใช้ allTasks) ===

//     // 3.1 Task Throughput
//     const completedCount = completedTasks.length;
//     // 3.2 Total Impact Delivered
//     const impactDelivered = completedTasks.reduce(
//       (sum, task) => sum + task["Impact Score"],
//       0
//     );
//     // 3.3 Work In Progress (WIP)
//     // กำหนดสถานะที่นับเป็น WIP (ปรับได้ตาม Workflow ของทีมคุณ)
//     // หมายเหตุ: "Not Started" มักจะถือเป็น Backlog ไม่ใช่ WIP
//     const wipStatuses = ["In Progress", "Doing", "Reviewing", "Help Me"];
//     // ตรวจสอบให้แน่ใจว่าสถานะเหล่านี้มีอยู่ในระบบจริง (statusOptions)
//     const relevantWipStatuses = wipStatuses.filter((status) =>
//       statusOptions.includes(status)
//     );
//     const wipCount = tasks.filter((t) =>
//       relevantWipStatuses.includes(t.Status)
//     ).length;

//     // 3.4 Overdue Count
//     const overdueCount = incompleteTasks.filter(
//       (t) => t.Deadline && t.Deadline < today
//     ).length;

//     // === 4. การคำนวณ Metrics เดิม (OPS, EFF, OTP) ===

//     // จัดการกรณีที่ยังไม่มี Task ใดๆ เสร็จสิ้น
//     // if (completedCount === 0) {
//     //   return {
//     //     operationScore: "N/A",
//     //     efficiencyRatio: "N/A",
//     //     onTimePerformance: "N/A",
//     //     tasksByStatus: statusCounts,
//     //     tasksByOwner: ownerCounts,
//     //     globalTasksByStatus: globalStatusCounts,
//     //     globalTasksByOwner: globalOwnerCounts,
//     //     totalCompletedTasks: 0,
//     //     totalImpactDelivered: 0,
//     //     workInProgressCount: wipCount,
//     //     overdueTaskCount: overdueCount,
//     //   };
//     // }

//     // จัดการกรณีที่ยังไม่มี Task ใดๆ เสร็จสิ้น
//     if (completedTasks.length === 0) {
//       return {
//         operationScore: "N/A",
//         efficiencyRatio: "N/A",
//         onTimePerformance: "N/A",
//         tasksByStatus: statusCounts,
//         tasksByOwner: ownerCounts,
//         globalTasksByStatus: globalStatusCounts,
//         globalTasksByOwner: globalOwnerCounts,
//         totalCompletedTasks: 0,
//         totalImpactDelivered: 0,
//         workInProgressCount: wipCount,
//         overdueTaskCount: overdueCount,
//       };
//     }

//     // คำนวณคะแนน (ใช้ allTasks)
//     const totalImpact = completedTasks.reduce(
//       (sum, task) => sum + task["Impact Score"],
//       0
//     );
//     const opScore = totalImpact / completedTasks.length;

//     const totalEst = completedTasks.reduce(
//       (sum, task) => sum + task["Est. Hours"],
//       0
//     );
//     const totalActual = completedTasks.reduce(
//       (sum, task) => sum + (task["Actual Hours"] || 0),
//       0
//     );
//     // ป้องกันการหารด้วยศูนย์
//     const effRatio = totalActual > 0 ? (totalEst / totalActual) * 100 : 0;

//     const onTimeCount = completedTasks.filter(
//       (t) => t.Timeliness === "On-Time" || t.Timeliness === "Early"
//     ).length;
//     const onTimePerf = (onTimeCount / completedTasks.length) * 100;

//     return {
//       operationScore: opScore.toFixed(2),
//       efficiencyRatio: effRatio.toFixed(1) + "%",
//       onTimePerformance: onTimePerf.toFixed(1) + "%",
//       tasksByStatus: statusCounts,
//       tasksByOwner: ownerCounts,
//       globalTasksByStatus: globalStatusCounts,
//       globalTasksByOwner: globalOwnerCounts,
//       totalCompletedTasks: completedCount,
//       totalImpactDelivered: impactDelivered,
//       workInProgressCount: wipCount,
//       overdueTaskCount: overdueCount,
//     };
//   }, [tasks, allTasks]);

//   const value = {
//     projects,
//     tasks,
//     initialTasks,
//     selectedProjectId,
//     allTasks,

//     // Status State
//     isLoadingProjects,
//     isLoadingTasks,
//     isLoadingAllTasks,
//     isOperating,
//     error,

//     // Derived Data
//     // filteredTasks,
//     operationScore,
//     efficiencyRatio,
//     onTimePerformance,
//     tasksByStatus,
//     tasksByOwner,
//     globalTasksByStatus,
//     globalTasksByOwner,
//     totalCompletedTasks,
//     totalImpactDelivered,
//     workInProgressCount,
//     overdueTaskCount,

//     // Actions
//     setSelectedProjectId,
//     handleProjectSelect,
//     saveTask,
//     createProject,
//     updateProject,
//     createTask,
//     confirmDelete,
//     refreshAllData,
//     bulkUpdateDeadline,

//     taskHistory,
//     isLoadingHistory,
//     fetchTaskHistory,
//     clearTaskHistory,
//   };

//   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
// };

// export const useData = () => {
//   const context = useContext(DataContext);
//   if (context === undefined) {
//     throw new Error("useData must be used within a DataProvider");
//   }
//   return context;
// };
