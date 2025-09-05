import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from './icons';
import { NotificationDropdown } from './NotificationDropdown';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  _id: string;
  taskName: string;
  projectName: string;
  createdAt: string;
  deadline: string;
  type: 'deadline' | 'new_task';
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef(null);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiRequest<Notification[]>({ op: 'getNotifications', user: user });
      if (Array.isArray(response)) {
        setNotifications(response);
        setUnreadCount(response.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button onClick={handleToggle} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>
      <NotificationDropdown notifications={notifications} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};