const express = require('express')
const router = express.Router()
const db = require('../database')

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

module.exports = router