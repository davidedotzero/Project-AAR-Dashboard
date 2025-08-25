// src/components/CreateTaskModal.tsx

import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { ownerOptions, statusOptions, phaseOptions, impactScoreOptions } from '../constants';

// สร้าง Type สำหรับข้อมูล Task ใหม่ (บาง field ไม่จำเป็นต้องมีตอนสร้าง)
type NewTaskData = Partial<Pick<Task, 'Task' | 'Owner' | 'Phase' | 'Status' | 'Deadline' | 'Est. Hours' | 'Impact Score'>>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newTaskData: NewTaskData) => void;
  initialPhase: string | null;
  isLoading: boolean;
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreate, initialPhase, isLoading }) => {
    const [formData, setFormData] = useState<NewTaskData>({});

    // ตั้งค่าเริ่มต้นให้ฟอร์มเมื่อ Modal ถูกเปิด
    useEffect(() => {
        if (isOpen) {
            setFormData({
                Task: '',
                Phase: initialPhase || phaseOptions[0],
                Owner: ownerOptions[0],
                Status: 'Not Started',
                Deadline: new Date().toISOString().split('T')[0],
                'Est. Hours': 8,
                'Impact Score': 3,
            });
        }
    }, [isOpen, initialPhase]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(formData);
    };

    const baseInputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm ...";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">สร้าง Task ใหม่</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2">
                            <FormField label="Task"><input type="text" name="Task" value={formData.Task || ''} onChange={handleChange} required className={baseInputClass} /></FormField>
                        </div>
                        <FormField label="Phase">
                            <select name="Phase" value={formData.Phase} onChange={handleChange} className={baseInputClass}>
                                {phaseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Owner">
                            <select name="Owner" value={formData.Owner} onChange={handleChange} className={baseInputClass}>
                                {ownerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Deadline"><input type="date" name="Deadline" value={formData.Deadline || ''} onChange={handleChange} className={baseInputClass} /></FormField>
                        <FormField label="Est. Hours"><input type="number" name="Est. Hours" value={formData['Est. Hours'] || ''} onChange={handleChange} className={baseInputClass} /></FormField>
                    </div>
                    <footer className="flex justify-end p-6 bg-gray-50 border-t rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-md">ยกเลิก</button>
                        <button type="submit" disabled={isLoading} className="ml-3 px-6 py-2 text-white bg-orange-500 rounded-md disabled:bg-gray-400">
                            {isLoading ? 'กำลังสร้าง...' : 'สร้าง Task'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};