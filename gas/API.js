// API.gs (Clean Code - ไม่มี Comment)

const UPLOAD_FOLDER_ID = '1nM-gVlXFbhN1PRsNp7J1A_6TE3yCP6jz';
const ATTACHMENT_COLUMN_NAME = 'Attachment';
const TASK_ID_COLUMN_NAME = '_id';
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
const HISTORY_SHEET_NAME = 'TaskHistory';

function normalizeString(str) {
  return str ? String(str).toLowerCase().trim() : null;
}

function hasPermission(user, ownerName) {
  if (!user) return false;
  if (normalizeString(user.role) === 'admin') {
    return true;
  }
  if (ownerName && normalizeString(user.name) === normalizeString(ownerName)) {
    return true;
  }
  return false;
}

function doGet(e) {
  const response = { status: 'success', message: 'API Service is running. Please use POST requests.' };
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { op, user } = request;
    const payload = request.payload;

    let verifiedUser = null;
    if (op !== 'verifyUserByEmail' && user && user.email) {
      verifiedUser = verifyUserByEmail_API(user.email);
    }

    const publicOps = ['verifyUserByEmail', 'getInitialTasks'];
    if (!publicOps.includes(op) && !verifiedUser) {
      logActivity((user && user.email) ? user.email : 'Guest', `Unauthorized Access Attempt: ${op}`);
      return createJsonResponse({ status: 'error', message: 'Unauthorized: User session invalid or expired.' });
    }

    if (verifiedUser && op !== 'verifyUserByEmail') {
      logActivity(verifiedUser.email, `Operation: ${op}`);
    }

    let result;
    let message = 'Operation successful';

    switch (op) {
      case 'verifyUserByEmail':
        if (!payload || !payload.email) throw new Error("Email missing.");
        result = verifyUserByEmail_API(payload.email);
        if (!result) {
          return createJsonResponse({ status: 'success', message: 'User not found or access denied.', data: null });
        }
        break;

      case 'getProjects':
        result = getProjects_API(verifiedUser);
        break;

      case 'getTasks':
        if (!payload || !payload.projectId) throw new Error("projectId missing.");
        result = getTasks_API(payload.projectId, verifiedUser);
        break;

      case 'getAllTasks':
        result = getAllTasks_API(verifiedUser);
        break;

      case 'getInitialTasks':
        result = getInitialTasksAsObjects();
        break;
      
      // [✅ เพิ่มใหม่] API สำหรับดึงประวัติ Task
      case 'getTaskHistory':
        if (!payload || !payload.taskId) throw new Error("taskId missing.");
        result = getTaskHistory_API(payload.taskId, verifiedUser);
        break;

      case 'updateTask':
        if (!payload || !payload.task) throw new Error("Task data missing.");
        result = updateTask_API(payload.task, verifiedUser);
        message = 'Task updated successfully';
        break;

      case 'bulkUpdateTasks':
        if (!payload || !payload.taskIds || !payload.updates) throw new Error("Bulk update data missing.");
        result = bulkUpdateTasks_API(payload.taskIds, payload.updates, verifiedUser);
        message = `Successfully updated ${result.updatedCount} tasks.`;
        break;

      case 'updateProject':
        if (!payload || !payload.projectId || !payload.updatedData) throw new Error("Project update data missing.");
        result = updateProject_API(payload.projectId, payload.updatedData, verifiedUser);
        message = 'Project updated successfully';
        break;
      
      case 'deleteTask':
        if (!payload || payload.rowIndex == null) throw new Error("rowIndex missing.");
        result = deleteTask_API(payload.rowIndex, verifiedUser);
        message = 'Task deleted successfully';
        break;

      case 'deleteProject':
        if (!payload || !payload.projectId) throw new Error("projectId missing.");
        result = deleteProject_API(payload.projectId, verifiedUser);
        message = 'Project deleted successfully';
        break;
      
      case 'createNewProject':
        if (!payload || !payload.projectId || !payload.projectName) throw new Error("Project data missing.");
        result = createNewProject_API(payload.projectId, payload.projectName, payload.priority, payload.selectedTasks, verifiedUser);
        message = 'Project created successfully';
        break;

      case 'createTask':
        if (!payload || !payload.taskData) throw new Error("Task data missing.");
        result = createTask_API(payload.taskData, verifiedUser);
        message = 'Task created successfully';
        break;
      
      case 'uploadFile':
        if (!payload) throw new Error("File data missing.");
        result = uploadFile_API(payload, verifiedUser);
        return createJsonResponse(result);

      case 'backfillTaskIds':
        result = backfillTaskIds();
        message = `Backfill complete. Updated ${result.updatedCount} tasks.`;
        break;

      default:
        throw new Error("Invalid operation specified: " + op);
    }

    return createJsonResponse({ status: 'success', message: message, data: result });

  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.toString() + ' Stack: ' + error.stack);
    const errorMessage = (error instanceof Error) ? error.message : 'An unexpected server error occurred.';
    return createJsonResponse({ status: 'error', message: errorMessage });
  }
}

