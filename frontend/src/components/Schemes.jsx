const Schemes = () => {
    const schemes = [
        {
            id: 1,
            name: 'PM-KISAN Samman Nidhi',
            description: 'Financial benefit of ₹6,000 per year to eligible farmer families, payable in three equal installments of ₹2,000.',
            eligibility: 'All landholding farmer families',
            deadline: 'Open all year',
            link: 'https://pmkisan.gov.in/',
            status: 'Active'
        },
        {
            id: 2,
            name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
            description: 'Crop insurance scheme providing comprehensive risk cover for crops against non-preventable natural risks.',
            eligibility: 'Farmers with insurable interest in the crop',
            deadline: 'July 31, 2025',
            link: 'https://pmfby.gov.in/',
            status: 'Closing Soon'
        },
        {
            id: 3,
            name: 'Kisan Credit Card (KCC)',
            description: 'Provides adequate and timely credit support from the banking system under a single window.',
            eligibility: 'All farmers, tenant farmers, share croppers',
            deadline: 'Open all year',
            link: 'https://www.myscheme.gov.in/schemes/kcc',
            status: 'Active'
        },
        {
            id: 4,
            name: 'Soil Health Card Scheme',
            description: 'Government provides Soil Health Cards to farmers with crop-wise recommendations of nutrients and fertilizers.',
            eligibility: 'All farmers',
            deadline: 'Cycle of 2 years',
            link: 'https://soilhealth.dac.gov.in/',
            status: 'Active'
        },
        {
            id: 5,
            name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
            description: 'Promotes organic farming through adoption of organic village by cluster approach and PGS certification.',
            eligibility: 'Farmers in clusters',
            deadline: 'Open all year',
            link: 'https://pgsindia-ncof.gov.in/',
            status: 'Active'
        }
    ]

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🏛️ Government Schemes</h1>
                    <p className="text-gray-500">Subsidies and financial aid for farmers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemes.map(scheme => (
                    <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{scheme.name}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {scheme.status}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-6 flex-grow">{scheme.description}</p>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Eligibility</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">{scheme.eligibility}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Deadline</span>
                                <span className="font-medium text-gray-900">{scheme.deadline}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <a
                                href={scheme.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                            >
                                Apply Now ↗
                            </a>
                            <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
                                Check Status
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Schemes
