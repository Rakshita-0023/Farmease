# Production Setup Checklist - 10 Minutes

## ✅ Current Status
- [x] Models trained and working on localhost
- [x] disease_model.h5 (11 MB) - ready to upload
- [x] crop_model.pkl (3.4 MB) - ready to upload
- [ ] Models uploaded to Google Drive
- [ ] Render environment configured
- [ ] Production deployment working

---

## 📋 Step-by-Step Checklist

### Part 1: Upload Models to Google Drive (5 minutes)

- [ ] **Step 1.1**: Open [Google Drive](https://drive.google.com)
- [ ] **Step 1.2**: Upload `ml-service/disease_model.h5`
- [ ] **Step 1.3**: Upload `ml-service/crop_model.pkl`
- [ ] **Step 1.4**: Right-click `disease_model.h5` → Share → "Anyone with link" → Copy link
- [ ] **Step 1.5**: Right-click `crop_model.pkl` → Share → "Anyone with link" → Copy link

### Part 2: Extract File IDs (2 minutes)

From your Google Drive links, extract the FILE_ID:

**Disease Model Link:**
```
https://drive.google.com/file/d/YOUR_DISEASE_FILE_ID_HERE/view?usp=sharing
                                  ^^^^^^^^^^^^^^^^^^^^^^^^
```

**Crop Model Link:**
```
https://drive.google.com/file/d/YOUR_CROP_FILE_ID_HERE/view?usp=sharing
                                  ^^^^^^^^^^^^^^^^^^^^
```

- [ ] **Step 2.1**: Copy Disease Model FILE_ID: `_________________`
- [ ] **Step 2.2**: Copy Crop Model FILE_ID: `_________________`

### Part 3: Configure Render (3 minutes)

- [ ] **Step 3.1**: Go to [Render Dashboard](https://dashboard.render.com)
- [ ] **Step 3.2**: Find your ML service (farmease-plant-doctor)
- [ ] **Step 3.3**: Click "Environment" tab
- [ ] **Step 3.4**: Add environment variable:
  - Key: `DISEASE_MODEL_GDRIVE_ID`
  - Value: (paste your disease model FILE_ID)
- [ ] **Step 3.5**: Add environment variable:
  - Key: `CROP_MODEL_GDRIVE_ID`
  - Value: (paste your crop model FILE_ID)
- [ ] **Step 3.6**: Click "Settings" tab
- [ ] **Step 3.7**: Change "Start Command" to: `bash start.sh`
- [ ] **Step 3.8**: Click "Save Changes"

### Part 4: Verify Deployment (2 minutes)

- [ ] **Step 4.1**: Wait for Render to redeploy (1-2 minutes)
- [ ] **Step 4.2**: Check Render logs for:
  ```
  ✅ Downloaded disease_model.h5 (11.0 MB)
  ✅ Downloaded crop_model.pkl (3.4 MB)
  ✅ Disease detection model loaded successfully
  ```
- [ ] **Step 4.3**: Test Plant Doctor on production: https://farmease-zeta.vercel.app/plant-doctor
- [ ] **Step 4.4**: Test Crop Recommendation on production: https://farmease-zeta.vercel.app/crop-recommendation

---

## 🎉 Success Indicators

When everything is working, you should see:

### Plant Doctor:
- Upload image → Click "Start AI Analysis" → See disease name and confidence score

### Crop Recommendation:
- Enter soil/climate data → Click "Get Recommendation" → See crop suggestion

---

## 🆘 Troubleshooting

### Issue: "Bad Gateway" error persists
**Solution**: Wait 30-60 seconds for the ML service to download models and start

### Issue: "Not Found" error
**Solution**: 
1. Check that Google Drive links are set to "Anyone with link"
2. Verify FILE_IDs are correct (no extra characters)
3. Check Render logs for download errors

### Issue: Models not downloading
**Solution**:
1. Verify start command is `bash start.sh` (not `python app.py`)
2. Check environment variables are saved
3. Manually trigger redeploy in Render

---

## 📞 Need Help?

Refer to detailed guides:
- `ml-service/UPLOAD_GUIDE.txt` - Visual step-by-step guide
- `ml-service/QUICK_SETUP.md` - 5-minute quick start
- `ml-service/MODEL_SETUP.md` - Technical documentation

---

## ✨ After Completion

Once done, both features will work identically on:
- ✅ Localhost (already working)
- ✅ Production (will work after setup)

No code changes needed - just configuration!
