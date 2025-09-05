import requests
import mysql.connector
import json

# --- Configuration ---
# Provided by user
MYSQL_HOST = "thsv80.hostatom.com"
MYSQL_DATABASE = "preme_project_aar_db"
MYSQL_USER = "preme_aar_user"
MYSQL_PASSWORD = "93v4O~q7i"
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_J_JGwfufl2AY3J-0eQ2H8q8_1q3-IOwpaBm8_I_15RY1dUS5koxPPvsjHPkoy2mgZQ/exec"

# Needs to be provided by the user
ADMIN_EMAIL = "larron959@gmail.com" # <<< PLEASE REPLACE WITH A VALID ADMIN EMAIL

# --- Helper Functions ---

def api_request(operation, payload={}):
    """Makes a request to the Google Apps Script API."""
    headers = {"Content-Type": "text/plain;charset=utf-8"}
    data = {
        "op": operation,
        "user": {"email": ADMIN_EMAIL},
        "payload": payload
    }
    try:
        response = requests.post(SCRIPT_URL, headers=headers, data=json.dumps(data))
        response.raise_for_status() # Raise an exception for bad status codes
        result = response.json()
        if result.get('status') != 'success':
            raise Exception(f"API Error for operation '{operation}': {result.get('message')}")
        return result.get('data')
    except requests.exceptions.RequestException as e:
        print(f"Error calling API for operation '{operation}': {e}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from API for operation '{operation}'. Response: {response.text}")
        return None

def get_all_users():
    """Fetches all users by checking a list of potential users."""
    # Since there is no direct 'getUsers' endpoint, we have to be creative.
    # This is a placeholder. We will need to get the user list from the user or by other means.
    # For now, we will assume we can get it from the tasks and projects.
    print("Fetching users is not directly supported by the API, will derive from tasks and projects.")
    return []

# --- Main Migration Logic ---

def migrate_data():
    """Main function to perform the data migration."""
    db_connection = None
    try:
        # 1. Connect to MySQL
        print("Connecting to MySQL database...")
        db_connection = mysql.connector.connect(
            host=MYSQL_HOST,
            database=MYSQL_DATABASE,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        cursor = db_connection.cursor()
        print("MySQL connection successful.")

        # 2. Fetch data from Google Sheets
        print("Fetching data from Google Sheets...")
        projects = api_request("getProjects")
        tasks = api_request("getAllTasks")
        # users = get_all_users() # Placeholder

        if projects is None or tasks is None:
            print("Could not fetch data from Google Sheets. Aborting migration.")
            return

        print(f"Fetched {len(projects)} projects and {len(tasks)} tasks.")

        # 3. Insert data into MySQL
        print("Inserting data into MySQL...")

        # Insert Projects
        project_count = 0
        for project in projects:
            try:
                sql = "INSERT INTO projects (projectId, projectName, details, priority) VALUES (%s, %s, %s, %s)"
                val = (project.get('projectId'), project.get('projectName'), project.get('details'), project.get('priority'))
                cursor.execute(sql, val)
                project_count += 1
            except mysql.connector.Error as err:
                print(f"Error inserting project {project.get('projectId')}: {err}")
        print(f"Inserted {project_count} projects.")

        # Insert Tasks
        task_count = 0
        for task in tasks:
            try:
                # Convert empty strings for date fields to None
                deadline = task.get('Deadline') if task.get('Deadline') else None
                created_at = task.get('Created At') if task.get('Created At') else None
                help_requested_at = task.get('HelpRequestedAt') if task.get('HelpRequestedAt') else None

                sql = """INSERT INTO tasks (_id, ProjectID, `Check ✅`, Phase, Task, Owner, Deadline, Status, `Est. Hours`, `Impact Score`, `Notes / Result`, `Created At`, Attachment, HelpAssignee, HelpRequestedAt)
                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                val = (
                    task.get('_id'), task.get('ProjectID'), bool(task.get('Check ✅')),
                    task.get('Phase'), task.get('Task'), task.get('Owner'),
                    deadline, task.get('Status'), task.get('Est. Hours'),
                    task.get('Impact Score'), task.get('Notes / Result'), created_at,
                    task.get('Attachment'), task.get('HelpAssignee'), help_requested_at
                )
                cursor.execute(sql, val)
                task_count += 1
            except mysql.connector.Error as err:
                print(f"Error inserting task {task.get('_id')}: {err}")
        print(f"Inserted {task_count} tasks.")

        # We will skip users for now as we don't have a direct way to get them.

        db_connection.commit()
        print("Data migration completed successfully!")

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if db_connection and db_connection.is_connected():
            cursor.close()
            db_connection.close()
            print("MySQL connection closed.")

if __name__ == "__main__":
    if ADMIN_EMAIL == "admin@example.com":
        print("Please replace 'admin@example.com' with a real admin email in the script.")
    else:
        migrate_data()
