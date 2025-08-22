
import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { ownerOptions, statusOptions, timelinessOptions, impactScoreOptions } from '../constants';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    task: Task;
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const baseInputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-gray-900";


export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const [formData, setFormData] = useState<Task>(task);

    useEffect(() => {
        setFormData(task);
    }, [task]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | null = value;
        if (type === 'number') {
            processedValue = value === '' ? null : Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">แก้ไข Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2">
                             <FormField label="Task">
                                <input type="text" name="Task" value={formData.Task} onChange={handleChange} className={baseInputClass} required/>
                            </FormField>
                        </div>

                        <FormField label="Owner">
                            <select name="Owner" value={formData.Owner} onChange={handleChange} className={baseInputClass}>
                                {ownerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Deadline">
                            <input type="date" name="Deadline" value={formData.Deadline} onChange={handleChange} className={baseInputClass} />
                        </FormField>

                        <FormField label="Status">
                            <select name="Status" value={formData.Status} onChange={handleChange} className={baseInputClass}>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Timeliness">
                            <select name="Timeliness" value={formData.Timeliness} onChange={handleChange} className={baseInputClass}>
                                 <option value="">N/A</option>
                                {timelinessOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Est. Hours">
                            <input type="number" name="Est. Hours" value={formData['Est. Hours'] ?? ''} onChange={handleChange} className={baseInputClass} />
                        </FormField>

                        <FormField label="Actual Hours">
                            <input type="number" name="Actual Hours" value={formData['Actual Hours'] ?? ''} onChange={handleChange} className={baseInputClass} />
                        </FormField>
                        
                        <FormField label="Impact Score">
                            <select name="Impact Score" value={formData['Impact Score']} onChange={handleChange} className={baseInputClass}>
                                {impactScoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>

                        <div className="md:col-span-2">
                            <FormField label="Notes / Result">
                                <textarea name="Notes / Result" value={formData['Notes / Result']} onChange={handleChange} className={baseInputClass} rows={3}></textarea>
                            </FormField>
                        </div>
                        <div className="md:col-span-2">
                             <FormField label="Feedback to Team">
                                <input type="text" name="Feedback to Team" value={formData['Feedback to Team']} onChange={handleChange} className={baseInputClass} />
                            </FormField>
                        </div>
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
            </div>
        </div>
    );
};