function createJsonResponse(responseObject) {
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifyUserByEmail_API(email) {
  if (!email) return null;
  try {
    const usersSheet = SPREADSHEET.getSheetByName('Users');
    if (!usersSheet) return null;
    const data = usersSheet.getDataRange().getValues();
    data.shift();
    const normalizedEmail = normalizeString(email);
    for (const row of data) {
      if (normalizeString(row[0]) === normalizedEmail) {
        return { email: row[0], role: row[1], name: row[2] };
      }
    }
  } catch (err) {
    Logger.log('CRITICAL ERROR in verifyUserByEmail_API: ' + err.message);
  }
  return null;
}

function logActivity(userEmail, action) {
  try {
    const logSheet = SPREADSHEET.getSheetByName('ActivityLog');
    if (logSheet) {
      logSheet.appendRow([new Date(), userEmail, action]);
    }
  } catch(e) {
    Logger.log('Failed to log activity: ' + e.message);
  }
}


function logTaskHistory(taskId, userEmail, action, details) {
  if (!taskId || !userEmail || !action) return;
  try {
    let historySheet = SPREADSHEET.getSheetByName(HISTORY_SHEET_NAME);
    if (!historySheet) {
      historySheet = SPREADSHEET.insertSheet(HISTORY_SHEET_NAME);
      historySheet.appendRow(['Timestamp', 'TaskID', 'UserEmail', 'Action', 'Details']);
    }
    historySheet.appendRow([new Date(), taskId, userEmail, action, details || '']);
  } catch(e) {
    Logger.log('Failed to log task history: ' + e.message);
  }
}

function getAllTasks_API(user) {
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
  const allData = tasksSheet.getDataRange().getValues();
  const headers = allData.shift();
  const ownerColIndex = headers.indexOf('Owner');
  if (ownerColIndex === -1) return [];

  const mapRowToObject = (row, index) => {
    let taskObject = {};
    headers.forEach((header, i) => { taskObject[header] = row[i]; });
    taskObject['rowIndex'] = index + 2;
    return taskObject;
  };

  if (user && normalizeString(user.role) === 'admin') {
    return allData.map(mapRowToObject);
  }

  return allData
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => hasPermission(user, row[ownerColIndex]))
    .map(({ row, index }) => mapRowToObject(row, index));
}

function getProjects_API(user) {
    const projectsSheet = SPREADSHEET.getSheetByName('Projects');
    const lastRow = projectsSheet.getLastRow();
    if (lastRow < 2) return [];

    const projectData = projectsSheet.getRange('A2:D' + lastRow).getValues();
    const mapProjects = (data) => data.map(row => ({ projectId: row[0], projectName: row[1], details: row[2], priority: row[3] }));

    if (user && normalizeString(user.role) === 'admin') {
        return mapProjects(projectData);
    }

    const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
    const taskData = tasksSheet.getDataRange().getValues();
    const headers = taskData.shift();
    const ownerColIndex = headers.indexOf('Owner');
    
    const accessibleProjectIds = new Set();
    const normalizedUserName = user ? normalizeString(user.name) : null;

    if (normalizedUserName && ownerColIndex !== -1) {
        taskData.forEach(row => {
            if (normalizedUserName === normalizeString(row[ownerColIndex])) {
                accessibleProjectIds.add(row[0]);
            }
        });
    }

    const filteredProjectsData = projectData.filter(row => accessibleProjectIds.has(row[0]));
    return mapProjects(filteredProjectsData);
}

function getTasks_API(projectId, user) {
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
  const allData = tasksSheet.getDataRange().getValues();
  const headers = allData.shift();
  const ownerColIndex = headers.indexOf('Owner');
  if (ownerColIndex === -1) return [];

  const projectTasks = [];
  allData.forEach((row, index) => {
    if (row[0] === projectId) {
      if (hasPermission(user, row[ownerColIndex])) {
        let taskObject = {};
        headers.forEach((header, i) => { taskObject[header] = row[i]; });
        taskObject['rowIndex'] = index + 2;
        projectTasks.push(taskObject);
      }
    }
  });
  return projectTasks;
}

