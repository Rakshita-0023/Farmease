const express = require('express')
const cors = require('cors')
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// In-memory storage (replace with database in production)
let farms = {}
let activities = {}

// Get farms for a user
app.get('/api/farms/:userId', (req, res) => {
  const { userId } = req.params
  res.json(farms[userId] || [])
})

// Save farms for a user
app.post('/api/farms/:userId', (req, res) => {
  const { userId } = req.params
  farms[userId] = req.body
  res.json({ success: true })
})

// Get activities for a user
app.get('/api/activities/:userId', (req, res) => {
  const { userId } = req.params
  res.json(activities[userId] || [])
})

// Save activity
app.post('/api/activities/:userId', (req, res) => {
  const { userId } = req.params
  if (!activities[userId]) activities[userId] = []
  activities[userId].push(req.body)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})