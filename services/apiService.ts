// src/services/apiService.ts

import { apiRequest } from './api';

// --- นิยาม Type เพื่อให้โค้ดฉลาดและปลอดภัย (ถ้าคุณใช้ TypeScript) ---
interface User {
  email: string;
  name: string;
  role: string;
}

interface Task {
  _id?: string; // ID จะไม่มีตอนสร้างใหม่
  rowIndex?: number; // เราจะไม่ใช้อันนี้ส่งไป แต่จะได้รับกลับมา
  Title: string;
  Owner: string;
  // ... fields อื่นๆ ของ Task
}

// --- ฟังก์ชัน Service Layer ---

/**
 * [ฟังก์ชันใหม่] บันทึก Task (ทั้งสร้างและอัปเดต)
 * ฟังก์ชันนี้จะเรียก 'saveTask' operation ใน Apps Script
 * @param taskData ข้อมูล Task ที่ต้องการบันทึก (อาจจะมี _id หรือไม่มีก็ได้)
 * @param user ข้อมูลผู้ใช้ปัจจุบัน
 */
export const saveTask = (taskData: Task, user: User) => {
  const body = {
    op: 'saveTask', // เรียก operation ใหม่ที่เราสร้างใน Backend
    payload: {
      taskData: taskData, // ส่งข้อมูล Task ทั้งก้อนไปใน payload นี้เสมอ
    },
    user: user,
  };
  // apiRequest จะคืนค่า Task ที่บันทึกเสร็จแล้ว (พร้อม _id) กลับมา
  return apiRequest<Task>(body);
};

/**
 * [ฟังก์ชันแก้ไข] ลบ Task
 * ฟังก์ชันนี้จะเรียก 'deleteTask' operation ใน Apps Script
 * @param taskId ID ของ Task ที่ต้องการลบ (ไม่ใช่ rowIndex!)
 * @param user ข้อมูลผู้ใช้ปัจจุบัน
 */
export const deleteTask = (taskId: string, user: User) => {
  const body = {
    op: 'deleteTask',
    payload: {
      taskId: taskId, // <<< แก้ไขตรงนี้: ส่ง 'taskId' แทน 'rowIndex'
    },
    user: user,
  };
  // apiRequest จะคืนค่า { deletedTaskId: '...' } กลับมา
  return apiRequest<{ deletedTaskId: string }>(body);
};

// คุณสามารถเพิ่มฟังก์ชันอื่นๆ ไว้ที่นี่ได้ด้วย
export const getTasks = (projectId: string, user: User) => {
  const body = { op: 'getTasks', payload: { projectId }, user };
  return apiRequest<Task[]>(body);
};

export const verifyUser = (email: string) => {
    const body = { op: 'verifyUserByEmail', payload: { email } };
    return apiRequest<User>(body);
}