function getTaskHistory_API(taskId, user) {
  const historySheet = SPREADSHEET.getSheetByName(HISTORY_SHEET_NAME);
  if (!historySheet) return [];
  const allData = historySheet.getDataRange().getValues();
  const headers = allData.shift();

  if (headers.length < 2) return [];
  const taskIdColIndex = headers.indexOf('TaskID');
  if (taskIdColIndex === -1) return [];

  const history = [];
  allData.forEach(row => {
    if (String(row[taskIdColIndex]) === String(taskId)) {
      let entry = {};
      headers.forEach((header, i) => { entry[header] = row[i]; });
      history.push(entry);
    }
  });

  return history.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
}

function bulkUpdateTasks_API(taskIds, updates, user) {
    const sheet = SPREADSHEET.getSheetByName('Tasks');
    const dataRange = sheet.getDataRange();
    const allData = dataRange.getValues();
    const headers = allData[0];

    const idColIndex = headers.indexOf(TASK_ID_COLUMN_NAME);
    const ownerColIndex = headers.indexOf('Owner');
    
    const updateColIndices = {};
    if (updates.hasOwnProperty('Deadline')) {
        updateColIndices['Deadline'] = headers.indexOf('Deadline');
    }

    if (idColIndex === -1) throw new Error(`ID column '${TASK_ID_COLUMN_NAME}' not found.`);
    if (ownerColIndex === -1) throw new Error("'Owner' column not found.");

    const taskIdSet = new Set(taskIds.map(String));
    let updatedCount = 0;
    let dataModified = false;

    for (let i = 1; i < allData.length; i++) {
        const currentTaskId = String(allData[i][idColIndex]);
        if (taskIdSet.has(currentTaskId)) {
            const currentOwner = allData[i][ownerColIndex];
            if (!hasPermission(user, currentOwner)) {
                throw new Error(`Permission Denied to edit Task ID: ${currentTaskId}.`);
            }

            if (updates.hasOwnProperty('Deadline') && updateColIndices['Deadline'] > -1) {
                let newDeadline = updates.Deadline;
                const deadlineColIndex = updateColIndices['Deadline'];
                
                const oldValue = allData[i][deadlineColIndex] ? new Date(allData[i][deadlineColIndex]).toISOString().split('T')[0] : "";
                const newValue = newDeadline || "";

                if (newDeadline) {
                    newDeadline = new Date(newDeadline);
                    if (isNaN(newDeadline.getTime())) {
                        throw new Error(`Invalid Date format for Task ID ${currentTaskId}`);
                    }
                } else {
                    newDeadline = "";
                }
                
                allData[i][deadlineColIndex] = newDeadline;
                dataModified = true;

                if (oldValue !== newValue) {
                   logTaskHistory(currentTaskId, user.email, 'Bulk Update Deadline', `Changed from ${oldValue} to ${newValue}`);
                }
            }
            
            updatedCount++;
            taskIdSet.delete(currentTaskId);
        }
    }

    if (taskIdSet.size > 0) {
        Logger.log(`Warning: Could not find tasks: ${Array.from(taskIdSet).join(', ')}`);
    }

    if (dataModified) {
        dataRange.setValues(allData);
    }

    return { updatedCount: updatedCount };
}

function uploadFile_API(requestData, user) {
    const { rowIndex, fileData, mimeType, fileName } = requestData;
    if (!rowIndex || !fileData || !mimeType || !fileName) {
        return { status: 'error', message: "Incomplete file upload data" };
    }

    const sheet = SPREADSHEET.getSheetByName('Tasks');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const ownerColIndex = headers.indexOf('Owner') + 1;
    const attachmentColIndex = headers.indexOf(ATTACHMENT_COLUMN_NAME) + 1;

    if (attachmentColIndex === 0) return { status: 'error', message: `Column "${ATTACHMENT_COLUMN_NAME}" not found` };
    if (ownerColIndex === 0) return { status: 'error', message: "'Owner' column not found." };
    
    const currentOwner = sheet.getRange(rowIndex, ownerColIndex).getValue();
    if (!hasPermission(user, currentOwner)) {
        return { status: 'error', message: "Permission Denied to upload file for this task" };
    }

    try {
        const decodedData = Utilities.base64Decode(fileData.split(',')[1]);
        const blob = Utilities.newBlob(decodedData, mimeType, fileName);
        const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileUrl = file.getUrl();
        sheet.getRange(rowIndex, attachmentColIndex).setValue(fileUrl);
        return { status: 'success', message: 'File uploaded successfully', fileUrl: fileUrl };
    } catch (err) {
        Logger.log(err);
        return { status: 'error', message: 'Error during file upload: ' + err.message };
    }
}

