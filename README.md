<div align="center">
</div>

# Project AAR Dashboard

**Project AAR Dashboard** คือเว็บแอปพลิเคชันสำหรับบริหารจัดการและติดตามความคืบหน้าของโปรเจกต์ในรูปแบบเกมบริหารจัดการ (Management Game) ที่ได้รับแรงบันดาลใจจากเกมอย่าง Football Manager โดยใช้ Google Sheets เป็นฐานข้อมูลเบื้องหลัง ช่วยให้เห็นภาพรวมของงาน (Task), ประสิทธิภาพของทีม (Owner), และความเร่งด่วนของงานผ่าน Dashboard ที่สรุปผลแบบ After Action Review (AAR)

---
## 🚀 คู่มือการใช้งานเว็บแอปพลิเคชัน

### 1. ภาพรวม Dashboard (สรุปผล AAR)
แท็บแรกที่คุณจะเห็นคือหน้าสรุปผลการดำเนินงานทั้งหมด ประกอบด้วย:
* **คะแนนปฏิบัติการ (OPS):** ค่าเฉลี่ยคะแนนความสำคัญ (Impact Score) ของงานที่เสร็จสิ้นแล้ว
* **อัตราส่วนประสิทธิภาพ (EFF):** ประสิทธิภาพการทำงานโดยเทียบชั่วโมงที่ประเมิน (Est. Hours) กับชั่วโมงที่ใช้จริง (Actual Hours)
* **ประสิทธิภาพตรงต่อเวลา (OTP):** เปอร์เซ็นต์ของงานที่เสร็จสิ้นตรงเวลาหรือก่อนเวลา
* **กราฟสรุป:** แสดงภาพรวมสถานะของ Task ทั้งหมด และสัดส่วน Task ที่แต่ละทีมรับผิดชอบ


### 2. การจัดการ Task (รายการ Task)
แท็บนี้คือพื้นที่ทำงานหลักของคุณ สามารถจัดการ Task ทั้งหมดของโปรเจกต์ที่เลือกได้
* **การกรองข้อมูล:** ใช้ฟิลเตอร์ด้านบนเพื่อกรอง Task ตาม **Phase**, **Owner (ทีม)**, หรือ **Status**
* **การจัดกลุ่ม:** Task จะถูกจัดกลุ่มตาม Phase โดยอัตโนมัติ และคุณสามารถคลิกที่แถบสีของแต่ละ Phase เพื่อย่อ/ขยายรายการ Task ภายในกลุ่มได้
* **แจ้งเตือน Deadline:** คอลัมน์ Deadline จะแสดงผลเป็นป้ายสีเพื่อบอกความเร่งด่วนของงานที่ยังไม่เสร็จ:
    * **สีเขียว:** ยังมีเวลา (มากกว่า 3 วัน)
    * **สีเหลือง:** ใกล้ถึงกำหนด (0-3 วัน)
    * **สีแดง:** เกินกำหนดแล้ว
* **Actions:** ในแต่ละ Task จะมีปุ่มควบคุม 3 ปุ่ม:
    * 👁️ **ดูรายละเอียด (View):** เปิด Modal เพื่อดูข้อมูลทั้งหมดของ Task ในรูปแบบอ่านอย่างเดียว สามารถกดปุ่ม Arrow ◀️▶️ ที่ Header เพื่อเลื่อนดู Task ก่อนหน้าหรือถัดไปได้
    * ✏️ **แก้ไข (Edit):** เปิด Modal เพื่อแก้ไขข้อมูลของ Task
    * 🗑️ **ลบ (Delete):** เปิดหน้าต่างเพื่อยืนยันการลบ Task


### 3. การสร้างโปรเจกต์ใหม่
* คลิกปุ่ม **"+ สร้างโปรเจกต์ใหม่"** ที่ด้านล่างของ Sidebar
* หน้าต่าง Modal จะเปิดขึ้นมา ให้คุณกรอก **ชื่อโปรเจกต์**
* เลือก **ชุด Task เริ่มต้น** ที่ต้องการสำหรับโปรเจกต์ใหม่นี้ โดยสามารถ "เลือกทั้งหมด" หรือ "ล้างทั้งหมด" ได้
* กด "สร้างโปรเจกต์" ข้อมูลโปรเจกต์และ Task ที่คุณเลือกจะถูกบันทึกลงใน Google Sheet โดยอัตโนมัติ


### 4. การจัดการโปรเจกต์ (แท็บ โปรเจกต์)
แสดงรายการโปรเจกต์ทั้งหมดที่มีอยู่ในรูปแบบ Card คุณสามารถกดปุ่มถังขยะ 🗑️ เพื่อลบโปรเจกต์ได้ (การกระทำนี้จะลบ Task ทั้งหมดของโปรเจกต์นั้นด้วย)

---
## 🛠️ สำหรับนักพัฒนา (For Developers)

### การติดตั้งและใช้งาน (Local)
**สิ่งที่ต้องมี:** Node.js

1.  **Clone Repository:**
    ```bash
    git clone [your-repository-url]
    cd [your-repository-folder]
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **ตั้งค่า Environment:**
    * คัดลอกไฟล์ `.env.example` (ถ้ามี) เป็น `.env`
    * ตั้งค่า `GEMINI_API_KEY` (ถ้ามีการใช้งาน)
4.  **Run the App:**
    ```bash
    npm run dev
    ```
แอปพลิเคชันจะรันที่ `http://localhost:5173`

### การเชื่อมต่อกับ Google Apps Script
แอปพลิเคชันนี้ทำงานโดยการเรียก API ไปยัง Google Apps Script ที่ Deploy ไว้เป็น Web App
* **URL ของ API:** ถูกกำหนดไว้ในตัวแปร `SCRIPT_URL` ในไฟล์ `src/App.tsx`
* คุณต้องนำ URL ที่ได้จากการ Deploy Apps Script ของคุณมาใส่แทนที่ในตัวแปรนี้

### Database Migration to MySQL

Project is undergoing a database migration from Google Sheets to MySQL.

**Phase 1: Design & Preparation**
*   **Schema Design:** The new MySQL schema has been designed based on the existing data structure in Google Sheets. The schema is defined in the `mysql_schema.sql` file.

**Phase 2: Data Migration**
*   **Migration Script:** A Python script `migration.py` has been created to automate the data migration from Google Sheets to the MySQL database.

    **Requirements:**
    *   Python 3
    *   `requests` library: `pip install requests`
    *   `mysql-connector-python` library: `pip install mysql-connector-python`

    **How to run:**
    1.  Open the `migration.py` file.
    2.  Replace the placeholder `ADMIN_EMAIL = "admin@example.com"` with an email address of a user who has 'admin' role in the application.
    3.  Run the script from your terminal: `python migration.py`

**Phase 3: Backend Refactoring**
*   **Backend API:** A new backend API has been developed using Node.js and Express.js. The code is in the `backend-api` directory.

### Backend API

The backend API is built with Node.js and Express.js and connects to the MySQL database.

**How to run:**
1.  Navigate to the `backend-api` directory:
    ```bash
    cd backend-api
    ```
2.  Start the server:
    ```bash
    node index.js
    ```
3.  The API will be running at `http://localhost:3000`.
93v4O~q7i