# ML Model Setup for Production

This guide explains how to host the ML model files externally and configure the service to download them on startup.

## Option 1: Google Drive (Recommended)

### Step 1: Upload Model to Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Upload `disease_model.h5` (11.6 MB)
3. Upload `crop_model.pkl` (if you have it)

### Step 2: Get Shareable Link

1. Right-click on the uploaded file
2. Click "Share" → "Get link"
3. Set permissions to "Anyone with the link can view"
4. Copy the link (it will look like: `https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing`)

### Step 3: Extract File ID

From the link `https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing`

The FILE_ID is: `1ABC123xyz`

### Step 4: Set Environment Variables on Render

In your Render ML service dashboard:

1. Go to "Environment" tab
2. Add these variables:
   - `DISEASE_MODEL_GDRIVE_ID` = `YOUR_FILE_ID_HERE`
   - `CROP_MODEL_GDRIVE_ID` = `YOUR_FILE_ID_HERE` (optional)

### Step 5: Update Start Command on Render

In Render service settings, set the start command to:
```bash
bash start.sh
```

## Option 2: Direct URL (Dropbox, AWS S3, etc.)

If you're using Dropbox or another service:

1. Upload the model file
2. Get a direct download link
3. Update `download_models.py` to use direct URLs instead of Google Drive

## Option 3: GitHub Release Assets

1. Create a GitHub release
2. Attach model files as release assets
3. Use the release asset URL in the download script

## Testing Locally

To test the download script:

```bash
cd ml-service

# Set environment variable
export DISEASE_MODEL_GDRIVE_ID="your_file_id_here"

# Run download script
python download_models.py

# Start service
python app.py
```

## Verifying Model Files

After deployment, check the logs to ensure models are downloaded:

```
✅ Disease model already exists (11.6 MB)
✅ Disease detection model loaded successfully
✅ Loaded 38 disease classes
```

## Troubleshooting

### Model not downloading
- Check that the Google Drive link is set to "Anyone with the link"
- Verify the FILE_ID is correct
- Check Render logs for download errors

### Service crashes on startup
- Model file might be corrupted during download
- Check TensorFlow version compatibility
- Verify all dependencies are installed

### 502 Bad Gateway
- Service might be taking too long to start (downloading model)
- Increase Render timeout settings
- Consider pre-downloading models to a persistent volume
