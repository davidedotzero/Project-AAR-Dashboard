
# T1: ติดตั้งและใช้งาน React Router DOM

## 1. เป้าหมาย
เปลี่ยนระบบ Navigation ปัจจุบันที่อาจใช้ State (เช่น `activeTab` ใน `App.tsx`) ไปเป็นระบบ Routing ที่อ้างอิงตาม URL โดยใช้ `react-router-dom` (v6+).

## 2. ขั้นตอนการดำเนินงาน
1.  **ติดตั้ง Library:** เพิ่ม `react-router-dom` ใน `package.json`.
2.  **ตั้งค่า Router:** ใน `main.tsx` (หรือ entry point), ห่อหุ้ม `<App />` ด้วย `<BrowserRouter>`.
3.  **กำหนด Routes ใน App.tsx:**
    *   ลบ Logic การจัดการ State ที่ใช้สลับหน้าออก (เช่น `activeTab` และ Conditional Rendering แบบ Manual).
    *   ใช้ `<Routes>` และ `<Route>` เพื่อกำหนด Path ให้กับแต่ละ Page Component ใน `src/pages/`.
    *   ตัวอย่าง: `<Route path="/" element={<Dashboard />} />`, `<Route path="/login" element={<Login />} />`.
4.  **ปรับปรุง Navigation Components:**
    *   แก้ไข `Navbar` หรือ `Sidebar` ให้ใช้ `<Link>` หรือ `<NavLink>` แทนการเรียก `onClick` เพื่อเปลี่ยน State.

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
*   ผู้ใช้สามารถเข้าถึงหน้าต่างๆ ผ่าน URL ได้.
*   โค้ดเดิมที่ใช้จัดการ `activeTab` สำหรับสลับหน้าถูกลบออกไป.
