import React, { useState, useMemo, useEffect } from "react";
import type { Task } from "../types";
import {
  statusColorMap,
  phaseColorMap,
  phaseOptions,
  ownerOptions,
} from "../constants";
import { EditIcon, ChevronDownIcon, ViewIcon, DeleteIcon } from "./icons"; // <-- เพิ่ม ViewIcon ด้วย
import { TaskFilters } from "./TaskFilters";
import { DeadlineAlert } from "./DeadlineAlert";

interface TasksTabProps {
  filteredTasks: Task[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskView: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenCreateTask: (phase: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  // filteredTasks,
  onEditTask,
  onTaskView,
  onDeleteTask,
  onOpenCreateTask,
}) => {
  const tasksCountByOwner = useMemo(() => {
    if (!tasks) return {};
    const counts: { [key: string]: number } = {};
    ownerOptions.forEach((owner) => {
      const activeTasks = tasks.filter(
        (task) => task.Owner === owner && task.Status !== "Done"
      ).length;
      if (activeTasks > 0) {
        counts[owner] = activeTasks;
      }
    });
    return counts;
  }, [tasks]);

  // --- ส่วนที่ 1: Hooks และ Logic (ถูกต้องแล้ว) ---
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [expandedPhases, setExpandedPhases] = useState<{
    [key: string]: boolean;
  }>({});

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task: Task) => {
      const activeFilterKeys = Object.keys(filters).filter(
        (key) => filters[key]
      );

      if (activeFilterKeys.length === 0) {
        return true;
      }
      return activeFilterKeys.every((field) => {
        const filterValue = filters[field].toLowerCase();
        const taskValue = task[field as keyof Task];

        if (taskValue === null || taskValue === undefined) {
          return false;
        }

        const taskValueString = String(taskValue).toLowerCase();
        if (field === "Owner" || field === "Status" || field === "Phase") {
          return taskValueString === filterValue;
        } else {
          return taskValueString.includes(filterValue);
        }
      });
    });
  }, [tasks, filters]);

  const tasksByPhase = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    phaseOptions.forEach((phase) => {
      const tasksInPhase = filteredTasks.filter((task) => task.Phase === phase);
      if (tasksInPhase.length > 0) {
        grouped[phase] = tasksInPhase;
      }
    });
    return grouped;
  }, [filteredTasks]);

  useEffect(() => {
    if (Object.keys(tasksByPhase).length > 0) {
      const firstPhase = Object.keys(tasksByPhase)[0];
      setExpandedPhases({ [firstPhase]: true });
    } else {
      setExpandedPhases({}); // Clear state when tasks are empty
    }
  }, [tasksByPhase]);

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phase]: !prev[phase],
    }));
  };

  // --- ส่วนที่ 2: Return JSX (นำโค้ดทั้งหมดมารวมในนี้) ---
  return (
    <div>
      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="mb-6 p-4 bg-white border rounded-xl shadow-sm">
        <h3 className="text-md font-bold text-gray-700 mb-3">
          สรุป Task ที่ต้องดำเนินการ (Active)
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.keys(tasksCountByOwner).length > 0 ? (
            Object.entries(tasksCountByOwner).map(([owner, count]) => (
              <div
                key={owner}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full"
              >
                <span className="font-semibold text-gray-800 text-sm">
                  {owner}:
                </span>
                <span className="font-bold text-orange-600 text-lg">
                  {count}
                </span>
                <span className="text-gray-500 text-sm">Tasks</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              ไม่มี Task ที่ต้องดำเนินการในขณะนี้
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="hidden md:table-header-group text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">
                Task
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Owner
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Deadline
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-4 font-medium text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tasksByPhase).map(([phase, tasksInPhase]) => {
              if (!Array.isArray(tasksInPhase)) {
                return null;
              }
              const isExpanded = !!expandedPhases[phase];
              return (
                <React.Fragment key={phase}>
                  <tr
                    className="bg-gray-50 hover:bg-gray-100 border-b border-t border-gray-200 cursor-pointer"
                    onClick={() => togglePhase(phase)}
                  >
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${phaseColorMap[phase]?.bg} ${phaseColorMap[phase]?.text}`}
                          >
                            {phase}
                          </span>
                          <span className="ml-4 text-gray-500 font-medium">
                            ({tasksInPhase.length} Tasks)
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCreateTask(phase);
                            }}
                            className="ml-4 text-sm font-bold text-orange-500 hover:text-orange-700 transition-colors"
                            aria-label={`Add new task to ${phase}`}
                          >
                            + Add Task
                          </button>
                        </div>
                        <button
                          className={`p-1 rounded-full transform transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <ChevronDownIcon />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded &&
                    tasksInPhase.map((task) => (
                      <tr
                        key={task._id}
                        className="hidden md:table-row bg-white hover:bg-orange-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 border-b border-gray-200">
                          {task.Task}
                        </td>
                        <td className="px-6 py-4 border-b border-gray-200">
                          <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                            {task.Owner}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-b border-gray-200">
                          <DeadlineAlert
                            deadline={task.Deadline}
                            status={task.Status}
                          />
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold border-b border-gray-200 ${
                            statusColorMap[task.Status] || "text-gray-500"
                          }`}
                        >
                          {task.Status}
                        </td>

                        {/* --- นี่คือส่วนปุ่ม Actions ที่คุณยกมา --- */}
                        <td className="px-4 py-4 text-center border-b border-gray-200">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onTaskView(task)}
                              className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100"
                              aria-label="View Task"
                            >
                              <ViewIcon />
                            </button>
                            <button
                              onClick={() => onEditTask(task)}
                              className="text-gray-500 hover:text-orange-600 p-2 rounded-full hover:bg-orange-100"
                              aria-label="Edit Task"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task._id)}
                              className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100"
                              aria-label="Delete Task"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>หมายเหตุ:</strong> ข้อมูล Task จะถูกดึงและบันทึกไปยัง Google
          Sheet โดยตรง
        </p>
      </div>
    </div>
  );
};
