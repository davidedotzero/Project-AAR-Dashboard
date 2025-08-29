// src/types.ts

// =================================================
// Authentication and Authorization
// =================================================

/**
 * [✅ เพิ่มใหม่] โครงสร้างข้อมูลผู้ใช้ (อิงตาม Google Sheet 'Users' และ API.gs)
 */
export interface User {
  email: string;
  role: string;  // บทบาท (เช่น 'admin', 'user')
  name: string;  // ชื่อผู้ใช้ (ใช้สำหรับเปรียบเทียบกับ Owner)
}

// =================================================
// Core Data Models
// =================================================

export interface Project {
  ProjectID: string;
  Name: string;
  Priority: number;
}

/**
 * [✅ ปรับปรุง] โครงสร้างข้อมูล Task
 */
export interface Task {
  _id: string;
  rowIndex: number;
  ProjectID: string;
  Check: boolean;
  Phase: string;
  Task: string;
  Owner: string;
  Deadline: string | null;
  Status: string;
  "Est. Hours": number;
  "Actual Hours": number | null;
  "Impact Score": number;
  Timeliness: string;
  "Notes / Result": string | null;
  "Feedback to Team": string | null;
  "Owner Feedback": string | null;
  "Project Feedback": string | null;
  MilestoneID: string | null;

  // [✅ เพิ่มใหม่] ฟิลด์เสริมที่ใช้ใน DashboardTab/TasksTab
  HelpAssignee?: string | null;
  HelpDetails?: string | null;
  HelpRequestedAt?: string | null;
  Attachment?: string | null;
}

// =================================================
// Dashboard/Chart Types
// =================================================

export type TasksByStatus = Array<{ name: string; Tasks: number; }>;
export type TasksByOwner = Array<{ name: string; value: number; }>;