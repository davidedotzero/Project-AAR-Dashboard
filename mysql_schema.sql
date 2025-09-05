-- T16: MySQL Database Schema (Revised with Best Practices)

-- 1. Users Table
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50),
    name VARCHAR(255)
);

-- 2. Projects Table
CREATE TABLE projects (
    -- ปรับเป็น VARCHAR(36) สำหรับ UUID และใช้ snake_case
    project_id VARCHAR(36) PRIMARY KEY,
    project_name VARCHAR(255),
    details TEXT,
    priority INT
);

-- 3. Tasks Table
CREATE TABLE tasks (
    task_id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    is_checked BOOLEAN,                 -- แทน Check ✅
    phase VARCHAR(100),
    task_description VARCHAR(255),      -- แทน Task
    deadline DATE,
    status VARCHAR(100),
    estimated_hours FLOAT,              -- แทน Est. Hours
    impact_score INT,                   -- แทน Impact Score
    notes TEXT,                         -- แทน Notes / Result
    created_at DATETIME,
    attachment_url VARCHAR(255),
    help_requested_at DATETIME,

    -- เปลี่ยนจาก Name เป็น Email สำหรับความสัมพันธ์
    owner_email VARCHAR(255),
    help_assignee_email VARCHAR(255),

    -- Foreign Keys
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (owner_email) REFERENCES users(email),
    FOREIGN KEY (help_assignee_email) REFERENCES users(email)
);

-- 4. Activity Log Table
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    user_email VARCHAR(255),
    action VARCHAR(255),
    -- เพิ่ม Foreign Key เพื่อ Data Integrity
    FOREIGN KEY (user_email) REFERENCES users(email)
);

-- 5. Task History Table
CREATE TABLE task_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    task_id VARCHAR(36),
    user_email VARCHAR(255),
    action VARCHAR(255),
    details TEXT,
    -- Foreign Keys
    FOREIGN KEY (task_id) REFERENCES tasks(task_id),
    FOREIGN KEY (user_email) REFERENCES users(email)
);