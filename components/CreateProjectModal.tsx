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
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // State สำหรับการเพิ่ม Task ใหม่
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState(ownerOptions[0]);

  // เมื่อเปิด Modal ให้ตั้งค่าเริ่มต้น
  useEffect(() => {
    if (isOpen) {
      // เพิ่ม ID ชั่วคราวเพื่อให้ง่ายต่อการจัดการ
      const tasksWithIds = initialTasks.map((task, index) => ({
        ...task,
        _id: `temp-${index}-${Date.now()}`,
      }));
      setProjectTasks(tasksWithIds);
      // เลือก Task ทั้งหมดเป็นค่าเริ่มต้น
      setSelectedTaskIds(new Set(tasksWithIds.map(t => t._id!)));
      setProjectName("");
      setPriority("5");
    }
  }, [isOpen, initialTasks]);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds(prev => {
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
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      _id: `new-${Date.now()}`,
      Task: newTaskName.trim(),
      Owner: newTaskOwner,
      Status: 'In Progress', // ค่าเริ่มต้นใหม่
      Phase: 'Backlog', // กำหนดค่าเริ่มต้นสำหรับ Phase
      // ใส่ค่า default อื่นๆ ที่จำเป็น
      ProjectID: '',
      Check: false,
      Deadline: '',
      'Est. Hours': 0,
      'Actual Hours': null,
      'Impact Score': 3,
      Timeliness: '',
      'Notes / Result': '',
      'Feedback to Team': '',
      'Owner Feedback': '',
      'Project Feedback': '',
      MilestoneID: '',
      rowIndex: 0, // จะถูกกำหนดค่าจริงที่ Backend
    };

    setProjectTasks(prev => [...prev, newTask]);
    // เพิ่ม Task ใหม่ในรายการที่เลือกโดยอัตโนมัติ
    setSelectedTaskIds(prev => new Set(prev).add(newTask._id!));
    
    // Reset input fields
    setNewTaskName("");
    setNewTaskOwner(ownerOptions[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    const selectedTasksObjects = projectTasks.filter(t => selectedTaskIds.has(t._id!));

    if (!trimmedName || selectedTasksObjects.length === 0) {
      console.error("Project name and tasks are required.");
      return;
    }
    const numPriority = parsePriorityInput(priority, 5);
    onCreate(trimmedName, numPriority, selectedTasksObjects);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">สร้างโปรเจกต์ใหม่</h2>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          {/* Project Details Section */}
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
              <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="เช่น แคมเปญการตลาด Q4" required />
            </div>
            {/* <div className="w-48">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">ความสำคัญ (0=สูง, 10=ต่ำ)</label>
              <input type="number" id="priority" min="0" max="10" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="5" disabled={isLoading} />
            </div> */}
          </div>

          {/* Task Selection Section */}
          <div className="px-6 pb-2 flex justify-between items-center border-t pt-4">
            <p className="font-semibold text-gray-800">เลือก Task เริ่มต้น ({selectedTaskIds.size}/{projectTasks.length})</p>
          </div>

          <div className="px-6 pt-2 pb-4 overflow-y-auto border-b">
            <div className="space-y-2">
              {projectTasks.map((task) => (
                <label key={task._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task._id!)}
                      onChange={() => handleTaskToggle(task._id!)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-3 text-sm text-gray-800">{task.Task}</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                    {task.Owner}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Add New Task Section */}
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">เพิ่ม Task ใหม่ (ถ้ามี)</h3>
            <div className="flex items-end gap-3">
                <div className="flex-grow">
                    <label htmlFor="new-task-name" className="text-xs text-gray-600">ชื่อ Task</label>
                    <input type="text" id="new-task-name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="ชื่อ Task ใหม่..."/>
                </div>
                <div>
                    <label htmlFor="new-task-owner" className="text-xs text-gray-600">Owner</label>
                    <select id="new-task-owner" value={newTaskOwner} onChange={(e) => setNewTaskOwner(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                        {ownerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <button type="button" onClick={handleAddTask} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 text-sm">
                    + เพิ่ม
                </button>
            </div>
          </div>

          <footer className="p-6 bg-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-white border rounded-md">ยกเลิก</button>
            <button type="submit" className="px-6 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-gray-400" disabled={isLoading || !projectName.trim() || selectedTaskIds.size === 0}>
              {isLoading ? "กำลังสร้าง..." : "สร้างโปรเจกต์"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
