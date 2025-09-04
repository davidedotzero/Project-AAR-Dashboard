# T6: แก้ไขการเชื่อมโยงในหน้า /Projects ไปยังหน้า Tasks

## 1. เป้าหมาย (Goal)

ปรับปรุงระบบ Routing ในหน้า `/Projects` ให้สามารถนำทาง (navigate) ไปยังหน้ารายละเอียดของแต่ละโปรเจกต์ (หน้า Tasks) ได้อย่างถูกต้อง โดยใช้ `react-router-dom` (v6+).

- **Action:** เมื่อผู้ใช้งานคลิกที่การ์ดโปรเจกต์ (Project Card)
- **Event:** ฟังก์ชัน `onSelectProject(p.ProjectID)` จะถูกเรียก
- **Expected Outcome:** ระบบจะเปลี่ยนเส้นทาง (redirect) ไปยัง URL ที่เป็นหน้า Tasks ของโปรเจกต์นั้นๆ
- **URL Format:** `/task/[project.Name]`

## 2. ขั้นตอนการดำเนินงาน (Implementation Steps)

1.  **ปรับปรุงฟังก์ชัน `onSelectProject`:**
    * แก้ไขฟังก์ชัน `onSelectProject` ที่อยู่ในคอมโพเนนต์ของหน้า `/Projects`
    * เปลี่ยนจากการทำงานเดิม ให้เป็นการใช้ `useNavigate()` จาก `react-router-dom` เพื่อไปยัง Path ของโปรเจกต์ที่เลือก
    * ตัวอย่าง Path ที่ต้องการ: `/task/Project-A`, `/task/Project-B`

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)

- [ ] เมื่อคลิกที่การ์ดโปรเจกต์บนหน้า `/projects` แล้ว URL ในเบราว์เซอร์ต้องเปลี่ยนเป็น `/task/[project.Name]` อย่างถูกต้อง
- [ ] หน้าเว็บต้องแสดงคอมโพเนนต์ของหน้า Tasks ที่สอดคล้องกับโปรเจกต์ที่เลือก
- [ ] ไม่เกิดข้อผิดพลาด (error) ใน console ที่เกี่ยวข้องกับการ routing