function createTask_API(taskData, user) {
    if (!user) throw new Error("Permission Denied: Login required to create a task.");

    const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
    const headers = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];

    if (!headers.includes(TASK_ID_COLUMN_NAME)) {
        throw new Error(`Critical Configuration Error: '${TASK_ID_COLUMN_NAME}' column is missing in 'Tasks' sheet.`);
    }
    
    const newRowData = {
        'ProjectID': taskData.ProjectID || '',
        'Check ✅': false,
        'Phase': taskData.Phase || 'Backlog',
        'Task': taskData.Task || '',
        'Owner': taskData.Owner || '',
        'Deadline': (taskData.Deadline && !isNaN(new Date(taskData.Deadline).getTime())) ? new Date(taskData.Deadline) : null,
        'Status': taskData.Status || 'In Progress',
        'Est. Hours': taskData['Est. Hours'] || 8,
        'Impact Score': taskData['Impact Score'] || 3,
        'Notes / Result': taskData['Notes / Result'] || '',
    };

    let newId = Utilities.getUuid();
    newRowData[TASK_ID_COLUMN_NAME] = newId;

    const newRow = headers.map(header => newRowData.hasOwnProperty(header) ? newRowData[header] : (taskData[header] || null));
    tasksSheet.appendRow(newRow);

    logTaskHistory(newId, user.email, 'Create Task', `Task "${taskData.Task}" created.`);
    
    return { message: "Row appended successfully.", newId: newId };
}

function deleteTask_API(rowIndex, user) {
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
  if (!rowIndex || rowIndex < 2) throw new Error("Invalid rowIndex.");

  const headers = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];
  const ownerColIndex = headers.indexOf('Owner') + 1;

  if (ownerColIndex > 0) {
    const currentOwner = tasksSheet.getRange(rowIndex, ownerColIndex).getValue();
    if (!hasPermission(user, currentOwner)) {
      throw new Error("Permission Denied: You cannot delete this task.");
    }
  } else {
    throw new Error("Configuration Error: 'Owner' column not found.");
  }
  
  tasksSheet.deleteRow(rowIndex);
  return { deletedRow: rowIndex };
}

function updateProject_API(projectId, updatedData, user) {
    if (!user || normalizeString(user.role) !== 'admin') {
        throw new Error("Permission Denied: Only Admins can edit projects.");
    }
    const projectsSheet = SPREADSHEET.getSheetByName('Projects');
    const data = projectsSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === projectId) {
            const rowIndex = i + 1;
            if (updatedData.projectName !== undefined) projectsSheet.getRange(rowIndex, 2).setValue(updatedData.projectName);
            if (updatedData.priority !== undefined) projectsSheet.getRange(rowIndex, 4).setValue(updatedData.priority);
            return { projectId: projectId, updated: true };
        }
    }
    throw new Error("Project not found: " + projectId);
}

function deleteProject_API(projectId, user) {
  if (!user || normalizeString(user.role) !== 'admin') {
    throw new Error("Permission Denied: Only Admins can delete projects.");
  }

  const projectsSheet = SPREADSHEET.getSheetByName('Projects');
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');

  const taskData = tasksSheet.getDataRange().getValues();
  for (let i = taskData.length - 1; i >= 1; i--) {
    if (taskData[i][0] === projectId) tasksSheet.deleteRow(i + 1);
  }

  const projectData = projectsSheet.getDataRange().getValues();
  for (let i = projectData.length - 1; i >= 1; i--) {
    if (projectData[i][0] === projectId) projectsSheet.deleteRow(i + 1);
  }
  
  return { deletedProjectId: projectId };
}

