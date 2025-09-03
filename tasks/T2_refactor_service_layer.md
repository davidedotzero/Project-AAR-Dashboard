
# T2: ปรับปรุง Service Layer โดยแยกตาม Domain

## 1. เป้าหมาย
แยกไฟล์ Service ที่อาจรวมกันอยู่ (เช่น `services/api.ts`) ออกเป็นไฟล์ย่อยตามกลุ่มของข้อมูล (Domain-specific).

## 2. โครงสร้างเป้าหมาย
/src/services/
├── authService.ts    # จัดการ Authentication (Login, Logout, Token)
├── aarService.ts     # จัดการข้อมูล AARs (Fetch, Create, Update)
└── apiCore.ts        # (Optional) สำหรับการตั้งค่าพื้นฐานของการเรียก API

## 3. ขั้นตอนการดำเนินงาน
1.  **วิเคราะห์ Services ปัจจุบัน:** ตรวจสอบฟังก์ชันทั้งหมดใน `src/services/`.
2.  **สร้างไฟล์ใหม่:** สร้างไฟล์ตามโครงสร้างเป้าหมาย (เช่น `authService.ts`, `aarService.ts`).
3.  **ย้ายฟังก์ชัน:** ย้ายฟังก์ชันที่เกี่ยวข้องไปยังไฟล์ใหม่.
4.  **อัปเดต Import Paths (สำคัญ):** ค้นหาทั่วทั้งโปรเจกต์ (ใน `context`, `hooks`, `pages`) และแก้ไข Import Path ทั้งหมดที่อ้างอิงถึงฟังก์ชันที่ถูกย้าย ให้ชี้ไปยังตำแหน่งใหม่ที่ถูกต้อง.

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
*   Service Layer ถูกจัดระเบียบตาม Domain.
*   Import Paths ทั้งหมดถูกต้อง.
*   การทำงานของแอปพลิเคชันยังคงเหมือนเดิม (ไม่มีการแก้ไข Logic).
