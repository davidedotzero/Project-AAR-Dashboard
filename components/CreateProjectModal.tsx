// src/components/CreateProjectModal.tsx

import React, { useState, useEffect, useMemo } from "react";
import type { Task } from "../types";
import { phaseOptions, phaseColorMap } from "../constants";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    projectName: string,
    priority: number,
    selectedTasks: string[]
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
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const tasksByPhase = useMemo(() => {
    const grouped: { [key: string]: string[] } = {};
    phaseOptions.forEach((phase) => {
      const tasksInPhase = initialTasks.filter((task) => task.Phase === phase);
      if (tasksInPhase.length > 0) {
        grouped[phase] = tasksInPhase;
      }
    });
    return grouped;
  }, [initialTasks]);

  // เมื่อเปิด Modal ให้เลือก Task ทั้งหมดเป็นค่าเริ่มต้น
  useEffect(() => {
    if (isOpen) {
      setSelectedTasks(initialTasks.map((t) => t.Task));
      setPriority("5");
    } else {
      setProjectName("");
      setSelectedTasks([]);
    }
  }, [isOpen, initialTasks]);

  const handleTaskToggle = (taskName: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskName)
        ? prev.filter((name) => name !== taskName)
        : [...prev, taskName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName || selectedTasks.length === 0) {
      console.error("Project name and tasks are required.");
      return;
    }
    const numPriority = parsePriorityInput(priority, 5);
    onCreate(trimmedName, numPriority, selectedTasks);
  };

  const handleSelectAll = () => {
    setSelectedTasks(initialTasks.map((t) => t.Task));
  };
  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  const handleSelectPhase = (tasksInPhase: Task[]) => {
    const taskNames = tasksInPhase.map((t) => t.Task);
    setSelectedTasks((prev) => [...new Set([...prev, ...taskNames])]);
  };

  const handleDeselectPhase = (tasksInPhase: Task[]) => {
    const taskNames = tasksInPhase.map((t) => t.Task);
    setSelectedTasks((prev) =>
      prev.filter((name) => !taskNames.includes(name))
    );
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
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="project-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ชื่อโปรเจกต์
              </label>
              <input
                type="text"
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="เช่น แคมเปญการตลาด Q4"
                required
              />
            </div>

            <div className="w-48">
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ความสำคัญ (0=สูง, 10=ต่ำ)
              </label>
              <input
                type="number"
                id="priority"
                min="0"
                max="10"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                placeholder="5"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="px-6 pb-2 flex justify-between items-center border-t pt-4">
            <p className="font-semibold text-gray-800">
              เลือก Task เริ่มต้น ({selectedTasks.length}/{initialTasks.length})
            </p>
            <div className="space-x-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                ล้างทั้งหมด
              </button>
            </div>
          </div>

          <div className="px-6 pt-2 pb-4 overflow-y-auto border-t border-b">
            <div className="space-y-2">
              {Object.entries(tasksByPhase).map(([phase, tasksInPhase]) => {
                // vvvv เพิ่มการตรวจสอบ Type Guard ตรงนี้ vvvv
                if (!Array.isArray(tasksInPhase)) {
                  return null; // ถ้าไม่ใช่ Array, ไม่ต้อง render ส่วนนี้
                }
                // ^^^^ เมื่อผ่านตรงนี้ไป TypeScript จะรู้ว่า tasksInPhase เป็น Array ^^^^

                return (
                  <div
                    key={phase}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm"
                  >
                    <div
                      className={`flex justify-between items-center p-3 rounded-t-lg ${
                        phaseColorMap[phase]?.bg || "bg-gray-600"
                      } ${phaseColorMap[phase]?.text || "text-white"}`}
                    >
                      <h3 className="font-bold">{phase}</h3>
                      <div className="space-x-2">
                        {/* ตอนนี้ tasksInPhase ถูกการันตีแล้วว่าเป็น Array */}
                        <button
                          type="button"
                          onClick={() => handleSelectPhase(tasksInPhase)}
                          className="text-xs font-semibold opacity-80 hover:opacity-100 hover:underline"
                        >
                          เลือก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeselectPhase(tasksInPhase)}
                          className="text-xs font-semibold opacity-80 hover:opacity-100 hover:underline"
                        >
                          ล้าง
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {/* และ .map() ก็จะสามารถใช้งานได้โดยไม่มี error */}
                      {tasksInPhase.map((task) => (
                        <label
                          key={task._id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.Task)}
                            onChange={() => handleTaskToggle(task.Task)}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-800">
                            {task.Task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="p-6 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white border rounded-md"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-gray-400"
              disabled={
                isLoading || !projectName.trim() || selectedTasks.length === 0
              }
            >
              {isLoading ? "กำลังสร้าง..." : "สร้างโปรเจกต์"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
