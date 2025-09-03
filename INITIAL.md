# บริบทงาน: การจัดโครงสร้างโปรเจกต์ Project-AAR-Dashboard

## 1. ภาพรวมโปรเจกต์ (Project Overview)
*   **Repository:** https://github.com/davidedotzero/Project-AAR-Dashboard.git
*   **Framework:** React + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Key Libraries:** @react-oauth/google, Recharts
*   **Integration:** Google Apps Script (GAS)

## 2. 🎯 เป้าหมายการ Refactor (Refactoring Goal)
จัดระเบียบโครงสร้างภายใน `src/` ใหม่ เพื่อแยกประเภทไฟล์ตามหน้าที่ (Pages, Components, Services) ให้ชัดเจน โดยไม่ส่งผลกระทบต่อการทำงานเดิมของแอปพลิเคชัน

## 3. 📂 วิเคราะห์โครงสร้างปัจจุบันและปัญหา (Current Structure Analysis)
โครงสร้างปัจจุบันมีปัญหาเรื่องการจัดเก็บไฟล์:
*   `src/components`: เก็บ Components ที่เป็นหน้าหลัก (Pages) ปะปนกับ Components ย่อย (Reusable Components) ทำให้โครงสร้างไม่ชัดเจน
*   `src/api`: ใช้จัดการ Services แต่ควรเปลี่ยนชื่อให้สื่อความหมายและเป็นมาตรฐานมากขึ้น

## 4. 🏗️ โครงสร้างเป้าหมาย (Target Structure)
ต้องการปรับโครงสร้างไฟล์ภายใน `src/` เป็นดังนี้ ไม่จำเป็นต้องเปลี่ยนชื่อตามนี้ (ปรับใช้กับ TypeScript):

```bash
/src
├── services/          # <--- เปลี่ยนชื่อจาก api/
│   ├── aarService.ts  # (ตัวอย่าง)
│   └── authService.ts # (ตัวอย่าง)
│
├── components/        # <--- เก็บเฉพาะ Reusable Components เท่านั้น
│   ├── AARdisplay/
│   ├── Navbar/
│   └── common/        # (ทางเลือก)
│
├── context/           # (คงเดิม) สำหรับ State Management
├── hooks/             # (คงเดิม) สำหรับ Custom Hooks
│
├── pages/             # <--- ย้าย Components ที่เป็นหน้าหลักมาที่นี่
│   ├── Dashboard/
│   │   └── Dashboard.tsx
│   ├── AdminPanel/
│   │   └── AdminPanel.tsx
│   ├── Login/
│   │   └── Login.tsx
│   ├── AARform/
│   │   └── AARform.tsx
│   └── Signup/
│       └── Signup.tsx
│
└── utils/             # (ถ้ามี) สำหรับฟังก์ชันช่วยเหลือทั่วไป
```

## 5. 📋 แผนการดำเนินงาน (Execution Plan)

ดำเนินการตามขั้นตอนต่อไปนี้อย่างเคร่งครัด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Services
1.  **เปลี่ยนชื่อโฟลเดอร์:** เปลี่ยนชื่อ `src/api` เป็น `src/services`

### ขั้นตอนที่ 2: ย้าย Page-Level Components
ย้าย Components ที่ทำหน้าที่เป็นหน้าหลักจาก `src/components` ไปยัง `src/pages` โดยสร้างโฟลเดอร์สำหรับแต่ละหน้า (ตรวจสอบนามสกุลไฟล์จริงใน Repo ว่าเป็น .tsx หรือ .ts และคงนามสกุลเดิมไว้ หากเป็น .js ให้เปลี่ยนเป็น .tsx):

1.  สร้างโฟลเดอร์ `src/pages` (หากยังไม่มี)
2.  ย้าย `src/components/AARform.*` -> `src/pages/AARform/AARform.tsx`
3.  ย้าย `src/components/AdminPanel.*` -> `src/pages/AdminPanel/AdminPanel.tsx`
4.  ย้าย `src/components/Dashboard.*` -> `src/pages/Dashboard/Dashboard.tsx`
5.  ย้าย `src/components/Login.*` -> `src/pages/Login/Login.tsx`
6.  ย้าย `src/components/Signup.*` -> `src/pages/Signup/Signup.tsx`

### ขั้นตอนที่ 3: ตรวจสอบ Components ที่เหลือ
1.  ตรวจสอบให้แน่ใจว่าใน `src/components` เหลือเพียง Components ที่สามารถนำไปใช้ซ้ำได้จริง (เช่น `AARdisplay`, `Navbar`)

### ขั้นตอนที่ 4: ปรับปรุง Import Paths (สำคัญที่สุด)
ค้นหาและแก้ไข `import` statements ทั้งหมดในโปรเจกต์ที่อ้างอิงถึงไฟล์ที่ถูกย้ายในขั้นตอนที่ 1 และ 2

1.  **แก้ไขการอ้างอิง Services:**
    *   ค้นหาการ import ทั้งหมดที่ใช้เส้นทาง `../api/` หรือ `./api/` และเปลี่ยนเป็น `../services/` หรือ `./services/`
2.  **แก้ไขการอ้างอิง Pages (โดยเฉพาะใน Router/App.tsx):**
    *   ตรวจสอบไฟล์ที่ทำการ Import หน้าหลักเหล่านี้
    *   *ตัวอย่างการเปลี่ยนแปลง:*
        *   **จาก:** `import Dashboard from './components/Dashboard';`
        *   **เป็น:** `import Dashboard from './pages/Dashboard/Dashboard';`

## 6. ข้อกำหนดในการ Commit (Commit Requirement)
เมื่อเสร็จสิ้น ให้ใช้ Commit Message ที่สื่อความหมายชัดเจน:
`"refactor: Reorganize project structure for pages, components, and services"`