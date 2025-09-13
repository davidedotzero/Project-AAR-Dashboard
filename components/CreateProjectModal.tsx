import React, { useState, useEffect } from "react";
import type { Task } from "../types";
import { ownerOptions } from "../constants";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    projectName: string,
    priority: number,
    selectedTasks: Task[]
  ) => void;
  initialTasks: Task[];
  isLoading: boolean;
}

// --- Utility functions ---

const parsePriorityInput = (value: string, defaultValue: number): number => {
  if (value === "") return defaultValue;
  const num = Number(value);
  if (isNaN(num) || num < 0) return 0;
  if (num > 10) return 10;
  return num;
};

const getFormattedDate = (date: Date): string => {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
};

// [✅ NEW HELPER] แปลง YYYY-MM-DD เป็น Date Object (Local Timezone)
const parseDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
        // new Date(year, monthIndex, day)
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
};

// [✅ NEW HELPER] เพิ่ม/ลด จำนวนวัน
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};


const getFutureDate = (daysAhead: number): string => {
  return getFormattedDate(addDays(new Date(), daysAhead));
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
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState(ownerOptions[0]);
  const [newTaskDeadline, setNewTaskDeadline] = useState(getFutureDate(7));
  const [bulkDeadline, setBulkDeadline] = useState<string>("");

  // --- Bulk Action Logic ---

  useEffect(() => {
    const currentIds = new Set(projectTasks.map((t) => t._id!));
    setSelectedTaskIds((prev) => new Set([...prev].filter((id) => currentIds.has(id))));
  }, [projectTasks]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTaskIds(event.target.checked ? new Set(projectTasks.map((t) => t._id!)) : new Set());
  };
  
  const isAllSelected = projectTasks.length > 0 && selectedTaskIds.size === projectTasks.length;
  const isPartialSelected = selectedTaskIds.size > 0 && selectedTaskIds.size < projectTasks.length;
  
  const handleBulkUpdate = () => {
    if (selectedTaskIds.size === 0 || !bulkDeadline) return;
    setProjectTasks((prev) =>
      prev.map((task) => selectedTaskIds.has(task._id!) ? { ...task, Deadline: bulkDeadline } : task)
    );
    setBulkDeadline("");
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.size === 0 || !window.confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${selectedTaskIds.size} Task ออกจากโปรเจกต์นี้?`)) return;
    setProjectTasks((prev) => prev.filter((task) => !selectedTaskIds.has(task._id!)));
  };

  // [🔥🔥🔥 START: New Bulk Date Shifting Logic 🔥🔥🔥]
  const handleBulkShiftDays = (daysToAdd: number) => {
    if (selectedTaskIds.size === 0) return;

    setProjectTasks(prevTasks =>
        prevTasks.map(task => {
            // ตรวจสอบว่าเป็น Task ที่ถูกเลือกหรือไม่ และมี Deadline อยู่แล้วหรือไม่
            if (selectedTaskIds.has(task._id!) && task.Deadline) {
                const currentDate = parseDate(task.Deadline);
                if (currentDate) { // ตรวจสอบว่าแปลงวันที่สำเร็จ
                    const newDate = addDays(currentDate, daysToAdd);
                    return { ...task, Deadline: getFormattedDate(newDate) };
                }
            }
            return task;
        })
    );
  };
  // [🔥🔥🔥 END: New Bulk Date Shifting Logic 🔥🔥🔥]


  // --- Component Lifecycle & Handlers ---

  useEffect(() => {
    if (isOpen) {
      const defaultDeadline = getFutureDate(7);
      const tasksWithIds = initialTasks.map((task, index) => ({
        ...task,
        Deadline: task.Deadline || defaultDeadline,
        _id: task._id || `temp-${index}-${Date.now()}`,
      }));
      setProjectTasks(tasksWithIds);
      setSelectedTaskIds(new Set(tasksWithIds.map((t) => t._id!)));
      setProjectName("");
      setPriority("5");
      setBulkDeadline("");
    }
  }, [isOpen, initialTasks]);

  const handleTaskDeadlineChange = (taskId: string, newDeadline: string) => {
    setProjectTasks((prev) =>
      prev.map((task) => (task._id === taskId ? { ...task, Deadline: newDeadline } : task))
    );
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
      return newSet;
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskDeadline) return;
    const newTask: Task = {
      _id: `new-${Date.now()}`, Task: newTaskName.trim(), Owner: newTaskOwner, Status: "In Progress", Phase: "Backlog", Deadline: newTaskDeadline,
      // Default values...
      ProjectID: "", Check: false, "Est. Hours": 0, "Actual Hours": null, "Impact Score": 3, Timeliness: "", "Notes / Result": "", "Feedback to Team": "", "Owner Feedback": "", "Project Feedback": "", MilestoneID: "", rowIndex: 0, HelpAssignee: null, HelpDetails: null, HelpRequestedAt: null,
    };
    setProjectTasks((prev) => [...prev, newTask]);
    setSelectedTaskIds((prev) => new Set(prev).add(newTask._id!));
    setNewTaskName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    const selectedTasksObjects = projectTasks.filter((t) => selectedTaskIds.has(t._id!));
    if (!trimmedName) return alert("กรุณากรอกชื่อโปรเจกต์");
    if (selectedTasksObjects.length === 0) return alert("กรุณาเลือกหรือเพิ่มอย่างน้อย 1 Task");
    if (selectedTasksObjects.some(t => !t.Deadline)) return alert("กรุณากำหนด Deadline ให้กับ Task ที่เลือกทั้งหมด");
    onCreate(trimmedName, parsePriorityInput(priority, 5), selectedTasksObjects);
  };

  if (!isOpen) return null;
  const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100";

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center p-4" onClick={!isLoading ? onClose : undefined}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-6 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800">สร้างโปรเจกต์ใหม่</h2>
          <button onClick={!isLoading ? onClose : undefined} disabled={isLoading} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-2xl">&times;</button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
         <fieldset disabled={isLoading} className="flex flex-col overflow-hidden flex-1">
            <div className="overflow-y-auto flex-1">
              {/* Project Details */}
              <div className="p-6 space-y-4">
                <div className="flex gap-6">
                    <div className="flex-grow">
                        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
                        <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className={baseInputClass} required />
                    </div>
                    <div className="w-48">
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ (0=สูง, 10=ต่ำ)</label>
                        <input type="number" id="priority" min="0" max="10" value={priority} onChange={(e) => setPriority(e.target.value)} className={baseInputClass} />
                    </div>
                </div>
              </div>

              {/* Add New Task */}
              <div className="p-6 bg-gray-50 border-y">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">เพิ่ม Task ใหม่ (ถ้ามี)</h3>
                <div className="flex items-end gap-3">
                    <div className="flex-grow">
                        <label htmlFor="new-task-name" className="text-xs text-gray-600">ชื่อ Task</label>
                        <input type="text" id="new-task-name" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} className={`${baseInputClass} text-sm`}/>
                    </div>
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
                    <button type="button" onClick={handleAddTask} disabled={!newTaskName.trim()} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 text-sm h-10 disabled:bg-gray-400">+ เพิ่ม</button>
                </div>
              </div>

                {/* Task List & Bulk Action */}
                <div className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">กำหนด Task และ Deadline</h3>
                    <div className="flex justify-between items-center mb-4 p-4 bg-white border rounded-lg shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="text-sm font-medium text-gray-700">เลือกแล้ว {selectedTaskIds.size} / {projectTasks.length}</div>
                            <button type="button" onClick={handleBulkDelete} disabled={selectedTaskIds.size === 0} className="text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 cursor-pointer">ลบที่เลือก</button>
                        </div>

                        {/* [🔥🔥🔥 UI UPDATE: Bulk Action Controls 🔥🔥🔥] */}
                        <div className={`flex items-center gap-2 transition-opacity ${selectedTaskIds.size > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <label htmlFor="bulk-deadline" className="text-sm font-medium text-gray-600">Deadline ทั้งหมด:</label>
                            <input type="date" id="bulk-deadline" value={bulkDeadline} onChange={(e) => setBulkDeadline(e.target.value)} className={`${baseInputClass} text-sm w-36`}/>
                            <button type="button" onClick={handleBulkUpdate} disabled={!bulkDeadline} className="px-3 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 text-sm disabled:bg-gray-400">Set</button>
                            
                            {/* Quick add buttons */}
                            <div className="flex items-center gap-1 pl-2 border-l ml-2">
                                <button type="button" onClick={() => handleBulkShiftDays(1)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 1 วัน">+1d</button>
                                <button type="button" onClick={() => handleBulkShiftDays(3)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 3 วัน">+3d</button>
                                <button type="button" onClick={() => handleBulkShiftDays(5)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 5 วัน">+5d</button>
                                <button type="button" onClick={() => handleBulkShiftDays(7)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 7 วัน">+7d</button>
                                <button type="button" onClick={() => handleBulkShiftDays(10)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 10 วัน">+10d</button>
                                <button type="button" onClick={() => handleBulkShiftDays(15)} className="px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="เลื่อนออกไป 15 วัน">+15d</button>
                            </div>
                        </div>
                    </div>

                    {/* Task List Table */}
                    {projectTasks.length > 0 && (
                        <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50 rounded-md items-center border-b">
                            <div className="col-span-6 flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer mr-3" checked={isAllSelected} onChange={handleSelectAll} ref={el => el && (el.indeterminate = isPartialSelected)} />
                                รายการ Task
                            </div>
                            <div className="col-span-3">กำหนดเสร็จ</div>
                            <div className="col-span-3">ทีมที่รับผิดชอบ</div>
                          </div>
                    )}
                  <div className="pt-2 space-y-2">
                    {projectTasks.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 border-t">ไม่มี Task ในรายการ</div>
                    ) : (
                      projectTasks.map((task) => {
                        const isSelected = selectedTaskIds.has(task._id!);
                        return (
                            <div key={task._id} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-md transition-colors border ${isSelected ? 'bg-white hover:bg-orange-50 border-gray-200 shadow-sm' : 'bg-gray-100 opacity-60 border-transparent'}`}>
                                <div className="col-span-6 flex items-center">
                                    <input type="checkbox" checked={isSelected} onChange={() => handleTaskToggle(task._id!)} className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer mr-3"/>
                                    <span className="text-sm text-gray-800 truncate" title={task.Task}>{task.Task}</span>
                                </div>
                                <div className="col-span-3">
                                    <input type="date" value={task.Deadline || ''} onChange={(e) => handleTaskDeadlineChange(task._id!, e.target.value)} disabled={!isSelected} className={`w-full px-2 py-1 text-sm border rounded-md focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-200 disabled:text-gray-500 ${isSelected && !task.Deadline ? 'border-red-500' : 'border-gray-300'}`}/>
                                </div>
                                <div className="col-span-3">
                                     <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">{task.Owner}</span>
                                </div>
                            </div>
                        );
                      })
                    )}
                  </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="p-6 bg-gray-100 flex justify-end space-x-3 border-t shrink-0">
                <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50 hover:bg-gray-50">ยกเลิก</button>
                <button type="submit" disabled={isLoading || !projectName.trim() || selectedTaskIds.size === 0} className="px-6 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? "กำลังสร้าง..." : "สร้างโปรเจกต์"}
                </button>
            </footer>
         </fieldset>
        </form>
      </div>
    </div>
  );
};