function updateTask_API(taskData, user) {
    const sheet = SPREADSHEET.getSheetByName('Tasks');
    const rowIndex = taskData.rowIndex;
    if (!rowIndex || rowIndex < 2) throw new Error("Invalid rowIndex.");

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const ownerColIndex = headers.indexOf('Owner');
    if (ownerColIndex === -1) throw new Error("Configuration Error: 'Owner' column not found.");

    const currentRowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    const currentOwner = currentRowValues[ownerColIndex];
    if (!hasPermission(user, currentOwner)) {
        throw new Error("Permission Denied: You cannot edit this task.");
    }

    const oldValues = {};
    headers.forEach((header, index) => {
        oldValues[header.trim()] = currentRowValues[index];
    });
     if (oldValues['Check ✅'] !== undefined) {
        oldValues['Check'] = oldValues['Check ✅'];
    }

    const columnMap = {};
    headers.forEach((header, index) => {
        columnMap[header.trim()] = index + 1;
    });
    if (columnMap['Check ✅']) {
        columnMap['Check'] = columnMap['Check ✅'];
    }

    const taskId = taskData._id;

    for (var key in taskData) {
        if (taskData.hasOwnProperty(key) && columnMap.hasOwnProperty(key)) {
            let columnIndex = columnMap[key];
            let newValue = taskData[key];
            let oldValue = oldValues[key];
            
            if (key === 'Deadline' || key === 'HelpRequestedAt') {
                const oldDateStr = oldValue ? new Date(oldValue).toISOString().split('T')[0] : "";
                const newDateStr = newValue || "";
                 if (oldDateStr !== newDateStr) {
                    logTaskHistory(taskId, user.email, `Update ${key}`, `From: ${oldDateStr || 'none'} To: ${newDateStr || 'none'}`);
                }
                if (newValue && !isNaN(new Date(newValue).getTime())) {
                    newValue = new Date(newValue);
                }
            } else if (String(oldValue) !== String(newValue)) {
                logTaskHistory(taskId, user.email, `Update ${key}`, `From: "${oldValue}" To: "${newValue}"`);
            }

            sheet.getRange(rowIndex, columnIndex).setValue(newValue);
        }
    }
    return taskData;
}

function createNewProject_API(projectId, projectName, priority, selectedTasks, user) {
  if (!user) throw new Error("Permission Denied: Login required to create a project.");

  const projectsSheet = SPREADSHEET.getSheetByName('Projects');
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
  const headers = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];

  if (!headers.includes(TASK_ID_COLUMN_NAME)) {
      throw new Error(`Critical Configuration Error: '${TASK_ID_COLUMN_NAME}' column is missing in 'Tasks' sheet.`);
  }

  projectsSheet.appendRow([projectId, projectName, '', priority || 5]);

  if (!selectedTasks || selectedTasks.length === 0) {
    return { projectId, projectName, tasksAdded: 0 };
  }

  const newProjectTasks = selectedTasks.map(taskData => {
    const newRowData = {
      'ProjectID': projectId,
      'Check ✅': false,
      'Phase': taskData.Phase || 'Backlog',
      'Task': taskData.Task,
      'Owner': taskData.Owner,
      'Deadline': (taskData.Deadline && !isNaN(new Date(taskData.Deadline).getTime())) ? new Date(taskData.Deadline) : null,
      'Status': taskData.Status || 'In Progress',
      'Est. Hours': taskData['Est. Hours'] || 8,
      'Impact Score': taskData['Impact Score'] || 3,
      'Notes / Result': taskData['Notes / Result'] || '',
    };

    newRowData[TASK_ID_COLUMN_NAME] = Utilities.getUuid();

    return headers.map(header => newRowData.hasOwnProperty(header) ? newRowData[header] : (taskData[header] || null));
  });

  if (newProjectTasks.length > 0) {
    tasksSheet.getRange(
      tasksSheet.getLastRow() + 1, 1, newProjectTasks.length, newProjectTasks[0].length
    ).setValues(newProjectTasks);
  }
  
  return { projectId, projectName, tasksAdded: newProjectTasks.length };
}


if (typeof getInitialTasksAsObjects !== 'function') {
  function getInitialTasksAsObjects() { return []; }
}
if (typeof getInitialProjectData !== 'function') {
  function getInitialProjectData() { return []; }
}

function backfillTaskIds() {
  const tasksSheet = SPREADSHEET.getSheetByName('Tasks');
  const dataRange = tasksSheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  const idColIndex = headers.indexOf(TASK_ID_COLUMN_NAME);

  if (idColIndex === -1) {
    throw new Error(`'${TASK_ID_COLUMN_NAME}' column not found.`);
  }

  let updated = 0;
  for (let i = 1; i < values.length; i++) {
    if (!values[i][idColIndex]) {
      const newId = Utilities.getUuid();
      tasksSheet.getRange(i + 1, idColIndex + 1).setValue(newId);
      updated++;
    }
  }
  Logger.log(`Backfill complete. Updated ${updated} tasks.`);
  return { status: 'success', updatedCount: updated };
}