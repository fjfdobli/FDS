# CineTicket - Movie Ticket Booking System

CineTicket is a comprehensive cinema management and ticket booking system that allows users to manage movies, cinemas, book tickets, select seats, and generate reports.

## Features

### Movie Management
- Add, edit, and delete movies
- Upload movie posters
- Track movie details (title, description, genre, rating, etc.)

### Cinema Management
- Add, edit, and delete cinema venues
- Manage cinema details (name, location, contact info)

### Booking System
- Interactive seat selection with real-time updates
- Support for different seat types (regular, premium, VIP, accessible)
- Visual representation of theater layout
- Apply promotions and discounts

### User Management
- Manage user accounts
- Track booking history

### Reports
- Generate detailed booking reports
- Filter by date range
- View statistics on bookings and movie popularity

## System Architecture

The system follows a client-server architecture:
- Frontend: HTML, CSS, and JavaScript
- Backend: Node.js with Express
- Database: MySQL

## Database Schema

The database consists of the following main tables:
- Movie: Stores movie information
- Cinema: Stores cinema venue information
- Theater: Connects cinemas to screens
- Screen: Represents individual theater screens
- Seat: Stores seat information for each screen
- User: Manages user accounts
- Showtime: Links movies to screens with times
- Booking: Stores booking information
- Ticket: Connects bookings to seats
- Promotion: Manages discount promotions

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   mysql -u root -p < createDB.sql
   ```
4. Start the server:
   ```
   node server.js
   ```
5. Access the application at http://localhost:3000

## Testing

Follow the QA_TEST_PLAN.md file for comprehensive testing procedures.

## Usage Guide

### Adding a Movie
1. Click on "Add Movie" button
2. Fill in movie details
3. Upload a poster image
4. Click "Save Movie"

### Managing Cinemas
1. Navigate to the Cinema tab
2. Click "Add Cinema" to create a new cinema
3. Fill in the venue details
4. Click "Save Cinema"

### Booking Tickets
1. Find a movie in the list
2. Click "Buy Tickets"
3. Select a showtime
4. Choose your seats in the interactive seat map
5. Proceed to checkout
6. Select user and payment method
7. Complete the booking

### Generating Reports
1. Navigate to the Reports tab
2. Select a date range
3. Click "Generate Report"
4. View statistics and booking data

## Technology Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Authentication: Basic authentication (expandable)
- File Storage: Local file system for posters

## Future Enhancements
- Mobile app integration
- Online payment processing
- Email ticket delivery
- QR code generation for tickets
- Advanced analytics dashboard
- Customer loyalty program