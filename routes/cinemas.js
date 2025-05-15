const express = require('express')
const router = express.Router()
const db = require('../database')

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Cinema ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching cinemas:', error)
    res.status(500).json({ message: 'Error fetching cinemas' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Cinema WHERE cinema_id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cinema not found' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching cinema:', error)
    res.status(500).json({ message: 'Error fetching cinema' })
  }
})

router.get('/:id/theaters', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Theater WHERE cinema_id = ? ORDER BY theater_name',
      [req.params.id]
    )
    res.json(rows)
  } catch (error) {
    console.error('Error fetching theaters for cinema:', error)
    res.status(500).json({ message: 'Error fetching theaters' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, address, city, contact_number } = req.body
    
    const [result] = await db.query(
      'INSERT INTO Cinema (name, address, city, contact_number) VALUES (?, ?, ?, ?)',
      [name, address, city, contact_number]
    )
    
    const [newCinema] = await db.query('SELECT * FROM Cinema WHERE cinema_id = ?', [result.insertId])
    res.status(201).json(newCinema[0])
  } catch (error) {
    console.error('Error creating cinema:', error)
    res.status(500).json({ message: 'Error creating cinema' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, address, city, contact_number } = req.body
    
    await db.query(
      'UPDATE Cinema SET name = ?, address = ?, city = ?, contact_number = ? WHERE cinema_id = ?',
      [name, address, city, contact_number, req.params.id]
    )
    
    const [updatedCinema] = await db.query('SELECT * FROM Cinema WHERE cinema_id = ?', [req.params.id])
    if (updatedCinema.length === 0) {
      return res.status(404).json({ message: 'Cinema not found' })
    }
    
    res.json(updatedCinema[0])
  } catch (error) {
    console.error('Error updating cinema:', error)
    res.status(500).json({ message: 'Error updating cinema' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const [theaters] = await db.query('SELECT * FROM Theater WHERE cinema_id = ?', [req.params.id])
    if (theaters.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete cinema with existing theaters. Delete the theaters first.' 
      })
    }
    
    const [result] = await db.query('DELETE FROM Cinema WHERE cinema_id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cinema not found' })
    }
    res.json({ message: 'Cinema deleted successfully' })
  } catch (error) {
    console.error('Error deleting cinema:', error)
    res.status(500).json({ message: 'Error deleting cinema' })
  }
})

module.exports = router