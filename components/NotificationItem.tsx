import React from 'react';
import { BellIcon } from './icons';

interface NotificationItemProps {
  notification: {
    taskName: string;
    projectName: string;
    createdAt: string;
    deadline: string;
    type: 'deadline' | 'new_task';
  };
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { taskName, projectName, createdAt, deadline, type } = notification;

  const isDeadline = type === 'deadline';

  return (
    <div className="p-3 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${isDeadline ? 'bg-red-100' : 'bg-blue-100'}`}>
          <BellIcon className={`h-4 w-4 ${isDeadline ? 'text-red-500' : 'text-blue-500'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">
            {taskName}
          </p>
          <p className="text-xs text-gray-500">
            Project: {projectName}
          </p>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Created: {formatDate(createdAt)}</span>
            <span className={isDeadline ? 'font-bold text-red-600' : ''}>
              Deadline: {formatDate(deadline)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};