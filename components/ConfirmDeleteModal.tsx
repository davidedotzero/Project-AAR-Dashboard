// src/components/ConfirmDeleteModal.tsx

import React, { useState } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen, onClose, onConfirm, title, message, isLoading
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/70 bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
          <button onClick={onClose} disabled={isLoading || isDeleting} className="px-4 py-2 text-sm bg-white border rounded-md">
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || isDeleting}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {isLoading || isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
          </button>
        </div>
      </div>
    </div>
  );
};