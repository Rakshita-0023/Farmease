"""
Download ML model files from external storage
This script downloads the disease detection model if it doesn't exist locally
"""

import os
import sys
import requests
from pathlib import Path

# Model file URLs (you'll need to replace these with your actual URLs)
MODEL_URLS = {
    'disease_model.h5': 'YOUR_DISEASE_MODEL_URL_HERE',
    'crop_model.pkl': 'YOUR_CROP_MODEL_URL_HERE'
}

def download_file(url, destination):
    """Download a file from URL to destination with progress bar"""
    print(f"📥 Downloading {destination}...")
    
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 8192
        downloaded = 0
        
        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=block_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\r  Progress: {percent:.1f}%", end='', flush=True)
        
        print(f"\n✅ Downloaded {destination} ({downloaded / (1024*1024):.1f} MB)")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to download {destination}: {e}")
        return False

def download_from_google_drive(file_id, destination):
    """Download file from Google Drive using file ID"""
    print(f"📥 Downloading from Google Drive to {destination}...")
    
    URL = "https://drive.google.com/uc?export=download"
    
    session = requests.Session()
    response = session.get(URL, params={'id': file_id}, stream=True, timeout=300)
    
    # Handle large file confirmation
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            params = {'id': file_id, 'confirm': value}
            response = session.get(URL, params=params, stream=True, timeout=300)
            break
    
    total_size = int(response.headers.get('content-length', 0))
    block_size = 8192
    downloaded = 0
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=block_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    print(f"\r  Progress: {percent:.1f}%", end='', flush=True)
    
    print(f"\n✅ Downloaded {destination} ({downloaded / (1024*1024):.1f} MB)")
    return True

def main():
    """Download all required model files"""
    script_dir = Path(__file__).parent

    # Render health/startup must not wait on external model storage. Opt in to
    # downloads explicitly when a deployment has a controlled model artifact
    # source; otherwise the API starts with a documented degraded capability.
    if os.getenv('FARMEASE_DOWNLOAD_MODELS', 'false').lower() != 'true':
        print('ℹ️ Optional model downloads disabled; using files bundled in the image')
        return
    
    # Check for Google Drive file IDs in environment variables
    disease_model_id = os.getenv('DISEASE_MODEL_GDRIVE_ID')
    crop_model_id = os.getenv('CROP_MODEL_GDRIVE_ID')
    
    # Check for direct URLs
    disease_model_url = os.getenv('DISEASE_MODEL_URL')
    crop_model_url = os.getenv('CROP_MODEL_URL')
    
    # Disease model
    disease_model_path = script_dir / 'disease_model.h5'
    if not disease_model_path.exists():
        if disease_model_url:
            print("🔍 Disease model not found, downloading from URL...")
            download_file(disease_model_url, disease_model_path)
        elif disease_model_id:
            print("🔍 Disease model not found, downloading from Google Drive...")
            download_from_google_drive(disease_model_id, disease_model_path)
        else:
            print("⚠️ Disease model not found and no download URL/ID set")
            print("   Set DISEASE_MODEL_URL or DISEASE_MODEL_GDRIVE_ID environment variable")
            print("   The ML service will start but disease detection will not work")
    else:
        print(f"✅ Disease model already exists ({disease_model_path.stat().st_size / (1024*1024):.1f} MB)")
    
    # Crop model
    crop_model_path = script_dir / 'crop_model.pkl'
    if not crop_model_path.exists():
        if crop_model_url:
            print("🔍 Crop model not found, downloading from URL...")
            download_file(crop_model_url, crop_model_path)
        elif crop_model_id:
            print("🔍 Crop model not found, downloading from Google Drive...")
            download_from_google_drive(crop_model_id, crop_model_path)
        else:
            print("⚠️ Crop model not found and no download URL/ID set")
            print("   Using rule-based crop recommendation instead")
    else:
        print(f"✅ Crop model already exists ({crop_model_path.stat().st_size / 1024:.1f} KB)")
    
    print("\n✅ Model download check complete!")

if __name__ == '__main__':
    main()
