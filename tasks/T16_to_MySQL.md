# T16: วางแผนการย้ายฐานข้อมูลจาก Google Sheets (GAS) ไปยัง MySQL

## 1. เป้าหมาย (Goal)

ย้ายฐานข้อมูลของแอปพลิเคชันจากระบบเดิมที่ใช้ Google Sheets เป็น Backend ผ่าน Google Apps Script (GAS) ไปยังระบบฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ที่มีความเสถียรและประสิทธิภาพสูงกว่า โดยใช้ MySQL ที่โฮสต์บน Plesk ผ่าน phpMyAdmin

**เหตุผลในการย้าย:**
* **Performance:** เพิ่มความเร็วในการอ่าน-เขียนข้อมูล สำหรับรองรับข้อมูลจำนวนมากและการใช้งานที่ซับซ้อนขึ้น
* **Scalability:** รองรับการขยายตัวของข้อมูลและจำนวนผู้ใช้ในอนาคตได้ดีกว่า
* **Data Integrity:** รักษาความถูกต้องของข้อมูลด้วย Relation, Constraints, และ Transaction
* **Security:** เพิ่มความปลอดภัยในการจัดการข้อมูลและการเข้าถึง

## 2. ขอบเขตของงาน (Scope of Work)

### Phase 1: การออกแบบและเตรียมการ (Design & Preparation)

* [ ] **(Design)** **วิเคราะห์และออกแบบ Schema:**
    * ตรวจสอบชีตทั้งหมดใน Google Sheets (เช่น `Tasks`, `Projects`, `Users`, `ActivityLog`)
    * ออกแบบ Database Schema สำหรับ MySQL โดยกำหนด Table, Column, Data Type, Primary Key, Foreign Key, และ Index ที่เหมาะสม
    * จัดทำเอกสาร ER Diagram (Entity-Relationship Diagram) เพื่อให้เห็นภาพรวมความสัมพันธ์ของข้อมูล

* [ ] **(Setup)** **ตั้งค่าสภาพแวดล้อม (Environment Setup):**
    * สร้างฐานข้อมูล MySQL ใหม่บน Plesk ผ่าน phpMyAdmin
    * สร้าง User และกำหนดสิทธิ์ (Permissions) สำหรับฐานข้อมูล
    * เตรียมข้อมูลการเชื่อมต่อ (Connection String) เช่น Host, Database Name, Username, Password

### Phase 2: การย้ายข้อมูล (Data Migration)

* [ ] **(Script)** **เขียนสคริปต์สำหรับ Export ข้อมูล:**
    * สร้างสคริปต์ (อาจจะใช้ GAS หรือ Python) เพื่อดึงข้อมูลทั้งหมดจาก Google Sheets
    * แปลงข้อมูลให้อยู่ในรูปแบบที่สามารถ Import เข้า MySQL ได้ง่าย (เช่น CSV หรือ SQL `INSERT` statements)

* [ ] **(Migration)** **นำเข้าข้อมูลไปยัง MySQL:**
    * Import ข้อมูลที่ได้จากขั้นตอนก่อนหน้าเข้าสู่ฐานข้อมูล MySQL ใหม่ผ่าน phpMyAdmin
    * ตรวจสอบความถูกต้องและความครบถ้วนของข้อมูลหลังการนำเข้า (Data Validation)

### Phase 3: การปรับปรุง Backend (Backend Refactoring)

* [ ] **(API)** **สร้าง Backend API ใหม่:**
    * เลือกภาษาและ Framework สำหรับสร้าง API ที่จะเชื่อมต่อกับ MySQL (เช่น Node.js + Express, Python + Flask, PHP)
    * พัฒนา API Endpoints ใหม่ทั้งหมดเพื่อทดแทนฟังก์ชันเดิมใน `API.gs` (เช่น `getProjects`, `updateTask`, `createTask`)
    * Implement Logic การเชื่อมต่อฐานข้อมูล (Database Connection) และการจัดการ Transaction

* [ ] **(Security)** **เพิ่มระบบ Authentication & Authorization:**
    * ออกแบบและ Implement ระบบยืนยันตัวตน (เช่น JWT - JSON Web Tokens)
    * กำหนดสิทธิ์การเข้าถึงข้อมูลในแต่ละ Endpoint ตาม Role ของผู้ใช้ (Admin, User)

### Phase 4: การเชื่อมต่อ Frontend และการทดสอบ (Frontend Integration & Testing)

* [ ] **(Frontend)** **ปรับปรุงโค้ด Frontend:**
    * แก้ไขไฟล์ `services/api.ts` (หรือไฟล์ที่เกี่ยวข้อง) ให้เรียกใช้ API Endpoints ใหม่แทนที่ URL ของ GAS เดิม
    * ปรับแก้โครงสร้างของข้อมูล (Data Structure) ที่รับ-ส่งให้ตรงกับที่ API ใหม่กำหนด

* [ ] **(Testing)** **ทดสอบระบบทั้งหมด (End-to-End Testing):**
    * ทดสอบทุกฟีเจอร์ของแอปพลิเคชันเพื่อให้แน่ใจว่าทำงานได้ถูกต้องกับฐานข้อมูลใหม่
    * ทดสอบเรื่อง Performance และ Security

## 3. เกณฑ์การยอมรับ (Acceptance Criteria)

-   [ ] แอปพลิเคชันสามารถทำงานได้ครบทุกฟีเจอร์โดยใช้ฐานข้อมูล MySQL ใหม่
-   [ ] ข้อมูลทั้งหมดจาก Google Sheets ถูกย้ายมายัง MySQL อย่างครบถ้วนและถูกต้อง
-   [ ] ระบบ API ใหม่มีความปลอดภัยและประสิทธิภาพที่ดี
-   [ ] การเชื่อมต่อระหว่าง Frontend และ Backend API ใหม่ทำงานได้อย่างสมบูรณ์