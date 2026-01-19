# Quick Setup Guide - 5 Minutes

## Step 1: Upload Model to Google Drive (2 minutes)

1. Open [Google Drive](https://drive.google.com) in your browser
2. Click "New" → "File upload"
3. Select `ml-service/disease_model.h5` from your computer
4. Wait for upload to complete

## Step 2: Make it Public (1 minute)

1. Right-click on the uploaded `disease_model.h5` file
2. Click "Share"
3. Click "Change to anyone with the link"
4. Click "Copy link"

## Step 3: Extract File ID (30 seconds)

Your link looks like:
```
https://drive.google.com/file/d/1ABC123XYZ456/view?usp=sharing
```

The File ID is the part between `/d/` and `/view`:
```
1ABC123XYZ456
```

## Step 4: Configure Render (1 minute)

1. Go to your Render dashboard
2. Open your ML service (farmease-plant-doctor)
3. Click "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Add:
   - Key: `DISEASE_MODEL_GDRIVE_ID`
   - Value: `1ABC123XYZ456` (your actual file ID)
6. Click "Save Changes"

## Step 5: Update Start Command (30 seconds)

1. In Render dashboard, go to "Settings"
2. Find "Start Command"
3. Change it to: `bash start.sh`
4. Click "Save Changes"

## Step 6: Deploy

Render will automatically redeploy. The service will:
1. Download the model from Google Drive
2. Load it into memory
3. Start accepting requests

Check the logs to see:
```
📥 Downloading from Google Drive to disease_model.h5...
✅ Downloaded disease_model.h5 (11.6 MB)
✅ Disease detection model loaded successfully
```

## Done! 🎉

Your Plant Doctor should now work on the hosted link!

Test it at: `https://your-app.vercel.app/plant-doctor`

---

## Alternative: Use Dropbox

If you prefer Dropbox:

1. Upload `disease_model.h5` to Dropbox
2. Right-click → "Share" → "Create link"
3. Copy the link (e.g., `https://www.dropbox.com/s/abc123/disease_model.h5?dl=0`)
4. Change `?dl=0` to `?dl=1` at the end
5. Set environment variable:
   - Key: `DISEASE_MODEL_URL`
   - Value: `https://www.dropbox.com/s/abc123/disease_model.h5?dl=1`

Then update `download_models.py` to use `DISEASE_MODEL_URL` instead of Google Drive.
