// components/DashboardTab.tsx (New File)
import React, { useMemo, useState, useEffect } from "react";
import { useGlobalFilters } from "@/components/GlobalFilterContext";
import { useData } from "@/contexts/DataContext";
import { useUI } from "@/contexts/UIContext";
import { Project, Task } from "../types";
import { useAuth } from "@/contexts/AuthContext"; // [✅ เพิ่ม]
import { canEditTask } from "@/utils/authUtils"; // [✅ เพิ่ม]
import { ViewIcon } from "./icons";

// --- Helper Component: FilterDropdown ---
const truncateText = (text: string, wordLimit: number): string => {
  if (!text) return "-";
  const words = text.split(" ");
  if (words.length <= wordLimit) {
    return text;
  }
  return words.slice(0, wordLimit).join(" ") + "...";
};
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
        // return <span key={index}>{part}</span>;
        return null;
      })}
    </div>
  );
};

const FilterDropdown: React.FC<{
  label: string;
  value: string | null;
  // รองรับทั้ง String Array (Owner/Status) และ Project Array
  options: Array<string | Project>;
  onChange: (value: string | null) => void;
  disabled: boolean;
}> = ({ label, value, options, onChange, disabled }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100"
      disabled={disabled || options.length === 0}
    >
      <option value="">-- ทั้งหมด ({options.length}) --</option>
      {options.map((opt, index) =>
        typeof opt === "string" ? (
          <option key={`${opt}-${index}`} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.ProjectID} value={opt.ProjectID}>
            {opt.Name}
          </option>
        )
      )}
    </select>
  </div>
);

// --- Stat Card Component (Copied from TasksTab) ---
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
    <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 px-3 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm scale-0 group-hover:scale-100 transition-transform origin-bottom z-10">
      {description}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
    </div>
  </div>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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

const SortIcon: React.FC<{ direction: "asc" | "desc" }> = ({ direction }) => (
  <svg
    className="w-4 h-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {direction === "asc" ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    )}
  </svg>
);

const formatDateToDDMMYYYY = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  // เนื่องจาก Format คือ YYYY-MM-DD
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return "N/A";
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

