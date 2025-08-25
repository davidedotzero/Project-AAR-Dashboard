// src/components/DeadlineAlert.tsx

import React from 'react';

interface DeadlineAlertProps {
  deadline: string; // รับค่าวันที่ในรูปแบบ 'YYYY-MM-DD'
  status: string;
}

// ฟังก์ชันคำนวณความต่างของวัน
const getDaysDiff = (deadline: string): number => {
  if (!deadline) return 999;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  // ตั้งค่าเวลาให้เป็น 0 เพื่อเปรียบเทียบเฉพาะวันที่
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const DeadlineAlert: React.FC<DeadlineAlertProps> = ({ deadline, status }) => {
  // ไม่ต้องแสดง Alert ถ้างานเสร็จแล้ว (Done)
  if (status === 'Done' || !deadline) {
    return <span className="text-gray-500">{deadline || 'N/A'}</span>;
  }

  const daysRemaining = getDaysDiff(deadline);
  let alertStyle = {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    text: deadline,
  };

  if (daysRemaining < 0) {
    // เกินกำหนด
    alertStyle = {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      text: `เกินกำหนด ${Math.abs(daysRemaining)} วัน`,
    };
  } else if (daysRemaining >= 0 && daysRemaining <= 3) {
    // ใกล้ถึงกำหนด (3 วันหรือน้อยกว่า)
    alertStyle = {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      text: `เหลือ ${daysRemaining} วัน`,
    };
  } else {
    // ยังมีเวลา (มากกว่า 3 วัน)
     alertStyle = {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      text: `เหลือ ${daysRemaining} วัน`,
    };
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${alertStyle.bgColor} ${alertStyle.textColor}`}>
      {alertStyle.text}
    </span>
  );
};