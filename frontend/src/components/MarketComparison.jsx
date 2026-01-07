import { useState, useMemo, useCallback } from 'react'
import { useLocation } from '../LocationContext'
import { Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table, RefreshCw, ChevronDown, BarChart3, ArrowRightLeft } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMarketComparison } from '../hooks/useMandiData'

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

const CROP_IMAGES = {
    'Wheat': '/wheat.jpeg',
    'Jowar': '/jowar.webp',
    'Maize': '/corn.jpg',
    'Corn': '/corn.jpg',
    'Rice': '/rice.jpg',
    'Paddy': '/rice.jpg',
    'Bajra': '/bajra.jpg',
    'Ragi': '/ragi.webp',
    'Arhar Dal': '/Arhar_Dal.webp',
    'Chana Dal': '/Chana_Dal.webp',
    'Moong Dal': '/Moong_Dal.jpg',
    'Chilli': '/tomato.jpeg',
    'Turmeric': '/Mustard.jpg',
    'Mustard': '/Mustard.jpg',
    'Onion': '/onions.avif',
    'Tomato': '/tomato.jpeg',
    'Potato': '/potato.jpg',
    'Cabbage': '/cabbage.jpeg',
    'Cauliflower': '/Cauliflower.jpg',
    'Banana': '/Bananas.jpg',
    'Mango': '/Mangoes.jpg',
    'Apple': '/Apples.jpeg',
    'Orange': '/Oranges.jpg',
    'Cotton': '/cotton.jpg',
    'Groundnut': '/Groundnut.jpg',
    'Sunflower': '/Sunflower.jpg',
    'Jute': '/Jute.jpg',
    'Sugarcane': '/sugercane.jpg',
    'Coffee': '/coffee.jpeg',
    'Tea': '/tea.jpg',
    'Rubber': '/Rubber.jpg'
}

const MarketComparison = () => {
    const { location: userLocation } = useLocation()

    // Filter State
    const [selectedCity, setSelectedCity] = useState('')
    const [selectedCrop, setSelectedCrop] = useState('')
    const [viewMode, setViewMode] = useState('table') // Comparison usually better in table
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch comparison data
    const { data: marketData = [], isLoading, error, refetch, isError } = useMarketComparison(selectedCrop, selectedCity)

    // Options for dropdowns
    const cities = ['Hyderabad', 'Vijayawada', 'Guntur', 'Warangal', 'Nizamabad', 'Kurnool']
    const crops = ['Wheat', 'Jowar', 'Maize', 'Rice', 'Paddy', 'Bajra', 'Cotton', 'Onion', 'Tomato', 'Turmeric', 'Chilli']

    const getImageForCommodity = useCallback((commodity) => {
        return CROP_IMAGES[commodity] || '/wheat.jpeg'
    }, [])

    const filteredData = useMemo(() => {
        if (!Array.isArray(marketData)) return []
        if (!searchTerm) return marketData
        const lower = searchTerm.toLowerCase()
        return marketData.filter(item =>
            item.commodity?.toLowerCase().includes(lower) ||
            item.market?.toLowerCase().includes(lower)
        )
    }, [marketData, searchTerm])

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <ArrowRightLeft className="text-green-600" />
                        Market Comparison Tool
                    </h1>
                    <p className="text-gray-500 mt-1">Compare prices across locations and crops for Dec 28, 2025</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Table size={20} />
                    </button>
                </div>
            </div>

            {/* Comparison Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Location Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Location-First View</label>
                        <div className="relative">
                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    setSelectedCity(e.target.value)
                                    setSelectedCrop('') // Pivot to location
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium"
                            >
                                <option value="">All Locations (Trending)</option>
                                {cities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Crop Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Crop-First View</label>
                        <div className="relative">
                            <select
                                value={selectedCrop}
                                onChange={(e) => {
                                    setSelectedCrop(e.target.value)
                                    setSelectedCity('') // Pivot to crop
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium"
                            >
                                <option value="">All Crops (Trending)</option>
                                {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                            </select>
                            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Quick Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search commodity or market..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Table/Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <RefreshCw className="animate-spin text-green-600 mb-4" size={40} />
                    <p className="text-gray-500 font-medium">Analyzing market data...</p>
                </div>
            ) : isError ? (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-red-600 font-medium">Failed to load comparison data</p>
                    <button onClick={() => refetch()} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Retry Analysis
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Commodity</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Market</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Price</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">State Avg</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Variance</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredData.map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.is_cheapest ? 'bg-green-50/30' : item.is_highest ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={getImageForCommodity(item.commodity)} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                                        <div>
                                                            <div className="font-bold text-gray-900">{item.commodity}</div>
                                                            <div className="text-xs text-gray-500">{item.variety}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {item.market}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-tight">{item.district}, {item.state}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-lg font-black text-gray-900">₹{item.modal_price.toLocaleString()}</div>
                                                    {item.is_cheapest && <span className="text-[10px] font-bold text-green-600 uppercase bg-green-100 px-1.5 py-0.5 rounded">Cheapest Place</span>}
                                                    {item.is_highest && <span className="text-[10px] font-bold text-red-600 uppercase bg-red-100 px-1.5 py-0.5 rounded">Highest Price</span>}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium">
                                                    {item.avg_price ? `₹${item.avg_price.toLocaleString()}` : '--'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.variance !== null ? (
                                                        <div className={`flex items-center gap-1 font-bold ${item.variance > 0 ? 'text-red-600' : item.variance < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                                                            {item.variance !== 0 && (item.variance > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
                                                        </div>
                                                    ) : '--'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${item.trend === 'up' ? 'bg-green-100 text-green-700' :
                                                        item.trend === 'down' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {item.trend === 'up' ? <TrendingUp size={12} /> : item.trend === 'down' ? <TrendingDown size={12} /> : <BarChart3 size={12} />}
                                                        {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Falling' : 'Stable'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredData.map((item) => (
                                <div key={item.id} className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${item.is_cheapest ? 'ring-2 ring-green-500' : item.is_highest ? 'ring-2 ring-red-500' : ''}`}>
                                    <div className="h-32 relative overflow-hidden">
                                        <img src={getImageForCommodity(item.commodity)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div>
                                                <h3 className="text-white font-bold">{item.commodity}</h3>
                                                <p className="text-white/70 text-[10px]">{item.variety}</p>
                                            </div>
                                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/30">
                                                {item.market}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-black text-gray-900">₹{item.modal_price.toLocaleString()}</span>
                                            <div className={`p-1.5 rounded-lg ${item.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {item.trend === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                            </div>
                                        </div>
                                        {item.variance !== null && (
                                            <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-2">
                                                <span className="text-gray-400 font-medium">Vs State Avg</span>
                                                <span className={`font-bold ${item.variance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredData.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-gray-800">No matching data found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default MarketComparison
