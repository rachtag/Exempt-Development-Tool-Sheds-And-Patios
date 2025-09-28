# Logging of Assessment requests and results to SQLITE database

import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

class AssessmentDB:
    def __init__(self, db_path="assessments.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self._create_table()

    def _create_table(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                context TEXT,         -- 'Exempt', 'Non-Exempt', 'Invalid'
                input_json TEXT,      -- raw input parameters
                response_json TEXT    -- full backend response
            )
        """)
        self.conn.commit()

    def save_assessment(self, context, input_json, response_json):
        # Save the current time in AEST timezone
        aest_time = datetime.now(ZoneInfo("Australia/Sydney")).isoformat()

        self.cursor.execute("""
            INSERT INTO assessments (timestamp, context, input_json, response_json)
            VALUES (?, ?, ?, ?)
        """, (aest_time, context, input_json, response_json))
        self.conn.commit()

    def get_recent_assessments(self, limit=10):
        self.cursor.execute("""
            SELECT id, timestamp, context, input_json, response_json
            FROM assessments
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        return self.cursor.fetchall()
    
    def get_assessment_id(self, assessment_id=1):
        self.cursor.execute("""
            SELECT id, timestamp, context, input_json, response_json
            FROM assessments
            WHERE id = ?
        """, (assessment_id,))
        return self.cursor.fetchall()

    def clear_assessments(self):
        self.cursor.execute("DELETE FROM assessments")
        self.conn.commit()

    def close(self):
        self.cursor.close()
        self.conn.close()



