import React, { useState, useMemo } from "react";
import type { Task } from "../types";
import {
  statusColorMap,
  phaseColorMap,
} from "../constants";
import { EditIcon, ViewIcon, DeleteIcon } from "./icons";
import { TaskFilters } from "./TaskFilters";
import { DeadlineAlert } from "./DeadlineAlert";

interface TasksTabProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskView: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onEditTask,
  onTaskView,
  onDeleteTask,
}) => {
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // 1. Logic การกรองข้อมูล (เหมือนเดิม)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: Task) => {
      const activeFilterKeys = Object.keys(filters).filter((key) => filters[key]);
      if (activeFilterKeys.length === 0) return true;
      return activeFilterKeys.every((field) => {
        const filterValue = filters[field].toLowerCase();
        const taskValue = task[field as keyof Task];
        if (taskValue === null || taskValue === undefined) return false;
        const taskValueString = String(taskValue).toLowerCase();
        if (field === "Owner" || field === "Status" || field === "Phase") {
          return taskValueString === filterValue;
        }
        return taskValueString.includes(filterValue);
      });
    });
  }, [tasks, filters]);

  // 2. ++ เพิ่ม Logic การจัดเรียงตาม Deadline ++
  const sortedTasks = useMemo(() => {
    const sortableTasks = [...filteredTasks];
    sortableTasks.sort((a, b) => {
      const aDeadline = a.Deadline ? new Date(a.Deadline).getTime() : Infinity;
      const bDeadline = b.Deadline ? new Date(b.Deadline).getTime() : Infinity;
      return aDeadline - bDeadline; // เรียงจากน้อยไปมาก (ใกล้ที่สุดไปไกลที่สุด)
    });
    return sortableTasks;
  }, [filteredTasks]);

  return (
    <div>
      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm">
          {/* 3. ++ ปรับปรุง Header ของตาราง ++ */}
          <thead className="hidden md:table-header-group text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Task</th>
              <th scope="col" className="px-6 py-4 font-medium">Phase</th>
              <th scope="col" className="px-6 py-4 font-medium">Owner</th>
              <th scope="col" className="px-6 py-4 font-medium">Deadline</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
              <th scope="col" className="px-4 py-4 font-medium text-center">Actions</th>
            </tr>
          </thead>

          {/* 4. ++ ปรับปรุง Body ของตาราง (แสดงผลแบบไม่แบ่งกลุ่ม) ++ */}
          <tbody className="divide-y md:divide-none divide-gray-200">
            {sortedTasks.map((task) => (
              <React.Fragment key={task._id}>
                {/* ----- 1. มุมมอง Desktop (Table Row) ----- */}
                <tr className="hidden md:table-row bg-white hover:bg-orange-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{task.Task}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${phaseColorMap[task.Phase]?.bg} ${phaseColorMap[task.Phase]?.text}`}>
                      {task.Phase}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                      {task.Owner}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <DeadlineAlert deadline={task.Deadline} status={task.Status} />
                  </td>
                  <td className={`px-6 py-4 font-semibold ${statusColorMap[task.Status] || "text-gray-500"}`}>
                    {task.Status}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => onTaskView(task)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100" aria-label="View Task"><ViewIcon /></button>
                      <button onClick={() => onEditTask(task)} className="text-gray-500 hover:text-orange-600 p-2 rounded-full hover:bg-orange-100" aria-label="Edit Task"><EditIcon /></button>
                      <button onClick={() => onDeleteTask(task)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100" aria-label="Delete Task"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
                {/* ----- 2. มุมมอง Mobile (Card) ----- */}
                <tr className="md:hidden">
                  <td colSpan={5} className="p-4">
                    <div className="space-y-3 p-4 bg-white border rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                             <p className="font-bold text-gray-800 flex-1 pr-2">{task.Task}</p>
                             <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${phaseColorMap[task.Phase]?.bg} ${phaseColorMap[task.Phase]?.text}`}>
                                {task.Phase}
                            </span>
                        </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">OWNER</p>
                          <span className="px-2.5 py-1 font-semibold text-orange-800 bg-orange-100 rounded-full">{task.Owner}</span>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">STATUS</p>
                          <p className={`font-semibold ${statusColorMap[task.Status] || "text-gray-500"}`}>{task.Status}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1 text-xs">DEADLINE</p>
                        <DeadlineAlert deadline={task.Deadline} status={task.Status} />
                      </div>
                      <div className="flex justify-end pt-2 border-t mt-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => onTaskView(task)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100"><ViewIcon /></button>
                          <button onClick={() => onEditTask(task)} className="text-gray-500 hover:text-orange-600 p-2 rounded-full hover:bg-orange-100"><EditIcon /></button>
                          <button onClick={() => onDeleteTask(task)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100"><DeleteIcon /></button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
             {sortedTasks.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                        ไม่พบ Task ที่ตรงกับเกณฑ์การค้นหา
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};