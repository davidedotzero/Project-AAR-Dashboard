
import React from 'react';

interface SettingsTabProps {
    ownerOptions: string[];
    statusOptions: string[];
    phaseOptions: string[];
}

const SettingsSection: React.FC<{ title: string; options: string[] }> = ({ title, options }) => (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
        <p className="font-semibold text-gray-700">{title}:</p>
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map(opt => (
                <span key={opt} className="px-3 py-1 text-sm text-gray-800 bg-gray-100 rounded-full">{opt}</span>
            ))}
        </div>
    </div>
);


export const SettingsTab: React.FC<SettingsTabProps> = ({ ownerOptions, statusOptions, phaseOptions }) => {
    return (
        <div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-xl text-gray-700 mb-4 border-b pb-4">ตัวแปรหลัก (Global Inputs)</h3>
                <div className="space-y-4">
                    <SettingsSection title="Owner Options" options={ownerOptions} />
                    <SettingsSection title="Status Options" options={statusOptions} />
                    <SettingsSection title="Phase Options" options={phaseOptions} />
                </div>
                <p className="mt-6 text-sm text-gray-500">ส่วนนี้ใช้สำหรับตั้งค่าตัวเลือกต่างๆ ที่จะใช้ในโปรเจกต์ทั้งหมด</p>
            </div>
        </div>
    );
};