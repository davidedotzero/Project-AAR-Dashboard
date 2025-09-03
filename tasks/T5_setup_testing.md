
# T5: ตั้งค่าสภาพแวดล้อมการทดสอบ (Vitest & React Testing Library)

## 1. เป้าหมาย
สร้างโครงสร้างพื้นฐานสำหรับการเขียน Unit Tests และ Integration Tests สำหรับโปรเจกต์ Vite/React.

## 2. ขั้นตอนการดำเนินงาน
1.  **ติดตั้ง Libraries (Dev Dependencies):**
    `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
    (ตรวจสอบใน package.json และเพิ่มเฉพาะที่ยังไม่มี)
2.  **กำหนดค่า Vite:** แก้ไข `vite.config.ts` (หรือ .js):
    *   เพิ่ม `/// <reference types="vitest" />` ที่ด้านบนสุด (ถ้าเป็น .ts).
    *   เพิ่ม/แก้ไขการตั้งค่า `test` block:
        ```typescript
        test: {
          globals: true,
          environment: 'jsdom',
          setupFiles: './src/setupTests.ts',
        }
        ```
3.  **สร้างไฟล์ Setup:** สร้าง `src/setupTests.ts` (ถ้ายังไม่มี) และเพิ่ม `import '@testing-library/jest-dom';`.
4.  **เพิ่ม Test Scripts:** ใน `package.json`, เพิ่ม/แก้ไข script: `"test": "vitest"`.
5.  **เขียนตัวอย่าง Test:** สร้างไฟล์ทดสอบแรก เช่น `src/App.test.tsx` เพื่อยืนยันว่าสภาพแวดล้อมทำงานได้.

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
*   สามารถรัน `npm test` ได้โดยไม่มีข้อผิดพลาดการตั้งค่า.
*   Test ตัวอย่างแรกทำงานได้สำเร็จ.
