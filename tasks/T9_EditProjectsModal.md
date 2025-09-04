# T9 (Rev.2): พัฒนาฟีเจอร์แก้ไขรายละเอียดและจัดลำดับโปรเจกต์

## 1. เป้าหมาย (Goal)

ปรับปรุงหน้า `/projects` และ `EditProjectModal` เพื่อเพิ่มความสามารถในการให้รายละเอียดของโปรเจกต์ และปรับปรุงประสบการณ์ผู้ใช้ (UX) โดยการเพิ่ม "View Mode" และเปิดใช้งานการจัดลำดับโปรเจกต์ด้วยการลากและวาง (Drag and Drop)

**ไฟล์ที่เกี่ยวข้องหลัก:** `src/components/modals/EditProjectModal.tsx`, `src/pages/Projects/ProjectsTab.tsx`

## 2. คุณสมบัติหลัก (Key Features)

1.  **เพิ่มกรอบการทำงาน (Project Framework):**
    * ใน `EditProjectModal.tsx` เพิ่มช่อง `textarea` สำหรับให้ผู้ใช้กรอกรายละเอียดเกี่ยวกับ "กรอบการทำงาน" หรือแนวทางของโปรเจกต์

2.  **โหมดดูรายละเอียด (View Mode):**
    * ปรับปรุง `EditProjectModal.tsx` ให้มี 2 สถานะ:
        * **View Mode:** เป็นสถานะเริ่มต้นเมื่อเปิด Modal ขึ้นมา แสดงข้อมูลทั้งหมดแบบอ่านอย่างเดียว (read-only)
        * **Edit Mode:** เข้าสู่โหมดนี้เมื่อผู้ใช้กดปุ่ม "แก้ไข" เพื่อเปิดฟอร์มให้แก้ไขข้อมูลได้

3.  **การจัดลำดับด้วยการลากและวาง (Drag and Drop):**
    * ในหน้า `/projects` ผู้ใช้สามารถคลิกค้างที่การ์ดโปรเจกต์ (Project Card) แล้วลากเพื่อจัดลำดับการแสดงผลใหม่ได้

## 3. ขั้นตอนการดำเนินงาน (Implementation Steps)

### 3.1. ปรับปรุง `EditProjectModal.tsx`

* [ ] **(Data Model)** (ถ้าจำเป็น) ตรวจสอบ Backend (Google Apps Script) ว่ามีคอลัมน์สำหรับเก็บข้อมูล "Project Framework" หรือไม่ หากไม่มีให้เพิ่มคอลัมน์ใหม่ (เช่น `frameworkDetails`) และอัปเดต API ที่เกี่ยวข้อง (`updateProject_API`)
* [ ] **(UI)** เพิ่ม State `isEditing` ใน `EditProjectModal.tsx` เพื่อควบคุมสถานะ View/Edit (default: `false`)
* [ ] **(UI)** สร้าง UI สำหรับ View Mode ที่แสดงข้อมูล Project Name, Priority, และ Framework Details (ถ้ามี) ในรูปแบบข้อความปกติ
* [ ] **(UI)** สร้าง UI สำหรับ Edit Mode โดยนำฟอร์มแก้ไขเดิมมาใช้ และเพิ่ม `textarea` สำหรับ `frameworkDetails`
* [ ] **(Logic)** สร้างเงื่อนไขเพื่อสลับการแสดงผลระหว่าง View Mode และ Edit Mode โดยใช้ State `isEditing`
* [ ] **(Logic)** จัดการปุ่มต่างๆ:
    * **ใน View Mode:** แสดงปุ่ม "Edit" และ "Close"
    * **ใน Edit Mode:** แสดงปุ่ม "Save" และ "Cancel"
    * เมื่อกด "Save" ให้เรียก API เพื่อบันทึกข้อมูลทั้งหมดแล้วสลับกลับไป View Mode
    * เมื่อกด "Cancel" ให้สลับกลับไป View Mode โดยไม่บันทึก

### 3.2. พัฒนาฟีเจอร์ Drag and Drop ในหน้า `/projects`

* [ ] **(Library)** ติดตั้ง Library สำหรับ Drag and Drop ที่เหมาะสมกับ React (เช่น `dnd-kit`, `react-beautiful-dnd`)
* [ ] **(Logic)** ในหน้า `ProjectsTab.tsx` จัดการ State สำหรับเก็บลำดับของโปรเจกต์
* [ ] **(Component)** ห่อ (Wrap) Project Card ด้วย Draggable component จาก Library ที่เลือก
* [ ] **(Component)** สร้าง Droppable context รอบ List ของโปรเจกต์ทั้งหมด
* [ ] **(Logic)** สร้างฟังก์ชัน `onDragEnd` เพื่ออัปเดต State ลำดับของโปรเจกต์ในฝั่ง Frontend เมื่อผู้ใช้วางการ์ดในตำแหน่งใหม่
* [ ] **(Backend - Optional)** หากต้องการให้ลำดับที่จัดใหม่ถูกบันทึกไว้ใช้งานครั้งถัดไป จะต้องมีการออกแบบเพิ่มเติม:
    * เพิ่มคอลัมน์ `sortOrder` ใน Google Sheets
    * สร้าง API สำหรับการอัปเดต `sortOrder` ของโปรเจกต์ทั้งหมด (Bulk Update)
    * เรียก API นี้เมื่อ `onDragEnd` ทำงานสำเร็จ

## 4. เกณฑ์การยอมรับ (Acceptance Criteria)

-   [ ] เมื่อเปิด Modal ของโปรเจกต์ ต้องแสดงเป็น View Mode ก่อนเสมอ
-   [ ] ใน Edit Mode ของ Modal ต้องมีช่อง `textarea` สำหรับกรอก Framework Details และสามารถบันทึกข้อมูลลง Backend ได้
-   [ ] ผู้ใช้สามารถสลับระหว่าง View Mode และ Edit Mode ใน Modal ได้อย่างถูกต้อง
-   [- ] ผู้ใช้สามารถลากและวางการ์ดโปรเจกต์เพื่อจัดลำดับการแสดงผลใหม่ในหน้า `/projects` ได้อย่างราบรื่น
-   [ ] (Optional) ลำดับที่จัดใหม่ผ่าน Drag and Drop จะต้องถูกบันทึกและแสดงผลเหมือนเดิมเมื่อมีการโหลดหน้าซ้ำ