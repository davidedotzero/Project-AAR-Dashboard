import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Task } from "@/types";
import { statusColorMap, ownerOptions, statusOptions } from "@/constants";
import { EditIcon, ViewIcon, DeleteIcon } from "@/components/icons";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { canEditTask } from "@/utils/authUtils";
import { useUI } from "@/contexts/UIContext";

// --- Utility Functions (ย้ายมาด้านนอกเพื่อให้ใช้ร่วมกันได้) ---

const formatDateToDDMMYYYY = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "วันที่ไม่ระบุ";
  // เนื่องจาก Format คือ YYYY-MM-DD
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return "วันที่ไม่ระบุ";
};

const getTodayYYYYMMDD = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const parseDateComponents = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1; // 0=Jan, 11=Dec
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(monthIndex) || isNaN(day)) return null;

  return { year, monthIndex, day };
};

// Helper function to truncate text (เหมือนเดิม)
const truncateText = (
  text: string | null | undefined,
  wordLimit: number
): string => {
  if (!text) return "-";
  const words = text.split(" ");
  if (words.length <= wordLimit) {
    return text;
  }
  return words.slice(0, wordLimit).join(" ") + "...";
};

// [🔥🔥🔥 Date Helpers สำหรับ Gantt Chart]

// สมมติว่ามีฟังก์ชันเหล่านี้อยู่แล้ว
const parseDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("-").map((p) => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
};
// [🔥🔥🔥 START: New Milestone Timeline Chart Component 🔥🔥🔥]

// Helper สำหรับกำหนดสีตามสถานะ (ใช้สำหรับ bg-color)
const getStatusColorClass = (status: string, isOverdue: boolean) => {
  if (isOverdue) return "bg-red-500"; // สำคัญที่สุด
  switch (status) {
    case "Done":
      return "bg-green-600";
    case "In Progress":
      return "bg-orange-500";
    case "Help Me":
      return "bg-purple-500";
    case "Cancelled":
      return "bg-gray-500";
    default:
      return "bg-blue-500"; // Backlog หรืออื่นๆ
  }
};

// Component สำหรับแสดงจุด Milestone และ Popover
const MilestoneMarker: React.FC<{
  date: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  today: string;
}> = ({ date, tasks, onTaskClick, today }) => {
  // กำหนดสีหลักของ Marker โดยดูจาก Task ที่ "สำคัญที่สุด" ในกลุ่ม
  // Priority: Overdue > Help Me > In Progress > Backlog > Done/Cancelled
  let primaryColor = "bg-gray-500";
  let hasOverdue = false;
  let hasHelpMe = false;
  let hasInProgress = false;
  let hasBacklog = false;

  tasks.forEach((task) => {
    const isDone = task.Status === "Done" || task.Status === "Cancelled";
    if (!isDone && task.Deadline && task.Deadline < today) {
      hasOverdue = true;
    }
    if (task.Status === "Help Me") hasHelpMe = true;
    if (task.Status === "In Progress") hasInProgress = true;
    if (task.Status === "Backlog") hasBacklog = true;
  });

  if (hasOverdue) primaryColor = "bg-red-500";
  else if (hasHelpMe) primaryColor = "bg-purple-500";
  else if (hasInProgress) primaryColor = "bg-orange-500";
  else if (hasBacklog) primaryColor = "bg-blue-500";
  else primaryColor = "bg-green-600"; // ถ้าทั้งหมดเสร็จแล้ว

  return (
    // group คือ container หลักสำหรับการ Hover (ใช้ Tailwind group-hover)
    <div className="relative group flex justify-center h-full items-center">
      {/* The Marker (Dot) */}
      <div
        className={`w-4 h-4 rounded-full ${primaryColor} cursor-pointer shadow-md transform transition-transform group-hover:scale-125 z-10`}
      >
        {/* แสดงจำนวนถ้ามีมากกว่า 1 Task */}
        {tasks.length > 1 && (
          <span className="absolute top-[-8px] right-[-8px] bg-white text-xs font-bold rounded-full px-1.5 py-0.5 text-gray-700 border shadow-sm">
            {tasks.length}
          </span>
        )}
      </div>

      {/* The Popover (Tooltip) - แสดงเมื่อ Hover ที่ group (Marker) */}
      {/* ใช้ scale-0 group-hover:scale-100 เพื่อซ่อน/แสดง */}
      <div className="absolute top-full mt-3 w-80 p-4 bg-white border rounded-lg shadow-xl scale-0 group-hover:scale-100 transition-transform origin-top z-50">
        <div className="font-bold text-gray-800 mb-3 border-b pb-2">
          กำหนดส่ง: {formatDateToDDMMYYYY(date)} ({tasks.length} Tasks)
        </div>
        {/* รายการ Task ภายใน Popover */}
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {tasks.map((task) => {
            const isDone =
              task.Status === "Done" || task.Status === "Cancelled";
            const isOverdue = !isDone && task.Deadline && task.Deadline < today;
            const taskColor = getStatusColorClass(task.Status, isOverdue);

            return (
              <li
                key={task._id}
                className="text-sm p-2 hover:bg-orange-100 rounded cursor-pointer transition-colors flex items-center"
                onClick={() => onTaskClick(task)}
                title={task.Task}
              >
                {/* จุดสีสถานะของแต่ละ Task */}
                <span
                  className={`inline-block w-3 h-3 mr-3 rounded-full ${taskColor}`}
                ></span>
                <span className="truncate flex-1">{task.Task}</span>
                <span className="text-xs text-gray-500 ml-2">{task.Owner}</span>
              </li>
            );
          })}
        </ul>
        {/* Arrow ที่ด้านบนของ Popover */}
        <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white shadow-sm"></div>
      </div>
    </div>
  );
};

