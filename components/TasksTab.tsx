
import React from 'react';
import type { Task } from '../types';
import { statusColorMap } from '../constants';
import { EditIcon } from './icons';

interface TasksTabProps {
    filteredTasks: Task[];
    onEditTask: (task: Task) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ filteredTasks, onEditTask }) => {
    return (
        <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium">Task</th>
                                <th scope="col" className="px-6 py-4 font-medium">Owner</th>
                                <th scope="col" className="px-6 py-4 font-medium">Deadline</th>
                                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                                <th scope="col" className="px-6 py-4 font-medium text-center">Impact</th>
                                <th scope="col" className="px-6 py-4 font-medium">Feedback</th>
                                <th scope="col" className="px-4 py-4 font-medium text-center">แก้ไข</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">ไม่พบ Task ที่ตรงกับเงื่อนไข</td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                <tr key={task._id} className="bg-white border-b last:border-b-0 border-gray-200 hover:bg-orange-50 transition-colors duration-200">
                                    <td className="px-6 py-4 font-medium text-gray-900">{task.Task}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">{task.Owner}</span>
                                    </td>
                                    <td className="px-6 py-4">{task.Deadline}</td>
                                    <td className={`px-6 py-4 font-semibold ${statusColorMap[task.Status] || 'text-gray-500'}`}>{task.Status}</td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-700">{task['Impact Score']}</td>
                                    <td className="px-6 py-4 text-red-600">{task['Feedback to Team']}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button 
                                            onClick={() => onEditTask(task)}
                                            className="text-gray-500 hover:text-orange-600 transition-colors duration-200 p-2 rounded-full hover:bg-orange-100"
                                            aria-label={`Edit task ${task.Task}`}
                                        >
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-6 text-sm text-gray-600">
                <p><strong>หมายเหตุ:</strong> ข้อมูล Task จะถูกดึงและบันทึกไปยัง Google Sheet โดยตรง</p>
            </div>
        </div>
    );
};