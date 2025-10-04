# YouTube Transcript AI - Chrome Extension

A Chrome extension that provides AI-powered transcripts and summaries for YouTube videos. The extension appears as a popup on the right side of YouTube video pages.

## Features

- 📝 **Real-time Transcript**: Get transcripts for any YouTube video
- 🤖 **AI Summary**: Powered by Google Gemini for intelligent summaries
- 📊 **Video Metadata**: View video information, duration, views, and more
- 🎨 **Clean UI**: Modern, responsive design that doesn't interfere with YouTube
- ⚡ **Fast Loading**: Optimized for quick transcript retrieval

## Prerequisites

1. **Backend API**: Make sure the backend server is running on `http://localhost:8000`
2. **API Key**: Ensure your `GEMINI_API_KEY` is set in the backend's `.env` file

## Building the Extension

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the extension**:
   ```bash
   npm run build:extension
   ```

3. **The built extension will be in the `dist/` folder**

## Installing the Extension

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer mode** (toggle in the top right)
3. **Click "Load unpacked"**
4. **Select the `dist/` folder** from this project
5. **The extension should now appear in your extensions list**

## Using the Extension

1. **Navigate to any YouTube video**
2. **The transcript popup will automatically appear** on the right side
3. **Switch between tabs** to view:
   - **Transcript**: Full sentence-by-sentence transcript
   - **Summary**: AI-generated summary of the video
   - **Info**: Video metadata (title, channel, duration, views)
4. **Click the × button** to close the popup

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build:extension
```

### File Structure

```
frontend/
├── src/
│   ├── content.ts          # Content script for YouTube injection
│   └── popup.ts            # Extension popup script
├── public/
│   └── manifest.json       # Chrome extension manifest
├── popup.html              # Extension popup HTML
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```

## Troubleshooting

### Extension Not Working
- Make sure the backend server is running on `http://localhost:8000`
- Check that your `GEMINI_API_KEY` is properly set
- Verify the extension is enabled in Chrome

### CORS Issues
- The extension is configured to work with `localhost:8000`
- Make sure your backend allows requests from the extension

### No Transcript Available
- Some videos may not have transcripts available
- Check if the video has captions enabled

## API Integration

The extension communicates with the backend API at:
- **Endpoint**: `GET /vid/get-transcript?video_id={videoId}`
- **Response**: JSON with transcript, summary, and metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## License

MIT License - see LICENSE file for details