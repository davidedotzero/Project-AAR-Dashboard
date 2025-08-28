// src/components/AllTasksTeamViewTab.tsx

import React from 'react';
import { useData } from '../contexts/DataContext';
import { Task } from '../types';

// Helper function to group tasks by owner
const groupTasksByOwner = (tasks: Task[]) => {
  return tasks.reduce((acc, task) => {
    const owner = task.Owner || 'Unassigned';
    if (!acc[owner]) {
      acc[owner] = [];
    }
    acc[owner].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
};

export const AllTasksTeamViewTab: React.FC = () => {
  // ดึง allTasks มาจาก Context โดยตรง
  const { allTasks, loadingMessage } = useData();
//   console.log("All Tasks received:", allTasks);

  if (loadingMessage) {
    return <div>Loading tasks...</div>;
  }

  const tasksByOwner = groupTasksByOwner(allTasks);
  const owners = Object.keys(tasksByOwner).sort();

  return (
    <div className="space-y-8">
      {owners.length === 0 && <p className="text-gray-500">ไม่พบ Task ที่มีเจ้าของ</p>}
      {owners.map((owner) => (
        <div key={owner}>
          <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">
            {owner}
          </h3>
          <ul className="space-y-2">
            {tasksByOwner[owner].map((task, index) => (
              <li key={`${task.rowIndex}-${index}`} className="p-3 bg-white rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                    <p className="font-medium text-gray-900">{task.Task}</p>
                    <p className="text-sm text-gray-500">
                       <span className="font-bold">Project:</span> {task.ProjectID} | <span className="font-bold">Status:</span> {task.Status}
                    </p>
                </div>
                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                    task.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {task.Status}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};