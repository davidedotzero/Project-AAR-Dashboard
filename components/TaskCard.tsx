// src/components/TaskCard.tsx

import React from 'react';
import type { Task } from '../types';
import { useUI } from '../contexts/UIContext';
import { DeadlineAlert } from './DeadlineAlert';
import { ViewIcon, EditIcon, DeleteIcon } from './icons';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { openViewModal, openEditModal, openDeleteModal } = useUI();
  // สมมติว่าใน UIContext มี allTasks state หรือเราสามารถดึงมาจาก DataContext ได้
  // ในที่นี้จะใช้ [] ชั่วคราวไปก่อน
  const allTasks: Task[] = []; 

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="font-bold text-gray-800 text-sm mb-3">{task.Task}</p>
      <div className="space-y-2">
        <div className="text-xs">
          <p className="text-gray-500 mb-1">DEADLINE</p>
          <DeadlineAlert deadline={task.Deadline} status={task.Status} />
        </div>
        <div className="text-xs">
          <p className="text-gray-500 mb-1">STATUS</p>
          <p className="font-semibold">{task.Status}</p>
        </div>
      </div>
      <div className="flex justify-end pt-3 border-t mt-3 space-x-1">
        <button onClick={() => openViewModal(task, allTasks)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50">
          <ViewIcon />
        </button>
        <button onClick={() => openEditModal(task)} className="text-gray-400 hover:text-orange-600 p-1.5 rounded-full hover:bg-orange-50">
          <EditIcon />
        </button>
        <button onClick={() => openDeleteModal('task', task)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50">
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
};