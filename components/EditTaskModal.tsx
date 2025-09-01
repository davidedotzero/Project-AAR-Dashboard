import React, { useState, useEffect, useMemo } from "react";
import type { Task } from "../types";
import {
  ownerOptions,
  statusOptions,
  statusColorMap,
  timelinessOptions,
  impactScoreOptions,
  phaseColorMap,
} from "../constants";
import { FileUpload } from "./FileUpload";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-1 text-gray-900">{children}</div>
  </div>
);

// --- Helper function to calculate day difference ---
const formatDateToDDMMYYYY = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "N/A";
  // Input format คือ YYYY-MM-DD
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return "N/A";
};

const calculateLeadTime = (deadline?: string, requestDate?: string): string => {
  if (!deadline || !requestDate) {
    return "N/A";
  }
  const deadlineD = new Date(deadline);
  const requestD = new Date(requestDate);
  if (isNaN(deadlineD.getTime()) || isNaN(requestD.getTime())) {
    return "N/A";
  }
  const diffTime = deadlineD.getTime() - requestD.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} วัน`;
};

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

// --- Component ย่อยสำหรับแสดงผลในโหมด View เท่านั้น ---
const TaskDetailsView: React.FC<{ task: Task }> = ({ task }) => {
  const helpLeadTime = calculateLeadTime(task.Deadline, task.HelpRequestedAt);
  const attachmentLink = task.AttachmentLink;

  return (
    <div className="p-8 space-y-6">
      {/* --- Main Task Details --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 pb-6 border-b">
        <div className="md:col-span-3">
          <DetailItem label="Task">
            <p className="text-lg font-semibold">{task.Task}</p>
          </DetailItem>
        </div>

        <DetailItem label="Phase">
          <span
            className={`px-2.5 py-1 text-sm font-semibold rounded-full ${
              phaseColorMap[task.Phase]?.bg
            } ${phaseColorMap[task.Phase]?.text}`}
          >
            {task.Phase}
          </span>
        </DetailItem>

        <DetailItem label="Owner">
          <span className="px-2.5 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full">
            {task.Owner}
          </span>
        </DetailItem>

        <DetailItem label="Status">
          <p
            className={`font-bold ${
              statusColorMap[task.Status]
            } || 'text-gray-500'}`}
          >
            {task.Status}
          </p>
        </DetailItem>

        <DetailItem label="Deadline">
          <p>{formatDateToDDMMYYYY(task.Deadline)}</p>
        </DetailItem>

        <DetailItem label="Est. Hours">
          <p>{task["Est. Hours"] ?? 0} ชั่วโมง</p>
        </DetailItem>

        <DetailItem label="Actual Hours">
          <p>{task["Actual Hours"] ?? "N/A"} ชั่วโมง</p>
        </DetailItem>
      </div>

      {/* --- Help Me Section (Conditional) --- */}
      {task.Status === "Help Me" && (
        <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
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
                <p className="p-2 bg-purple-100 rounded-md border border-purple-200 min-h-[50px]">
                  {task.HelpDetails || "-"}
                </p>
              </DetailItem>
            </div>
          </div>
        </div>
      )}

      {/* --- Notes & Feedback Section --- */}
      <div className="grid grid-cols-1 gap-y-6">
        <DetailItem label="Notes / Result">
          <p className="p-2 bg-gray-50 rounded-md border min-h-[50px]">
            {task["Notes / Result"] || "-"}
          </p>
        </DetailItem>
        <DetailItem label="Attachment Link (ลิงก์แนบ)">
          {attachmentLink ? (
            <a
              href={attachmentLink}
              target="_blank"
              rel="noopener noreferrer"
              // [✅ ปรับปรุง] เพิ่ม Style ให้ดูน่าสนใจขึ้น
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline break-all p-2 bg-blue-50 rounded-md border border-blue-200"
            >
              <LinkIcon className="mr-2 flex-shrink-0" />
              <span>{attachmentLink}</span>
            </a>
          ) : (
            <p className="p-2 bg-gray-50 rounded-md border">-</p>
          )}
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

  useEffect(() => {
    if (task) {
      const formattedTask = {
        ...task,
        Deadline: task.Deadline || "",
        HelpRequestedAt: task.HelpRequestedAt || "",
        AttachmentLink: task.AttachmentLink || "",
      };
      setFormData(formattedTask);
    }
  }, [task]);

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

      if (name === "Status") {
        if (value === "Help Me" && !updatedData.HelpRequestedAt) {
          const today = new Date();
          const formattedToday = `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          updatedData.HelpRequestedAt = formattedToday;
        } else if (value !== "Help Me") {
          // If status is changed away from "Help Me", clear all related fields
          updatedData.HelpRequestedAt = "";
          updatedData.HelpAssignee = "";
          updatedData.HelpDetails = "";
        }
      }

      return updatedData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // ป้องกันการ Submit ซ้ำ

    if (formData) {
      onSave(formData);
    }
  };

  const helpLeadTime = useMemo(() => {
    return calculateLeadTime(formData?.Deadline, formData?.HelpRequestedAt);
  }, [formData?.Deadline, formData?.HelpRequestedAt]);

  const baseInputClass =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500";

  if (!isOpen || !formData) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isViewOnly ? "รายละเอียด Task" : "แก้ไข Task"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            &times;
          </button>
        </header>
        {/* ... Header remains the same ... */}
        <div className="overflow-y-auto">
          {isViewOnly ? (
            <TaskDetailsView task={formData} />
          ) : (
            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <fieldset disabled={isLoading}>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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

                  {/* Spacer to align fields correctly when Help Me is not selected */}
                  {formData.Status !== "Help Me" && (
                    <div className="hidden md:block"></div>
                  )}

                  {/* +++ START: Conditional "Help Me" Section +++ */}
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
                              readOnly // Make it read-only
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
                    <FormField label="Notes / Result">
                      <textarea
                        name="Notes / Result"
                        value={formData["Notes / Result"] ?? ""}
                        onChange={handleChange}
                        className={baseInputClass}
                        rows={4} // เพิ่มพื้นที่
                      />
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Attachment Link (ลิงก์แนบ)">
                      <input
                        type="url"
                        name="AttachmentLink"
                        value={formData.AttachmentLink ?? ""} 
                        onChange={handleChange}
                        className={baseInputClass}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-3 px-6 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        {/* Loading Spinner SVG */}
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        กำลังบันทึก...
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                </div>
              </fieldset>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
