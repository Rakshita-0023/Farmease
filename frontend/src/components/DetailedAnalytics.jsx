import { useState } from 'react'

function DetailedAnalytics({ farm, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '1000px',
          height: '80%',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 30px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#1f2937' }}>
              📊 {farm.cropType} Analytics
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {farm.area} hectares • {farm.soilType} soil • {farm.progress}% complete
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '0 30px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'growth', label: 'Growth' },
              { id: 'environment', label: 'Environment' },
              { id: 'insights', label: 'Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#22c55e' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: activeTab === tab.id ? '2px solid #22c55e' : '2px solid transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '30px'
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e' }}>
                    {farm.progress}%
                  </div>
                  <div style={{ fontSize: '14px', color: '#166534' }}>Growth Progress</div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #93c5fd'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>
                    {farm.daysToHarvest}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e40af' }}>Days to Harvest</div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fffbeb',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #fcd34d'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                    {farm.area}
                  </div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>Hectares</div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#faf5ff',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #c4b5fd'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}>
                    85%
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b21a8' }}>Health Score</div>
                </div>
              </div>

              {/* Chart */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '25px'
              }}>
                <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>
                  Weekly Growth Progress
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '10px',
                  height: '150px'
                }}>
                  {[12, 25, 38, 52, 67, 78, 85, 92].map((value, index) => (
                    <div key={index} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${value * 1.5}px`,
                        backgroundColor: '#22c55e',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}></div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        W{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '25px'
            }}>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '25px'
              }}>
                <h4 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>
                  Growth Trend
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '6px',
                  height: '200px'
                }}>
                  {[12, 25, 38, 52, 67, 78, 85, 92].map((value, index) => (
                    <div key={index} style={{
                      flex: 1,
                      height: `${value * 2.2}px`,
                      backgroundColor: '#22c55e',
                      borderRadius: '3px'
                    }}></div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{
                  backgroundColor: '#dcfce7',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '15px'
                }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    Growth Rate
                  </h5>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                    12%/week
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#dbeafe',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                    Current Stage
                  </h5>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                    {farm.progress < 50 ? 'Growing' : farm.progress < 80 ? 'Flowering' : 'Mature'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'environment' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '25px'
            }}>
              <div style={{
                backgroundColor: '#f0f9ff',
                borderRadius: '10px',
                padding: '25px'
              }}>
                <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                  💧 Soil Moisture
                </h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e40af', marginBottom: '5px' }}>
                  79%
                </div>
                <div style={{ fontSize: '14px', color: '#1e40af' }}>Current Level</div>
              </div>
              <div style={{
                backgroundColor: '#fef3c7',
                borderRadius: '10px',
                padding: '25px'
              }}>
                <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  🌡️ Temperature
                </h4>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e', marginBottom: '5px' }}>
                  30°C
                </div>
                <div style={{ fontSize: '14px', color: '#92400e' }}>Current Temp</div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '10px',
                borderLeft: '4px solid #22c55e'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                  ✅ Excellent Growth
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
                  Your {farm.cropType} is growing 15% faster than average for {farm.soilType} soil.
                </p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#fffbeb',
                borderRadius: '10px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  ⚠️ Irrigation Needed
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                  Soil moisture trending down. Consider watering within 2-3 days.
                </p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#faf5ff',
                borderRadius: '10px',
                borderLeft: '4px solid #8b5cf6'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#6b21a8' }}>
                  📅 Harvest Prediction
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b21a8' }}>
                  Expected harvest in {farm.daysToHarvest} days with 85% yield confidence.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailedAnalytics