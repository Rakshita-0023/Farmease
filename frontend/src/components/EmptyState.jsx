import './WeatherEnhancements.css'

const EmptyState = ({ 
  icon = '📭', 
  title = 'No data found', 
  description = 'There\'s nothing here yet.', 
  actionText = 'Get Started',
  onAction = null,
  children 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-icon">{icon}</div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        
        {children}
        
        {onAction && (
          <button 
            onClick={onAction}
            className="empty-state-action primary-btn"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState