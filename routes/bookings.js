const express = require('express')
const router = express.Router()
const db = require('../database')
const mysql = require('mysql2/promise')

router.get('/', async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        u.username 
      FROM 
        Booking b
      LEFT JOIN 
        User u ON b.users_id = u.users_id
      ORDER BY 
        b.booking_date DESC
    `)
    
    const enhancedBookings = []
    
    for (const booking of bookings) {
      let promoCode = 'None'
      let movieTitle = 'N/A'
      
      if (booking.promotion_id) {
        try {
          const [promos] = await db.query(
            'SELECT promo_code FROM Promotion WHERE promotion_id = ?',
            [booking.promotion_id]
          )
          if (promos.length > 0) {
            promoCode = promos[0].promo_code
          }
        } catch (err) {
          console.log(`Error getting promotion for booking ${booking.booking_id}:`, err.message)
        }
      }
      
      try {
        const [tickets] = await db.query(
          'SELECT * FROM Ticket WHERE booking_id = ? LIMIT 1',
          [booking.booking_id]
        )
        
        if (tickets.length > 0) {
          const [showtimes] = await db.query(
            'SELECT * FROM Showtime WHERE showtime_id = ?',
            [tickets[0].showtime_id]
          )
          
          if (showtimes.length > 0) {
            const [movies] = await db.query(
              'SELECT title FROM Movie WHERE movie_id = ?',
              [showtimes[0].movie_id]
            )
            
            if (movies.length > 0) {
              movieTitle = movies[0].title
            }
          }
        }
      } catch (err) {
        console.log(`Error getting movie for booking ${booking.booking_id}:`, err.message)
      }
      
      enhancedBookings.push({
        ...booking,
        movie_title: movieTitle,
        promo_code: promoCode
      })
    }
    
    res.json(enhancedBookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    res.status(500).json({
      message: 'Error fetching bookings',
      error: error.message
    })
  }
})

// Endpoint for generating report data with date range filtering
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    let query = `
      SELECT 
        b.*,
        u.username,
        t.ticket_id,
        t.ticket_code,
        t.ticket_type_id,
        s.showtime_id,
        s.movie_id,
        s.start_time,
        scr.screen_id,
        th.theater_id,
        th.cinema_id,
        c.name as cinema_name,
        m.title as movie_title
      FROM 
        Booking b
      LEFT JOIN 
        User u ON b.users_id = u.users_id
      LEFT JOIN 
        Ticket t ON b.booking_id = t.booking_id
      LEFT JOIN 
        Showtime s ON t.showtime_id = s.showtime_id
      LEFT JOIN 
        Screen scr ON s.screen_id = scr.screen_id
      LEFT JOIN 
        Theater th ON scr.theater_id = th.theater_id
      LEFT JOIN 
        Cinema c ON th.cinema_id = c.cinema_id
      LEFT JOIN 
        Movie m ON s.movie_id = m.movie_id
    `
    
    // Add date filtering if both dates are provided
    const params = []
    if (startDate && endDate) {
      query += ` WHERE b.booking_date BETWEEN ? AND ?`
      params.push(startDate, endDate)
    }
    
    query += ` ORDER BY b.booking_date DESC`
    
    const [rows] = await db.query(query, params)
    
    // Group tickets by booking to get accurate counts
    const bookingsMap = new Map()
    
    for (const row of rows) {
      if (!bookingsMap.has(row.booking_id)) {
        bookingsMap.set(row.booking_id, {
          booking_id: row.booking_id,
          users_id: row.users_id,
          username: row.username,
          booking_date: row.booking_date,
          booking_status: row.booking_status,
          promotion_id: row.promotion_id,
          movie_title: row.movie_title,
          cinema_name: row.cinema_name,
          tickets: [],
          ticket_count: 0,
          total_price: 0
        })
      }
      
      const booking = bookingsMap.get(row.booking_id)
      
      // Only add tickets if we have a valid ticket ID
      if (row.ticket_id) {
        // Calculate ticket price based on ticket type
        let ticketPrice = 0
        switch (row.ticket_type_id) {
          case 1: // Regular
            ticketPrice = 12.99
            break
          case 2: // Premium
            ticketPrice = 16.99
            break
          case 3: // VIP
            ticketPrice = 24.99
            break
          default:
            ticketPrice = 12.99
        }
        
        booking.tickets.push({
          ticket_id: row.ticket_id,
          ticket_code: row.ticket_code,
          ticket_type_id: row.ticket_type_id,
          price: ticketPrice
        })
        
        booking.ticket_count++
        booking.total_price += ticketPrice
      }
    }
    
    // Apply promotions discount if applicable
    for (const booking of bookingsMap.values()) {
      if (booking.promotion_id) {
        try {
          const [promos] = await db.query(
            'SELECT promo_code, discount_percent FROM Promotion WHERE promotion_id = ?',
            [booking.promotion_id]
          )
          
          if (promos.length > 0) {
            const discount = promos[0].discount_percent || 10
            booking.promo_code = promos[0].promo_code
            booking.discount_percent = discount
            booking.total_price = booking.total_price * (1 - discount/100)
          }
        } catch (err) {
          console.log(`Error getting promotion for booking ${booking.booking_id}:`, err.message)
        }
      }
    }
    
    const reportData = Array.from(bookingsMap.values())
    res.json(reportData)
  } catch (error) {
    console.error('Error generating booking report:', error)
    res.status(500).json({
      message: 'Error generating booking report',
      error: error.message
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Booking WHERE booking_id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const booking = rows[0]
    let promoCode = 'None'
    let movieTitle = 'N/A'
    let username = 'N/A'
    
    // Get user information
    const [users] = await db.query('SELECT username FROM User WHERE users_id = ?', [booking.users_id])
    if (users.length > 0) {
      username = users[0].username
    }
    
    // Get promotion information
    if (booking.promotion_id) {
      const [promos] = await db.query(
        'SELECT promo_code FROM Promotion WHERE promotion_id = ?',
        [booking.promotion_id]
      )
      if (promos.length > 0) {
        promoCode = promos[0].promo_code
      }
    }
    
    // Get movie information
    const [tickets] = await db.query(
      'SELECT * FROM Ticket WHERE booking_id = ? LIMIT 1',
      [booking.booking_id]
    )
    
    if (tickets.length > 0) {
      const [showtimes] = await db.query(
        'SELECT * FROM Showtime WHERE showtime_id = ?',
        [tickets[0].showtime_id]
      )
      
      if (showtimes.length > 0) {
        const [movies] = await db.query(
          'SELECT title FROM Movie WHERE movie_id = ?',
          [showtimes[0].movie_id]
        )
        
        if (movies.length > 0) {
          movieTitle = movies[0].title
        }
      }
    }

    res.json({
      ...booking,
      username,
      movie_title: movieTitle,
      promo_code: promoCode
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    res.status(500).json({ message: 'Error fetching booking' })
  }
})

router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const { users_id, promotion_id, booking_status, tickets } = req.body;
    
    if (!users_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Set booking date to current time if not provided
    const bookingDate = new Date();
    
    // Create booking
    const [result] = await connection.query(
      'INSERT INTO Booking (users_id, booking_status, promotion_id, booking_date) VALUES (?, ?, ?, ?)',
      [users_id, booking_status || 'PENDING', promotion_id || null, bookingDate]
    );
    
    const booking_id = result.insertId;
    
    // Create tickets if provided
    if (tickets && Array.isArray(tickets) && tickets.length > 0) {
      for (const ticket of tickets) {
        // Validate showtime exists
        // We need to check if this is a real showtime from database or create it if it's a demo showtime
        const [existingShowtimes] = await connection.query(
          'SELECT * FROM Showtime WHERE showtime_id = ?', 
          [ticket.showtime_id]
        );
        
        if (existingShowtimes.length === 0) {
          console.log(`Showtime with ID ${ticket.showtime_id} not found in database. Creating temporary showtime.`);
          
          // For demo purposes, create a temporary showtime if it doesn't exist
          try {
            // First, check if this is a fake demo ID (typically high numbers like 11, 12, 13...)
            if (ticket.showtime_id > 10) {
              // Create a new showtime record
              // We need movie_id, screen_id, start_time, base_price at minimum
              const movie_id = 1; // Use a default movie that exists in the database
              const screen_id = 1; // Use a default screen that exists in the database
              const start_time = new Date();
              const end_time = new Date(start_time.getTime() + (120 * 60 * 1000)); // 2 hours after start time
              const base_price = 12.99; // Default price
              
              const [newShowtime] = await connection.query(
                'INSERT INTO Showtime (movie_id, screen_id, start_time, end_time, base_price, is_accessible) VALUES (?, ?, ?, ?, ?, ?)',
                [movie_id, screen_id, start_time, end_time, base_price, true]
              );
              
              // Use the newly created showtime
              ticket.showtime_id = newShowtime.insertId;
              
              console.log(`Created new showtime with ID ${ticket.showtime_id} for booking`);
            } else {
              await connection.rollback();
              return res.status(400).json({ message: `Showtime with ID ${ticket.showtime_id} not found` });
            }
          } catch (err) {
            console.error('Error creating temporary showtime:', err);
            await connection.rollback();
            return res.status(400).json({ message: `Could not create temporary showtime: ${err.message}` });
          }
        }
        
        // Get the showtime data again (either existing or newly created)
        const [showtimes] = await connection.query(
          'SELECT * FROM Showtime WHERE showtime_id = ?', 
          [ticket.showtime_id]
        );
        
        // Handle seat_id which might be a code (like "A1") or an ID
        let seat_id = ticket.seat_id;
        
        // If seat_id is a string like "A1", try to find the corresponding seat in the database
        if (isNaN(ticket.seat_id) || typeof ticket.seat_id === 'string') {
          // Parse seat code - assuming format is like "A1" where "A" is row and "1" is number
          const seatCode = ticket.seat_id.toString();
          const seatRow = seatCode.charAt(0);
          const seatNumber = seatCode.substring(1);
          
          // Get the screen_id from the showtime
          const screen_id = showtimes[0].screen_id;
          
          // Try to find matching seat
          const [seats] = await connection.query(
            'SELECT seat_id FROM Seat WHERE screen_id = ? AND seat_row = ? AND seat_number = ?',
            [screen_id, seatRow, seatNumber]
          );
          
          if (seats.length > 0) {
            seat_id = seats[0].seat_id;
            console.log(`Found existing seat: ${seatCode} with seat_id=${seat_id}`);
          } else {
            // Create a new seat if it doesn't exist (for demo purposes)
            console.log(`Creating new seat for ${seatRow}${seatNumber} in screen_id=${screen_id}`);
            const [newSeat] = await connection.query(
              'INSERT INTO Seat (screen_id, seat_row, seat_number, seat_type, price_multiplier, is_accessible) VALUES (?, ?, ?, ?, ?, ?)',
              [screen_id, seatRow, seatNumber, 'Regular', 1.0, false]
            );
            seat_id = newSeat.insertId;
            console.log(`Created new seat with ID: ${seat_id}`);
          }
        }
        
        // Check if the seat is already booked for this showtime
        const [existingTickets] = await connection.query(
          `SELECT t.ticket_id 
           FROM Ticket t 
           WHERE t.showtime_id = ? AND t.seat_id = ? AND t.ticket_status = 'ACTIVE'`,
          [ticket.showtime_id, seat_id]
        );
        
        if (existingTickets.length > 0) {
          await connection.rollback();
          return res.status(400).json({ message: `Seat is already booked for this showtime` });
        }
        
        // Create the ticket
        await connection.query(
          'INSERT INTO Ticket (showtime_id, users_id, seat_id, ticket_status, ticket_code, booking_id, ticket_type_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            ticket.showtime_id, 
            users_id, 
            seat_id, 
            ticket.ticket_status || 'ACTIVE',
            ticket.ticket_code || `TKT${Math.floor(Math.random() * 1000000)}`,
            booking_id,
            ticket.ticket_type_id || 1
          ]
        );
      }
    }
    
    await connection.commit();
    
    const [newBooking] = await connection.query('SELECT * FROM Booking WHERE booking_id = ?', [booking_id]);
    res.status(201).json(newBooking[0]);
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { booking_status, promotion_id } = req.body
    const booking_id = req.params.id
    
    // Check if booking exists
    const [existingBooking] = await db.query('SELECT * FROM Booking WHERE booking_id = ?', [booking_id])
    if (existingBooking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    // Update booking
    await db.query(
      'UPDATE Booking SET booking_status = ?, promotion_id = ? WHERE booking_id = ?',
      [booking_status || 'PENDING', promotion_id, booking_id]
    )
    
    const [updatedBooking] = await db.query('SELECT * FROM Booking WHERE booking_id = ?', [booking_id])
    res.json(updatedBooking[0])
  } catch (error) {
    console.error('Error updating booking:', error)
    res.status(500).json({ message: 'Error updating booking', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const booking_id = req.params.id;
    
    // Check if booking exists
    const [existingBooking] = await connection.query('SELECT * FROM Booking WHERE booking_id = ?', [booking_id]);
    if (existingBooking.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Delete all tickets associated with this booking
    await connection.query('DELETE FROM Ticket WHERE booking_id = ?', [booking_id]);
    
    // Delete the booking
    await connection.query('DELETE FROM Booking WHERE booking_id = ?', [booking_id]);
    
    await connection.commit();
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

module.exports = router