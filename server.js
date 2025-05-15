require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const app = express()
const PORT = process.env.PORT || 3000
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const moviesRouter = require('./routes/movies')
const bookingsRouter = require('./routes/bookings')
const cinemasRouter = require('./routes/cinemas')
const usersRouter = require('./routes/users')
const promotionsRouter = require('./routes/promotions')

app.get('/uploads-check', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads')
  
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('Created uploads directory:', uploadsDir)
      res.send('Uploads directory created')
    } catch (error) {
      console.error('Error creating uploads directory:', error)
      res.status(500).send('Failed to create uploads directory: ' + error.message)
    }
  } else {
    try {
      const testFile = path.join(uploadsDir, 'test.txt')
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      res.send('Uploads directory exists and is writable')
    } catch (error) {
      console.error('Uploads directory permission issue:', error)
      res.status(500).send('Uploads directory permission issue: ' + error.message)
    }
  }
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/movies', moviesRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/cinemas', cinemasRouter)
app.use('/api/users', usersRouter)
app.use('/api/promotions', promotionsRouter)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Movie Ticket Booking System is available at: http://localhost:${PORT}`)
})