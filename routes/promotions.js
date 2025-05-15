const express = require('express')
const router = express.Router()
const db = require('../database')

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Promotion ORDER BY start_date DESC')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching promotions:', error)
    res.status(500).json({ message: 'Error fetching promotions' })
  }
})

router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Promotion WHERE CURDATE() BETWEEN start_date AND end_date ORDER BY discount_percentage DESC'
    )
    res.json(rows)
  } catch (error) {
    console.error('Error fetching active promotions:', error)
    res.status(500).json({ message: 'Error fetching active promotions' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Promotion WHERE promotion_id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching promotion:', error)
    res.status(500).json({ message: 'Error fetching promotion' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { promo_code, discount_percentage, start_date, end_date } = req.body
    
    const [existingPromo] = await db.query('SELECT * FROM Promotion WHERE promo_code = ?', [promo_code])
    if (existingPromo.length > 0) {
      return res.status(400).json({ message: 'Promotion code already exists' })
    }
    
    if (discount_percentage <= 0 || discount_percentage > 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' })
    }
    
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' })
    }
    
    const [result] = await db.query(
      'INSERT INTO Promotion (promo_code, discount_percentage, start_date, end_date) VALUES (?, ?, ?, ?)',
      [promo_code, discount_percentage, start_date, end_date]
    )
    
    const [newPromotion] = await db.query('SELECT * FROM Promotion WHERE promotion_id = ?', [result.insertId])
    res.status(201).json(newPromotion[0])
  } catch (error) {
    console.error('Error creating promotion:', error)
    res.status(500).json({ message: 'Error creating promotion' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { promo_code, discount_percentage, start_date, end_date } = req.body
    
    const [existingPromo] = await db.query(
      'SELECT * FROM Promotion WHERE promo_code = ? AND promotion_id != ?', 
      [promo_code, req.params.id]
    )
    if (existingPromo.length > 0) {
      return res.status(400).json({ message: 'Promotion code already exists' })
    }
    
    if (discount_percentage <= 0 || discount_percentage > 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' })
    }
    
    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' })
    }
    
    await db.query(
      'UPDATE Promotion SET promo_code = ?, discount_percentage = ?, start_date = ?, end_date = ? WHERE promotion_id = ?',
      [promo_code, discount_percentage, start_date, end_date, req.params.id]
    )
    
    const [updatedPromotion] = await db.query('SELECT * FROM Promotion WHERE promotion_id = ?', [req.params.id])
    if (updatedPromotion.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' })
    }
    
    res.json(updatedPromotion[0])
  } catch (error) {
    console.error('Error updating promotion:', error)
    res.status(500).json({ message: 'Error updating promotion' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const [bookings] = await db.query('SELECT * FROM Booking WHERE promotion_id = ?', [req.params.id])
    if (bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete promotion that is used in bookings. Update the bookings first.' 
      })
    }
    
    const [result] = await db.query('DELETE FROM Promotion WHERE promotion_id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Promotion not found' })
    }
    res.json({ message: 'Promotion deleted successfully' })
  } catch (error) {
    console.error('Error deleting promotion:', error)
    res.status(500).json({ message: 'Error deleting promotion' })
  }
})

module.exports = router