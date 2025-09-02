import React, { useState, useEffect, useMemo } from "react";
import type { Task } from "../types";
import { ownerOptions } from "../constants";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    projectName: string,
    priority: number,
    selectedTasks: Task[] // ส่งเป็น Object แทนที่จะเป็น string
  ) => void;
  initialTasks: Task[];
  isLoading: boolean;
}

const parsePriorityInput = (value: string, defaultValue: number): number => {
  if (value === "") return defaultValue;
  const num = Number(value);
  if (isNaN(num) || num < 0) return 0;
  if (num > 10) return 10;
  return num;
};

const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getFutureDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return getFormattedDate(date);
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialTasks,
  isLoading,
}) => {
  const [projectName, setProjectName] = useState("");
  const [priority, setPriority] = useState<string>("5");

  // State สำหรับจัดการ Task ทั้งหมดใน Modal นี้
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  // State สำหรับ Task ที่ถูกเลือก (เก็บเป็น ID ชั่วคราว)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );

  // State สำหรับการเพิ่ม Task ใหม่
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState(ownerOptions[0]);

  const [newTaskDeadline, setNewTaskDeadline] = useState(getFutureDate(7));

  // เมื่อเปิด Modal ให้ตั้งค่าเริ่มต้น
  useEffect(() => {
    if (isOpen) {
      const defaultDeadline = getFutureDate(7);
      // เพิ่ม ID ชั่วคราวเพื่อให้ง่ายต่อการจัดการ
      const tasksWithIds = initialTasks.map((task, index) => ({
        ...task,
        _id: `temp-${index}-${Date.now()}`,
      }));
      setProjectTasks(tasksWithIds);
      // เลือก Task ทั้งหมดเป็นค่าเริ่มต้น
      setSelectedTaskIds(new Set(tasksWithIds.map((t) => t._id!)));
      setProjectName("");
      setPriority("5");
    }
  }, [isOpen, initialTasks]);

  const handleTaskDeadlineChange = (taskId: string, newDeadline: string) => {
    setProjectTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, Deadline: newDeadline } : task
      )
    );
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskDeadline) return;

    const newTask: Task = {
      _id: `new-${Date.now()}`,
      Task: newTaskName.trim(),
      Owner: newTaskOwner,
      Status: "In Progress", // ค่าเริ่มต้นใหม่
      Phase: "Backlog", // กำหนดค่าเริ่มต้นสำหรับ Phase
      // ใส่ค่า default อื่นๆ ที่จำเป็น
      ProjectID: "",
      Check: false,
      Deadline: newTaskDeadline,
      "Est. Hours": 0,
      "Actual Hours": null,
      "Impact Score": 3,
      Timeliness: "",
      "Notes / Result": "",
      "Feedback to Team": "",
      "Owner Feedback": "",
      "Project Feedback": "",
      MilestoneID: "",
      rowIndex: 0, // จะถูกกำหนดค่าจริงที่ Backend
      HelpAssignee: null,
      HelpDetails: null,
      HelpRequestedAt: null,
    };

    setProjectTasks((prev) => [...prev, newTask]);
    setSelectedTaskIds((prev) => new Set(prev).add(newTask._id!));

    // Reset input fields
    setNewTaskName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const trimmedName = projectName.trim();
    const selectedTasksObjects = projectTasks.filter((t) =>
      selectedTaskIds.has(t._id!)
    );

    if (!trimmedName || selectedTasksObjects.length === 0) {
      console.error("กรุณากรอกชื่อโปรเจกต์และเลือกอย่างน้อย 1 Task");
      return;
    }
    const numPriority = parsePriorityInput(priority, 5);
    onCreate(trimmedName, numPriority, selectedTasksObjects);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;
  const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100";

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={handleClose}>
      <div
        // [✅] ขยายความกว้างเป็น max-w-4xl
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">สร้างโปรเจกต์ใหม่</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">&times;</button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
         {/* [✅] ใช้ fieldset เพื่อ Disable ฟอร์มทั้งหมดขณะโหลด */}
         <fieldset disabled={isLoading} className="flex flex-col overflow-hidden">

          {/* Project Details Section */}
          <div className="p-6 space-y-4">
            <div className="flex gap-6">
                <div className="flex-grow">
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
                    <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className={baseInputClass} placeholder="เช่น แคมเปญการตลาด Q4" required />
                </div>
                <div className="w-48">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ (0=สูง, 10=ต่ำ)</label>
                    <input type="number" id="priority" min="0" max="10" value={priority} onChange={(e) => setPriority(e.target.value)} className={baseInputClass} placeholder="5" />
                </div>
            </div>
          </div>

          {/* Task Selection Header */}
          <div className="px-6 pb-2 border-t pt-4">
            <p className="font-semibold text-gray-800 mb-3">กำหนด Task และ Deadline ({selectedTaskIds.size}/{projectTasks.length})</p>
             {/* [✅ ปรับปรุง Layout] Header ของตาราง */}
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50 rounded-md">
                <div className="col-span-6">Task</div>
                <div className="col-span-3">Deadline</div>
                <div className="col-span-3">Owner</div>
              </div>
          </div>

           {/* [✅ ปรับปรุง Layout] Task List (Scrollable) */}
          <div className="px-6 pt-2 pb-4 overflow-y-auto border-b flex-1  min-h-0">
            <div className="space-y-2">

              {projectTasks.map((task) => {
                const isSelected = selectedTaskIds.has(task._id!);
                return (
                    <div key={task._id} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-md transition-colors ${isSelected ? 'bg-white hover:bg-orange-50' : 'bg-gray-100 opacity-70'}`}>

                        {/* Column 1: Checkbox and Task Name */}
                        <div className="col-span-6 flex items-center">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleTaskToggle(task._id!)}
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer mr-3"
                            />
                            <span className="text-sm text-gray-800 truncate" title={task.Task}>{task.Task}</span>
                        </div>

                        {/* Column 2: Deadline Input */}
                        <div className="col-span-3">
                            <input
                                type="date"
                                value={task.Deadline || ''}
                                onChange={(e) => handleTaskDeadlineChange(task._id!, e.target.value)}
                                // ปิดการใช้งานถ้า Task ไม่ได้ถูกเลือก หรือ กำลังโหลด
                                disabled={!isSelected || isLoading}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-200 disabled:text-gray-500"
                            />
                        </div>

                        {/* Column 3: Owner */}
                        <div className="col-span-3">
                             <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                                {task.Owner}
                            </span>
                        </div>
                    </div>
                )
              })}
            </div>
          </div>

          {/* Add New Task Section */}
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">เพิ่ม Task ใหม่ (ถ้ามี)</h3>
            <div className="flex items-end gap-3">
                <div className="flex-grow">
                    <label htmlFor="new-task-name" className="text-xs text-gray-600">ชื่อ Task</label>
                    <input type="text" id="new-task-name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} className={`${baseInputClass} text-sm`} placeholder="ชื่อ Task ใหม่..."/>
                </div>
                 {/* [✅ เพิ่ม] ช่อง Deadline สำหรับ Task ใหม่ */}
                 <div className="w-36">
                    <label htmlFor="new-task-deadline" className="text-xs text-gray-600">Deadline</label>
                    <input type="date" id="new-task-deadline" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className={`${baseInputClass} text-sm`}/>
                </div>
                <div className="w-40">
                    <label htmlFor="new-task-owner" className="text-xs text-gray-600">Owner</label>
                    <select id="new-task-owner" value={newTaskOwner} onChange={(e) => setNewTaskOwner(e.target.value)} className={`${baseInputClass} text-sm`}>
                        {ownerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <button type="button" onClick={handleAddTask} disabled={isLoading || !newTaskName.trim() || !newTaskDeadline} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 text-sm h-10 disabled:bg-gray-400">
                    + เพิ่ม
                </button>
            </div>
          </div>

         </fieldset> {/* ปิด fieldset */}

          <footer className="p-6 bg-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">ยกเลิก</button>
            <button
                type="submit"
                className="px-6 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading || !projectName.trim() || selectedTaskIds.size === 0}
            >
              {isLoading ? (
                    <span className="flex items-center">
                        {/* Loading Spinner SVG */}
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังสร้าง...
                    </span>
                ) : "สร้างโปรเจกต์"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
