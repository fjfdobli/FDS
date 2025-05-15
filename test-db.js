require('dotenv').config()
const mysql = require('mysql2/promise')

async function testConnection() {
  try {
    console.log('Attempting to connect to:')
    console.log('Host:', process.env.DB_HOST || 'localhost')
    console.log('User:', process.env.DB_USER || 'root')
    console.log('Database:', process.env.DB_NAME || 'MovieTicketBookingDB')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'MovieTicketBookingDB'
    })
    
    console.log('Connected to database successfully!')
    
    console.log('\nTesting Movie table:')
    const [movies] = await connection.query('SELECT * FROM Movie LIMIT 2')
    console.log(`Found ${movies.length} movies`)
    
    console.log('\nTesting Cinema table:')
    const [cinemas] = await connection.query('SELECT * FROM Cinema LIMIT 2')
    console.log(`Found ${cinemas.length} cinemas`)
    
    console.log('\nTesting Booking table:')
    const [bookings] = await connection.query('SELECT * FROM Booking LIMIT 2')
    console.log(`Found ${bookings.length} bookings`)
    
    await connection.end()
    console.log('\nDatabase tests completed successfully!')
  } catch (error) {
    console.error('Error testing database:', error)
  }
}

testConnection()