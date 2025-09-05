# T17: สร้าง Backend API ใหม่เพื่อเชื่อมต่อกับฐานข้อมูล MySQL

## 1. เป้าหมาย (Goal)

พัฒนาและ Deploy Backend API ใหม่บนเซิร์ฟเวอร์ Plesk เพื่อทำหน้าที่เป็นตัวกลาง (Intermediary) ระหว่าง Frontend (React App) และฐานข้อมูล MySQL ที่ได้ทำการย้ายมาใหม่ API นี้จะเข้ามาทดแทนการทำงานทั้งหมดของ Google Apps Script เดิม เพื่อเพิ่มประสิทธิภาพ, ความเสถียร, และรองรับการขยายตัวในอนาคต

## 2. ภาพรวมสถาปัตยกรรม (Architecture Overview)

เรากำลังจะเปลี่ยนสถาปัตยกรรมของแอปพลิเคชันจากการพึ่งพา Google Ecosystem ไปสู่ Self-hosted Solution บน Plesk

**สถาปัตยกรรมเก่า:**
`React App ---> Google Apps Script (พ่อครัว) ---> Google Sheets (ตู้เสบียง)`

**สถาปัตยกรรมใหม่:**
`React App ---> [Backend API ที่จะสร้าง] (พ่อครัวคนใหม่) ---> MySQL Database (ตู้เสบียงใหม่)`

## 3. ขอบเขตและฟังก์ชันที่ต้องการ (Scope & Required Functionality)

API ใหม่จะต้องมี Endpoints สำหรับจัดการข้อมูลต่างๆ เพื่อทดแทนฟังก์ชันเดิมทั้งหมดเป็นอย่างน้อย ดังนี้:

* **Projects:**
    * `GET /api/projects`: ดึงข้อมูลโปรเจกต์ทั้งหมด
    * `POST /api/projects`: สร้างโปรเจกต์ใหม่
    * `PUT /api/projects/:id`: อัปเดตข้อมูลโปรเจกต์
    * `DELETE /api/projects/:id`: ลบโปรเจกต์

* **Tasks:**
    * `GET /api/tasks`: ดึงข้อมูล Task ทั้งหมด (อาจมี query param เช่น `?projectId=...` เพื่อกรอง)
    * `POST /api/tasks`: สร้าง Task ใหม่
    * `PUT /api/tasks/:id`: อัปเดต Task
    * `DELETE /api/tasks/:id`: ลบ Task

* **Users & Auth:**
    * `POST /api/users/verify`: ตรวจสอบข้อมูลผู้ใช้จากการล็อกอิน

* **Notifications:**
    * `GET /api/notifications`: ดึงข้อมูลการแจ้งเตือนสำหรับผู้ใช้ที่ล็อกอินอยู่

## 4. ข้อกำหนดทางเทคนิค (Technical Requirements)

* **Technology Stack:** **Node.js** + **Express.js**
* **Database Connection:** ต้องสามารถเชื่อมต่อกับฐานข้อมูล MySQL บน Plesk ได้อย่างเสถียร (แนะนำให้ใช้ Connection Pooling)
* **CORS:** ต้องเปิดใช้งาน CORS (Cross-Origin Resource Sharing) เพื่ออนุญาตให้ Request จาก React App (ที่รันบนคนละ Port หรือคนละ Domain) สามารถเข้าถึง API ได้
* **JSON Standard:** Request Body และ Response Body ทั้งหมดต้องอยู่ในรูปแบบ JSON ที่มีโครงสร้างสม่ำเสมอ เช่น
    * **Success:** `{ "status": "success", "data": [...] }`
    * **Error:** `{ "status": "error", "message": "Error description..." }`
* **Error Handling:** ต้องมีการจัดการ Error ที่ดี เช่น การใช้ `try...catch` ในทุกๆ Database query และส่ง Response ที่มีความหมายกลับไปให้ Frontend

## 5. ขั้นตอนการดำเนินงาน (Implementation Steps)

1.  **[ ] ตั้งค่าโปรเจกต์ Node.js:**
    * สร้างโฟลเดอร์โปรเจกต์บนเซิร์ฟเวอร์
    * `npm init` เพื่อสร้าง `package.json`
    * `npm install express mysql2 cors` เพื่อติดตั้ง Library ที่จำเป็น

2.  **[ ] สร้างโมดูลเชื่อมต่อฐานข้อมูล:**
    * สร้างไฟล์สำหรับจัดการการเชื่อมต่อ MySQL (Connection Pool)

3.  **[ ] พัฒนา API Endpoints:**
    * สร้างไฟล์หลัก (เช่น `index.js`) เพื่อตั้งค่า Express server และ Routes
    * ทยอยสร้าง Endpoint แต่ละตัวตาม Scope ที่กำหนดไว้ในข้อ 3

4.  **[ ] ทดสอบ API:**
    * ใช้เครื่องมือเช่น Postman หรือ Insomnia เพื่อทดสอบการทำงานของแต่ละ Endpoint ว่าสามารถทำ CRUD (Create, Read, Update, Delete) กับฐานข้อมูลได้ถูกต้อง

5.  **[ ] Deploy บน Plesk:**
    * ตั้งค่า Node.js App ใน Plesk ให้ชี้ไปยังโปรเจกต์ API
    * ตรวจสอบให้แน่ใจว่าแอปพลิเคชันทำงานได้อย่างต่อเนื่อง

## 6. เกณฑ์การยอมรับ (Acceptance Criteria)

-   [ ] Backend API ที่สร้างด้วย Node.js สามารถรันบนเซิร์ฟเวอร์ Plesk ได้
-   [ ] API Endpoints ทั้งหมดตามที่ระบุใน Scope สามารถทำงานได้ถูกต้อง
-   [ ] สามารถใช้ Postman หรือเครื่องมืออื่นทดสอบการ CRUD ข้อมูลในฐานข้อมูล MySQL ผ่าน API ได้สำเร็จ
-   [ ] Frontend สามารถเรียกใช้ API ได้โดยไม่ติดปัญหา CORS
-   [ ] มีการจัดการ Error และ Response ในรูปแบบที่เป็นมาตรฐาน