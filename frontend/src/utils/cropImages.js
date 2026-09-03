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
  'bajra': '/corn.jpg',
  'pearl millet': '/corn.jpg',
  'jowar': '/corn.jpg',
  'sorghum': '/corn.jpg',
  'ragi': '/rice.jpg',
  'finger millet': '/rice.jpg',
  
  // Pulses & Dals
  'arhar': '/Arhar_Dal.webp',
  'arhar dal': '/Arhar_Dal.webp',
  'toor': '/Arhar_Dal.webp',
  'toor dal': '/Arhar_Dal.webp',
  'tur': '/Arhar_Dal.webp',
  'dal': '/Arhar_Dal.webp',
  'chana': '/Arhar_Dal.webp',
  'chana dal': '/Arhar_Dal.webp',
  'gram': '/Arhar_Dal.webp',
  'bengal gram': '/Arhar_Dal.webp',
  'chickpea': '/Arhar_Dal.webp',
  'moong': '/Arhar_Dal.webp',
  'moong dal': '/Arhar_Dal.webp',
  'mung': '/Arhar_Dal.webp',
  'green gram': '/Arhar_Dal.webp',
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
  'cabbage': '/potato.jpg',
  'green': '/potato.jpg',
  'cauliflower': '/potato.jpg',
  'gobhi': '/potato.jpg',
  'phool gobhi': '/potato.jpg',
  
  // Fruits
  'apple': '/tomato.jpeg',
  'apples': '/tomato.jpeg',
  'seb': '/tomato.jpeg',
  'banana': '/Sunflower.jpg',
  'bananas': '/Sunflower.jpg',
  'kela': '/Sunflower.jpg',
  'mango': '/Sunflower.jpg',
  'mangoes': '/Sunflower.jpg',
  'aam': '/Sunflower.jpg',
  'orange': '/tomato.jpeg',
  'oranges': '/tomato.jpeg',
  'santra': '/tomato.jpeg',
  'nagpur': '/tomato.jpeg',
  'mosambi': '/tomato.jpeg',
  
  // Cash Crops
  'cotton': '/Rubber.jpg',
  'kapas': '/Rubber.jpg',
  'sugarcane': '/sugercane.jpg',
  'ganna': '/sugercane.jpg',
  'jute': '/sugercane.jpg',
  'pat': '/sugercane.jpg',
  'rubber': '/Rubber.jpg',
  'tea': '/tea.jpg',
  'chai': '/tea.jpg',
  'coffee': '/tea.jpg',
  
  // Oilseeds
  'groundnut': '/Sunflower.jpg',
  'peanut': '/Sunflower.jpg',
  'moongfali': '/Sunflower.jpg',
  'java': '/Sunflower.jpg',
  'mustard': '/Sunflower.jpg',
  'sarson': '/Sunflower.jpg',
  'sunflower': '/Sunflower.jpg',
  'surajmukhi': '/Sunflower.jpg',
  
  // Spices
  'turmeric': '/turmeric.jpeg',
  'haldi': '/turmeric.jpeg',
  
  // Plantation / Others
  'arecanut': '/tea.jpg',
  'areca': '/tea.jpg',
  'supari': '/tea.jpg',
  'betel': '/tea.jpg',
  'sesame': '/Sunflower.jpg',
  'til': '/Sunflower.jpg',
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
