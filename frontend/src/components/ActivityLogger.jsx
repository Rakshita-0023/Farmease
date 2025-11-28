import { useState } from 'react'
import './WeatherEnhancements.css'

const ActivityLogger = ({ farm, onClose, onSave }) => {
  const [activity, setActivity] = useState({
    type: 'irrigation',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const activityTypes = [
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'fertilizer', label: 'Fertilizer Application' },
    { value: 'pesticide', label: 'Pesticide Spray' },
    { value: 'weeding', label: 'Weeding' },
    { value: 'harvesting', label: 'Harvesting' },
    { value: 'planting', label: 'Planting' },
    { value: 'inspection', label: 'Field Inspection' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activity.notes.trim()) return

    const logEntry = {
      id: Date.now(),
      farmId: farm.id,
      farmName: farm.name,
      ...activity,
      timestamp: new Date().toISOString()
    }

    // Save to localStorage
    const existingLogs = JSON.parse(localStorage.getItem('farmActivities') || '[]')
    existingLogs.push(logEntry)
    localStorage.setItem('farmActivities', JSON.stringify(existingLogs))

    onSave && onSave(logEntry)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="activity-modal add-farm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Log Activity - {farm.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <select
            value={activity.type}
            onChange={(e) => setActivity({...activity, type: e.target.value})}
            className="glassmorphic-select"
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={activity.date}
            onChange={(e) => setActivity({...activity, date: e.target.value})}
            required
          />

          <textarea
            className="activity-notes"
            placeholder="Enter activity details..."
            value={activity.notes}
            onChange={(e) => setActivity({...activity, notes: e.target.value})}
            required
          />

          <div className="modal-buttons">
            <button type="submit">Save Activity</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActivityLogger