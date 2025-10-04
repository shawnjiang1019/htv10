# Chrome Extension Installation Guide

## Quick Installation Steps

1. **Make sure your backend is running**:
   ```bash
   cd backend
   python app.py
   ```
   (Should be running on http://localhost:8000)

2. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**:
   - Click "Load unpacked"
   - Navigate to: `C:\Users\nolaw\OneDrive\Desktop\htv10\frontend\dist`
   - Select the `dist` folder and click "Select Folder"

4. **Test the Extension**:
   - Go to any YouTube video (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   - The transcript popup should appear on the right side
   - Click between the tabs to see Transcript, Summary, and Info

## Troubleshooting

### Extension Not Loading
- Make sure you selected the `dist` folder, not the `frontend` folder
- Check that all files are present in the dist folder:
  - manifest.json
  - content.js
  - popup.html
  - popup.js
  - assets/ folder with CSS files

### Popup Not Appearing on YouTube
- Make sure you're on a YouTube video page (URL contains `/watch?v=`)
- Check the browser console for any errors (F12 → Console)
- Ensure the backend server is running on localhost:8000

### Backend Connection Issues
- Verify the backend is running: http://localhost:8000/vid/get-transcript?video_id=test
- Check that your GEMINI_API_KEY is set in the backend's .env file
- Make sure there are no CORS issues

## Files in dist/ folder
- `manifest.json` - Chrome extension configuration
- `content.js` - Script that runs on YouTube pages
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `assets/` - CSS and other assets

The extension is now ready to use! 🎉
