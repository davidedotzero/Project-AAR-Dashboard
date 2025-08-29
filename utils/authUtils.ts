// src/utils/authUtils.ts
import type { User, Task } from '../types'; 

// Helper function สำหรับเตรียม String (ทำให้เป็นตัวพิมพ์เล็กและตัดช่องว่าง)
const normalize = (str: string | null | undefined) => str?.toLowerCase().trim();

/**
 * ตรวจสอบว่าเป็น Admin หรือไม่
 */
export const isAdmin = (user: User | null): boolean => {
  // เปรียบเทียบ Role แบบ Case-insensitive
  return normalize(user?.role) === 'admin';
};

/**
 * ตรวจสอบว่ามีสิทธิ์แก้ไข/ลบ Task หรือไม่ (Admin หรือ Owner)
 * Logic นี้ต้องตรงกับที่ใช้ใน Backend (API.gs)
 */
export const canEditTask = (user: User | null, task: Task): boolean => {
  if (!user) return false;
  
  // 1. Admin มีสิทธิ์เสมอ
  if (isAdmin(user)) return true;
  
  // 2. ตรวจสอบความเป็นเจ้าของ (เปรียบเทียบ 'ชื่อ' ของ User กับ 'Owner' ของ Task)
  return normalize(user.name) === normalize(task.Owner);
};