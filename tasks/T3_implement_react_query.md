
# T3: ติดตั้งและใช้งาน React Query สำหรับ Server State

## 1. เป้าหมาย
ปรับปรุงการดึงข้อมูล (Data Fetching) และการจัดการ State ที่มาจาก Server โดยใช้ `@tanstack/react-query` เพื่อลดความซับซ้อนและแทนที่การจัดการแบบ Manual ใน React Context (เช่น DataContext).

## 2. ขั้นตอนการดำเนินงาน
1.  **ติดตั้ง Library:** เพิ่ม `@tanstack/react-query` ใน `package.json`.
2.  **ตั้งค่า Provider:** ใน `main.tsx` (หรือ entry point):
    *   สร้าง `QueryClient` instance.
    *   ห่อหุ้มแอปพลิเคชันด้วย `<QueryClientProvider client={queryClient}>`.
3.  **สร้าง Custom Hooks:**
    *   สร้าง Hooks ใหม่ใน `src/hooks/` (เช่น `useAARs.ts`).
    *   ใช้ `useQuery` โดยอ้างอิงฟังก์ชันการดึงข้อมูลจาก Service ที่แยกไว้แล้ว (เช่น `aarService.ts`).
    *   ตัวอย่าง: `return useQuery({ queryKey: ['aars'], queryFn: aarService.fetchAARs });`
4.  **ปรับปรุง Components:**
    *   ใน Component ที่ใช้ข้อมูล (เช่น Dashboard), เปลี่ยนจากการใช้ `useContext(DataContext)` เป็น Custom Hook ใหม่ (เช่น `useAARs()`).
    *   จัดการแสดงผลตามสถานะ `isLoading`, `error`, `data` ที่ได้จาก Hook.
5.  **Refactor Context:**
    *   ลบ State และ Logic ที่เกี่ยวข้องกับการดึงข้อมูล (เช่น `isLoading`, `data`, `useEffect` สำหรับ Fetching) ออกจาก Context เดิม.

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)
*   การดึงข้อมูลหลักถูกย้ายไปใช้ `useQuery`.
*   Components แสดงสถานะ Loading/Error ที่จัดการโดย React Query.
*   DataContext ไม่มีการจัดการ Server State แล้ว.
