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

const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

// --- Helper Function for Robust API Requests ---

/**
 * จัดการการเรียก API ไปยัง Google Apps Script
 * ตรวจสอบ Error และรับประกันการ Parse ข้อมูล JSON อย่างปลอดภัย
 */
const apiRequest = async <T,>(body: object): Promise<T> => {
  if (!SCRIPT_URL) {
    throw new Error("VITE_APP_SCRIPT_URL is not defined.");
  }
  
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      // ใช้ text/plain เพื่อหลีกเลี่ยงปัญหา CORS preflight กับ Google Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });

    // 1. ตรวจสอบ HTTP Status
    if (!response.ok) {
      const errorText = await response.text().catch(() => "N/A");
      console.error("HTTP Error Response:", errorText);
      throw new Error(`HTTP error ${response.status}. โปรดตรวจสอบการเชื่อมต่อหรือสถานะเซิร์ฟเวอร์.`);
    }

    // 2. อ่านข้อมูลเป็น Text ก่อน (สำคัญมากสำหรับการ Debug และป้องกัน JSON Error)
    const textData = await response.text();

    // 3. พยายามแปลงเป็น JSON
    try {
      const result = JSON.parse(textData);
      // ตรวจสอบสถานะจาก Backend (ตามโครงสร้างที่คาดหวังจาก GAS)
      if (result.status !== 'success') {
        throw new Error(result.message || "การดำเนินการล้มเหลว (Backend Error).");
      }
      return result.data as T;
    } catch (parseError) {
      // ดักจับ "SyntaxError: JSON.parse: unexpected character"
      if (parseError instanceof SyntaxError) {
          console.error("Failed to parse JSON. Raw data received:", textData);
          throw new Error("ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON. โปรดตรวจสอบ Logs หรือสิทธิ์ของ Google Apps Script.");
      }
      throw parseError;
    }
  } catch (error) {
    // จัดการ Network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Network Error/CORS).');
    }
    throw error;
  }
};

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
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Provider Component ---

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { filterTeam, itemToDelete, closeModals, setActiveTab } = useUI();

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // Task ของโปรเจกต์ปัจจุบัน
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Task ทั้งหมดในระบบ
  const [initialTasks, setInitialTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Status States (ปรับปรุงใหม่)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingAllTasks, setIsLoadingAllTasks] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
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
        if (!Array.isArray(data)) return [];

      const sortedData = [...data].sort((a, b) => {
        const phaseAIndex = phaseOrder.indexOf(a.Phase);
        const phaseBIndex = phaseOrder.indexOf(b.Phase);
        if (phaseAIndex === phaseBIndex) return 0;
        return phaseAIndex < phaseBIndex ? -1 : 1;
      });

      return sortedData.map((t: any) => ({
        // สร้าง _id ที่เสถียร
        _id: t.ProjectID && t.rowIndex ? `${t.ProjectID}-${t.rowIndex}` : `temp-${uuidv4()}`,
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

  // --- API Calls (Refactored) ---

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    setError(null);
    try {
      const data = await apiRequest<any[]>({ op: 'getProjects', user: user });
      
      const formattedProjects: Project[] = data.map((p: any) => ({
        ProjectID: p.projectId,
        Name: p.projectName,
        Priority: p.priority,
      }));
      formattedProjects.sort((a, b) => a.Priority - b.Priority);
      setProjects(formattedProjects);

      // เลือกโปรเจกต์อัตโนมัติ
      setSelectedProjectId((currentId) => {
        if (!currentId || !formattedProjects.find((p) => p.ProjectID === currentId)) {
          return formattedProjects.length > 0 ? formattedProjects[0].ProjectID : null;
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
        const data = await apiRequest<any[]>({
            op: 'getAllTasks',
            user: user,
            payload: { userRole: user.role }
        });
        
        const formatted = formatAndSortTasks(data);
        setAllTasks(formatted);
        
    } catch (error: any) {
        console.error("Error fetching all tasks:", error);
        // ไม่จำเป็นต้องตั้ง Error หลัก หากเป็นการโหลดพื้นหลัง
    } finally {
        setIsLoadingAllTasks(false);
    }
  }, [user, formatAndSortTasks]);

  // ฟังก์ชันสำหรับดึง Task ของโปรเจกต์ที่ระบุเท่านั้น
  const fetchTasksForProject = useCallback(
    async (projectId: string) => {
      if (!user || projectId === "ALL") return;

      setIsLoadingTasks(true);
      setError(null);

      try {
        const data = await apiRequest<any[]>({
            op: 'getTasks',
            user: user,
            payload: { projectId: projectId, userRole: user.role }
        });

        const formattedTasks = formatAndSortTasks(data);
        setTasks(formattedTasks);
      } catch (err: any) {
        setError(`โหลด Task ล้มเหลว: ${err.message}`);
        console.error("fetchTasks Error:", err);
        setTasks([]); // ล้าง Task เมื่อเกิด Error
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [user, formatAndSortTasks]
  );

  const fetchInitialTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest<any[]>({ op: 'getInitialTasks', user: user });
      const formatted = formatAndSortTasks(data);
      setInitialTasks(formatted);
    } catch (err) {
      console.error("Failed to fetch initial tasks:", err);
    }
  }, [user, formatAndSortTasks]);

  const refreshAllData = useCallback(async () => {
    // โหลด Projects และ AllTasks พร้อมกัน
    await Promise.all([fetchProjects(), fetchAllTasks()]);
  }, [fetchProjects, fetchAllTasks]);

  // --- Effects (ปรับโครงสร้างใหม่และมีประสิทธิภาพ) ---

  // Effect 1: โหลดข้อมูลเริ่มต้นเมื่อ User Login และล้างข้อมูลเมื่อ Logout
  useEffect(() => {
    if (user) {
        refreshAllData();
        fetchInitialTasks();
    } else {
        setProjects([]);
        setTasks([]);
        setAllTasks([]);
        setInitialTasks([]);
        setSelectedProjectId(null);
    }
  }, [user, refreshAllData, fetchInitialTasks]);


  // Effect 2: จัดการการโหลด Task เมื่อโปรเจกต์ที่เลือกเปลี่ยนแปลง
  // (แทนที่ useEffect ที่ซ้ำซ้อนในโค้ดเดิม)
  useEffect(() => {
    if (!user || !selectedProjectId) {
      setTasks([]);
      return;
    }

    if (selectedProjectId !== "ALL") {
      // ถ้าเลือกโปรเจกต์เฉพาะ ให้เคลียร์ Task เดิมและเรียก fetch
      setTasks([]); 
      fetchTasksForProject(selectedProjectId);
    }
    // เราไม่ใส่ allTasks ใน dependency ที่นี่ เพื่อป้องกันการโหลดซ้ำที่ไม่จำเป็น
  }, [selectedProjectId, user, fetchTasksForProject]);

  // Effect 3: อัปเดต tasks หาก allTasks เปลี่ยนแปลง (เช่น หลัง Edit) และกำลังเลือก "ALL" อยู่
  useEffect(() => {
    if (selectedProjectId === "ALL") {
        setTasks(allTasks);
    }
  }, [allTasks, selectedProjectId]);


  // --- Data Mutations & Actions ---

  // Helper สำหรับจัดการสถานะ Loading/Error สำหรับการ Create/Update/Delete
  const handleApiAction = async (action: () => Promise<void>) => {
    setIsOperating(true);
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(`การดำเนินการล้มเหลว: ${err.message}`);
      console.error("API Action Error:", err);
      throw err; // ส่งต่อ Error เพื่อให้ฟังก์ชันที่เรียกใช้ (เช่น saveTask) จัดการ Rollback ได้
    } finally {
      setIsOperating(false);
    }
  };

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setActiveTab("tasks");
    },
    [setActiveTab]
  );

  // Save Task พร้อม Optimistic Update และ Rollback
  const saveTask = useCallback(
    async (updatedTask: Task) => {
      if (!user) return;

      // เก็บ State เก่าไว้เผื่อ Rollback
      // ใช้ functional updates เพื่อเข้าถึง state ก่อนหน้าอย่างปลอดภัย
      let previousTasks: Task[] = [];
      let previousAllTasks: Task[] = [];

      // 1. Optimistic UI update (อัปเดตหน้าจอทันที)
      const updateState = (prevTasks: Task[]) =>
          prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t));
          
      setTasks(prev => {
        previousTasks = prev;
        return updateState(prev);
      });
      setAllTasks(prev => {
        previousAllTasks = prev;
        return updateState(prev);
      });

      // 2. ส่งข้อมูลไป Backend
      try {
        await handleApiAction(async () => {
            await apiRequest({ 
                op: "updateTask", 
                user: user,
                payload: { task: updatedTask } 
            });
            closeModals();
        });
      } catch (err) {
        // 3. Rollback UI หาก Backend ทำงานล้มเหลว (Error ถูกตั้งค่าใน handleApiAction แล้ว)
        setTasks(previousTasks);
        setAllTasks(previousAllTasks);
      }
    },
    [user, closeModals]
  );

  const createProject = useCallback(
    async (projectName: string, priority: number, selectedTasks: Task[]) => {
      if (!user) return;
      const newProjectId = `PROJ-${uuidv4().slice(0, 8).toUpperCase()}`;
      
      await handleApiAction(async () => {
        await apiRequest({
            op: "createNewProject",
            user: user,
            // ตรวจสอบให้แน่ใจว่าโครงสร้างตรงกับ Backend ของคุณ
            project: { 
              projectId: newProjectId,
              projectName: projectName,
              priority: priority,
              selectedTasks: selectedTasks,
            }
        });

        // Refetch ข้อมูลใหม่
        await refreshAllData();
        setSelectedProjectId(newProjectId);
        setActiveTab("dashboard");
        closeModals();
      });
    },
    [user, refreshAllData, setActiveTab, closeModals]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      updatedData: { Name: string; Priority: number }
    ) => {
      if (!user) return;

      await handleApiAction(async () => {
        await apiRequest({
            op: "updateProject",
            user: user,
            projectId: projectId,
            updatedData: {
              projectName: updatedData.Name,
              priority: updatedData.Priority,
            }
        });

        // Refetch เพื่อให้ข้อมูลและการเรียงลำดับถูกต้อง
        await fetchProjects();
        closeModals();
      });
    },
    [user, fetchProjects, closeModals]
  );

  const createTask = useCallback(
    async (newTaskData: Omit<Task, "rowIndex" | "_id" | "Check">) => {
      if (!user || !selectedProjectId || selectedProjectId === "ALL") return;

      await handleApiAction(async () => {
        await apiRequest({
            op: "createTask",
            user: user,
            taskData: { ...newTaskData, ProjectID: selectedProjectId } 
        });
        
        // Refetch ข้อมูล Task ของโปรเจกต์นี้ และข้อมูล Task ทั้งหมด
        await fetchTasksForProject(selectedProjectId);
        await fetchAllTasks();
        closeModals();
      });
    },
    [user, selectedProjectId, fetchTasksForProject, fetchAllTasks, closeModals]
  );

  const confirmDelete = useCallback(async () => {
    if (!user || !itemToDelete) return;

    const { type, data } = itemToDelete;

    // เก็บ State เก่าไว้เผื่อ Rollback (สำหรับ Task)
    let previousTasks: Task[] = [];
    let previousAllTasks: Task[] = [];

    try {
        // Optimistic update for task deletion
        if (type === "task") {
            setTasks(prev => {
                previousTasks = prev;
                return prev.filter((t) => t._id !== data._id);
            });
            setAllTasks(prev => {
                previousAllTasks = prev;
                return prev.filter((t) => t._id !== data._id);
            });
        }

        await handleApiAction(async () => {
            const op = type === "task" ? "deleteTask" : "deleteProject";
            // ตรวจสอบให้แน่ใจว่าโครงสร้าง Body ตรงกับ Backend
            const body =
              type === "task"
                ? { op, user, rowIndex: data.rowIndex }
                : { op, user, projectId: data.ProjectID };

            await apiRequest(body);

            if (type !== "task") {
              // Refetch หลังจากลบโปรเจกต์
              await refreshAllData();
            }
            closeModals();
        });
    } catch (err) {
        // Rollback UI หากลบไม่สำเร็จ
        if (type === "task") {
            setTasks(previousTasks);
            setAllTasks(previousAllTasks);
        }
    }
  }, [user, itemToDelete, refreshAllData, closeModals]);

  // --- Derived/Calculated Data (Memoized) ---

  const filteredTasks = useMemo(() => {
    if (filterTeam === "ALL") return tasks;
    return tasks.filter(
      (task) =>
        task["Feedback to Team"] &&
        task["Feedback to Team"].includes(`@${filterTeam}`)
    );
  }, [tasks, filterTeam]);

  // การคำนวณสถิติ (Dashboard)
  const {
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 10); // กำหนดช่วงเวลาเตือน 10 วัน

    // ใช้ allTasks สำหรับการคำนวณภาพรวม
    const incompleteTasks = allTasks.filter(
        (t) => t.Status !== "Done" && t.Status !== "Cancelled"
    );

    // *** แก้ไข Bug: โค้ดเดิมอ้างอิง tasks.Deadline ซึ่งผิด ต้องใช้ t.Deadline ***
    /*
    const warningTasks = incompleteTasks.filter((t) => {
      if (!t.Deadline) return false; 
      const deadlineDate = new Date(t.Deadline);
      return deadlineDate >= today && deadlineDate <= warningDate;
    });
    */

    const completedTasks = allTasks.filter((t) => t.Status === "Done");

    // ใช้ 'tasks' (มุมมองปัจจุบัน) สำหรับสถิติเฉพาะหน้า (เช่น กราฟในหน้า TaskTab)
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

    // จัดการกรณีที่ยังไม่มี Task ใดๆ เสร็จสิ้น
    if (completedTasks.length === 0) {
      return {
        operationScore: "N/A",
        efficiencyRatio: "N/A",
        onTimePerformance: "N/A",
        tasksByStatus: statusCounts,
        tasksByOwner: ownerCounts,
      };
    }

    // คำนวณคะแนน (ใช้ allTasks)
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
    // ป้องกันการหารด้วยศูนย์
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
    };
  }, [tasks, allTasks]);

  const value = {
    projects,
    tasks,
    initialTasks,
    selectedProjectId,
    allTasks,

    // Status State
    isLoadingProjects,
    isLoadingTasks,
    isLoadingAllTasks,
    isOperating,
    error,

    // Derived Data
    filteredTasks,
    operationScore,
    efficiencyRatio,
    onTimePerformance,
    tasksByStatus,
    tasksByOwner,

    // Actions
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