-- T16: MySQL Database Schema
-- This schema is designed based on the analysis of the existing Google Apps Script and Google Sheets structure.

-- 1. Users Table
-- Stores user information and roles.
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50),
    name VARCHAR(255)
);

-- 2. Projects Table
-- Stores project information.
CREATE TABLE projects (
    projectId VARCHAR(255) PRIMARY KEY,
    projectName VARCHAR(255),
    details TEXT,
    priority INT
);

-- 3. Tasks Table
-- Stores task information.
CREATE TABLE tasks (
    _id VARCHAR(255) PRIMARY KEY,
    ProjectID VARCHAR(255),
    `Check ✅` BOOLEAN,
    Phase VARCHAR(100),
    Task VARCHAR(255),
    Owner VARCHAR(255),
    Deadline DATE,
    Status VARCHAR(100),
    `Est. Hours` FLOAT,
    `Impact Score` INT,
    `Notes / Result` TEXT,
    `Created At` DATETIME,
    Attachment VARCHAR(255),
    HelpAssignee VARCHAR(255),
    HelpRequestedAt DATETIME,
    FOREIGN KEY (ProjectID) REFERENCES projects(projectId)
);

-- 4. Activity Log Table
-- Logs user activities.
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    user_email VARCHAR(255),
    action VARCHAR(255)
);

-- 5. Task History Table
-- Logs changes to tasks.
CREATE TABLE task_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    task_id VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(255),
    details TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(_id)
);
