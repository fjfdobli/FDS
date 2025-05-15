const express = require('express')
const router = express.Router()
const db = require('../database')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Movie ORDER BY release_date DESC')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching movies:', error)
    res.status(500).json({ message: 'Error fetching movies' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Movie WHERE movie_id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching movie:', error)
    res.status(500).json({ message: 'Error fetching movie' })
  }
})

router.post('/', upload.single('poster'), async (req, res) => {
  try {
    const { title, description, duration, genre, rating, release_date } = req.body
    
    let posterUrl = null
    if (req.file) {
      posterUrl = `/uploads/${req.file.filename}`
    }
    
    const [result] = await db.query(
      'INSERT INTO Movie (title, description, duration, genre, rating, release_date, poster) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, duration, genre, rating, release_date, posterUrl]
    )
    
    const [newMovie] = await db.query('SELECT * FROM Movie WHERE movie_id = ?', [result.insertId])
    res.status(201).json(newMovie[0])
  } catch (error) {
    console.error('Error creating movie:', error)
    res.status(500).json({ message: 'Error creating movie', error: error.message })
  }
})

router.put('/:id', upload.single('poster'), async (req, res) => {
  try {
    const { title, description, duration, genre, rating, release_date } = req.body
    
    console.log('Updating movie:', req.params.id)
    console.log('Request body:', req.body)
    
    let query, params
    
    if (req.file) {
      const posterUrl = `/uploads/${req.file.filename}`
      console.log('Uploaded poster:', posterUrl)
      query = 'UPDATE Movie SET title = ?, description = ?, duration = ?, genre = ?, rating = ?, release_date = ?, poster = ? WHERE movie_id = ?'
      params = [title, description, duration, genre, rating, release_date, posterUrl, req.params.id]
    } else {
      query = 'UPDATE Movie SET title = ?, description = ?, duration = ?, genre = ?, rating = ?, release_date = ? WHERE movie_id = ?'
      params = [title, description, duration, genre, rating, release_date, req.params.id]
    }
    
    const [result] = await db.query(query, params)
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    
    const [updatedMovie] = await db.query('SELECT * FROM Movie WHERE movie_id = ?', [req.params.id])
    res.json(updatedMovie[0])
  } catch (error) {
    console.error('Error updating movie:', error)
    res.status(500).json({ message: 'Error updating movie', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const movieId = req.params.id
    console.log(`Attempting to delete movie with ID: ${movieId}`)
    
    const [showtimes] = await db.query('SELECT showtime_id FROM showtime WHERE movie_id = ?', [movieId])
    console.log(`Found ${showtimes.length} showtimes for movie ID ${movieId}`)
    
    if (showtimes.length > 0) {
      const showtimeIds = showtimes.map(s => s.showtime_id)
      
      const [tickets] = await db.query('SELECT ticket_id FROM ticket WHERE showtime_id IN (?)', [showtimeIds])
      console.log(`Found ${tickets.length} tickets for these showtimes`)
      
      if (tickets.length > 0) {
        const ticketIds = tickets.map(t => t.ticket_id)
        
        console.log(`Deleting payments for tickets of movie_id=${movieId}`)
        const [paymentResult] = await db.query('DELETE FROM payment WHERE ticket_id IN (?)', [ticketIds])
        console.log(`Deleted ${paymentResult.affectedRows} payment records`)
        
        console.log(`Deleting bookings for tickets of movie_id=${movieId}`)
        try {
          const [bookingResult] = await db.query('DELETE FROM booking WHERE ticket_id IN (?)', [ticketIds])
          console.log(`Deleted ${bookingResult.affectedRows} booking records`)
        } catch (err) {
          console.log('No bookings table or no ticket_id reference in bookings')
        }
      }
      
      console.log(`Deleting tickets for showtimes of movie_id=${movieId}`)
      const [ticketResult] = await db.query('DELETE FROM ticket WHERE showtime_id IN (?)', [showtimeIds])
      console.log(`Deleted ${ticketResult.affectedRows} ticket records`)
    }
    
    console.log(`Deleting showtimes for movie_id=${movieId}`)
    const [showtimeResult] = await db.query('DELETE FROM showtime WHERE movie_id = ?', [movieId])
    console.log(`Deleted ${showtimeResult.affectedRows} showtime records`)
    
    try {
      const [bookingMovieResult] = await db.query('DELETE FROM booking WHERE movie_id = ?', [movieId])
      console.log(`Deleted ${bookingMovieResult.affectedRows} direct booking records`)
    } catch (err) {
      console.log('No direct movie_id reference in bookings')
    }
    
    console.log(`Deleting movie with ID=${movieId}`)
    const [result] = await db.query('DELETE FROM Movie WHERE movie_id = ?', [movieId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Movie not found' })
    }
    
    try {
      const [movie] = await db.query('SELECT poster FROM Movie WHERE movie_id = ?', [movieId])
      if (movie.length > 0 && movie[0].poster) {
        const posterPath = path.join(__dirname, '..', movie[0].poster.substring(1)) // Remove leading '/'
        if (fs.existsSync(posterPath)) {
          fs.unlinkSync(posterPath)
          console.log(`Deleted poster file: ${posterPath}`)
        }
      }
    } catch (err) {
      console.log('Error deleting poster file:', err)
    }
    
    res.json({ message: 'Movie deleted successfully' })
  } catch (error) {
    console.error('Error deleting movie:', error)
    res.status(500).json({ message: 'Error deleting movie', error: error.message })
  }
})

module.exports = router