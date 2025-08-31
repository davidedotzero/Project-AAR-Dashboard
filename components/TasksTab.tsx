import React, { useState, useMemo } from "react";
import type { Task } from "../types";
import {
  statusColorMap,
  // phaseColorMap, // ไม่ได้ใช้งาน
  ownerOptions,
  statusOptions,
} from "@/constants";
import { EditIcon, ViewIcon, DeleteIcon } from "@/components/icons";
// import { DeadlineAlert } from "@/components/DeadlineAlert"; // ไม่ได้ใช้งาน
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext"; // [✅ เพิ่ม]
import { canEditTask } from "@/utils/authUtils"; // [✅ เพิ่ม]
import { useUI } from "@/contexts/UIContext";

// Helper function to truncate text (เหมือนเดิม)
const truncateText = (text: string | null | undefined, wordLimit: number): string => {
  if (!text) return "-";
  const words = text.split(" ");
  if (words.length <= wordLimit) {
    return text;
  }
  return words.slice(0, wordLimit).join(" ") + "...";
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
      className={`flex items-center space-x-2 p-3 bg-gray-50 rounded-lg w-full text-left transition-all duration-200 ${isActive ? 'ring-2 ring-orange-500 shadow-md' : 'hover:bg-gray-100'
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
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);


interface TasksTabProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskView: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenCreateTask: (defaults: {}) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onEditTask,
  onTaskView,
  onDeleteTask,
  onOpenCreateTask,
}) => {
  const { user } = useAuth(); // [✅ เพิ่ม]
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const { fetchTasks, selectedProjectId } = useData();
  const { openCreateTaskModal } = useUI()

  const { refreshAllData } = useData();

  // const handleRefresh = () => {
  //   refreshAllData();
  // };

  const handleStatFilterClick = (filterType: string) => {
    setActiveStatFilter(prev => (prev === filterType ? null : filterType));
  };

  const statDescriptions = {
    overdue: "งานที่ยังไม่เสร็จและเลยกำหนดส่งแล้ว",
    warning: "งานที่ยังไม่เสร็จและใกล้ถึงกำหนดส่งใน 10 วัน",
    incomplete: "งานทั้งหมดที่ยังต้องดำเนินการ (สถานะไม่ใช่ 'เสร็จสิ้น' หรือ 'ยกเลิก')",
    done: "งานทั้งหมดที่มีสถานะ 'เสร็จสิ้น'",
    helpMe: "งานที่ทีมกำลังร้องขอความช่วยเหลือ",
  };

  const formatDateToDDMMYYYY = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    // [✅ ปรับปรุง] ใช้ UTC เพื่อป้องกันปัญหา Timezone
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // --- KPIs Calculation ---
  const { statusMetrics } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const warningDate = new Date(today);
    warningDate.setDate(today.getDate() + 10);

    const incompleteTasks = tasks.filter(t => t.Status !== 'Done' && t.Status !== 'Cancelled');
    const overdueCount = incompleteTasks.filter(t => t.Deadline && new Date(t.Deadline) < today).length;
    const warningCount = incompleteTasks.filter(t => {
      if (!t.Deadline) return false;
      const deadlineDate = new Date(t.Deadline);
      return deadlineDate >= today && deadlineDate <= warningDate;
    }).length;
    const doneCount = tasks.filter(t => t.Status === 'Done').length;
    const helpMeCount = tasks.filter(t => t.Status === 'Help Me').length;

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningDate = new Date(today);
    warningDate.setDate(today.getDate() + 10);

    let tasksToProcess = tasks;

    if (activeStatFilter) {
      const incomplete = tasks.filter(t => t.Status !== 'Done' && t.Status !== 'Cancelled');
      switch (activeStatFilter) {
        case 'Overdue':
          tasksToProcess = incomplete.filter(t => t.Deadline && new Date(t.Deadline) < today);
          break;
        case 'Warning':
          tasksToProcess = incomplete.filter(t => {
            if (!t.Deadline) return false;
            const deadlineDate = new Date(t.Deadline);
            return deadlineDate >= today && deadlineDate <= warningDate;
          });
          break;
        case 'Incomplete':
          tasksToProcess = incomplete;
          break;
        case 'Done':
          tasksToProcess = tasks.filter(t => t.Status === 'Done');
          break;
        case 'Help Me':
          tasksToProcess = tasks.filter(t => t.Status === 'Help Me');
          break;
      }
    }

    let finalFiltered = tasksToProcess.filter((task) => {
      // [✅ แก้ไข] ใช้ task.HelpAssignee โดยตรง (ไม่ต้องใช้ as any เพราะแก้ไข types.ts แล้ว)
      const matchesOwner = ownerFilter ? task.Owner === ownerFilter || task.HelpAssignee === ownerFilter : true;
      const matchesStatus = statusFilter ? task.Status === statusFilter : true;
      const matchesSearch = searchQuery
        ? task.Task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task["Notes / Result"] || "").toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesOwner && matchesStatus && matchesSearch;
    });

    finalFiltered.sort((a, b) => {
      const aHasDeadline = a.Deadline != null && a.Deadline !== '';
      const bHasDeadline = b.Deadline != null && b.Deadline !== '';

      if (aHasDeadline && !bHasDeadline) return -1;
      if (!aHasDeadline && bHasDeadline) return 1;
      if (!aHasDeadline && !bHasDeadline) return 0;

      const aDeadline = new Date(a.Deadline!).getTime();
      const bDeadline = new Date(b.Deadline!).getTime();
      return aDeadline - bDeadline;
    });

    return finalFiltered;
  }, [tasks, ownerFilter, statusFilter, searchQuery, activeStatFilter]);

  return (
    <div className="space-y-6">
      {/* KPIs Summary Section */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-bold text-gray-700">สรุปสถานะ Task ของโปรเจกต์นี้</h3>
            <button onClick={refreshAllData} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors" aria-label="Refresh data">
                <RefreshIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatDisplayCard label="Overdue" value={statusMetrics.overdue} color="text-red-500" isActive={activeStatFilter === 'Overdue'} onClick={() => handleStatFilterClick('Overdue')} description={statDescriptions.overdue} />
          <StatDisplayCard label="Warning" value={statusMetrics.warning} color="text-yellow-500" isActive={activeStatFilter === 'Warning'} onClick={() => handleStatFilterClick('Warning')} description={statDescriptions.warning} />
          <StatDisplayCard label="Incomplete" value={statusMetrics.incomplete} color="text-blue-500" isActive={activeStatFilter === 'Incomplete'} onClick={() => handleStatFilterClick('Incomplete')} description={statDescriptions.incomplete} />
          <StatDisplayCard label="Done" value={statusMetrics.done} color="text-green-500" isActive={activeStatFilter === 'Done'} onClick={() => handleStatFilterClick('Done')} description={statDescriptions.done} />
          <StatDisplayCard label="Help Me" value={statusMetrics.helpMe} color="text-purple-500" isActive={activeStatFilter === 'Help Me'} onClick={() => handleStatFilterClick('Help Me')} description={statDescriptions.helpMe} />
        </div>
      </div>

      {/* Filter Section */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-gray-700">ตัวกรองและเครื่องมือ</h3>
          <button
            onClick={openCreateTaskModal}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold flex px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="w-4 h-4" />
            <span>เพิ่ม Task</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Owner / Assignee</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">-- ทีมทั้งหมด --</option>
              {ownerOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">-- ทุกสถานะ --</option>
              {statusOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ค้นหา Task / Note</label>
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

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium text-left">Deadline</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Task</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Note/Result</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Owner</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Help Assignee</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Help Details</th>
              <th scope="col" className="px-6 py-3 font-medium text-left">Status</th>
              <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedTasks.map((task) => {
              // [✅ เพิ่ม] ตรวจสอบสิทธิ์การแก้ไข
              const userCanEdit = canEditTask(user, task);

              return (
                <tr key={task._id} className="bg-white hover:bg-orange-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateToDDMMYYYY(task.Deadline)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate" title={task.Task}>
                    {task.Task}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-sm truncate" title={task['Notes / Result']}>
                    {truncateText(task['Notes / Result'], 10)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                      {task.Owner}
                    </span>
                  </td>
                  {/* [✅ แก้ไข] ใช้ Property โดยตรง */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-medium">{task.HelpAssignee || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={task.HelpDetails || undefined}>
                    {truncateText(task.HelpDetails, 10)}
                  </td>
                  <td className={`px-6 py-4 font-semibold ${statusColorMap[task.Status] || "text-gray-500"}`}>
                    {task.Status}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* [✅ แก้ไข] แสดงปุ่มเมื่อมีสิทธิ์เท่านั้น */}
                      {userCanEdit && (
                        <>
                          <button onClick={() => onEditTask(task)} className="text-gray-500 hover:text-orange-600 p-2 rounded-full hover:bg-orange-100" aria-label="Edit Task"><EditIcon /></button>
                          <button onClick={() => onDeleteTask(task)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100" aria-label="Delete Task"><DeleteIcon /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  ไม่พบ Task ที่ตรงกับเกณฑ์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
