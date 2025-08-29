import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);


export const ProfileTab: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="p-8 text-center text-gray-500">
        No user is currently logged in. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <UserIcon />
            </div>
          <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-md text-gray-500">{user.email}</p>
          <span className="mt-2 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full capitalize">{user.role}</span>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
            <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <LogoutIcon />
                <span className="ml-2">Logout</span>
            </button>
        </div>
      </div>
    </div>
  );
};
