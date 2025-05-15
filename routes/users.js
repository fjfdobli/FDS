const express = require('express')
const router = express.Router()
const db = require('../database')

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM User ORDER BY username')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Error fetching users' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM User WHERE users_id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Error fetching user' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, email, password, phone_number } = req.body
    
    const [existingUsername] = await db.query('SELECT * FROM User WHERE username = ?', [username])
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Username already exists' })
    }
    
    const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [email])
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    
    const [result] = await db.query(
      'INSERT INTO User (username, email, password, phone_number) VALUES (?, ?, ?, ?)',
      [username, email, password, phone_number]
    )
    
    const [newUser] = await db.query('SELECT * FROM User WHERE users_id = ?', [result.insertId])
    res.status(201).json(newUser[0])
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ message: 'Error creating user' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { username, email, password, phone_number } = req.body
    
    const [existingUsername] = await db.query(
      'SELECT * FROM User WHERE username = ? AND users_id != ?', 
      [username, req.params.id]
    )
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Username already exists' })
    }
    
    const [existingEmail] = await db.query(
      'SELECT * FROM User WHERE email = ? AND users_id != ?', 
      [email, req.params.id]
    )
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    
    await db.query(
      'UPDATE User SET username = ?, email = ?, password = ?, phone_number = ? WHERE users_id = ?',
      [username, email, password, phone_number, req.params.id]
    )
    
    const [updatedUser] = await db.query('SELECT * FROM User WHERE users_id = ?', [req.params.id])
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    res.json(updatedUser[0])
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ message: 'Error updating user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const [bookings] = await db.query('SELECT * FROM Booking WHERE users_id = ?', [req.params.id])
    if (bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with existing bookings. Delete the bookings first.'
      })
    }
    
    const [result] = await db.query('DELETE FROM User WHERE users_id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ message: 'Error deleting user' })
  }
})

module.exports = router