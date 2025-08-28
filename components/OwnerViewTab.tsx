// src/components/OwnerViewTab.tsx

import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ownerOptions } from '../constants';
import { TaskCard } from './TaskCard';
import type { Task } from '../types';

export const OwnerViewTab: React.FC = () => {
  const { tasks } = useData();

  const tasksByOwner = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    if (!tasks) return grouped;
    
    ownerOptions.forEach(owner => {
      grouped[owner] = tasks.filter(task => task.Owner === owner);
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {ownerOptions.map(owner => (
        <div key={owner} className="flex-shrink-0 w-72 bg-gray-50 rounded-xl p-3">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-gray-700">{owner}</h3>
            <span className="text-sm font-semibold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
              {tasksByOwner[owner]?.length || 0}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)]">
            {tasksByOwner[owner] && tasksByOwner[owner].length > 0 ? (
              tasksByOwner[owner].map(task => <TaskCard key={task._id} task={task} />)
            ) : (
              <div className="text-center text-sm text-gray-400 p-4">
                - ไม่มี Task -
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};