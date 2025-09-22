import React, { useState, useEffect, useMemo } from "react";
import type { Task, Project } from "../types";
import {
  ownerOptions,
  statusOptions,
  statusColorMap,
} from "../constants";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";
import { useData } from "../contexts/DataContext";

// --- Helper Functions (เหมือนเดิม) ---

const formatDateToDDMMYYYY = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

const calculateLeadTime = (deadline?: string, requestDate?: string): string => {
  if (!deadline || !requestDate) return "N/A";
  const deadlineD = new Date(deadline);
  const requestD = new Date(requestDate);
  if (isNaN(deadlineD.getTime()) || isNaN(requestD.getTime())) return "N/A";
  const diffTime = deadlineD.getTime() - requestD.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} วัน`;
};

const getTimestamp = (): string => {
    return new Date().toLocaleString('th-TH');
};

const getISODateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};


// --- Helper Components (เหมือนเดิม) ---

const AssigneeLabels: React.FC<{ text: string | null | undefined }> = ({ text }) => {
  if (!text) return <span>-</span>;
  const parts = text.split(/([@#]\w+)/g).filter(part => part);
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span key={index} className="px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
              {part}
            </span>
          );
        }
        if (part.startsWith('#')) {
          return (
            <span key={index} className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">
              {part}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-1 text-gray-900">{children}</div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
  </div>
);


// --- Component ย่อยสำหรับแสดงผลในโหมด View เท่านั้น (เหมือนเดิม) ---
const TaskDetailsView: React.FC<{ task: Task }> = ({ task }) => {
  const helpLeadTime = calculateLeadTime(task.Deadline, task.HelpRequestedAt);
  const { projects } = useData();

  const selectedProject = useMemo(() => {
    if (!task || !projects) return null;
    return projects.find(p => p.ProjectID === task.ProjectID);
  }, [task, projects]);

  return (
    <div className="p-8 space-y-8">
      {/* === Section: รายละเอียดหลัก === */}
      <div className="pb-6 border-b">
        <div className="md:col-span-2 mb-6">
            <DetailItem label="Task">
              <p className="text-xl font-bold text-gray-800">{task.Task || "-"}</p>
              <strong>ของ Project:</strong>
              <p>{selectedProject ? selectedProject.Name : `(${task.ProjectID})`}</p>
            </DetailItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <DetailItem label="Owner">
              <span className="px-2.5 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full">
                {task.Owner}
              </span>
            </DetailItem>

            <DetailItem label="Status">
              <p className={`font-bold text-base ${statusColorMap[task.Status] || 'text-gray-500'}`}>
                {task.Status}
              </p>
            </DetailItem>

            <DetailItem label="Deadline">
              <p className="text-base">{formatDateToDDMMYYYY(task.Deadline)}</p>
            </DetailItem>
        </div>
      </div>

      {/* === Section: Help Me (ถ้ามี) === (โค้ดเดิม) */}
      {task.Status === "Help Me" && (
        <div className="p-5 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
          <h4 className="text-md font-bold text-purple-800 mb-4">
            รายละเอียดการร้องขอความช่วยเหลือ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <DetailItem label="วันที่ร้องขอ">
              <p className="font-semibold">
                {formatDateToDDMMYYYY(task.HelpRequestedAt) || "-"}
              </p>
            </DetailItem>
            <DetailItem label="ขอความช่วยเหลือจาก">
              <span className="px-2.5 py-1 text-sm font-semibold text-purple-800 bg-purple-200 rounded-full">
                {task.HelpAssignee || "-"}
              </span>
            </DetailItem>
            <DetailItem label="ขอความช่วยเหลือล่วงหน้า">
              <p className="font-bold text-purple-800">{helpLeadTime}</p>
            </DetailItem>
            <div className="md:col-span-3">
              <DetailItem label="รายละเอียด">
                <p className="p-3 bg-purple-100 rounded-md border border-purple-200 min-h-[50px] whitespace-pre-wrap">
                  {task.HelpDetails || "-"}
                </p>
              </DetailItem>
            </div>
          </div>
        </div>
      )}

      {/* === Section: Feedback และผลลัพธ์ === */}
      <div className="grid grid-cols-1 gap-y-6">
        <DetailItem label="ผู้ปฏิบัติงาน (To Team)">
            <AssigneeLabels text={task["Feedback to Team"]} />
        </DetailItem>

        <DetailItem label="Notes / Result (Log)">
          <p className="p-3 bg-gray-50 rounded-md border min-h-[100px] whitespace-pre-wrap">
            {task["Notes / Result"] || "-"}
          </p>
        </DetailItem>
      </div>
    </div>
  );
};

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task: Task;
  isViewOnly?: boolean;
  onNavigate: (direction: "next" | "previous") => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  isLoading: boolean;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  isViewOnly = false,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updateReason, setUpdateReason] = useState("");

  const { projects } = useData();

  // useEffect (เหมือนเดิม)
  useEffect(() => {
    if (task) {
      const formattedTask = {
        ...task,
        Deadline: task.Deadline || "",
        HelpRequestedAt: task.HelpRequestedAt || "",
        AttachmentLink: task.AttachmentLink || "",
        "Notes / Result": task["Notes / Result"] || "",
      };
      setFormData(formattedTask);
      setIsEditing(false);
      setUpdateReason("");
    }
  }, [task]);

  // Logic การตรวจสอบการเปลี่ยนแปลง (Change Detection) (เหมือนเดิม)
  const { requiresReason, isDeadlineChanged, isStatusChanged } = useMemo(() => {
    if (!task || !formData || !isEditing) {
        return { requiresReason: false, isDeadlineChanged: false, isStatusChanged: false };
    }
    const isDeadlineChanged = (formData.Deadline || "") !== (task.Deadline || "");
    const isStatusChanged = formData.Status !== task.Status;

    return {
        requiresReason: isDeadlineChanged || isStatusChanged,
        isDeadlineChanged,
        isStatusChanged,
    };
  }, [task, formData, isEditing]);


  // handleChange (เหมือนเดิม)
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue: string | number | null = value;
    if (type === "number") {
      processedValue = value === "" ? null : Number(value);
    }

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: processedValue } as any;

      // Logic สำหรับ "Help Me"
      if (name === "Status") {
        if (value === "Help Me" && !updatedData.HelpRequestedAt) {
          updatedData.HelpRequestedAt = getISODateString(new Date());
        } else if (value !== "Help Me") {
          updatedData.HelpRequestedAt = "";
          updatedData.HelpAssignee = "";
          updatedData.HelpDetails = "";
        }
      }

      return updatedData;
    });
  };

  // handleSubmit (เหมือนเดิม)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isLoading || !formData || !task) return;

    const trimmedReason = updateReason.trim();

    // 1. Validation
    if (requiresReason && !trimmedReason) {
        alert("Deadline หรือ Status มีการเปลี่ยนแปลง กรุณากรอกเหตุผล/รายละเอียดการอัปเดตในช่องที่กำหนด");
        return;
    }

    let finalFormData = { ...formData };

    // 2. Logging
    if (requiresReason || trimmedReason) {
        const timestamp = getTimestamp();
        let logEntry = `\n\n--- [อัปเดตเมื่อ ${timestamp}] ---\n`;

        if (isStatusChanged) {
            logEntry += `* เปลี่ยน Status: "${task.Status}" -> "${formData.Status}"\n`;
        }
        if (isDeadlineChanged) {
            logEntry += `* เปลี่ยน Deadline: "${formatDateToDDMMYYYY(task.Deadline)}" -> "${formatDateToDDMMYYYY(formData.Deadline)}"\n`;
        }
        
        if (trimmedReason) {
            logEntry += `รายละเอียด/เหตุผล: ${trimmedReason}\n`;
        }
        logEntry += `----------------------------------------`;

        // 3. Appending Logic
        const existingNotes = formData["Notes / Result"] || "";
        finalFormData["Notes / Result"] = existingNotes ? `${existingNotes}${logEntry}` : logEntry.trimStart();
    }


    // 4. Saving
    setIsSaving(true);
    try {
      await onSave(finalFormData);
      setFormData(finalFormData); 
      setIsEditing(false);
      setUpdateReason("");
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // handleCancelEdit (เหมือนเดิม)
  const handleCancelEdit = () => {
    if (task) {
        const formattedTask = {
            ...task,
            Deadline: task.Deadline || "",
            HelpRequestedAt: task.HelpRequestedAt || "",
            AttachmentLink: task.AttachmentLink || "",
            "Notes / Result": task["Notes / Result"] || "",
          };
      setFormData(formattedTask);
    }
    setIsEditing(false);
    setUpdateReason("");
  };
  
  const helpLeadTime = useMemo(() => {
    return calculateLeadTime(formData?.Deadline, formData?.HelpRequestedAt);
  }, [formData?.Deadline, formData?.HelpRequestedAt]);
  
  const selectedProject = useMemo(() => {
    if (!task || !projects) return null;
    return projects.find(p => p.ProjectID === task.ProjectID);
  }, [task, projects]);

  const baseInputClass =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500";

  if (!isOpen || !formData) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const currentModeIsView = isViewOnly || !isEditing;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {currentModeIsView ? "รายละเอียด Task" : "แก้ไข Task"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-2xl"
          >
            &times;
          </button>
        </header>
        
        {/* Content (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="overflow-y-auto flex-1">
            {currentModeIsView ? (
                <TaskDetailsView task={formData} />
            ) : (
                
                <fieldset disabled={isLoading || isSaving}>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    
                    {/* ... (ส่วน Form Fields ทั้งหมดเหมือนเดิม) ... */}

                    <div className="md:col-span-2 mb-4">
                    <strong>ของ Project:</strong>
                    <p>{selectedProject ? selectedProject.Name : `(${task.ProjectID})`}</p>
                    </div>
                    <div className="md:col-span-2">
                        <FormField label="Task">
                        <input
                            type="text"
                            name="Task"
                            value={formData.Task}
                            onChange={handleChange}
                            className={baseInputClass}
                            required
                        />
                        </FormField>
                    </div>

                    <FormField label="Owner">
                        <select
                        name="Owner"
                        value={formData.Owner}
                        onChange={handleChange}
                        className={baseInputClass}
                        >
                        {ownerOptions.map((opt) => (
                            <option key={opt} value={opt}>
                            {opt}
                            </option>
                        ))}
                        </select>
                    </FormField>

                    <FormField label="Deadline">
                        <input
                        type="date"
                        name="Deadline"
                        value={formData.Deadline || ""}
                        onChange={handleChange}
                        className={baseInputClass}
                        />
                    </FormField>

                    <FormField label="Status">
                        <select
                        name="Status"
                        value={formData.Status}
                        onChange={handleChange}
                        className={baseInputClass}
                        >
                        {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                            {opt}
                            </option>
                        ))}
                        </select>
                    </FormField>

                    {/* Spacer */}
                    {formData.Status !== "Help Me" && (
                        <div className="hidden md:block"></div>
                    )}

                    {/* +++ START: Conditional "Help Me" Section +++ (โค้ดเดิม) */}
                    {formData.Status === "Help Me" && (
                        <>
                        <div className="md:col-span-2 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            <FormField label="วันที่ร้องขอความช่วยเหลือ">
                                <input
                                type="date"
                                name="HelpRequestedAt"
                                value={formData.HelpRequestedAt || ""}
                                onChange={handleChange}
                                className={`${baseInputClass} bg-gray-200`}
                                readOnly
                                />
                            </FormField>
                            <FormField label="ขอความช่วยเหลือล่วงหน้า">
                                <div className="mt-1 px-3 py-2 bg-gray-200 rounded-md text-sm font-bold text-purple-800 h-full flex items-center">
                                {helpLeadTime}
                                </div>
                            </FormField>
                            <FormField label="ผู้ช่วยเหลือ (Help Assignee)">
                                <select
                                name="HelpAssignee"
                                value={formData.HelpAssignee || ""}
                                onChange={handleChange}
                                className={`${baseInputClass} border-purple-300`}
                                >
                                <option value="">-- เลือกทีม --</option>
                                {ownerOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                    {opt}
                                    </option>
                                ))}
                                </select>
                            </FormField>
                            <div className="md:col-span-3">
                                <FormField label="รายละเอียดการร้องขอ">
                                <textarea
                                    name="HelpDetails"
                                    value={formData.HelpDetails || ""}
                                    onChange={handleChange}
                                    className={`${baseInputClass} border-purple-300`}
                                    rows={3}
                                    placeholder="อธิบายปัญหาที่ต้องการความช่วยเหลือ..."
                                ></textarea>
                                </FormField>
                            </div>
                            </div>
                        </div>
                        </>
                    )}
                    {/* +++ END: Conditional "Help Me" Section +++ */}
                    
                    <div className="md:col-span-2">
                        <FormField label="ผู้ปฏิบัติงาน (To Team)">
                        <input
                            type="text"
                            name="Feedback to Team"
                            value={formData["Feedback to Team"] ?? ""}
                            onChange={handleChange}
                            className={baseInputClass}
                            placeholder="เช่น @TeamA #Tag"
                        />
                        </FormField>
                    </div>

                    {/* ช่องสำหรับกรอกรายละเอียดการอัปเดต/เหตุผล */}
                    <div className="md:col-span-2 mt-4">
                        <div className={`p-4 rounded-lg border transition-colors duration-200 ${requiresReason ? 'bg-yellow-50 border-yellow-400 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                            <FormField label={`รายละเอียดการอัปเดต ${requiresReason ? '(จำเป็นต้องกรอก*)' : '(ถ้ามี)'}`}>
                                <textarea
                                    name="updateReason"
                                    value={updateReason}
                                    onChange={(e) => setUpdateReason(e.target.value)}
                                    className={`${baseInputClass} transition-colors duration-200 ${requiresReason ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500' : ''}`}
                                    rows={4}
                                    placeholder={requiresReason ? "กรุณาระบุเหตุผลเนื่องจากมีการเปลี่ยนแปลง Deadline หรือ Status..." : "ระบุรายละเอียดการเปลี่ยนแปลงอื่นๆ..."}
                                />
                            </FormField>
                            <p className={`text-sm mt-2 transition-colors duration-200 ${requiresReason ? 'text-yellow-700 font-medium' : 'text-gray-500'}`}>
                                * ข้อมูลนี้จะถูกบันทึกลงใน Notes / Result โดยอัตโนมัติเมื่อกดบันทึก
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <FormField label="Notes / Result (Log)">
                        <textarea
                            name="Notes / Result"
                            value={formData["Notes / Result"] ?? ""}
                            onChange={handleChange}
                            className={`${baseInputClass} bg-gray-100`}
                            rows={5}
                            readOnly
                            placeholder="ประวัติการอัปเดตจะแสดงที่นี่..."
                        />
                        </FormField>
                    </div>
                    </div>
                </fieldset>
            )}
            </div>

            {/* Footer */}
            <footer className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-xl">
            <div>
                {/* ปุ่ม Navigation */}
                <button
                type="button"
                onClick={() => onNavigate('previous')}
                disabled={!canNavigatePrev || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                <ArrowLeftIcon />
                </button>
                <button
                type="button"
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext || isLoading}
                className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                <ArrowRightIcon />
                </button>
            </div>
            <div>
                {currentModeIsView ? (
                <>
                    <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                    >
                    ปิด
                    </button>
                    {/* ปุ่มเข้าสู่โหมดแก้ไข */}
                    {!isViewOnly && (
                    <button
                        type="button"
                        // [⭐ BUG FIX] ใช้ onClick + setTimeout(0) เพื่อป้องกัน Race Condition ในทุกกรณี (รวมถึง "Help Me")
                        onClick={() => {
                            // เลื่อนการเปลี่ยน State ออกไป เพื่อให้ Event Loop นี้จบก่อน
                            setTimeout(() => setIsEditing(true), 0);
                        }}
                        disabled={isLoading}
                        className="ml-3 px-6 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 focus:outline-none disabled:bg-gray-400"
                    >
                        แก้ไข
                    </button>
                    )}
                </>
                ) : (
                <>
                    <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isLoading || isSaving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                    >
                    ยกเลิก
                    </button>
                    <button
                    type="submit"
                    disabled={isLoading || isSaving || (requiresReason && !updateReason.trim())}
                    className="ml-3 px-6 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                    {isLoading || isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </>
                )}
            </div>
            </footer>
        </form>
      </div>
    </div>
  );
};