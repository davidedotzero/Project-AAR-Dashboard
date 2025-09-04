// components/EditProjectModal.tsx (New File)
import React, { useState, useEffect } from "react";
import type { Project } from "../types";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (projectId: string, updatedData: { Name: string, Priority: number, frameworkDetails: string }) => void;
  onDeleteInitiate: (project: Project) => void; // สำหรับเริ่มกระบวนการลบ
  isLoading: boolean;
  // กำหนดให้ต้องมีข้อมูลโปรเจกต์เสมอเมื่อเปิด Modal นี้
  project: Project;
}

// Helper สำหรับแปลงค่า Priority
const parsePriorityInput = (value: string, defaultValue: number): number => {
    if (value === "") return defaultValue;
    const num = Number(value);
    if (isNaN(num) || num < 0) return 0;
    if (num > 10) return 10;
    return num;
};

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onDeleteInitiate,
  isLoading,
  project,
}) => {
  const [projectName, setProjectName] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [frameworkDetails, setFrameworkDetails] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (isOpen && project) {
        setProjectName(project.Name);
        const p = project.Priority;
        setPriority(p >= 0 && p <= 10 ? String(p) : "");
        setFrameworkDetails(project.frameworkDetails || "");
        setIsEditing(false); // Reset to view mode every time it opens
    }
  }, [isOpen, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    const numPriority = parsePriorityInput(priority, 99);

    onUpdate(project.ProjectID, { Name: trimmedName, Priority: numPriority, frameworkDetails });
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    onDeleteInitiate(project);
  };

  const handleCancel = () => {
    // Reset state to original project data
    if (project) {
        setProjectName(project.Name);
        const p = project.Priority;
        setPriority(p >= 0 && p <= 10 ? String(p) : "");
        setFrameworkDetails(project.frameworkDetails || "");
    }
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/70 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-2xl font-semibold text-gray-800">
              {isEditing ? "แก้ไขโปรเจกต์" : "รายละเอียดโปรเจกต์"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">ID: {project.ProjectID}</p>
          </div>

          <div className="p-6 space-y-6">
            {isEditing ? (
              <>
                <div>
                    <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อโปรเจกต์ (Project Name) *
                    </label>
                    <input
                        type="text"
                        id="editProjectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="editPriority" className="block text-sm font-medium text-gray-700 mb-2">
                        ความสำคัญ (0=สูง, 10=ต่ำ)
                    </label>
                    <input
                        type="number"
                        id="editPriority"
                        min="0"
                        max="10"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        placeholder="ไม่ระบุ"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="frameworkDetails" className="block text-sm font-medium text-gray-700 mb-2">
                        กรอบการทำงาน (Project Framework)
                    </label>
                    <textarea
                        id="frameworkDetails"
                        value={frameworkDetails}
                        onChange={(e) => setFrameworkDetails(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                        rows={4}
                        disabled={isLoading}
                    />
                </div>
              </>
            ) : (
              <>
                <div>
                    <h4 className="text-sm font-medium text-gray-500">ชื่อโปรเจกต์</h4>
                    <p className="text-lg text-gray-800">{project.Name}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500">ความสำคัญ</h4>
                    <p className="text-lg text-gray-800">{project.Priority >= 0 && project.Priority <= 10 ? project.Priority : "ไม่ระบุ"}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500">กรอบการทำงาน</h4>
                    <p className="text-lg text-gray-800 whitespace-pre-wrap">{project.frameworkDetails || "ไม่มี"}</p>
                </div>
              </>
            )}
          </div>

          <div className="p-6 bg-gray-50 flex items-center justify-between">
            <div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        ลบโปรเจกต์
                    </button>
                )}
            </div>

            <div className="flex space-x-3">
                {isEditing ? (
                    <>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 text-white font-medium rounded-md shadow-sm hover:bg-orange-600 disabled:opacity-50"
                            disabled={isLoading || !projectName.trim()}
                        >
                            {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            ปิด
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md shadow-sm hover:bg-blue-600"
                        >
                            แก้ไข
                        </button>
                    </>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};