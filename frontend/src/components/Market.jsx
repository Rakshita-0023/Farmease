import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table, RefreshCw, ChevronDown, Filter } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMandiData } from '../hooks/useMandiData'

// Fix for Leaflet default icon issues in React
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Market = () => {
  const { userLocation } = useOutletContext()
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Location State
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedMandi, setSelectedMandi] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Use the custom hook for data fetching
  const { data: marketData = [], isLoading, refetch } = useMandiData(selectedState, selectedDistrict, selectedMandi)

  // Location Hierarchy Data
  const locationHierarchy = {
    'Telangana': {
      'Hyderabad': ['Hyderabad'],
      'Warangal': ['Warangal'],
      'Nizamabad': ['Nizamabad'],
      'Adilabad': ['Adilabad'],
      'Khammam': ['Khammam']
    },
    'Andhra Pradesh': {
      'Guntur': ['Guntur'],
      'Krishna': ['Vijayawada'],
      'Kurnool': ['Kurnool']
    }
  }

  const states = Object.keys(locationHierarchy)
  const districts = selectedState ? Object.keys(locationHierarchy[selectedState]) : []
  const mandis = selectedDistrict ? locationHierarchy[selectedState][selectedDistrict] : []

  // Handle GPS Location
  const handleUseLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate reverse geocoding for demo
          setTimeout(() => {
            setSelectedState('Andhra Pradesh')
            setSelectedDistrict('Guntur')
            setSelectedMandi('Guntur')
            setIsLocating(false)
          }, 1000)
        },
        (error) => {
          console.error(error)
          setIsLocating(false)
          alert('Could not access location. Please select manually.')
        }
      )
    }
  }

  // Filter Logic
  const filteredData = useMemo(() => {
    let data = marketData
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      data = data.filter(item =>
        item.commodity.toLowerCase().includes(lower) ||
        item.market.toLowerCase().includes(lower)
      )
    }
    return data
  }, [marketData, searchTerm])

  // Image Mapping (Reliable Unsplash URLs)
  const getImageForCommodity = (commodity) => {
    const map = {
      'Red Chilli': 'https://images.unsplash.com/photo-1563503649-656d0267746e?auto=format&fit=crop&w=400&q=80',
      'Maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
      'Brinjal': 'https://images.unsplash.com/photo-1621459569687-313620803d4e?auto=format&fit=crop&w=400&q=80',
      'Pomegranate': 'https://images.unsplash.com/photo-1541336032412-2048a678540d?auto=format&fit=crop&w=400&q=80',
      'Papaya': 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&w=400&q=80',
      'Banana': 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=400&q=80',
      'Cotton': 'https://images.unsplash.com/photo-1594315590298-3296052b32a1?auto=format&fit=crop&w=400&q=80',
      'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80',
      'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
    }
    // Fallback image
    return map[commodity] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📈 Market Prices
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
              Live Updates (Dec 2025)
            </span>
          </h1>
          <p className="text-gray-500 text-sm">Real-time Mandi rates from Agmarknet & e-NAM</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Card View"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List View"
          >
            <Table size={20} />
          </button>
        </div>
      </div>

      {/* Smart Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Location Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedDistrict('')
                  setSelectedMandi('')
                }}
                className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Select State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value)
                  setSelectedMandi('')
                }}
                disabled={!selectedState}
                className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:opacity-50"
              >
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            <div className="relative">
              <select
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:opacity-50"
              >
                <option value="">Select Mandi</option>
                {mandis.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUseLocation}
              disabled={isLocating}
              className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isLocating ? <RefreshCw size={18} className="animate-spin" /> : <MapPin size={18} />}
              Nearest Mandi
            </button>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search commodity..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-64 z-0">
        <MapContainer center={[17.0, 79.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredData.map(item => (
            <Marker key={item.id} position={[item.lat, item.lng]}>
              <Popup>
                <div className="text-sm font-sans">
                  <strong className="block text-green-700">{item.market}</strong>
                  {item.commodity}: ₹{item.modal_price}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100">
              <div className="h-32 bg-gray-100 rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-32 overflow-hidden relative">
                    <img
                      src={getImageForCommodity(item.commodity)}
                      alt={item.commodity}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} flex items-center gap-1 shadow-sm font-medium`}>
                        {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {item.trend === 'up' ? 'Up' : 'Down'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <h3 className="font-bold text-white text-lg leading-none">{item.commodity}</h3>
                      <p className="text-gray-200 text-xs mt-1">{item.variety}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Modal Price</p>
                        <p className="text-2xl font-bold text-gray-900">₹{item.modal_price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{item.market}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Range</span>
                        <span className="font-medium text-gray-700">₹{item.min_price.toLocaleString()} - ₹{item.max_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gap</span>
                        <span className={`font-medium ${item.max_price - item.min_price > 500 ? 'text-orange-600' : 'text-green-600'}`}>
                          ₹{(item.max_price - item.min_price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700">Commodity</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Market</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Min/Max</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Modal Price</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={getImageForCommodity(item.commodity)} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <div className="font-medium text-gray-900">{item.commodity}</div>
                              <div className="text-xs text-gray-500">{item.variety}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.market}</td>
                        <td className="px-6 py-4 text-gray-600">₹{item.min_price.toLocaleString()} - ₹{item.max_price.toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">₹{item.modal_price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Market