interface TasksMilestoneChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// Component หลักสำหรับแสดง Milestone Timeline
const TasksMilestoneChart: React.FC<TasksMilestoneChartProps> = ({
  tasks,
  onTaskClick,
}) => {
  const DAY_WIDTH = 50; // ความกว้างของคอลัมน์วัน
  const today = getTodayYYYYMMDD();

  const { timelineDays, groupedTasks, totalWidth } = useMemo(() => {
    if (!tasks || tasks.length === 0)
      return { timelineDays: [], groupedTasks: {}, totalWidth: 0 };

    // 1. Group tasks by Deadline
    const grouped = tasks.reduce((acc, task) => {
      // ตรวจสอบความถูกต้องของ Deadline ก่อนจัดกลุ่ม
      if (task.Deadline && parseDate(task.Deadline)) {
        if (!acc[task.Deadline]) {
          acc[task.Deadline] = [];
        }
        acc[task.Deadline].push(task);
      }
      return acc;
    }, {} as Record<string, Task[]>);

    const dates = Object.keys(grouped);
    if (dates.length === 0)
      return { timelineDays: [], groupedTasks: {}, totalWidth: 0 };

    // 2. Determine date range
    dates.sort();
    const minDateStr = dates[0];
    const maxDateStr = dates[dates.length - 1];
    const minDate = parseDate(minDateStr)!;
    const maxDate = parseDate(maxDateStr)!;

    // 3. Generate Timeline Axis (Days)
    const days = [];
    // สร้างวันที่ใหม่เพื่อป้องกัน mutation
    let currentDate = new Date(minDate.getTime());

    while (currentDate <= maxDate) {
      const year = currentDate.getFullYear();
      // ใช้ YYYY-MM-DD ที่สอดคล้องกับ Local Timezone สำหรับ Key
      const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(currentDate.getDate()).padStart(2, "0")}`;

      days.push({
        date: new Date(currentDate.getTime()),
        dateStr: dateStr,
        dayOfMonth: currentDate.getDate(),
        // ใช้ภาษาไทยแสดงชื่อวันและเดือน
        dayOfWeek: currentDate.toLocaleString("th-TH", { weekday: "short" }),
        monthName: currentDate.toLocaleString("th-TH", { month: "short" }),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalWidth = days.length * DAY_WIDTH;

    return { timelineDays: days, groupedTasks: grouped, totalWidth };
  }, [tasks]);

  if (timelineDays.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center text-gray-500">
        ไม่พบ Task ที่มี Deadline ที่ถูกต้องในรายการที่กรอง
      </div>
    );
  }

  return (
    <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        มุมมอง Milestone Timeline
      </h3>
      <div className="overflow-x-auto pb-4">
        {/* Container หลักที่กำหนดความกว้าง */}
        <div style={{ width: `${totalWidth}px` }} className="flex">
          {timelineDays.map((day) => {
            const tasksForDay = groupedTasks[day.dateStr] || [];
            const isWeekend =
              day.date.getDay() === 0 || day.date.getDay() === 6;
            const isToday = day.dateStr === today;

            return (
              <div
                key={day.dateStr}
                style={{ width: `${DAY_WIDTH}px` }}
                // กำหนดพื้นหลังสำหรับวันหยุดสุดสัปดาห์
                className={`flex flex-col border-r last:border-r-0 ${
                  isWeekend ? "bg-gray-50" : ""
                }`}
              >
                {/* Header (Date Info) */}
                {/* ไฮไลท์สีส้มถ้าเป็นวันนี้ */}
                <div
                  className={`p-2 text-center border-b text-xs font-semibold ${
                    isToday
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <div>
                    {day.dayOfMonth} {day.monthName}
                  </div>
                  <div className="opacity-80">{day.dayOfWeek}</div>
                </div>

                {/* Timeline Area (สำหรับวาง Marker) */}
                <div className="h-20 relative">
                  {tasksForDay.length > 0 && (
                    <MilestoneMarker
                      date={day.dateStr}
                      tasks={tasksForDay}
                      onTaskClick={onTaskClick}
                      today={today}
                    />
                  )}
                  {/* เส้น Timeline หลัก (แนวนอน) */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// [🔥🔥🔥 END: New Milestone Timeline Chart Component 🔥🔥🔥]

// Helper Component สำหรับแสดง @mentions และ #tags
const AssigneeLabels: React.FC<{ text: string | null | undefined }> = ({
  text,
}) => {
  if (!text) {
    return <span>-</span>;
  }
  const parts = text.split(/([@#]\w+)/g).filter((part) => part);
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
            >
              {part}
            </span>
          );
        }
        if (part.startsWith("#")) {
          return (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full"
            >
              {part}
            </span>
          );
        }
        // ในกรณีที่เป็นข้อความธรรมดา อาจจะไม่ต้องแสดงผล หรือแสดงผลแบบปกติ
        return (
          <span
            key={index}
            className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full"
          >
            {part}
          </span>
        );
      })}
    </div>
  );
};

// Stat Card component for the summary - with tooltip
const StatDisplayCard: React.FC<{
  label: string;
  value: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
  description: string;
}> = ({ label, value, color, isActive, onClick, description }) => (
  <div className="relative group flex justify-center">
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 p-3 bg-gray-50 rounded-lg w-full text-left transition-all duration-200 ${
        isActive ? "ring-2 ring-orange-500 shadow-md" : "hover:bg-gray-100"
      }`}
    >
      <span className={`font-bold text-xl ${color}`}>{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </button>
    {/* Tooltip */}
    <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 px-3 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm scale-0 group-hover:scale-100 transition-transform origin-bottom z-10">
      {description}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
    </div>
  </div>
);

// [✅ แก้ไข] ปรับปรุง viewBox ให้ถูกต้องเป็น 0 0 24 24
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
// [🔥🔥🔥 Icons สำหรับสลับ View]
const TableViewIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

const TimelineViewIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
);

interface TasksTabProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskView: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenCreateTask: (defaults: {}) => void;
  onBulkUpdateDeadline: (
    taskIds: string[],
    newDeadline: string
  ) => Promise<void>;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onEditTask,
  onTaskView,
  onDeleteTask,
  onOpenCreateTask,
  onBulkUpdateDeadline,
}) => {
  const { projectName } = useParams<{ projectName: string }>();
  const { user } = useAuth(); // [✅ เพิ่ม]
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const { openCreateTaskModal } = useUI();
  // State สำหรับ Bulk Action
  // ใช้ Set เพื่อประสิทธิภาพในการจัดการ ID
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [newDeadline, setNewDeadline] = useState<string>("");

  // [🔥🔥🔥 State สำหรับจัดการมุมมอง (Table/Timeline )]
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const {
    refreshAllData,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProjectName,
    setSelectedProjectName,
    getProjectName,
  } = useData();

  useEffect(() => {
    if (projectName) {
      const project = projects.find((p) => p.Name === projectName);
      if (project) {
        setSelectedProjectId(project.ProjectID);
        setSelectedProjectName(project.Name);
      }
    }
  }, [projectName, projects, setSelectedProjectId, setSelectedProjectName]);

  const handleStatFilterClick = (filterType: string) => {
    setActiveStatFilter((prev) => (prev === filterType ? null : filterType));
  };

  const statDescriptions = {
    overdue: "งานที่ยังไม่เสร็จและเลยกำหนดส่งแล้ว",
    warning: "งานที่ยังไม่เสร็จและใกล้ถึงกำหนดส่งใน 10 วัน",
    incomplete:
      "งานทั้งหมดที่ยังต้องดำเนินการ (สถานะไม่ใช่ 'เสร็จสิ้น' หรือ 'ยกเลิก')",
    done: "งานทั้งหมดที่มีสถานะ 'เสร็จสิ้น'",
    helpMe: "งานที่ทีมกำลังร้องขอความช่วยเหลือ",
  };

  const formatDateToDDMMYYYY = (
    dateString: string | null | undefined
  ): string => {
    if (!dateString) return "วันที่ไม่ระบุ";
    // เนื่องจาก Format คือ YYYY-MM-DD
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return "วันที่ไม่ระบุ";
  };

  const getTodayYYYYMMDD = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const getWarningDateYYYYMMDD = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- KPIs Calculation ---
  const { statusMetrics } = useMemo(() => {
    const today = getTodayYYYYMMDD();
    const warningDate = getWarningDateYYYYMMDD(10);

    const incompleteTasks = tasks.filter(
      (t) => t.Status !== "Done" && t.Status !== "Cancelled"
    );
    const overdueCount = incompleteTasks.filter(
      (t) => t.Deadline && t.Deadline < today
    ).length;
    const warningCount = incompleteTasks.filter((t) => {
      if (!t.Deadline) return false;
      return t.Deadline >= today && t.Deadline <= warningDate;
    }).length;

    const doneCount = tasks.filter((t) => t.Status === "Done").length;
    const helpMeCount = tasks.filter((t) => t.Status === "Help Me").length;

    const metrics = {
      overdue: overdueCount,
      warning: warningCount,
      incomplete: incompleteTasks.length,
      done: doneCount,
      helpMe: helpMeCount,
    };

    return { statusMetrics: metrics };
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const today = getTodayYYYYMMDD();
    const warningDate = getWarningDateYYYYMMDD(10);

    let tasksToProcess = tasks;

    if (activeStatFilter) {
      const incomplete = tasks.filter(
        (t) => t.Status !== "Done" && t.Status !== "Cancelled"
      );
      switch (activeStatFilter) {
        case "Overdue":
          tasksToProcess = incomplete.filter(
            (t) => t.Deadline && t.Deadline < today
          );
          break;
        case "Warning":
          tasksToProcess = incomplete.filter((t) => {
            if (!t.Deadline) return false;
            return t.Deadline >= today && t.Deadline <= warningDate;
          });
          break;
        case "Incomplete":
          tasksToProcess = incomplete;
          break;
        case "Done":
          tasksToProcess = tasks.filter((t) => t.Status === "Done");
          break;
        case "Help Me":
          tasksToProcess = tasks.filter((t) => t.Status === "Help Me");
          break;
      }
    }

    let finalFiltered = tasksToProcess.filter((task) => {
      // [✅ แก้ไข] ใช้ task.HelpAssignee โดยตรง (ไม่ต้องใช้ as any เพราะแก้ไข types.ts แล้ว)
      const matchesOwner = ownerFilter
        ? task.Owner === ownerFilter || task.HelpAssignee === ownerFilter
        : true;
      const matchesStatus = statusFilter ? task.Status === statusFilter : true;
      const matchesSearch = searchQuery
        ? task.Task.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task["Notes / Result"] || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          getProjectName(task.ProjectID)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;
      return matchesOwner && matchesStatus && matchesSearch;
    });

    finalFiltered.sort((a, b) => {
      const aHasDeadline = a.Deadline != null && a.Deadline !== "";
      const bHasDeadline = b.Deadline != null && b.Deadline !== "";

      // จัดการ Null/Empty (เรียงตามลำดับ Ascending: มี Deadline ก่อน)
      if (aHasDeadline && !bHasDeadline) return -1;
      if (!aHasDeadline && bHasDeadline) return 1;
      if (!aHasDeadline && !bHasDeadline) return 0;

      // ใช้การเปรียบเทียบ String (YYYY-MM-DD)
      if (a.Deadline! < b.Deadline!) return -1;
      if (a.Deadline! > b.Deadline!) return 1;
      return 0;
    });

    return finalFiltered;
  }, [
    tasks,
    ownerFilter,
    statusFilter,
    searchQuery,
    activeStatFilter,
    getProjectName,
  ]);

  // [✅ เพิ่ม/ปรับปรุง] --- Bulk Action Logic ---
  // [✅ ปรับปรุง] Synchronize selection state when filters or tasks change
  // การเปลี่ยนแปลง Filter หรือการเปลี่ยน Project จะทำให้ filteredAndSortedTasks เปลี่ยน
  useEffect(() => {
    // สร้าง Set ของ ID ที่แสดงอยู่ในปัจจุบัน
    const visibleIds = new Set(filteredAndSortedTasks.map((t) => t._id));

    setSelectedTaskIds((prevSelectedIds) => {
      // กรองเอาเฉพาะ ID ที่ยังแสดงอยู่ (ป้องกันการแก้ไข Task ที่ถูกซ่อน)
      const newSelectedIds = new Set(
        [...prevSelectedIds].filter((id) => visibleIds.has(id))
      );

      if (newSelectedIds.size === prevSelectedIds.size) {
        // ถ้าไม่มีการเปลี่ยนแปลง ให้ return state เดิมเพื่อป้องกันการ re-render ที่ไม่จำเป็น
        return prevSelectedIds;
      }

      // ถ้ามีการเปลี่ยนแปลง (เช่น Task ถูกกรองออก)
      setNewDeadline(""); // เคลียร์ Deadline input
      return newSelectedIds;
    });
  }, [filteredAndSortedTasks]); // ขึ้นอยู่กับ filteredAndSortedTasks

  // Handler สำหรับการเลือก/ไม่เลือก Task เดียว
  const handleSelectOne = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId);
      } else {
        newSelection.add(taskId);
      }
      return newSelection;
    });
  };

  // คำนวณ Task ที่สามารถแก้ไขได้ (ที่แสดงอยู่)
  const editableTasksInView = useMemo(() => {
    return filteredAndSortedTasks.filter((task) => canEditTask(user, task));
  }, [filteredAndSortedTasks, user]);

  // Handler สำหรับการเลือก/ไม่เลือกทั้งหมด (เฉพาะที่แก้ไขได้)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // เลือกทั้งหมดที่แก้ไขได้ในหน้านี้
      setSelectedTaskIds(new Set(editableTasksInView.map((t) => t._id)));
    } else {
      // ยกเลิกการเลือกทั้งหมด
      setSelectedTaskIds(new Set());
    }
  };

  // [✅ เพิ่ม] ตรวจสอบสถานะ Select All (All, Partial, None)
  // เนื่องจากการ Sync ทำให้ selectedTaskIds มีเฉพาะ Task ที่แสดงและแก้ไขได้เท่านั้น
  const isAllSelected =
    editableTasksInView.length > 0 &&
    selectedTaskIds.size === editableTasksInView.length;
  const isPartialSelected =
    selectedTaskIds.size > 0 &&
    selectedTaskIds.size < editableTasksInView.length;

  // Handler สำหรับการทำ Bulk Update
  const handleBulkUpdate = async () => {
    if (selectedTaskIds.size === 0 || !newDeadline || isBulkUpdating) return;

    // [✅ เพิ่ม] การยืนยันก่อนดำเนินการ
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ที่จะเปลี่ยน Deadline ของ ${
          selectedTaskIds.size
        } Task เป็น ${formatDateToDDMMYYYY(newDeadline)}?`
      )
    ) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      await onBulkUpdateDeadline(Array.from(selectedTaskIds), newDeadline);
      // หากสำเร็จ ให้ล้างการเลือก
      setSelectedTaskIds(new Set());
      setNewDeadline("");
      // ข้อมูลควรอัปเดตอัตโนมัติผ่าน DataContext หรือเรียก refreshAllData() ถ้าจำเป็น
    } catch (error) {
      console.error("Error during bulk update:", error);
      // ควรเพิ่มการแจ้งเตือน Error ให้ผู้ใช้ทราบ (เช่น ใช้ Toast)
      alert("เกิดข้อผิดพลาดในการอัปเดต Deadline");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Summary Section */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-bold text-gray-700">
            สรุปสถานะ Task ของโปรเจกต์นี้
          </h3>
          <button
            onClick={refreshAllData}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
            aria-label="Refresh data"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatDisplayCard
            label="Overdue"
            value={statusMetrics.overdue}
            color="text-red-500"
            isActive={activeStatFilter === "Overdue"}
            onClick={() => handleStatFilterClick("Overdue")}
            description={statDescriptions.overdue}
          />
          <StatDisplayCard
            label="Warning"
            value={statusMetrics.warning}
            color="text-yellow-500"
            isActive={activeStatFilter === "Warning"}
            onClick={() => handleStatFilterClick("Warning")}
            description={statDescriptions.warning}
          />
          <StatDisplayCard
            label="Incomplete"
            value={statusMetrics.incomplete}
            color="text-blue-500"
            isActive={activeStatFilter === "Incomplete"}
            onClick={() => handleStatFilterClick("Incomplete")}
            description={statDescriptions.incomplete}
          />
          <StatDisplayCard
            label="Done"
            value={statusMetrics.done}
            color="text-green-500"
            isActive={activeStatFilter === "Done"}
            onClick={() => handleStatFilterClick("Done")}
            description={statDescriptions.done}
          />
          <StatDisplayCard
            label="Help Me"
            value={statusMetrics.helpMe}
            color="text-purple-500"
            isActive={activeStatFilter === "Help Me"}
            onClick={() => handleStatFilterClick("Help Me")}
            description={statDescriptions.helpMe}
          />
        </div>
      </div>

      {/* Filter Section */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-gray-700">
            ตัวกรองและเครื่องมือ
          </h3>
          <div className="flex items-center gap-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <TableViewIcon className="w-5 h-5 mr-2" />
                ตาราง
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center px-4 py-2 text-sm font-medium border rounded-r-lg transition-colors ${
                  viewMode === "timeline"
                    ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <TimelineViewIcon className="w-5 h-5 mr-2" />
                Timeline
              </button>
            </div>
          </div>

          {selectedProjectId && selectedProjectId !== "ALL" ? (
            <button
              onClick={openCreateTaskModal}
              className="flex items-center px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors
          duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="ml-2">เพิ่ม Task</span>
            </button>
          ) : (
            <div className="text-sm text-gray-500 italic">
              (เลือกโปรเจกต์เพื่อเพิ่ม Task)
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Owner / Assignee
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">-- ทีมทั้งหมด --</option>
              {ownerOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">-- ทุกสถานะ --</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              ค้นหา Task / Note
            </label>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* [✅ เพิ่ม] Bulk Action Bar */}
      {/* [✅ ปรับปรุง] เพิ่ม sticky top-0 z-10 เพื่อให้อยู่ด้านบนเมื่อ Scroll */}
      {selectedTaskIds.size > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-300 flex flex-wrap items-center justify-between gap-4 transition-all duration-300 sticky top-0 z-10">
          <div className="text-sm font-medium text-blue-800">
            เลือกแล้ว {selectedTaskIds.size} รายการ
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label
              htmlFor="bulk-deadline-input"
              className="text-sm font-medium text-gray-700"
            >
              กำหนด Deadline ใหม่:
            </label>
            <input
              id="bulk-deadline-input"
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              onClick={handleBulkUpdate}
              disabled={!newDeadline || isBulkUpdating}
              className={`px-4 py-2 text-sm font-semibold rounded-md text-white transition-colors duration-200 ${
                !newDeadline || isBulkUpdating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              }`}
            >
              {isBulkUpdating ? "กำลังอัปเดต..." : "ยืนยันการแก้ไข"}
            </button>
            <button
              onClick={() => {
                setSelectedTaskIds(new Set());
                setNewDeadline("");
              }}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 hover:bg-gray-200 rounded-md"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}
      {/* [🔥🔥🔥 Conditional Rendering: Timeline View] */}
      {viewMode === "timeline" && (
        <TasksMilestoneChart
          tasks={filteredAndSortedTasks} // ส่ง Task ที่กรองแล้วเข้าไป
          onTaskClick={onEditTask}
        />
      )}
      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    id="checkbox-all-search"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    // [✅ เพิ่ม] จัดการ Indeterminate state โดยใช้ Callback Ref
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isPartialSelected;
                      }
                    }}
                    // Disable ถ้าไม่มี Task ที่แก้ไขได้เลย
                    disabled={editableTasksInView.length === 0}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
                    title={
                      editableTasksInView.length === 0
                        ? "ไม่มี Task ที่คุณแก้ไขได้ในมุมมองนี้"
                        : "เลือกทั้งหมด (ที่แก้ไขได้)"
                    }
                  />
                  <label htmlFor="checkbox-all-search" className="sr-only">
                    เลือกทั้งหมด
                  </label>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                กำหนดส่ง
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                รายการ Task
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                หมายเหตุ / ผลลัพธ์
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                ทีมที่รับผิดชอบ
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                ผู้ปฏิบัติงาน
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                ทีมที่ร้องขอความช่วยเหลือ
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                รายละเอียดการช่วยเหลือ
              </th>
              <th scope="col" className="px-6 py-3 font-medium text-left">
                สถานะ
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-center">
                การกระทำ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedTasks.map((task) => {
              // [✅ เพิ่ม] ตรวจสอบสิทธิ์การแก้ไข
              const userCanEdit = canEditTask(user, task);
              const isSelected = selectedTaskIds.has(task._id);

              return (
                // [🔥🔥🔥 ทำให้แถวคลิกได้ และเพิ่ม cursor-pointer]
                <tr
                  key={task._id}
                  // ใช้ onEditTask เพื่อให้เหมือน Dashboard.tsx
                  onClick={() => onEditTask(task)}
                  className="bg-white hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  aria-label="Edit Task"
                >
                  <td className="w-4 p-4">
                    {userCanEdit ? (
                      // [🔥🔥🔥 เพิ่ม stopPropagation เพื่อป้องกันการคลิก Checkbox แล้วเปิด Modal]
                      <div
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          id={`checkbox-table-search-${task._id}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(task._id)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`checkbox-table-search-${task._id}`}
                          className="sr-only"
                        >
                          checkbox
                        </label>
                      </div>
                    ) : (
                      // แสดงช่องว่างถ้าแก้ไขไม่ได้ เพื่อให้ Layout ไม่เลื่อน
                      <div
                        className="w-4 h-4"
                        title="คุณไม่มีสิทธิ์แก้ไข Task นี้"
                      ></div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateToDDMMYYYY(task.Deadline)}
                  </td>
                  <td
                    className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate"
                    title={task.Task}
                  >
                    {task.Task}
                  </td>
                  <td
                    className="px-6 py-4 text-gray-600 max-w-sm truncate"
                    title={task["Notes / Result"]}
                  >
                    {truncateText(task["Notes / Result"], 10)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                      {task.Owner}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <AssigneeLabels text={task["Feedback to Team"]} />
                  </td>
                  {/* [✅ แก้ไข] ใช้ Property โดยตรง */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-medium">
                    {task.HelpAssignee || "-"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
                    title={task.HelpDetails || undefined}
                  >
                    {truncateText(task.HelpDetails, 10)}
                  </td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      statusColorMap[task.Status] || "text-gray-500"
                    }`}
                  >
                    {task.Status}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {/* [🔥🔥🔥 เพิ่ม stopPropagation เพื่อป้องกันการคลิกปุ่ม Actions แล้วเปิด Modal ซ้ำ] */}
                    <div
                      className="flex items-center justify-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onTaskView(task)}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100"
                        aria-label="View Task Details"
                      >
                        <ViewIcon />
                      </button>
                      {/* [✅ แก้ไข] แสดงปุ่มเมื่อมีสิทธิ์เท่านั้น */}
                      {userCanEdit && (
                        <>
                          <button
                            onClick={() => onEditTask(task)}
                            className="text-gray-500 hover:text-orange-600 p-2 rounded-full hover:bg-orange-100"
                            aria-label="Edit Task"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task)}
                            className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100"
                            aria-label="Delete Task"
                          >
                            <DeleteIcon />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedTasks.length === 0 && (
              <tr>
                {/* [✅] แก้ไข colSpan เป็น 10 ให้ตรงกับจำนวนคอลัมน์ */}
                <td colSpan={10} className="text-center py-10 text-gray-500">
                  กำลังโหลดข้อมูลและการวิเคราะห์...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
