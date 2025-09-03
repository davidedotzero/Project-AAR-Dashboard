
# มาตรฐานการเขียนโค้ด (Style Guide) - React & TypeScript

## 1. การตั้งชื่อ (Naming Conventions)
*   **Components/Pages/Types/Interfaces:** PascalCase (เช่น `UserProfile.tsx`, `interface UserProps {}`)
*   **Functions/Hooks/Variables:** camelCase (เช่น `fetchUserData`, `useAuth`)
*   **Constants (Global):** UPPER_SNAKE_CASE (เช่น `API_BASE_URL`)

## 2. แนวทางการเขียน React
*   **Functional Components:** ใช้ Functional Components และ Hooks เสมอ.
*   **Props Definition:** กำหนด Interface หรือ Type สำหรับ Props เสมอ.

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// ใช้การ Destructuring สำหรับ Props
const Button = ({ label, onClick }: ButtonProps) => {
  // ...
};
```

## 3. แนวทางการเขียน TypeScript
*   **หลีกเลี่ยง `any`:** พยายามหลีกเลี่ยงการใช้ `any`. ใช้ `unknown` หากไม่ทราบประเภทข้อมูล และทำการตรวจสอบประเภทก่อนใช้งาน.
