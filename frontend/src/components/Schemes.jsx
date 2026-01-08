import { motion } from 'framer-motion'
import { FileText, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const Schemes = () => {
    const schemes = [
        {
            id: 1,
            name: 'PM-KISAN Samman Nidhi',
            description: 'Financial benefit of ₹6,000 per year to eligible farmer families, payable in three equal installments.',
            eligibility: 'All landholding farmer families',
            deadline: 'Open all year',
            link: 'https://pmkisan.gov.in/',
            status: 'Active'
        },
        {
            id: 2,
            name: 'Pradhan Mantri Fasal Bima Yojana',
            description: 'Crop insurance scheme providing comprehensive risk cover against non-preventable natural risks.',
            eligibility: 'Farmers with insurable interest',
            deadline: 'July 31, 2025',
            link: 'https://pmfby.gov.in/',
            status: 'Closing Soon'
        },
        {
            id: 3,
            name: 'Kisan Credit Card (KCC)',
            description: 'Provides adequate and timely credit support from the banking system under a single window.',
            eligibility: 'All farmers, tenant farmers',
            deadline: 'Open all year',
            link: 'https://www.myscheme.gov.in/schemes/kcc',
            status: 'Active'
        },
        {
            id: 4,
            name: 'Soil Health Card Scheme',
            description: 'Government provides Soil Health Cards with crop-wise recommendations of nutrients and fertilizers.',
            eligibility: 'All farmers',
            deadline: 'Cycle of 2 years',
            link: 'https://soilhealth.dac.gov.in/',
            status: 'Active'
        },
        {
            id: 5,
            name: 'Paramparagat Krishi Vikas Yojana',
            description: 'Promotes organic farming through adoption of organic village by cluster approach.',
            eligibility: 'Farmers in clusters',
            deadline: 'Open all year',
            link: 'https://pgsindia-ncof.gov.in/',
            status: 'Active'
        }
    ]

    return (
        <div className="p-4 md:p-6 space-y-6 min-h-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-emerald-700/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
            >
                <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-emerald-300" size={20} />
                    <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Government Aid</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Government Schemes</h1>
                <p className="text-white/60">Subsidies and financial aid programs for farmers</p>
            </motion.div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schemes.map((scheme, index) => (
                    <motion.div
                        key={scheme.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all flex flex-col h-full group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 flex-1">
                                {scheme.name}
                            </h3>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ml-2 flex items-center gap-1 ${
                                scheme.status === 'Active' 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'bg-amber-500/20 text-amber-400'
                            }`}>
                                {scheme.status === 'Active' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                {scheme.status}
                            </span>
                        </div>

                        <p className="text-white/60 text-sm mb-5 flex-grow">{scheme.description}</p>

                        <div className="space-y-2 mb-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Eligibility</span>
                                <span className="font-medium text-white/80 text-right max-w-[60%]">{scheme.eligibility}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40 flex items-center gap-1">
                                    <Clock size={12} /> Deadline
                                </span>
                                <span className="font-medium text-white/80">{scheme.deadline}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <a
                                href={scheme.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-1"
                            >
                                Apply <ExternalLink size={14} />
                            </a>
                            <button className="flex-1 bg-white/10 border border-white/10 text-white py-2.5 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm">
                                Check Status
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default Schemes
