// src/components/TaskFilters.tsx

import React from "react";
import { ownerOptions, phaseOptions, statusOptions } from "../constants";

interface TaskFiltersProps {
  filters: any;
  onFilterChange: (field: string, value: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onFilterChange(e.target.name, e.target.value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border">
      {/* Filter by Task Name ไม่ใช้ */}
      {/* <div>
        <label
          htmlFor="task-filter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Task
        </label>
        <input
          type="text"
          id="task-filter"
          name="Task"
          value={filters.Task || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
          placeholder="ค้นหาชื่องาน..."
        />
      </div> */}

      {/* Filter by Phase */}
      <div>
        <label
          htmlFor="phase-filter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phase
        </label>
        <select
          id="phase-filter"
          name="Phase"
          value={filters.Phase || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
        >
          <option value="">ทั้งหมด</option>
          {phaseOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Owner (Team) */}
      <div>
        <label
          htmlFor="owner-filter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Owner (ทีม)
        </label>
        <select
          id="owner-filter"
          name="Owner"
          value={filters.Owner || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
        >
          <option value="">ทั้งหมด</option>
          {ownerOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Status */}
      <div>
        <label
          htmlFor="status-filter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id="status-filter"
          name="Status"
          value={filters.Status || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
        >
          <option value="">ทั้งหมด</option>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
