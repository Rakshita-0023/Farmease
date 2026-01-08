/**
 * Crop Image Mapping - Using LOCAL images from public folder
 * Consistent, pre-uploaded images for reliable loading
 */

const cropImageMap = {
  // Grains & Cereals
  'rice': '/rice.jpg',
  'paddy': '/rice.jpg',
  'basmati': '/rice.jpg',
  'ir64': '/rice.jpg',
  'sona': '/rice.jpg',
  'wheat': '/wheat.jpeg',
  'gehun': '/wheat.jpeg',
  'corn': '/corn.jpg',
  'maize': '/corn.jpg',
  'makka': '/corn.jpg',
  'hybrid': '/corn.jpg',
  'bajra': '/bajra.jpg',
  'pearl millet': '/bajra.jpg',
  'jowar': '/jowar.webp',
  'sorghum': '/jowar.webp',
  'ragi': '/ragi.webp',
  'finger millet': '/ragi.webp',
  
  // Pulses & Dals
  'arhar': '/Arhar_Dal.webp',
  'arhar dal': '/Arhar_Dal.webp',
  'toor': '/Arhar_Dal.webp',
  'toor dal': '/Arhar_Dal.webp',
  'tur': '/Arhar_Dal.webp',
  'dal': '/Arhar_Dal.webp',
  'chana': '/Chana_Dal.webp',
  'chana dal': '/Chana_Dal.webp',
  'gram': '/Chana_Dal.webp',
  'bengal gram': '/Chana_Dal.webp',
  'chickpea': '/Chana_Dal.webp',
  'moong': '/Moong_Dal.jpg',
  'moong dal': '/Moong_Dal.jpg',
  'mung': '/Moong_Dal.jpg',
  'green gram': '/Moong_Dal.jpg',
  'urad': '/Arhar_Dal.webp',
  'urad dal': '/Arhar_Dal.webp',
  'black gram': '/Arhar_Dal.webp',
  'masoor': '/Arhar_Dal.webp',
  'masoor dal': '/Arhar_Dal.webp',
  'masur': '/Arhar_Dal.webp',
  'lentil': '/Arhar_Dal.webp',
  'red lentil': '/Arhar_Dal.webp',
  
  // Vegetables
  'potato': '/potato.jpg',
  'aloo': '/potato.jpg',
  'kufri': '/potato.jpg',
  'tomato': '/tomato.jpeg',
  'tamatar': '/tomato.jpeg',
  'onion': '/onions.avif',
  'onions': '/onions.avif',
  'pyaz': '/onions.avif',
  'cabbage': '/cabbage.jpeg',
  'green': '/cabbage.jpeg',
  'cauliflower': '/Cauliflower.jpg',
  'gobhi': '/Cauliflower.jpg',
  'phool gobhi': '/Cauliflower.jpg',
  
  // Fruits
  'apple': '/Apples.jpeg',
  'apples': '/Apples.jpeg',
  'seb': '/Apples.jpeg',
  'banana': '/Bananas.jpg',
  'bananas': '/Bananas.jpg',
  'kela': '/Bananas.jpg',
  'mango': '/Mangoes.jpg',
  'mangoes': '/Mangoes.jpg',
  'aam': '/Mangoes.jpg',
  'orange': '/Oranges.jpg',
  'oranges': '/Oranges.jpg',
  'santra': '/Oranges.jpg',
  'nagpur': '/Oranges.jpg',
  'mosambi': '/Oranges.jpg',
  
  // Cash Crops
  'cotton': '/cotton.jpg',
  'kapas': '/cotton.jpg',
  'sugarcane': '/sugercane.jpg',
  'ganna': '/sugercane.jpg',
  'jute': '/Jute.jpg',
  'pat': '/Jute.jpg',
  'rubber': '/Rubber.jpg',
  'tea': '/tea.jpg',
  'chai': '/tea.jpg',
  'coffee': '/coffee.jpeg',
  
  // Oilseeds
  'groundnut': '/Groundnut.jpg',
  'peanut': '/Groundnut.jpg',
  'moongfali': '/Groundnut.jpg',
  'java': '/Groundnut.jpg',
  'mustard': '/Mustard.jpg',
  'sarson': '/Mustard.jpg',
  'sunflower': '/Sunflower.jpg',
  'surajmukhi': '/Sunflower.jpg',
  
  // Spices
  'turmeric': '/turmeric.jpeg',
  'haldi': '/turmeric.jpeg',
  
  // Plantation / Others
  'arecanut': '/coffee.jpeg',
  'areca': '/coffee.jpeg',
  'supari': '/coffee.jpeg',
  'betel': '/coffee.jpeg',
  'sesame': '/Mustard.jpg',
  'til': '/Mustard.jpg',
}

// Default fallback - wheat field
const defaultCropImage = '/wheat.jpeg'

/**
 * Get crop image URL by crop name
 */
export const getCropImage = (cropName) => {
  if (!cropName) return defaultCropImage
  
  const normalizedName = cropName.toLowerCase().trim()
  
  // Direct match
  if (cropImageMap[normalizedName]) {
    return cropImageMap[normalizedName]
  }
  
  // Try each word separately
  const words = normalizedName.split(' ')
  for (const word of words) {
    if (word.length > 2 && cropImageMap[word]) {
      return cropImageMap[word]
    }
  }
  
  // Partial match
  for (const [key, value] of Object.entries(cropImageMap)) {
    if (key.length >= 3 && (normalizedName.includes(key) || key.includes(normalizedName))) {
      return value
    }
  }
  
  return defaultCropImage
}

export default getCropImage
