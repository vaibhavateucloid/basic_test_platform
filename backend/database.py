import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'sessions.db')

def init_database():
    """Initialize the SQLite database with required tables"""
    # Ensure data directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Create sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            candidate_name TEXT NOT NULL,
            candidate_email TEXT NOT NULL,
            exam_code TEXT,
            state TEXT NOT NULL DEFAULT 'not_started',
            created_at TEXT NOT NULL,
            started_at TEXT,
            submitted_at TEXT,
            duration_minutes INTEGER NOT NULL DEFAULT 120,
            ip_address TEXT,
            tab_switch_count INTEGER DEFAULT 0
        )
    ''')

    # Create submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS submissions (
            submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            mcq_answers TEXT,
            python_code TEXT,
            sql_answers TEXT,
            mcq_score INTEGER,
            python_score INTEGER,
            sql_score INTEGER,
            total_score INTEGER,
            python_results TEXT,
            submitted_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        )
    ''')

    # Create progress table for auto-save
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS session_progress (
            session_id TEXT PRIMARY KEY,
            mcq_answers TEXT,
            python_code TEXT,
            sql_answers TEXT,
            saved_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        )
    ''')

    # Create index for faster lookups
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_session_state ON sessions(state)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_session_email ON sessions(candidate_email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_progress_saved ON session_progress(saved_at)')

    conn.commit()
    conn.close()
    print(f"✓ Database initialized at {DATABASE_PATH}")


def get_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_session(candidate_name: str, candidate_email: str, exam_code: str = None,
                   ip_address: str = None, duration_minutes: int = 120) -> str:
    """Create a new session and return session_id"""
    session_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO sessions (session_id, candidate_name, candidate_email, exam_code,
                            state, created_at, ip_address, duration_minutes)
        VALUES (?, ?, ?, ?, 'not_started', ?, ?, ?)
    ''', (session_id, candidate_name, candidate_email, exam_code, created_at, ip_address, duration_minutes))

    conn.commit()
    conn.close()

    print(f"✓ Created session {session_id} for {candidate_name} ({candidate_email})")
    return session_id


def get_session(session_id: str) -> Optional[Dict]:
    """Get session details by session_id"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM sessions WHERE session_id = ?', (session_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def update_session_state(session_id: str, new_state: str) -> bool:
    """Update session state (not_started -> in_progress -> submitted)"""
    conn = get_connection()
    cursor = conn.cursor()

    timestamp_field = None
    if new_state == 'in_progress':
        timestamp_field = 'started_at'
    elif new_state == 'submitted':
        timestamp_field = 'submitted_at'

    if timestamp_field:
        cursor.execute(f'''
            UPDATE sessions
            SET state = ?, {timestamp_field} = ?
            WHERE session_id = ?
        ''', (new_state, datetime.now().isoformat(), session_id))
    else:
        cursor.execute('UPDATE sessions SET state = ? WHERE session_id = ?',
                      (new_state, session_id))

    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def update_tab_switches(session_id: str, count: int) -> bool:
    """Update tab switch count for a session"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('UPDATE sessions SET tab_switch_count = ? WHERE session_id = ?',
                  (count, session_id))

    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0


def is_session_expired(session: Dict) -> bool:
    """Check if session has expired based on duration"""
    if not session:
        return True

    created_at = datetime.fromisoformat(session['created_at'])
    duration = timedelta(minutes=session['duration_minutes'])
    expiry_time = created_at + duration

    return datetime.now() > expiry_time


def get_remaining_time(session: Dict) -> int:
    """Get remaining time in seconds"""
    if not session:
        return 0

    created_at = datetime.fromisoformat(session['created_at'])
    duration = timedelta(minutes=session['duration_minutes'])
    expiry_time = created_at + duration

    remaining = (expiry_time - datetime.now()).total_seconds()
    return max(0, int(remaining))


def save_submission(session_id: str, mcq_answers: dict, python_code: dict,
                   sql_answers: dict, mcq_score: int, python_score: int,
                   sql_score: int, total_score: int, python_results: dict = None) -> int:
    """Save submission and return submission_id"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO submissions (session_id, mcq_answers, python_code, sql_answers,
                                mcq_score, python_score, sql_score, total_score,
                                python_results, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session_id,
        json.dumps(mcq_answers),
        json.dumps(python_code),
        json.dumps(sql_answers),
        mcq_score,
        python_score,
        sql_score,
        total_score,
        json.dumps(python_results) if python_results else None,
        datetime.now().isoformat()
    ))

    submission_id = cursor.lastrowid
    conn.commit()
    conn.close()

    print(f"✓ Saved submission {submission_id} for session {session_id}")
    return submission_id


def get_submission(session_id: str) -> Optional[Dict]:
    """Get submission for a session"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM submissions WHERE session_id = ? ORDER BY submitted_at DESC LIMIT 1',
                  (session_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        submission = dict(row)
        # Parse JSON fields
        submission['mcq_answers'] = json.loads(submission['mcq_answers'])
        submission['python_code'] = json.loads(submission['python_code'])
        submission['sql_answers'] = json.loads(submission['sql_answers'])
        if submission['python_results']:
            submission['python_results'] = json.loads(submission['python_results'])
        return submission
    return None


def get_all_sessions(state_filter: str = None) -> List[Dict]:
    """Get all sessions, optionally filtered by state"""
    conn = get_connection()
    cursor = conn.cursor()

    if state_filter:
        cursor.execute('SELECT * FROM sessions WHERE state = ? ORDER BY created_at DESC',
                      (state_filter,))
    else:
        cursor.execute('SELECT * FROM sessions ORDER BY created_at DESC')

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_session_with_submission(session_id: str) -> Optional[Dict]:
    """Get session along with submission if exists"""
    session = get_session(session_id)
    if not session:
        return None

    submission = get_submission(session_id)
    session['submission'] = submission

    return session


def save_progress(session_id: str, mcq_answers: dict, python_code: dict, sql_answers: dict) -> bool:
    """
    Save or update progress for a session (auto-save)
    Uses REPLACE to upsert (insert or update if exists)
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            REPLACE INTO session_progress (session_id, mcq_answers, python_code, sql_answers, saved_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session_id,
            json.dumps(mcq_answers),
            json.dumps(python_code),
            json.dumps(sql_answers),
            datetime.now().isoformat()
        ))

        conn.commit()
        print(f"✓ Progress saved for session {session_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to save progress for session {session_id}: {e}")
        return False
    finally:
        conn.close()


def get_progress(session_id: str) -> Optional[Dict]:
    """Get saved progress for a session"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM session_progress WHERE session_id = ?', (session_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        progress = dict(row)
        # Parse JSON fields
        progress['mcq_answers'] = json.loads(progress['mcq_answers']) if progress['mcq_answers'] else {}
        progress['python_code'] = json.loads(progress['python_code']) if progress['python_code'] else {}
        progress['sql_answers'] = json.loads(progress['sql_answers']) if progress['sql_answers'] else {}
        return progress
    return None


# Initialize database on module import
init_database()
