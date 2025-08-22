
import React from 'react';
import { ChartBarIcon, ListTodoIcon, FolderKanbanIcon, SettingsIcon } from './icons';

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeTab: string;
  onClick: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, activeTab, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${
      activeTab === id
        ? 'bg-orange-500 text-white rounded-lg shadow-md'
        : 'text-gray-600 hover:bg-orange-100 hover:text-orange-600 rounded-lg'
    }`}
  >
    <div className="mr-3">{icon}</div>
    <span className="font-medium">{label}</span>
  </button>
);


interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    filterTeam: string;
    setFilterTeam: (team: string) => void;
    ownerOptions: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, filterTeam, setFilterTeam, ownerOptions }) => {
    return (
        <aside className="w-1/4 max-w-xs bg-white p-6 flex flex-col border-r border-gray-200 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">แดชบอร์ด</h1>
            <p className="text-gray-500 mb-8">ภาพรวมโปรเจกต์และการดำเนินงาน</p>

            <nav className="space-y-3">
                <TabButton id="aar" label="สรุปผล (AAR)" icon={<ChartBarIcon />} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton id="tasks" label="รายการ Task" icon={<ListTodoIcon />} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton id="projects" label="โปรเจกต์" icon={<FolderKanbanIcon />} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton id="config" label="ตั้งค่า" icon={<SettingsIcon />} activeTab={activeTab} onClick={setActiveTab} />
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-200">
            <label htmlFor="feedback-filter" className="block text-sm font-medium text-gray-700 mb-2">กรอง Feedback ถึงทีม (@)</label>
            <select
                id="feedback-filter"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
                <option value="ALL">ทุกทีม</option>
                {ownerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            </div>
      </aside>
    );
}
