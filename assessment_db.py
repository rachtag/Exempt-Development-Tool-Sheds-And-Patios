# Logging of Assessment requests and results to SQLITE database

import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

class AssessmentDB:
    def __init__(self, db_path="assessments.db"):
        # Connect to the SQLite database (or create it if it doesn't exist)
        self.conn = sqlite3.connect(db_path)
        # Create a cursor object to execute SQL commands
        self.cursor = self.conn.cursor()
        # Create the assessments table if it doesn't exist
        self._create_table()

    def _create_table(self):
        # Create the assessments table with the required fields
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                context TEXT,         -- 'Exempt', 'Non-Exempt', 'Invalid'
                input_json TEXT,      -- raw input parameters
                response_json TEXT    -- full backend response
            )
        """)
        # Commit the changes to the database
        self.conn.commit()

    def save_assessment(self, context, input_json, response_json):
        # Save the current time in AEST timezone
        aest_time = datetime.now(ZoneInfo("Australia/Sydney")).isoformat()

        # Insert the assessment record into the database
        self.cursor.execute("""
            INSERT INTO assessments (timestamp, context, input_json, response_json)
            VALUES (?, ?, ?, ?)
        """, (aest_time, context, input_json, response_json))
        # Commit the changes to the database
        self.conn.commit()

    def get_recent_assessments(self, limit=10):
        # Retrieve the most recent assessments up to the specified limit
        self.cursor.execute("""
            SELECT id, timestamp, context, input_json, response_json
            FROM assessments
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        return self.cursor.fetchall()
    
    def get_assessment_id(self, assessment_id=1):
        # Retrieve a specific assessment by its ID
        self.cursor.execute("""
            SELECT id, timestamp, context, input_json, response_json
            FROM assessments
            WHERE id = ?
        """, (assessment_id,))
        return self.cursor.fetchall()

    def clear_assessments(self):
        # Delete all records from the assessments table
        self.cursor.execute("DELETE FROM assessments")
        # Reset the auto-incrementing primary key
        self.cursor.execute("DELETE FROM sqlite_sequence WHERE name='assessments'")
        # Commit the changes
        self.conn.commit()

    def close(self):
        # Close the database connection
        self.cursor.close()
        self.conn.close()



