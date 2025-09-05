import React from 'react';
import { NotificationItem } from './NotificationItem';

interface Notification {
  _id: string;
  taskName: string;
  projectName: string;
  createdAt: string;
  deadline: string;
  type: 'deadline' | 'new_task';
}

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No new notifications.</p>
        ) : (
          notifications.map(notif => (
            <NotificationItem key={notif._id} notification={notif} />
          ))
        )}
      </div>
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
        <button className="text-xs text-orange-600 hover:underline">
          View all notifications
        </button>
      </div>
    </div>
  );
};