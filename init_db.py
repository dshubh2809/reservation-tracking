# init_db.py
import sqlite3

def initialize_database():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Create seats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seat_number INTEGER UNIQUE NOT NULL,
            is_booked BOOLEAN NOT NULL DEFAULT 0
        )
    ''')

    # Pre-booked seats
    pre_booked = [5, 12, 20, 33, 45, 60, 75]

    # Insert seats
    for seat in range(1, 81):
        is_booked = 1 if seat in pre_booked else 0
        cursor.execute('''
            INSERT OR IGNORE INTO seats (seat_number, is_booked)
            VALUES (?, ?)
        ''', (seat, is_booked))

    conn.commit()
    conn.close()
    print("Database initialized with seats 1 to 80.")

if __name__ == '__main__':
    initialize_database()
