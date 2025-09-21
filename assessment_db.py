# Logging of Assessment requests and results to SQLITE database

import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

class AssessmentDB:
    def __init__(self, db_path="assessments.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self._create_table()
    # Old table structure before passing coordinates
    # def _create_table(self):
    #     self.cursor.execute("""
    #         CREATE TABLE IF NOT EXISTS assessments (
    #             id INTEGER PRIMARY KEY AUTOINCREMENT,
    #             timestamp TEXT,
    #             context TEXT,         -- 'Exempt', 'Non-Exempt', 'Invalid'}
    #             input_json TEXT,      -- raw input parameters
    #             response_json TEXT    -- full backend response
    #         )
    #     """)
    #    self.conn.commit()
      
    def _create_table(self):
        self.cursor.execute("""
          CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            context TEXT,         -- 'Exempt', 'Non-Exempt', 'Invalid'
            input_json TEXT,      -- raw input parameters
            response_json TEXT,   -- full backend response
            resolved_address TEXT,
            coordinate_x REAL,
            coordinate_y REAL
        )
    """)
        self.conn.commit()





    # # Old save_assessment method before passing coordinates
    # def save_assessment(self, context, input_json, response_json):
    #     # Save the current time in AEST timezone
    #     aest_time = datetime.now(ZoneInfo("Australia/Sydney")).isoformat()

    #     self.cursor.execute("""
    #         INSERT INTO assessments (timestamp, context, input_json, response_json)
    #         VALUES (?, ?, ?, ?)
    #     """, (aest_time, context, input_json, response_json))
    #     self.conn.commit()
    


    def save_assessment(self, context, input_json, response_json,
                    resolved_address=None, coordinate_x=None, coordinate_y=None):
        aest_time = datetime.now(ZoneInfo("Australia/Sydney")).isoformat()

        self.cursor.execute("""
             INSERT INTO assessments (timestamp, context, input_json, response_json, resolved_address, coordinate_x, coordinate_y)
             VALUES (?, ?, ?, ?, ?, ?, ?)
           """, (aest_time, context, input_json, response_json, resolved_address, coordinate_x, coordinate_y))
        self.conn.commit()





    def get_recent_assessments(self, limit=10):
        self.cursor.execute("""
            SELECT timestamp, context, input_json, response_json
            FROM assessments
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        return self.cursor.fetchall()

    def close(self):
        self.cursor.close()
        self.conn.close()



