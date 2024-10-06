# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/seats', methods=['GET'])
def get_seats():
    conn = get_db_connection()
    seats = conn.execute('SELECT * FROM seats ORDER BY seat_number').fetchall()
    conn.close()
    seat_list = [{'seat_number': seat['seat_number'], 'is_booked': bool(seat['is_booked'])} for seat in seats]
    return jsonify(seat_list)

@app.route('/api/book', methods=['POST'])
def book_seats():
    data = request.get_json()
    number_of_seats = data.get('number_of_seats')

    if not isinstance(number_of_seats, int) or not (1 <= number_of_seats <= 7):
        return jsonify({'error': 'Invalid number of seats. You can book between 1 to 7 seats at a time.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Booking logic remains the same
    total_rows = 12
    seats_per_row = 7
    last_row_seats = 3
    booked_seats = []

    for row in range(1, total_rows + 1):
        if row == total_rows:
            # Last row with 3 seats
            start = (row - 1) * seats_per_row
            end = start + last_row_seats
        else:
            start = (row - 1) * seats_per_row
            end = start + seats_per_row

        cursor.execute('''
            SELECT seat_number FROM seats
            WHERE seat_number BETWEEN ? AND ? AND is_booked = 0
            ORDER BY seat_number
        ''', (start + 1, end))
        available = cursor.fetchall()

        if len(available) >= number_of_seats:
            # Book the first 'number_of_seats' available in this row
            seats_to_book = [seat['seat_number'] for seat in available[:number_of_seats]]
            cursor.executemany('''
                UPDATE seats SET is_booked = 1 WHERE seat_number = ?
            ''', [(seat,) for seat in seats_to_book])
            booked_seats.extend(seats_to_book)
            conn.commit()
            conn.close()
            return jsonify({'booked_seats': booked_seats}), 200

    # If no single row has enough seats, find nearby seats
    cursor.execute('''
        SELECT seat_number FROM seats
        WHERE is_booked = 0
        ORDER BY seat_number
        LIMIT ?
    ''', (number_of_seats,))
    available = cursor.fetchall()

    if len(available) >= number_of_seats:
        seats_to_book = [seat['seat_number'] for seat in available[:number_of_seats]]
        cursor.executemany('''
            UPDATE seats SET is_booked = 1 WHERE seat_number = ?
        ''', [(seat,) for seat in seats_to_book])
        booked_seats.extend(seats_to_book)
        conn.commit()
        conn.close()
        return jsonify({'booked_seats': booked_seats}), 200

    # Not enough seats available
    conn.close()
    return jsonify({'error': 'Not enough seats available to fulfill your request.'}), 400

@app.route('/api/reset', methods=['POST'])
def reset_seats():
    """
    Reset all seat bookings to available.
    This endpoint should be secured using a secret key.
    """
    data = request.get_json()
    secret_key = data.get('secret_key')

    # Replace 'YOUR_SECRET_KEY' with an actual secret key
    if secret_key != os.environ.get('RESET_SECRET_KEY'):
        return jsonify({'error': 'Unauthorized access.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE seats SET is_booked = 0')
    conn.commit()
    conn.close()
    return jsonify({'message': 'All seats have been reset to available.'}), 200

if __name__ == '__main__':
    app.run(debug=True)
