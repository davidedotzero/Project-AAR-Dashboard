# T14: ตรวจสอบและแก้ไข `isOperating`/`isLoading` State ที่ไม่ทำงาน

## 1. ปัญหา (Problem Statement)

State ที่ใช้ควบคุมสถานะ "กำลังทำงาน" (อาจจะชื่อ `isOperating` หรือ `isLoading`) ไม่แสดงผลบน UI ตามที่คาดหวัง เมื่อผู้ใช้ทำการกดปุ่ม "บันทึก", "สร้าง", หรือ "แก้ไข" ข้อมูล ซึ่งเป็นการกระทำที่เรียกใช้ Asynchronous API Call

**พฤติกรรมที่เกิดขึ้นจริง (Actual Behavior):**
เมื่อผู้ใช้คลิกปุ่ม ไม่มี Action ที่แสดงให้เห็นว่าระบบกำลังประมวลผล (เช่น ปุ่มไม่ถูก disable, ไม่มี Spinner, ข้อความบนปุ่มไม่เปลี่ยนแปลง) ทำให้ผู้ใช้อาจสับสนและกดปุ่มซ้ำซ้อน

**พฤติกรรมที่คาดหวัง (Expected Behavior):**
เมื่อมีการเรียก API, UI ควรจะเข้าสู่ Loading State ทันที และกลับสู่สถานะปกติเมื่อการทำงานนั้นเสร็จสิ้น

## 2. เป้าหมาย (Goal)

1.  **วิเคราะห์และระบุสาเหตุ (Root Cause Analysis):** ค้นหาว่าทำไม `isOperating` State ถึงไม่ถูกนำไปใช้แสดงผลบน UI อย่างถูกต้อง
2.  **แก้ไขปัญหา (Implementation):** ปรับปรุงโค้ดเพื่อให้ UI ตอบสนองต่อ Loading State อย่างถูกต้องและสม่ำเสมอในทุกๆ Modal หรือ Form ที่มีการทำงานแบบ Asynchronous

## 3. ขั้นตอนการตรวจสอบและดำเนินงาน (Investigation & Implementation Steps)

### 3.1. การตรวจสอบ Logic การจัดการ State

* [ ] **ตรวจสอบฟังก์ชันที่เรียก API:**
    * ในไฟล์ Modal หรือ Context ที่เกี่ยวข้อง ให้ไปที่ฟังก์ชันที่ทำการ `await` API call (เช่น `handleSubmit`, `handleSave`)
    * ใช้ `console.log()` เพื่อตรวจสอบค่าของ `isOperating` ก่อนและหลังการเรียก API
        ```javascript
        const handleSave = async (data) => {
          console.log('Before API call, isOperating =', isOperating); // ควรจะเป็น false
          setIsOperating(true);
          console.log('Starting API call, isOperating =', isOperating); // ควรจะเป็น true
          try {
            await api.saveData(data);
          } catch (error) {
            console.error(error);
          } finally {
            setIsOperating(false);
            console.log('API call finished, isOperating =', isOperating); // ควรจะเป็น false
          }
        };
        ```
    * ตรวจสอบให้แน่ใจว่า `setIsOperating(false)` ถูกเรียกใช้ใน `finally` block เสมอ เพื่อจัดการทั้งกรณีที่สำเร็จและล้มเหลว

### 3.2. การตรวจสอบการผูก State กับ UI (UI Binding)

* [ ] **ตรวจสอบ Props ที่ส่งให้ Component:**
    * หาก `isOperating` ถูกจัดการใน Context หรือ Component แม่ (Parent), ตรวจสอบว่า Prop นี้ได้ถูกส่งต่อไปยัง Modal Component อย่างถูกต้องหรือไม่

* [ ] **ตรวจสอบโค้ดในส่วน JSX:**
    * ในไฟล์ Modal (`.tsx`) ให้ตรวจสอบว่ามีการนำ State `isOperating` ไปใช้ในการกำหนดเงื่อนไข (Conditional Rendering) หรือไม่
    * **ตัวอย่างที่ต้องตรวจสอบ:**
        * **ปุ่มถูก Disable หรือไม่:**
          ```jsx
          <button type="submit" disabled={isOperating}>
            {isOperating ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          ```
        * **ฟอร์ม Input ถูก Disable หรือไม่:**
          ```jsx
          <input type="text" disabled={isOperating} />
          ```
        * **มีการแสดง Spinner หรือไม่:**
          ```jsx
          {isOperating && <Spinner />}
          ```

### 3.3. การแก้ไขและปรับปรุง

* [ ] **แก้ไข Logic:** หากพบว่าปัญหาอยู่ที่ Logic การตั้งค่า State ให้แก้ไขโดยใช้ `try...catch...finally` pattern ที่ถูกต้อง
* [ ] **แก้ไข UI:** หากพบว่าปัญหาอยู่ที่การผูก State กับ UI ให้เพิ่มโค้ดที่จำเป็น (เช่น `disabled={isOperating}`) เข้าไปใน JSX
* [ ] **Refactor (ถ้าจำเป็น):** หากพบว่าโค้ดจัดการ Loading State ซ้ำซ้อนกันในหลายๆ ที่ อาจพิจารณาสร้าง Custom Hook (เช่น `useApiMutation`) เพื่อจัดการ Logic นี้จากส่วนกลาง

## 4. เกณฑ์การยอมรับ (Acceptance Criteria)

-   [ ] เมื่อคลิกปุ่มที่ทำให้เกิด API call (เช่น บันทึก, แก้ไข) UI จะต้องแสดงสถานะ Loading อย่างชัดเจน (เช่น ปุ่มถูก disable และข้อความเปลี่ยน)
-   [ ] เมื่อ API call ทำงานเสร็จสิ้น (ทั้งสำเร็จและล้มเหลว) UI จะต้องกลับสู่สถานะปกติทันที
-   [ ] พฤติกรรมนี้จะต้องเกิดขึ้นอย่างสม่ำเสมอในทุก Modal และ Form ที่เกี่ยวข้อง