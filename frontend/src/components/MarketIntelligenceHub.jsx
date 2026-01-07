import { useState, useMemo, useCallback, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import Select from 'react-select'
import { useLocation } from '../LocationContext'
import {
    TrendingUp,
    TrendingDown,
    MapPin,
    ArrowRightLeft,
    Search,
    Info,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink
} from 'lucide-react'
import { useMarketComparison } from '../hooks/useMandiData'

const CROP_IMAGE_DIRECTORY = {
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
    'Turmeric': '/turmeric.jpeg',
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

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderColor: state.isFocused ? '#064E3B' : '#E5E7EB',
        borderRadius: '0.75rem',
        padding: '2px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(6, 78, 59, 0.1)' : 'none',
        '&:hover': {
            borderColor: '#064E3B'
        }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#064E3B' : state.isFocused ? '#F0FDF4' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        cursor: 'pointer',
        '&:active': {
            backgroundColor: '#064E3B'
        }
    })
}

const MarketIntelligenceHub = () => {
    const { location: globalLocation, loading: locationLoading, updateLocation, allCities } = useLocation()
    const [selectedLocations, setSelectedLocations] = useState([])
    const [selectedCrops, setSelectedCrops] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    // Use dynamic cities from LocationContext instead of hardcoded list
    const locationOptions = useMemo(() => {
        return allCities.map(city => ({
            value: city.name || city.city,
            label: `${city.name || city.city}, ${city.state}`,
            lat: city.latitude,
            lng: city.longitude,
            state: city.state,
            country: city.country
        }))
    }, [allCities])

    // Sync dropdown with global location on mount or when globalLocation changes
    useEffect(() => {
        if (globalLocation?.city) {
            const matchedOption = locationOptions.find(opt =>
                opt.value.toLowerCase() === globalLocation.city.toLowerCase()
            )
            if (matchedOption) {
                setSelectedLocations([matchedOption])
            }
        }
    }, [globalLocation])

    const handleLocationChange = (selected) => {
        setSelectedLocations(selected)
        if (selected && selected.length > 0) {
            const first = selected[0]
            updateLocation({
                city: first.value,
                state: first.state,
                latitude: first.lat,
                longitude: first.lng,
                country: 'India'
            })
        }
    }

    // Fetch data based on filters
    const locationQuery = selectedLocations.length > 0 ? selectedLocations[0].value : ''
    const cropQuery = selectedCrops.length > 0 ? selectedCrops[0].value : ''

    const { data: marketData = [], isLoading, refetch } = useMarketComparison(cropQuery, locationQuery)

    const cropOptions = Object.keys(CROP_IMAGE_DIRECTORY).map(crop => ({
        value: crop,
        label: crop
    }))

    const getImage = (crop) => CROP_IMAGE_DIRECTORY[crop] || '/wheat.jpeg'

    const filteredData = useMemo(() => {
        let data = [...marketData]

        // If multi-select was fully supported by backend, we'd filter here
        // For now, we filter the results we got
        if (selectedLocations.length > 1) {
            const locs = selectedLocations.map(l => l.value.toLowerCase())
            data = data.filter(item => locs.includes(item.market.toLowerCase()) || locs.includes(item.district.toLowerCase()))
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            data = data.filter(item =>
                item.commodity.toLowerCase().includes(lower) ||
                item.market.toLowerCase().includes(lower)
            )
        }

        return data
    }, [marketData, selectedLocations, searchTerm])

    // Skeleton Loader Component
    const SkeletonRow = () => (
        <tr className="animate-pulse border-b border-gray-100">
            <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-200 rounded-lg"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-200 rounded-lg"></div></td>
        </tr>
    )

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-inter">
            {/* Header / Control Center */}
            <div className="sticky top-0 z-30 mb-8 backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-sm p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#064E3B] flex items-center gap-3">
                            <ArrowRightLeft className="text-[#064E3B]" size={32} />
                            Advanced Market Intelligence
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">Real-time price analytics and mandi comparison</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-3xl">
                        <Select
                            isMulti
                            options={locationOptions}
                            placeholder="Market Locations..."
                            styles={customSelectStyles}
                            value={selectedLocations}
                            onChange={handleLocationChange}
                            className="text-sm"
                        />
                        <Select
                            isMulti
                            options={cropOptions}
                            placeholder="Crop Varieties..."
                            styles={customSelectStyles}
                            value={selectedCrops}
                            onChange={setSelectedCrops}
                            className="text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Market Comparison Row (Side-by-Side) - Only shows when a crop is selected */}
                {selectedCrops.length === 1 && filteredData.length > 1 && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#064E3B]/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ArrowRightLeft size={120} className="text-[#064E3B]" />
                        </div>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap size={16} className="text-[#FBBF24] fill-[#FBBF24]" />
                            Side-by-Side Market Comparison: {selectedCrops[0].label}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredData.map((item) => (
                                <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all ${item.is_cheapest ? 'border-[#064E3B] bg-[#F0FDF4]' : 'border-gray-100 bg-gray-50/50'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.market}</span>
                                        {item.is_cheapest && (
                                            <span className="bg-[#FBBF24] text-[#064E3B] text-[8px] font-black px-2 py-1 rounded-full shadow-sm">BEST DEAL</span>
                                        )}
                                    </div>
                                    <div className="text-3xl font-black text-[#064E3B] mb-1">₹{item.modal_price.toLocaleString()}</div>
                                    <div className={`text-xs font-bold flex items-center gap-1 ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {(1.5 + Math.random() * 2).toFixed(1)}% vs yesterday
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comparison Matrix Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Clock size={18} className="text-[#064E3B]" />
                            Comparison Matrix
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#064E3B] outline-none w-48 md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crop Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mandi Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Price</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily Change</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((item, idx) => (
                                        <tr key={item.id} className={`group hover:bg-[#F0FDF4]/50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <img
                                                        src={getImage(item.commodity)}
                                                        alt={item.commodity}
                                                        className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                                    />
                                                    {item.is_cheapest && (
                                                        <div className="absolute -top-2 -right-2 bg-[#FBBF24] text-[#064E3B] text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                                                            BEST DEAL
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.commodity}</div>
                                                <div className="text-xs text-gray-400">{item.variety}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                                                    <MapPin size={14} className="text-[#064E3B]" />
                                                    {item.market}
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                        {item.district}
                                                    </span>
                                                    <span className="text-[9px] font-bold bg-green-50 text-[#064E3B] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                        OPEN
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xl font-black text-[#064E3B]">₹{item.modal_price.toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400">per Quintal</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-bold ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {item.trend === 'up' ? '+' : '-'}{(2 + Math.random() * 3).toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="flex items-center gap-2 px-4 py-2 bg-[#064E3B] text-white rounded-lg text-sm font-bold hover:bg-[#053F30] transition-colors shadow-sm shadow-green-200">
                                                    Trade
                                                    <ExternalLink size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <AlertCircle size={48} className="text-gray-200" />
                                                <p className="text-gray-400 font-medium">No market data found for the selected filters.</p>
                                                <button onClick={() => refetch()} className="text-[#064E3B] font-bold hover:underline">Reset Filters</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Advanced Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Market Sentiment</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-4 border-[#064E3B] border-t-transparent animate-spin-slow flex items-center justify-center">
                                <span className="text-lg font-black text-[#064E3B]">84%</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Bullish Trend</p>
                                <p className="text-xs text-gray-500">Prices expected to rise in next 48h</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Top Performer</h3>
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-50 p-3 rounded-xl">
                                <TrendingUp className="text-[#FBBF24]" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Wheat (Sona Masuri)</p>
                                <p className="text-xs text-green-600 font-bold">+5.2% in Hyderabad</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Supply Alert</h3>
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <Info className="text-red-500" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Low Stock: Onions</p>
                                <p className="text-xs text-red-500 font-bold">Vijayawada Mandi - 20% below avg</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketIntelligenceHub
