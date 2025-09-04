// components/EditProjectModal.tsx (New File)
import React, { useState, useEffect } from "react";
import type { Project } from "../types";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (projectId: string, updatedData: { Name: string, Priority: number }) => void;
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
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (isOpen && project) {
        setProjectName(project.Name);
        // ถ้า Priority เป็น 99 (ค่า default) หรืออยู่นอกเหนือ 0-10 ให้แสดงเป็นช่องว่าง
        const p = project.Priority;
        setPriority(p >= 0 && p <= 10 ? String(p) : "");
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    // ใช้ 99 เป็นค่า Default ถ้าว่าง (หมายถึงไม่ได้กำหนด)
    const numPriority = parsePriorityInput(priority, 99);

    setIsSaving(true);
    try {
      await onUpdate(project.ProjectID, { Name: trimmedName, Priority: numPriority });
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    onDeleteInitiate(project);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/70 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b">
            <h3 className="text-2xl font-semibold text-gray-800">
              แก้ไขโปรเจกต์
            </h3>
            <p className="text-sm text-gray-500 mt-1">ID: {project.ProjectID}</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Project Name */}
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

            {/* Priority */}
            {/* <div>
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
            </div> */}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50 flex items-center justify-between">
             {/* Delete Button */}
            <div>
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    disabled={isLoading}
                >
                    ลบโปรเจกต์
                </button>
            </div>

            {/* Cancel/Save Buttons */}
            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    disabled={isLoading}
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white font-medium rounded-md shadow-sm hover:bg-orange-600 disabled:opacity-50"
                    disabled={isLoading || isSaving || !projectName.trim()}
                >
                    {isLoading || isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};