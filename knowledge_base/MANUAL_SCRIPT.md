
# คู่มือการใช้งาน Gemini CLI (MANUAL SCRIPT)

คู่มือนี้อธิบายขั้นตอนการใช้ Context Engineering และ Gemini CLI เพื่อพัฒนาโปรเจกต์อย่างเป็นระบบ โดยใช้กระบวนการ Plan-Review-Proceed (PRP) ช่วยให้คุณทำงานได้โดยไม่ต้องพึ่งพาการแชท (Deep Think).

## 1. โครงสร้างไฟล์ Context
*   **System Context (`GEMINI.md`):** (อยู่ที่ Root) กำหนดบทบาท AI และกฎเหล็ก.
*   **Knowledge Base (`knowledge_base/`):**
    *   `ARCHITECTURE.md`: แนวทางสถาปัตยกรรมเป้าหมาย.
    *   `STYLE_GUIDE.md`: มาตรฐานการเขียนโค้ด.
*   **Tasks (`tasks/`):** รายละเอียดของงานปัจจุบัน (เช่น `T1_implement_react_router.md`).
*   **Commands (`.gemini/commands/`):** คำสั่งที่เชื่อมโยง Context ทั้งหมดเข้าด้วยกัน และกำหนดขอบเขตไฟล์ที่เกี่ยวข้อง (Context Scoping).

## 2. ขั้นตอนการทำงานมาตรฐาน (Standard Workflow - PRP)

สำหรับทุกๆ งาน (Task) ให้ปฏิบัติตามขั้นตอนต่อไปนี้:

### ขั้นตอนที่ 1: เตรียมความพร้อม (Preparation)
1.  **ตรวจสอบ Branch หลัก:** ตรวจสอบให้แน่ใจว่าโค้ดล่าสุดอยู่บน Branch หลัก (main/master).
2.  **สร้าง Branch ใหม่:**
    ```bash
    git checkout -b feature/my-new-task
    ```

### ขั้นตอนที่ 2: สร้างแผนงาน (Generate Plan - Dry Run)
สั่งให้ CLI วิเคราะห์และสร้างแผนงาน (ยังไม่มีการแก้ไขไฟล์จริง).

**รูปแบบคำสั่ง:**
```bash
gemini generate --command [ชื่อคำสั่ง]
```

*ตัวอย่างการใช้งาน Task 1 (Router):*
```bash
gemini generate --command run_t1_router
```

### ขั้นตอนที่ 3: ตรวจสอบแผนงาน (Review)
**สำคัญที่สุด!** CLI จะสร้างแผนงานไว้ใน `.gemini/runs/[Timestamp ล่าสุด]/`.
1.  เปิดไฟล์ `plan.md` หรือไฟล์ Diff/Patch ในโฟลเดอร์นั้น.
2.  **ตรวจสอบอย่างละเอียด:**
    *   การเปลี่ยนแปลงถูกต้องตาม Task หรือไม่?
    *   สอดคล้องกับ Architecture และ Style Guide หรือไม่?
    *   มีการแก้ไขไฟล์ที่ไม่เกี่ยวข้องหรือไม่?
3.  **หากไม่ถูกต้อง:** ให้แก้ไขไฟล์ใน `tasks/` หรือ `knowledge_base/` หรือแก้ไข Context Scoping ใน `.gemini/commands/` แล้วกลับไปรันขั้นตอนที่ 2 ใหม่.

### ขั้นตอนที่ 4: ดำเนินการตามแผน (Execute)
หากแผนงานถูกต้อง ให้สั่ง CLI ดำเนินการแก้ไขไฟล์จริง.

```bash
gemini execute
```

### ขั้นตอนที่ 5: ตรวจสอบและทดสอบ (Verification)
1.  **ติดตั้ง Dependencies (ถ้ามี):** หาก Task มีการเพิ่ม Library ใหม่ (เช่น Task 1, 3, 5)
    ```bash
    npm install
    ```
2.  **ตรวจสอบการเปลี่ยนแปลง:**
    ```bash
    git status
    git diff
    ```
3.  **ทดสอบการทำงาน:**
    ```bash
    npm run dev
    # (หรือ npm test สำหรับ Task 5)
    ```

### ขั้นตอนที่ 6: สรุปงาน (Commit)
```bash
git add .
git commit -m "feat: Description of the task completed (e.g., T1: Implement Router)"
```

## 3. ลำดับการพัฒนาที่แนะนำ (Roadmap)

แนะนำให้ดำเนินการตามลำดับนี้ เนื่องจากแต่ละขั้นตอนเป็นพื้นฐานสำหรับขั้นถัดไป:

1.  **T1: React Router** (Command: `run_t1_router`) - จัดการโครงสร้างหลักและการนำทาง.
2.  **T2: Service Layer** (Command: `run_t2_services`) - จัดระเบียบ API ก่อนเปลี่ยนวิธีดึงข้อมูล.
3.  **T3: React Query** (Command: `run_t3_query`) - เปลี่ยนวิธีการจัดการ Server State.
4.  **T4: Component Structure** (Command: `run_t4_components`) - จัดระเบียบคอมโพเนนต์ในหน้าต่างๆ.
5.  **T5: Setup Testing** (Command: `run_t5_testing`) - ตั้งค่าสภาพแวดล้อมการทดสอบ.

## 4. การสร้าง Task ใหม่
หากต้องการสร้างงานใหม่:
1. สร้างไฟล์ Task ใหม่ใน `tasks/`.
2. สร้างไฟล์ Command ใหม่ใน `.gemini/commands/` โดยคัดลอกจาก Command ที่มีอยู่ และแก้ไขชื่อ Task และ Context Scoping ให้เหมาะสม.
3. ดำเนินการตาม Workflow ปกติ.
