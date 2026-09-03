import { useContext } from 'react'
import { LocationContext } from '../contexts/locationContext'

export const useFarmLocation = () => {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useFarmLocation must be used within a LocationProvider')
  return context
}
