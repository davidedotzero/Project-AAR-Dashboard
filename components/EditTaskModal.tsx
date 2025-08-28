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


// --- Component ย่อยสำหรับแสดงผลในโหมด View เท่านั้น ---
const TaskDetailsView: React.FC<{ task: Task }> = ({ task }) => {
  const helpLeadTime = calculateLeadTime(task.Deadline, task.HelpRequestedAt);

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
          <p>
            {task.Deadline
              ? new Date(task.Deadline).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })
              : "N/A"}
          </p>
        </DetailItem>

        <DetailItem label="Est. Hours">
          <p>{task["Est. Hours"] ?? 0} ชั่วโมง</p>
        </DetailItem>

        <DetailItem label="Actual Hours">
          <p>{task["Actual Hours"] ?? "N/A"} ชั่วโมง</p>
        </DetailItem>
      </div>

      {/* --- Help Me Section (Conditional) --- */}
      {task.Status === 'Help Me' && (
        <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
            <h4 className="text-md font-bold text-purple-800 mb-4">รายละเอียดการร้องขอความช่วยเหลือ</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <DetailItem label="วันที่ร้องขอ">
                    <p className="font-semibold">
                        {task.HelpRequestedAt
                        ? new Date(task.HelpRequestedAt).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })
                        : "-"}
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
        {/* <DetailItem label="Feedback to Team">
          <p className="p-2 bg-gray-50 rounded-md border min-h-[50px]">
            {task["Feedback to Team"] || "-"}
          </p>
        </DetailItem> */}
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
}) => {
  const [formData, setFormData] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      const formattedTask = {
        ...task,
        Deadline: task.Deadline
          ? new Date(task.Deadline).toISOString().split("T")[0]
          : "",
        HelpRequestedAt: task.HelpRequestedAt
          ? new Date(task.HelpRequestedAt).toISOString().split("T")[0]
          : "",
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
        const updatedData = { ...prev, [name]: processedValue } as Task;
        
        if (name === 'Status') {
            if (value === 'Help Me' && !updatedData.HelpRequestedAt) {
                // Set request date to today, only if it's not already set
                updatedData.HelpRequestedAt = new Date().toISOString().split("T")[0];
            } else if (value !== 'Help Me') {
                // If status is changed away from "Help Me", clear all related fields
                updatedData.HelpRequestedAt = '';
                updatedData.HelpAssignee = '';
                updatedData.HelpDetails = '';
            }
        }

        return updatedData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ... Header remains the same ... */}
        <div className="overflow-y-auto">
          {isViewOnly ? (
            <TaskDetailsView task={formData} />
          ) : (
            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2">
                  <FormField label="Task">
                    <input type="text" name="Task" value={formData.Task} onChange={handleChange} className={baseInputClass} required />
                  </FormField>
                </div>

                <FormField label="Owner">
                  <select name="Owner" value={formData.Owner} onChange={handleChange} className={baseInputClass}>
                    {ownerOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </FormField>

                <FormField label="Deadline">
                  <input type="date" name="Deadline" value={formData.Deadline || ''} onChange={handleChange} className={baseInputClass} />
                </FormField>

                <FormField label="Status">
                  <select name="Status" value={formData.Status} onChange={handleChange} className={baseInputClass}>
                    {statusOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </FormField>

                {/* Spacer to align fields correctly when Help Me is not selected */}
                {formData.Status !== 'Help Me' && <div className="hidden md:block"></div>}


                {/* +++ START: Conditional "Help Me" Section +++ */}
                {formData.Status === 'Help Me' && (
                    <>
                        <div className="md:col-span-2 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                <FormField label="วันที่ร้องขอความช่วยเหลือ">
                                    <input
                                        type="date"
                                        name="HelpRequestedAt"
                                        value={formData.HelpRequestedAt || ''}
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
                                    <select name="HelpAssignee" value={formData.HelpAssignee || ''} onChange={handleChange} className={`${baseInputClass} border-purple-300`}>
                                        <option value="">-- เลือกทีม --</option>
                                        {ownerOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                    </select>
                                </FormField>
                                <div className="md:col-span-3">
                                    <FormField label="รายละเอียดการร้องขอ">
                                        <textarea
                                            name="HelpDetails"
                                            value={formData.HelpDetails || ''}
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


                {/* <FormField label="Est. Hours">
                  <input type="number" name="Est. Hours" value={formData["Est. Hours"] ?? ""} onChange={handleChange} className={baseInputClass} />
                </FormField>

                <FormField label="Actual Hours">
                  <input type="number" name="Actual Hours" value={formData["Actual Hours"] ?? ""} onChange={handleChange} className={baseInputClass} />
                </FormField> */}
                
                {/* ... Other form fields remain the same ... */}
              </div>

              <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
                  ยกเลิก
                </button>
                <button type="submit" className="ml-3 px-6 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md shadow-sm hover:bg-orange-600 focus:outline-none">
                  บันทึก
                </button>
              </div>
            </form>
          )}
        </div>
        {/* ... Footer for view-only mode remains the same ... */}
      </div>
    </div>
  );
};
