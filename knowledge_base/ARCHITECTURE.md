
# สถาปัตยกรรม Project-AAR-Dashboard (เป้าหมาย)

## 1. ภาพรวม (Overview)
โปรเจกต์พัฒนาด้วย React, Vite และ TypeScript โดยเชื่อมต่อกับ Google Apps Script (GAS) เป็น Backend.

## 2. Technology Stack เป้าหมาย
*   **Framework:** React (Functional Components, Hooks) + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM v6+ (ต้องใช้งาน)
*   **Testing:** Vitest + React Testing Library (ต้องใช้งาน)

## 3. โครงสร้างโปรเจกต์ (Target Structure)
/src
├── components/   # Reusable UI Components (Button, Modal, Navbar)
├── hooks/        # Custom Hooks (รวมถึง React Query Hooks)
├── pages/        # Screen-level Components (เชื่อมโยงกับ Routes)
│   ├── Dashboard/
│   │   ├── components/ # Page-specific components (Colocation)
│   │   └── Dashboard.tsx
├── services/     # API interactions (GAS), แยกตาม Domain
│   ├── aarService.ts
│   └── authService.ts
├── utils/
└── App.tsx       # Router config, Providers

## 4. หลักการสำคัญ (Key Principles)

### 4.1. Routing
ใช้ **React Router DOM** เท่านั้นในการจัดการ Navigation ห้ามใช้ State (เช่น activeTab) ในการสลับหน้า.

### 4.2. การจัดการ State (State Management Strategy)
*   **Server State (ข้อมูลจาก API/GAS):** ใช้ **@tanstack/react-query** (React Query) เท่านั้น. การดึงข้อมูลต้องทำผ่าน Custom Hooks ใน `src/hooks/`. ห้ามเก็บ Server State ใน React Context.
*   **Client/UI State (เช่น Auth, Theme, Modal):** ใช้ React Context หรือพิจารณา **Zustand** หากซับซ้อนขึ้น.

### 4.3. โครงสร้างคอมโพเนนต์ (Component Colocation)
คอมโพเนนต์ที่ใช้เฉพาะในหน้าใดหน้าหนึ่ง ต้องอยู่ในโฟลเดอร์ `components` ภายในหน้านั้น (Self-contained).

### 4.4. Service Layer
แยกไฟล์ Service ตาม Domain อย่างชัดเจน.