// --- Main Component: DashboardTab ---
export const DashboardTab: React.FC = () => {
  const { user } = useAuth(); // [✅ เพิ่ม]
  const {
    selections,
    options,
    setFilter,
    setSearchQuery,
    resetFilters,
    isLoading,
    filteredTasks, // These are the tasks filtered by the global dropdowns
  } = useGlobalFilters();
  const { projects, refreshAllData, bulkUpdateDeadline } = useData();
  const { onTaskView, openEditModal } = useUI();
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // [✅✅✅ เพิ่ม State สำหรับ Bulk Action]
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [newDeadline, setNewDeadline] = useState<string>("");

  const handleStatFilterClick = (filterType: string) => {
    setActiveStatFilter((prev) => (prev === filterType ? null : filterType));
  };

  const handleSortByDeadline = () => {
    setSortOrder((currentOrder) => (currentOrder === "asc" ? "desc" : "asc"));
  };

  const statDescriptions = {
    overdue: "งานที่ยังไม่เสร็จและเลยกำหนดส่งแล้ว",
    warning: "งานที่ยังไม่เสร็จและใกล้ถึงกำหนดส่งใน 10 วัน",
    incomplete:
      "งานทั้งหมดที่ยังต้องดำเนินการ (สถานะไม่ใช่ 'เสร็จสิ้น' หรือ 'ยกเลิก')",
    done: "งานทั้งหมดที่มีสถานะ 'เสร็จสิ้น'",
    helpMe: "งานที่ทีมกำลังร้องขอความช่วยเหลือ",
  };

  // --- KPIs Calculation (based on globally filtered tasks) ---
  const { statusMetrics, avgHelpLeadTime } = useMemo(() => {
    const today = getTodayYYYYMMDD();
    const warningDate = getWarningDateYYYYMMDD(10);

    const incompleteTasks = filteredTasks.filter(
      (t) => t.Status !== "Done" && t.Status !== "Cancelled"
    );
    const overdueCount = incompleteTasks.filter(
      (t) => t.Deadline && t.Deadline < today
    ).length;
    const warningCount = incompleteTasks.filter((t) => {
      if (!t.Deadline) return false;
      return t.Deadline >= today && t.Deadline <= warningDate;
    }).length;

    const doneCount = filteredTasks.filter((t) => t.Status === "Done").length;
    const helpMeCount = filteredTasks.filter(
      (t) => t.Status === "Help Me"
    ).length;

    const tasksRequestingHelp = filteredTasks.filter(
      (t) => t.Status === "Help Me" && t.HelpRequestedAt && t.Deadline
    );

    let totalLeadTime = 0;
    let validRequests = 0;
    if (tasksRequestingHelp.length > 0) {
      tasksRequestingHelp.forEach((task) => {
        const requestDate = new Date(task.HelpRequestedAt!);
        const deadlineDate = new Date(task.Deadline!);
        if (!isNaN(requestDate.getTime()) && !isNaN(deadlineDate.getTime())) {
          const diffTime = deadlineDate.getTime() - requestDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalLeadTime += diffDays;
          validRequests++;
        }
      });
    }

    const avgLeadTime =
      tasksRequestingHelp.length > 0
        ? (totalLeadTime / tasksRequestingHelp.length).toFixed(1)
        : "N/A";

    const metrics = {
      overdue: overdueCount,
      warning: warningCount,
      incomplete: incompleteTasks.length,
      done: doneCount,
      helpMe: helpMeCount,
    };

    return { statusMetrics: metrics, avgHelpLeadTime: avgLeadTime };
  }, [filteredTasks]);

  // Helper สำหรับหาชื่อโปรเจกต์
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.ProjectID === projectId);
    return project ? project.Name : projectId;
  };

  // Final filtering and sorting
  const finalSortedTasks = useMemo(() => {
    const today = getTodayYYYYMMDD();
    const warningDate = getWarningDateYYYYMMDD(10);

    let tasksToProcess = filteredTasks;

    // 1. Apply Stat Card Filtering
    if (activeStatFilter) {
      const incomplete = tasksToProcess.filter(
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
          tasksToProcess = tasksToProcess.filter((t) => t.Status === "Done");
          break;
        case "Help Me":
          tasksToProcess = tasksToProcess.filter((t) => t.Status === "Help Me");
          break;
      }
    }

    // 2. Sorting
    const sorted = [...tasksToProcess].sort((a, b) => {
      const aHasDeadline = a.Deadline != null && a.Deadline !== "";
      const bHasDeadline = b.Deadline != null && b.Deadline !== "";

      if (aHasDeadline && !bHasDeadline) return sortOrder === "asc" ? -1 : 1;
      if (!aHasDeadline && bHasDeadline) return sortOrder === "asc" ? 1 : -1;
      if (!aHasDeadline && !bHasDeadline) return 0;

      if (a.Deadline! < b.Deadline!) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (a.Deadline! > b.Deadline!) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [filteredTasks, activeStatFilter, sortOrder]);

  // [✅✅✅ START: Bulk Action Logic (Adapted from TasksTab) ✅✅✅]

  // 1. คำนวณ Task ที่สามารถแก้ไขได้ (ที่แสดงอยู่)
  const editableTasksInView = useMemo(() => {
    return finalSortedTasks.filter((task) => canEditTask(user, task));
  }, [finalSortedTasks, user]);

  // 2. Synchronize selection state when filters change
  useEffect(() => {
    // สร้าง Set ของ ID ที่แสดงอยู่ในปัจจุบัน
    const visibleIds = new Set(finalSortedTasks.map((t) => t._id));

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
  }, [finalSortedTasks]); // ขึ้นอยู่กับ finalSortedTasks

  // 3. Handler สำหรับการเลือก/ไม่เลือก Task เดียว
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

  // 4. Handler สำหรับการเลือก/ไม่เลือกทั้งหมด (เฉพาะที่แก้ไขได้)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // เลือกทั้งหมดที่แก้ไขได้ในหน้านี้
      setSelectedTaskIds(new Set(editableTasksInView.map((t) => t._id)));
    } else {
      // ยกเลิกการเลือกทั้งหมด
      setSelectedTaskIds(new Set());
    }
  };

  // 5. ตรวจสอบสถานะ Select All (All, Partial, None)
  const isAllSelected =
    editableTasksInView.length > 0 &&
    selectedTaskIds.size === editableTasksInView.length;
  const isPartialSelected =
    selectedTaskIds.size > 0 &&
    selectedTaskIds.size < editableTasksInView.length;

  // 6. Handler สำหรับการทำ Bulk Update
  const handleBulkUpdate = async () => {
    if (selectedTaskIds.size === 0 || !newDeadline || isBulkUpdating) return;

    // [✅ เพิ่มการตรวจสอบฟังก์ชัน]
    if (!bulkUpdateDeadline) {
      console.error(
        "bulkUpdateDeadline function is not available in DataContext."
      );
      alert("ฟังก์ชันการอัปเดตจำนวนมากยังไม่พร้อมใช้งาน (ตรวจสอบ DataContext)");
      return;
    }

    // Confirmation
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
      await bulkUpdateDeadline(Array.from(selectedTaskIds), newDeadline);
      // Clear selection on success
      setSelectedTaskIds(new Set());
      setNewDeadline("");
      // DataContext should handle the refresh automatically
    } catch (error) {
      console.error("Error during bulk update:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดต Deadline");
    } finally {
      setIsBulkUpdating(false);
    }
  };
  // [✅✅✅ END: Bulk Action Logic ✅✅✅]

  if (isLoading && finalSortedTasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        กำลังโหลดข้อมูลและการวิเคราะห์...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Dashboard & Global Filters
      </h1>

      {/* KPIs Summary Section */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-bold text-gray-700">
            สรุปสถานะ Task (จากผลการกรอง)
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
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              ระยะเวลาเฉลี่ยที่ขอความช่วยเหลือก่อน Deadline:
            </span>
            <span className="ml-2 font-bold text-lg text-gray-800">
              {avgHelpLeadTime}
            </span>
            {/* [✅ แก้ไข] แสดงหน่วย "วัน" เมื่อมีค่าเท่านั้น */}
            {avgHelpLeadTime !== "N/A" && (
              <span className="ml-1 text-sm text-gray-600">วัน</span>
            )}
          </div>
        </div>
      </div>

      {/* [✅✅✅ Filter Bar - ส่วนที่แก้ไข] */}
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <FilterDropdown
            // [✅ ปรับปรุงชื่อ]
            label="ผู้รับผิดชอบ/ผู้ช่วย"
            value={selections.owner}
            options={options.owners}
            onChange={(val) => setFilter("owner", val)}
            disabled={isLoading}
          />

          {/* [✅ นำ Comment ออก] */}
          <FilterDropdown
            label="ชื่อโปรเจกต์"
            value={selections.projectId}
            options={options.projects}
            onChange={(val) => setFilter("projectId", val)}
            disabled={isLoading}
          />
          {/* [✅ นำ Comment ออก] */}
          <FilterDropdown
            label="สถานะ"
            value={selections.status}
            options={options.statuses}
            onChange={(val) => setFilter("status", val)}
            disabled={isLoading}
          />

          {/* [✅ นำ Comment ออก] */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              กรองกำหนดเริ่มต้น
            </label>
            <input
              type="date"
              value={selections.startDate || ""}
              onChange={(e) => setFilter("startDate", e.target.value || null)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
          {/* [✅ นำ Comment ออก] */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              กรองกำหนดสิ้นสุด
            </label>
            <input
              type="date"
              value={selections.endDate || ""}
              onChange={(e) => setFilter("endDate", e.target.value || null)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            ค้นหา หัวข้อ/รายละเอียด
          </label>
          <input
            type="text"
            placeholder="ค้นหา หัวข้อ/รายละเอียด หรือ ทีมที่รับผิดชอบ"
            value={selections.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-between items-center pt-4 border-t mt-6">
          <p className="text-lg font-semibold text-gray-800">
            พบผลลัพธ์:{" "}
            <span className="text-orange-500">{finalSortedTasks.length}</span>{" "}
            รายการ
          </p>
          <button
            onClick={() => {
              resetFilters();
              setActiveStatFilter(null);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition duration-150 disabled:opacity-40"
            disabled={
              Object.values(selections).every((v) => v === null || v === "") &&
              !activeStatFilter
            }
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>

      {/* [✅✅✅ New Section: Bulk Action Bar (Copied from TasksTab) ✅✅✅] */}
      {selectedTaskIds.size > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-300 flex flex-wrap items-center justify-between gap-4 transition-all duration-300 sticky top-0 z-10">
          <div className="text-sm font-medium text-blue-800">
            เลือกแล้ว {selectedTaskIds.size} รายการ
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label
              htmlFor="bulk-deadline-input-dashboard"
              className="text-sm font-medium text-gray-700"
            >
              กำหนด Deadline ใหม่:
            </label>
            <input
              id="bulk-deadline-input-dashboard"
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
      {/* [✅✅✅ End Bulk Action Bar ✅✅✅] */}

      {/* ตารางแสดงผลลัพธ์ */}
      <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* [✅ New Column: Checkbox Header] */}
              <th scope="col" className="p-4 w-4">
                <div className="flex items-center">
                  <input
                    id="checkbox-all-search-dashboard"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    // จัดการ Indeterminate state โดยใช้ Callback Ref
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
                  <label
                    htmlFor="checkbox-all-search-dashboard"
                    className="sr-only"
                  >
                    เลือกทั้งหมด
                  </label>
                </div>
              </th>
              {/* [✅ End Checkbox Header] */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={handleSortByDeadline}
                  className="flex items-center space-x-1 hover:text-gray-800 transition-colors"
                >
                  <span>กำหนดส่ง</span>
                  <SortIcon direction={sortOrder} />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ทีมที่รับผิดชอบ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                โปรเจกต์
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ผู้ปฏิบัติงาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายละเอียด
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ทีมที่ร้องขอความช่วยเหลือ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายละเอียดการร้องขอ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {finalSortedTasks.map((task) => {
              const userCanEdit = canEditTask(user, task);
              const isSelected = selectedTaskIds.has(task._id);

              // [✅✅✅ New Logic] การตรวจสอบเพื่อเน้นสี Owner/Assignee
              const activeOwnerFilter = selections.owner;
              const isPrimaryOwner = task.Owner === activeOwnerFilter;
              const isHelpAssignee = task.HelpAssignee === activeOwnerFilter;

              // กำหนดสีสำหรับ Owner หลัก
              let ownerTextColor = "text-gray-900 font-medium"; // สี Default
              if (activeOwnerFilter) {
                if (isPrimaryOwner) {
                  // ถ้า Owner หลักตรงกับ Filter ให้เน้นสีส้มและตัวหนา
                  ownerTextColor = "text-orange-600 font-bold";
                } else if (isHelpAssignee) {
                  // ถ้า Owner หลักไม่ตรง (เช่น WEB) แต่ Task นี้แสดงเพราะ HelpAssignee ตรง (เช่น MARKETING) ให้ใช้สีเทา
                  ownerTextColor = "text-gray-500 font-medium";
                }
              }

              return (
                <tr key={task._id}
                    onClick={() => openEditModal(task)}
                    className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 cursor-pointer"
                    aria-label="View Task Details"
                  >
                    <td className="w-4 p-4">
                      {userCanEdit ? (
                        <div className="flex items-center">
                          <input
                            id={`checkbox-table-dashboard-${task._id}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(task._id)}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`checkbox-table-dashboard-${task._id}`}
                            className="sr-only"
                          >
                            checkbox
                          </label>
                        </div>
                      ) : (
                        // แสดงช่องว่างถ้าแก้ไขไม่ได้
                        <div
                          className="w-4 h-4"
                          title="คุณไม่มีสิทธิ์แก้ไข Task นี้"
                        ></div>
                      )}
                    </td>
                    {/* [✅ End Checkbox Cell] */}

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateToDDMMYYYY(task.Deadline)}
                    </td>

                    {/* [✅ Updated Cell] Owner Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={ownerTextColor}>
                        {task.Owner || "-"}
                      </span>
                      {/* แสดงข้อความเสริม ถ้า Task นี้แสดงเพราะ HelpAssignee */}
                      {activeOwnerFilter &&
                        !isPrimaryOwner &&
                        isHelpAssignee && (
                          <span
                            title={`แสดงเนื่องจาก ${activeOwnerFilter} เป็นผู้ช่วยเหลือ (Help Assignee)`}
                            className="ml-2 text-xs text-purple-500 italic"
                          >
                            (Via Help)
                          </span>
                        )}
                    </td>

                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-md"
                      title={task.Task}
                    >
                      {task.Task}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-sm"
                      title={getProjectName(task.ProjectID)}
                    >
                      {getProjectName(task.ProjectID)}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <AssigneeLabels text={task["Feedback to Team"]} />
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-sm"
                      title={task["Notes / Result"]}
                    >
                      {truncateText(task["Notes / Result"], 10)}
                    </td>
                    {/* [✅ Updated Cell] Help Assignee Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* เน้นสีม่วงเข้มและขีดเส้นใต้ถ้าตรงกับ Filter */}
                      <span
                        className={
                          isHelpAssignee && activeOwnerFilter
                            ? "text-purple-700 font-bold underline"
                            : "text-purple-700"
                        }
                      >
                        {task.HelpAssignee || "-"}
                      </span>
                    </td>

                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs"
                      title={task.HelpDetails}
                    >
                      {truncateText(task.HelpDetails, 10)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.Status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {userCanEdit && (
                        <button
                          onClick={() => openEditModal(task)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  
                </tr>
              );
            })}
          </tbody>
        </table>
        {finalSortedTasks.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500 bg-white">
            ไม่พบ Task ที่ตรงกับเกณฑ์การค้นหา
          </div>
        )}
      </div>
    </div>
  );
};
