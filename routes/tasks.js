const express = require('express')
const router = express.Router()
const db = require('../database')

router.use(async (req, res, next) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    next()
  } catch (error) {
    console.error('Error creating tasks table:', error)
    res.status(500).json({ message: 'Database initialization error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks ORDER BY created_at DESC')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ message: 'Error fetching tasks' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' })
    }
    res.json(rows[0])
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ message: 'Error fetching task' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { description, status } = req.body
    
    if (!description) {
      return res.status(400).json({ message: 'Task description is required' })
    }
    
    const [result] = await db.query(
      'INSERT INTO tasks (description, status) VALUES (?, ?)',
      [description, status || 'pending']
    )
    
    const [newTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId])
    res.status(201).json(newTask[0])
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ message: 'Error creating task' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { description, status } = req.body
    
    if (!description) {
      return res.status(400).json({ message: 'Task description is required' })
    }
    
    await db.query(
      'UPDATE tasks SET description = ?, status = ? WHERE id = ?',
      [description, status || 'pending', req.params.id]
    )
    
    const [updatedTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    if (updatedTask.length === 0) {
      return res.status(404).json({ message: 'Task not found' })
    }
    
    res.json(updatedTask[0])
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ message: 'Error updating task' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' })
    }
    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ message: 'Error deleting task' })
  }
})

module.exports = router