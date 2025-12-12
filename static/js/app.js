// Hotel Management System - Main Application

class HotelManagementApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.data = {
            guests: [],
            rooms: [],
            bookings: []
        };
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupEventListeners();
        await this.loadDashboard();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').replace('#', '');
                this.navigateToPage(page);
            });
        });
    }

    setupEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                HotelUtils.ModalManager.hide(e.target.id);
            }
        });

        // Close modal with close button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    HotelUtils.ModalManager.hide(modal.id);
                }
            }
        });
    }

    async navigateToPage(page) {
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[href="#${page}"]`);
        if (activeLink) activeLink.classList.add('active');

        this.currentPage = page;

        const mainContent = document.getElementById('main-content');
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(10px)';
        mainContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Load page content
        switch (page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'guests':
                await this.loadGuestsPage();
                break;
            case 'rooms':
                await this.loadRoomsPage();
                break;
            case 'bookings':
                await this.loadBookingsPage();
                break;
        }

        // Trigger animation
        requestAnimationFrame(() => {
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        });
    }

    async loadDashboard() {
        try {
            HotelUtils.LoadingManager.show('main-content');

            const [guests, rooms, bookings] = await Promise.all([
                window.api.get('/guests'),
                window.api.get('/rooms'),
                window.api.get('/bookings')
            ]);

            this.data.guests = guests;
            this.data.rooms = rooms;
            this.data.bookings = bookings;

            const stats = this.calculateStats();

            document.getElementById('main-content').innerHTML = `
                <div class="dashboard">
                    <div class="card">
                        <div class="icon">👥</div>
                        <div class="number">${stats.totalGuests}</div>
                        <div class="label">Total Guests</div>
                    </div>
                    <div class="card">
                        <div class="icon">🏠</div>
                        <div class="number">${stats.totalRooms}</div>
                        <div class="label">Total Rooms</div>
                    </div>
                    <div class="card">
                        <div class="icon">✅</div>
                        <div class="number">${stats.availableRooms}</div>
                        <div class="label">Available Rooms</div>
                    </div>
                    <div class="card">
                        <div class="icon">📅</div>
                        <div class="number">${stats.activeBookings}</div>
                        <div class="label">Active Bookings</div>
                    </div>
                    <div class="card">
                        <div class="icon">💰</div>
                        <div class="number">${HotelUtils.CurrencyUtils.format(stats.totalRevenue)}</div>
                        <div class="label">Total Revenue</div>
                    </div>
                    <div class="card">
                        <div class="icon">📊</div>
                        <div class="number">${stats.occupancyRate}%</div>
                        <div class="label">Occupancy Rate</div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn" onclick="app.showGuestModal()">
                        <span>➕</span> Add Guest
                    </button>
                    <button class="btn btn-success" onclick="app.showRoomModal()">
                        <span>🏠</span> Add Room
                    </button>
                    <button class="btn btn-warning" onclick="app.showBookingModal()">
                        <span>📅</span> New Booking
                    </button>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h2>Recent Bookings</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.recentBookings.map(booking => `
                                <tr>
                                    <td>${booking.guest.name}</td>
                                    <td>${booking.room.room_number}</td>
                                    <td>${HotelUtils.DateUtils.formatDate(booking.check_in_date)}</td>
                                    <td>${HotelUtils.DateUtils.formatDate(booking.check_out_date)}</td>
                                    <td>
                                        <span class="status-badge status-${booking.status.replace('_', '-')}">
                                            ${booking.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>${HotelUtils.CurrencyUtils.format(booking.total_amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadGuestsPage() {
        try {
            HotelUtils.LoadingManager.show('main-content');

            const guests = await window.api.get('/guests');
            this.data.guests = guests;

            document.getElementById('main-content').innerHTML = `
                <div class="actions">
                    <button class="btn" onclick="app.showGuestModal()">
                        <span>➕</span> Add New Guest
                    </button>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h2>Guests</h2>
                        <span class="text-muted">${guests.length} total guests</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>ID Proof</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${guests.map(guest => `
                                <tr>
                                    <td>#${guest.id}</td>
                                    <td>
                                        <strong>${guest.name}</strong>
                                    </td>
                                    <td>${guest.email}</td>
                                    <td>${guest.phone}</td>
                                    <td>${guest.address || '-'}</td>
                                    <td>${guest.id_proof || '-'}</td>
                                    <td>${HotelUtils.DateUtils.formatDate(guest.created_at)}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn btn-sm btn-danger" onclick="app.deleteGuest(${guest.id})">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Error loading guests:', error);
        }
    }

    async loadRoomsPage() {
        try {
            HotelUtils.LoadingManager.show('main-content');

            const rooms = await window.api.get('/rooms');
            this.data.rooms = rooms;

            document.getElementById('main-content').innerHTML = `
                <div class="actions">
                    <button class="btn btn-success" onclick="app.showRoomModal()">
                        <span>➕</span> Add New Room
                    </button>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h2>Rooms</h2>
                        <span class="text-muted">${rooms.length} total rooms</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Room Number</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Price/Night</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rooms.map(room => `
                                <tr>
                                    <td>#${room.id}</td>
                                    <td><strong>${room.room_number}</strong></td>
                                    <td>${room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)}</td>
                                    <td>${room.capacity} guests</td>
                                    <td>${HotelUtils.CurrencyUtils.format(room.price_per_night)}</td>
                                    <td>
                                        <span class="status-badge status-${room.is_available ? 'available' : 'occupied'}">
                                            ${room.is_available ? 'Available' : 'Occupied'}
                                        </span>
                                    </td>
                                    <td>${HotelUtils.DateUtils.formatDate(room.created_at)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-warning">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    async loadBookingsPage() {
        try {
            HotelUtils.LoadingManager.show('main-content');

            const bookings = await window.api.get('/bookings');
            this.data.bookings = bookings;

            document.getElementById('main-content').innerHTML = `
                <div class="actions">
                    <button class="btn btn-warning" onclick="app.showBookingModal()">
                        <span>➕</span> New Booking
                    </button>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h2>Bookings</h2>
                        <span class="text-muted">${bookings.length} total bookings</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Nights</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookings.map(booking => `
                                <tr>
                                    <td>#${booking.id}</td>
                                    <td>
                                        <strong>${booking.guest.name}</strong><br>
                                        <small>${booking.guest.email}</small>
                                    </td>
                                    <td>
                                        ${booking.room.room_number}<br>
                                        <small>${booking.room.room_type}</small>
                                    </td>
                                    <td>${HotelUtils.DateUtils.formatDate(booking.check_in_date)}</td>
                                    <td>${HotelUtils.DateUtils.formatDate(booking.check_out_date)}</td>
                                    <td>${HotelUtils.DateUtils.getDaysBetween(booking.check_in_date, booking.check_out_date)}</td>
                                    <td>${HotelUtils.CurrencyUtils.format(booking.total_amount)}</td>
                                    <td>
                                        <span class="status-badge status-${booking.status.replace('_', '-')}">
                                            ${booking.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="actions">
                                            ${booking.status === 'booked' ? `
                                                <button class="btn btn-sm btn-success" onclick="app.checkInGuest(${booking.id})">
                                                    Check In
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="app.cancelBooking(${booking.id})">
                                                    Cancel
                                                </button>
                                            ` : ''}
                                            ${booking.status === 'checked_in' ? `
                                                <button class="btn btn-sm btn-warning" onclick="app.checkOutGuest(${booking.id})">
                                                    Check Out
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    // Modal methods
    showGuestModal() {
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Guest</h2>
                    <button class="close">&times;</button>
                </div>
                <form id="guestForm">
                    <div class="form-group">
                        <label for="name">Name *</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone *</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" name="address" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="id_proof">ID Proof</label>
                        <input type="text" id="id_proof" name="id_proof" placeholder="e.g., Passport: A1234567">
                    </div>
                    <button type="submit" class="btn">Add Guest</button>
                </form>
            </div>
        `;

        HotelUtils.ModalManager.create('guestModal', modalHTML);
        HotelUtils.ModalManager.show('guestModal');
        this.setupGuestForm();
    }

    showRoomModal() {
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Room</h2>
                    <button class="close">&times;</button>
                </div>
                <form id="roomForm">
                    <div class="form-group">
                        <label for="room_number">Room Number *</label>
                        <input type="text" id="room_number" name="room_number" required>
                    </div>
                    <div class="form-group">
                        <label for="room_type">Room Type *</label>
                        <select id="room_type" name="room_type" required>
                            <option value="">Select Type</option>
                            <option value="single">Single</option>
                            <option value="double">Double</option>
                            <option value="suite">Suite</option>
                            <option value="dorm">Dormitory</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="capacity">Capacity *</label>
                        <input type="number" id="capacity" name="capacity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="price_per_night">Price per Night *</label>
                        <input type="number" id="price_per_night" name="price_per_night" step="0.01" min="0" required>
                    </div>
                    <button type="submit" class="btn">Add Room</button>
                </form>
            </div>
        `;

        HotelUtils.ModalManager.create('roomModal', modalHTML);
        HotelUtils.ModalManager.show('roomModal');
        this.setupRoomForm();
    }

    async showBookingModal() {
        try {
            const [guests, rooms] = await Promise.all([
                window.api.get('/guests'),
                window.api.get('/rooms?available=true')
            ]);

            const modalHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>New Booking</h2>
                        <button class="close">&times;</button>
                    </div>
                    <form id="bookingForm">
                        <div class="form-group">
                            <label for="guest_id">Guest *</label>
                            <select id="guest_id" name="guest_id" required>
                                <option value="">Select Guest</option>
                                ${guests.map(guest => `
                                    <option value="${guest.id}">${guest.name} (${guest.email})</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="room_id">Room *</label>
                            <select id="room_id" name="room_id" required>
                                <option value="">Select Room</option>
                                ${rooms.map(room => `
                                    <option value="${room.id}">${room.room_number} - ${room.room_type} (${HotelUtils.CurrencyUtils.format(room.price_per_night)}/night)</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="check_in_date">Check-in Date *</label>
                            <input type="date" id="check_in_date" name="check_in_date" required>
                        </div>
                        <div class="form-group">
                            <label for="check_out_date">Check-out Date *</label>
                            <input type="date" id="check_out_date" name="check_out_date" required>
                        </div>
                        <div class="form-group">
                            <label for="total_amount">Total Amount *</label>
                            <input type="number" id="total_amount" name="total_amount" step="0.01" min="0" required>
                        </div>
                        <button type="submit" class="btn">Create Booking</button>
                    </form>
                </div>
            `;

            HotelUtils.ModalManager.create('bookingModal', modalHTML);
            HotelUtils.ModalManager.show('bookingModal');
            this.setupBookingForm();

        } catch (error) {
            console.error('Error showing booking modal:', error);
        }
    }

    // Form setup methods
    setupGuestForm() {
        const form = document.getElementById('guestForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const guestData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address'),
                    id_proof: formData.get('id_proof')
                };

                try {
                    await window.api.post('/guests', guestData);
                    HotelUtils.ToastManager.show('Guest created successfully!', 'success');
                    HotelUtils.ModalManager.hide('guestModal');
                    HotelUtils.ModalManager.destroy('guestModal');
                    // Refresh guest data globally
                    this.data.guests = await window.api.get('/guests');
                    await this.loadGuestsPage();
                } catch (error) {
                    // Error already handled by API client
                }
            };
        }
    }

    setupRoomForm() {
        const form = document.getElementById('roomForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const roomData = {
                    room_number: formData.get('room_number'),
                    room_type: formData.get('room_type'),
                    capacity: parseInt(formData.get('capacity')),
                    price_per_night: parseFloat(formData.get('price_per_night'))
                };

                try {
                    await window.api.post('/rooms', roomData);
                    HotelUtils.ToastManager.show('Room created successfully!', 'success');
                    HotelUtils.ModalManager.hide('roomModal');
                    HotelUtils.ModalManager.destroy('roomModal');
                    // Refresh room data globally
                    this.data.rooms = await window.api.get('/rooms');
                    await this.loadRoomsPage();
                } catch (error) {
                    // Error already handled by API client
                }
            };
        }
    }

    setupBookingForm() {
        const form = document.getElementById('bookingForm');
        if (form) {
            // Auto-calculate total amount when dates and room are selected
            const updateTotalAmount = () => {
                const roomId = document.getElementById('room_id').value;
                const checkIn = document.getElementById('check_in_date').value;
                const checkOut = document.getElementById('check_out_date').value;
                const totalAmountField = document.getElementById('total_amount');

                if (roomId && checkIn && checkOut) {
                    const room = this.data.rooms.find(r => r.id == roomId);
                    if (room) {
                        const nights = HotelUtils.DateUtils.getDaysBetween(checkIn, checkOut);
                        const total = room.price_per_night * nights;
                        totalAmountField.value = total.toFixed(2);
                    }
                }
            };

            document.getElementById('room_id').addEventListener('change', updateTotalAmount);
            document.getElementById('check_in_date').addEventListener('change', updateTotalAmount);
            document.getElementById('check_out_date').addEventListener('change', updateTotalAmount);

            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const bookingData = {
                    guest_id: parseInt(formData.get('guest_id')),
                    room_id: parseInt(formData.get('room_id')),
                    check_in_date: formData.get('check_in_date'),
                    check_out_date: formData.get('check_out_date'),
                    total_amount: parseFloat(formData.get('total_amount'))
                };

                try {
                    await window.api.post('/bookings', bookingData);
                    HotelUtils.ToastManager.show('Booking created successfully!', 'success');
                    HotelUtils.ModalManager.hide('bookingModal');
                    HotelUtils.ModalManager.destroy('bookingModal');
                    // Refresh booking data globally
                    this.data.bookings = await window.api.get('/bookings');
                    await this.loadBookingsPage();
                } catch (error) {
                    // Error already handled by API client
                }
            };
        }
    }

    // Action methods
    async deleteGuest(guestId) {
        if (confirm('Are you sure you want to delete this guest?')) {
            try {
                await window.api.delete(`/guests?id=${guestId}`);
                HotelUtils.ToastManager.show('Guest deleted successfully!', 'success');
                await this.loadGuestsPage();
            } catch (error) {
                // Error already handled by API client
            }
        }
    }

    async checkInGuest(bookingId) {
        try {
            await window.api.put(`/bookings?id=${bookingId}&action=checkin`);
            HotelUtils.ToastManager.show('Guest checked in successfully!', 'success');
            await this.loadBookingsPage();
        } catch (error) {
            // Error already handled by API client
        }
    }

    async checkOutGuest(bookingId) {
        try {
            await window.api.put(`/bookings?id=${bookingId}&action=checkout`);
            HotelUtils.ToastManager.show('Guest checked out successfully!', 'success');
            await this.loadBookingsPage();
        } catch (error) {
            // Error already handled by API client
        }
    }

    async cancelBooking(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            try {
                await window.api.delete(`/bookings?id=${bookingId}`);
                HotelUtils.ToastManager.show('Booking cancelled successfully!', 'success');
                await this.loadBookingsPage();
            } catch (error) {
                // Error already handled by API client
            }
        }
    }

    // Utility methods
    calculateStats() {
        const totalGuests = this.data.guests.length;
        const totalRooms = this.data.rooms.length;
        const availableRooms = this.data.rooms.filter(r => r.is_available).length;
        const activeBookings = this.data.bookings.filter(b => ['booked', 'checked_in'].includes(b.status)).length;
        const totalRevenue = this.data.bookings.reduce((sum, b) => sum + b.total_amount, 0);
        const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;

        const recentBookings = this.data.bookings
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        return {
            totalGuests,
            totalRooms,
            availableRooms,
            activeBookings,
            totalRevenue,
            occupancyRate,
            recentBookings
        };
    }
}

// Global refresh function
function refreshData() {
    if (window.app) {
        HotelUtils.ToastManager.show('Refreshing data...', 'info');
        window.app.navigateToPage(window.app.currentPage);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HotelManagementApp();
});
