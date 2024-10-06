// static/js/script.js

document.addEventListener('DOMContentLoaded', function() {
    loadSeats();

    // Handle Booking Form Submission
    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const numSeatsInput = document.getElementById('numSeats');
        const numberOfSeats = parseInt(numSeatsInput.value);
        bookSeats(numberOfSeats);
    });

    // Handle Reset Form Submission
    const resetForm = document.getElementById('resetForm');
    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const resetKeyInput = document.getElementById('resetKey');
        const resetKey = resetKeyInput.value;
        resetDatabase(resetKey);
    });
});

function loadSeats() {
    fetch('/api/seats')
        .then(response => response.json())
        .then(data => {
            renderSeatMap(data);
            initializeTooltips();
        })
        .catch(error => {
            console.error('Error fetching seats:', error);
            showError('Unable to load seat map. Please try again later.');
        });
}

function renderSeatMap(seats) {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = ''; // Clear existing seats

    const totalRows = 12;
    const seatsPerRow = 7;
    const lastRowSeats = 3;

    for (let row = 1; row <= totalRows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');

        let seatsInRow = [];
        if (row === totalRows) {
            // Last row with 3 seats
            seatsInRow = seats.slice((row -1)*seatsPerRow, (row -1)*seatsPerRow + lastRowSeats);
        } else {
            seatsInRow = seats.slice((row -1)*seatsPerRow, row * seatsPerRow);
        }

        seatsInRow.forEach(seat => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat');

            const seatSpan = document.createElement('span');
            seatSpan.classList.add('seat-number');
            seatSpan.textContent = seat.seat_number;

            if (seat.is_booked) {
                seatSpan.classList.add('booked');
                seatSpan.setAttribute('title', `Seat ${seat.seat_number} is booked`);
                seatSpan.setAttribute('data-bs-toggle', 'tooltip');
            } else {
                seatSpan.classList.add('available');
                seatSpan.setAttribute('title', `Seat ${seat.seat_number} is available`);
                seatSpan.setAttribute('data-bs-toggle', 'tooltip');
                // Optional: Add click event for future enhancements (e.g., selecting seats)
                // seatSpan.addEventListener('click', () => selectSeat(seat.seat_number));
            }

            seatDiv.appendChild(seatSpan);
            rowDiv.appendChild(seatDiv);
        });

        seatMap.appendChild(rowDiv);
    }
}

function initializeTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function bookSeats(numberOfSeats) {
    // Reset messages
    document.getElementById('bookedSeats').classList.add('d-none');
    document.getElementById('error').classList.add('d-none');
    document.getElementById('error').querySelector('p').textContent = '';
    document.getElementById('resetConfirmation').classList.add('d-none');

    if (isNaN(numberOfSeats) || numberOfSeats < 1 || numberOfSeats > 7) {
        showError('Please enter a valid number of seats (1-7).');
        return;
    }

    fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number_of_seats: numberOfSeats })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200) {
            // Success
            document.getElementById('bookedSeatsList').textContent = result.body.booked_seats.join(', ');
            document.getElementById('bookedSeats').classList.remove('d-none');
            loadSeats(); // Refresh seat map
        } else {
            // Error
            showError(result.body.error);
        }
    })
    .catch(error => {
        console.error('Error booking seats:', error);
        showError('An unexpected error occurred.');
    });
}

function resetDatabase(secretKey) {
    // Reset messages
    document.getElementById('bookedSeats').classList.add('d-none');
    document.getElementById('error').classList.add('d-none');
    document.getElementById('error').querySelector('p').textContent = '';
    document.getElementById('resetConfirmation').classList.add('d-none');

    if (!secretKey) {
        showError('Please enter the reset key.');
        return;
    }

    fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret_key: secretKey })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(result => {
        if (result.status === 200) {
            // Success
            document.getElementById('resetConfirmation').classList.remove('d-none');
            loadSeats(); // Refresh seat map
        } else {
            // Error
            showError(result.body.error);
        }
    })
    .catch(error => {
        console.error('Error resetting database:', error);
        showError('An unexpected error occurred.');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('d-none');
}

/* Optional: Future Enhancements for Seat Selection
function selectSeat(seatNumber) {
    // Implement seat selection logic
}
*/
