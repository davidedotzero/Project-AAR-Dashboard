// components/DashboardTab.tsx (New File)
import React, { useMemo } from 'react';
import { useGlobalFilters } from '../components/GlobalFilterContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { Project } from '../types';

// --- Helper Component: FilterDropdown ---
const FilterDropdown: React.FC<{
  label: string;
  value: string | null;
  // รองรับทั้ง String Array (Owner/Status) และ Project Array
  options: Array<string | Project>;
  onChange: (value: string | null) => void;
  disabled: boolean;
}> = ({ label, value, options, onChange, disabled }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100"
      disabled={disabled || options.length === 0}
    >
      <option value="">-- ทั้งหมด ({options.length}) --</option>
      {options.map(opt => (
        typeof opt === 'string' ?
            <option key={opt} value={opt}>{opt}</option> :
            <option key={opt.ProjectID} value={opt.ProjectID}>{opt.Name}</option>
      ))}
    </select>
  </div>
);


// --- Main Component: DashboardTab ---
export const DashboardTab: React.FC = () => {
  const { selections, options, setFilter, setSearchQuery, resetFilters, isLoading, filteredTasks } = useGlobalFilters();
  const { projects } = useData();
  const { openViewModal, openEditModal } = useUI();

  // Helper สำหรับหาชื่อโปรเจกต์
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.ProjectID === projectId);
    return project ? project.Name : projectId;
  };

  // จัดเรียงตาม Deadline (Requirement: Arrange ตาม Deadline)
  const sortedTasks = useMemo(() => {
    const sortableTasks = [...filteredTasks];
    sortableTasks.sort((a, b) => {
        // ถ้าไม่มี Deadline ให้ถือว่าอยู่ท้ายสุด (ใช้ Infinity)
        const aDeadline = a.Deadline ? new Date(a.Deadline).getTime() : Infinity;
        const bDeadline = b.Deadline ? new Date(b.Deadline).getTime() : Infinity;
        return aDeadline - bDeadline; // เรียงจากใกล้ที่สุดไปไกลที่สุด
    });
    return sortableTasks;
  }, [filteredTasks]);


  if (isLoading && sortedTasks.length === 0) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลและการวิเคราะห์...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard & Global Filters</h1>

      {/* Filter Bar */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <FilterDropdown
                label="Owner (ทีม/ผู้รับผิดชอบ)"
                value={selections.owner}
                options={options.owners}
                onChange={(val) => setFilter('owner', val)}
                disabled={isLoading}
            />
            <FilterDropdown
                label="Operation (โปรเจกต์)"
                value={selections.projectId}
                options={options.projects}
                onChange={(val) => setFilter('projectId', val)}
                disabled={isLoading}
            />
             <FilterDropdown
                label="Status (สถานะ)"
                value={selections.status}
                options={options.statuses}
                onChange={(val) => setFilter('status', val)}
                disabled={isLoading}
            />

            {/* Search Input (Action/Task/Notes) */}
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Action (ค้นหา Task/Notes)</label>
                <input
                    type="text"
                    placeholder="ค้นหางาน, Owner, หรือ Notes..."
                    value={selections.searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                    disabled={isLoading}
                />
            </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-lg font-semibold text-gray-800">
                พบผลลัพธ์: <span className="text-orange-500">{sortedTasks.length}</span> รายการ
            </p>
            <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition duration-150 disabled:opacity-40"
            // Disable ปุ่ม Reset ถ้าไม่มีการเลือก Filter หรือ Search
            disabled={Object.values(selections).every(v => v === null || v === "")}
            >
            ล้างตัวกรอง
            </button>
        </div>
      </div>

      {/* ตารางแสดงผลลัพธ์ */}
      <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action (Task)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation (Project)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* ใช้ sortedTasks แทน filteredTasks */}
            {sortedTasks.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Deadline || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.Owner || 'Unassigned'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-md" title={task.Task}>{task.Task}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-sm" title={getProjectName(task.ProjectID)}>{getProjectName(task.ProjectID)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.Status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                   {/* สำคัญ: ส่ง sortedTasks ไปด้วยเพื่อให้การนำทาง (Next/Prev) ถูกต้องตามรายการที่กรองและเรียงมา */}
                   <button onClick={() => openViewModal(task, sortedTasks)} className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                   <button onClick={() => openEditModal(task)} className="text-orange-600 hover:text-orange-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedTasks.length === 0 && !isLoading && (
            <div className="text-center py-10 text-gray-500 bg-white">
                ไม่พบ Task ที่ตรงกับเกณฑ์การค้นหา
            </div>
        )}
      </div>
    </div>
  );
};