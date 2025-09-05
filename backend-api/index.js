const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Project AAR Backend API is running!');
});

app.get('/api', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ status: 'success', message: 'Database connection is successful.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed.', error: error.message });
  }
});

// --- Project Routes ---

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await db.query('SELECT * FROM projects');
    res.json({ status: 'success', data: projects });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch projects.', error: error.message });
  }
});

// CREATE a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { projectId, projectName, details, priority } = req.body;
    if (!projectId || !projectName) {
      return res.status(400).json({ status: 'error', message: 'projectId and projectName are required.' });
    }
    const [result] = await db.query(
      'INSERT INTO projects (projectId, projectName, details, priority) VALUES (?, ?, ?, ?)',
      [projectId, projectName, details, priority]
    );
    res.status(201).json({ status: 'success', data: { id: result.insertId, projectId, projectName } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create project.', error: error.message });
  }
});

// UPDATE a project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, details, priority } = req.body;
    if (!projectName) {
      return res.status(400).json({ status: 'error', message: 'projectName is required.' });
    }
    const [result] = await db.query(
      'UPDATE projects SET projectName = ?, details = ?, priority = ? WHERE projectId = ?',
      [projectName, details, priority, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Project not found.' });
    }
    res.json({ status: 'success', data: { projectId: id, projectName } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update project.', error: error.message });
  }
});

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Also delete all tasks associated with the project
    await db.query('DELETE FROM tasks WHERE ProjectID = ?', [id]);
    const [result] = await db.query('DELETE FROM projects WHERE projectId = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Project not found.' });
    }
    res.json({ status: 'success', message: 'Project and associated tasks deleted successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete project.', error: error.message });
  }
});

// --- Task Routes ---

// GET all tasks or filter by projectId
app.get('/api/tasks', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = 'SELECT * FROM tasks';
    const params = [];
    if (projectId) {
      query += ' WHERE ProjectID = ?';
      params.push(projectId);
    }
    const [tasks] = await db.query(query, params);
    res.json({ status: 'success', data: tasks });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch tasks.', error: error.message });
  }
});

// CREATE a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { _id, ProjectID, Task, Owner } = req.body;
    if (!_id || !ProjectID || !Task || !Owner) {
      return res.status(400).json({ status: 'error', message: '_id, ProjectID, Task, and Owner are required.' });
    }
    const [result] = await db.query(
      'INSERT INTO tasks (_id, ProjectID, Task, Owner) VALUES (?, ?, ?, ?)',
      [_id, ProjectID, Task, Owner]
    );
    res.status(201).json({ status: 'success', data: { id: result.insertId, _id, Task } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create task.', error: error.message });
  }
});

// UPDATE a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ProjectID, Task, Owner, Status, Deadline } = req.body;
    // Add more fields to update as needed
    const [result] = await db.query(
      'UPDATE tasks SET ProjectID = ?, Task = ?, Owner = ?, Status = ?, Deadline = ? WHERE _id = ?',
      [ProjectID, Task, Owner, Status, Deadline, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Task not found.' });
    }
    res.json({ status: 'success', data: { _id: id, Task } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update task.', error: error.message });
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM tasks WHERE _id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Task not found.' });
    }
    res.json({ status: 'success', message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete task.', error: error.message });
  }
});

// --- User & Auth Routes ---

// Verify user by email
app.post('/api/users/verify', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required.' });
    }
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }
    res.json({ status: 'success', data: users[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify user.', error: error.message });
  }
});

// --- Notification Routes ---

// GET notifications for a user
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_email } = req.query;
    if (!user_email) {
      return res.status(400).json({ status: 'error', message: 'user_email is required.' });
    }

    // Get user name from email
    const [users] = await db.query('SELECT name FROM users WHERE email = ?', [user_email]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }
    const userName = users[0].name;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [tasks] = await db.query(
      `SELECT t.*, p.projectName 
       FROM tasks t 
       JOIN projects p ON t.ProjectID = p.projectId 
       WHERE (t.Owner = ? OR t.HelpAssignee = ?) 
         AND t.Status NOT IN ('Done', 'Cancelled') 
         AND ((t.Deadline BETWEEN NOW() AND ?) OR (t.["Created At"] >= ?))`, 
      [userName, userName, sevenDaysFromNow, sevenDaysAgo]
    );

    const notifications = tasks.map(task => {
      const deadline = new Date(task.Deadline);
      const now = new Date();
      let type = 'new_task';
      if (deadline >= now && deadline <= sevenDaysFromNow) {
        type = 'deadline';
      }
      return {
        type: type,
        taskName: task.Task,
        projectName: task.projectName,
        deadline: task.Deadline,
        createdAt: task["Created At"],
        _id: task._id
      };
    });

    res.json({ status: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications.', error: error.message });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
