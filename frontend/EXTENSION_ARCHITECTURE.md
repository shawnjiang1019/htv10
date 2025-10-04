# YouTube Transcript AI - Extension Architecture

## Overview

This Chrome extension provides AI-powered transcript analysis and bias detection for YouTube videos. It's built with Vite for modern development and uses a content script to inject a collapsible popup into YouTube's sidebar with automatic dark mode support.

## Project Structure

```
frontend/
├── src/
│   ├── content.ts          # Main content script + CSS (injects into YouTube)
│   ├── popup-component.ts  # Reusable popup component
│   └── popup.ts            # Extension popup (when clicking extension icon)
├── public/
│   └── manifest.json       # Chrome extension configuration
├── popup.html              # Extension popup HTML
├── vite.config.ts          # Vite build configuration
└── dist/                   # Built extension (ready to install)
```

## How It Works

### 1. Content Script Injection

**File**: `src/content.ts`

The content script automatically runs on YouTube video pages and:

- **Detects YouTube videos**: Checks for `/watch` URLs
- **Waits for page load**: Uses `waitForElement()` to find YouTube's `#secondary` sidebar
- **Injects popup**: Creates and inserts the collapsible transcript analysis popup
- **Handles navigation**: Detects YouTube's SPA navigation between videos
- **Auto dark mode**: Automatically adapts to system theme preferences

```typescript
// Main injection function
async function injectPopup() {
  if (window.location.hostname !== "www.youtube.com") return;
  if (!window.location.pathname.startsWith("/watch")) return;
  
  // Inject CSS styles first
  injectStyles();
  
  // Extract video ID and create popup
  const videoId = getVideoId();
  const transcriptPopup = createTranscriptPopup(videoId);
  
  // Inject into YouTube sidebar
  const secondary = await waitForElement("#secondary");
  secondary.prepend(transcriptPopup);
}
```

### 2. Popup Component

**File**: `src/popup-component.ts`

The popup component provides:

- **Modular design**: Reusable popup creation and event handling
- **Dummy data**: Hardcoded data for demonstration (easy to replace with API)
- **Event listeners**: Handles close button and link interactions
- **Clean separation**: UI logic separated from injection logic

```typescript
// Component exports
export function createTranscriptPopup(videoId: string): HTMLElement
export function setupPopupEventListeners(popup: HTMLElement): void
```

### 3. Data Structure

**Dummy Data**: Currently uses hardcoded data for demonstration:

```typescript
const DUMMY_DATA = {
  summary: "AI-generated video summary...",
  alternateLinks: [
    {
      title: "Resource Title",
      url: "https://example.com",
      source: "Source Name",
      description: "Brief description"
    }
  ],
  biasScore: 0.15,    // 0-1 scale (0 = unbiased, 1 = highly biased)
  confidence: 0.87    // 0-1 scale (0 = low confidence, 1 = high confidence)
};
```

### 4. Visual Components

**File**: `src/content.ts` (inline CSS)

The popup includes:

- **Collapsible header**: Gradient background with close button
- **Summary Section**: AI-generated summary with bias indicator
- **Resources Section**: List of unbiased alternative sources
- **Footer**: Video ID and branding
- **Dark mode support**: Automatic theme detection and adaptation

### 5. Bias Analysis

The extension provides:

- **Bias Level**: Low (green), Moderate (orange), High (red)
- **Confidence Score**: Percentage of AI confidence
- **Visual Indicators**: Color-coded bias assessment

### 6. Dark Mode Support

**Automatic Theme Detection**:

- **System preference**: Uses `@media (prefers-color-scheme: dark)` CSS queries
- **Real-time updates**: Automatically adapts when system theme changes
- **Consistent styling**: Dark theme maintains visual hierarchy and readability
- **No JavaScript required**: Pure CSS-based theme detection

**Dark Mode Features**:
- Dark background (`#1f2937`) with subtle borders
- Adjusted text colors for optimal contrast
- Modified link hover states and shadows
- Dark scrollbar styling
- Consistent with modern dark UI patterns

## Build Process

### Vite Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts')  // Content script entry
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'content' ? 'content.js' : '[name].js'
        }
      }
    }
  }
})
```

### Build Commands

```bash
# Development
npm run dev

# Build extension
npm run build:extension

# Copy manifest and HTML files
npm run copy-manifest
```

## Chrome Extension Manifest

**File**: `public/manifest.json`

Key configurations:

- **Manifest V3**: Latest Chrome extension format
- **Content Scripts**: Automatically injects on YouTube pages
- **Permissions**: Access to YouTube and localhost backend
- **Host Permissions**: Allows requests to YouTube and backend API

## Key Features

### 1. Automatic Detection
- Runs on all YouTube video pages
- Handles YouTube's single-page app navigation
- Prevents duplicate popups

### 2. Smart Injection
- Tries to inject into YouTube's sidebar (`#secondary`)
- Falls back to document body if sidebar not found
- Uses `waitForElement()` for reliable timing

### 3. Collapsible Interface
- Click to minimize/expand popup
- Shows only header when collapsed
- Smooth animations and transitions
- Space-efficient design

### 4. Dark Mode Support
- Automatic system theme detection
- Real-time theme switching
- Consistent dark UI patterns
- No JavaScript required for theme detection

### 5. Responsive Design
- Mobile-friendly layout
- Custom scrollbar styling
- Hover effects and animations
- Adapts to different screen sizes

### 6. Easy Data Updates
- Centralized dummy data structure
- Easy to replace with real API data
- Maintains all styling and functionality

## Development Workflow

1. **Make changes** to `src/content.ts` or `src/popup-component.ts`
2. **Build extension**: `npm run build:extension`
3. **Reload extension** in Chrome (`chrome://extensions/`)
4. **Test on YouTube** video pages
5. **Test dark mode** by changing system theme

## Future Integration

To connect with the backend API:

1. Replace `DUMMY_DATA` with API calls
2. Update `fetchTranscript()` function
3. Add error handling for API failures
4. Implement loading states

## Troubleshooting

### Extension Not Loading
- Check manifest.json syntax
- Verify content script file name matches manifest
- Reload extension in Chrome

### Popup Not Appearing
- Check browser console for errors
- Verify YouTube page structure hasn't changed
- Test with different video URLs

### Styling Issues
- CSS is inline in content.ts (no separate CSS file)
- Check for CSS class name conflicts
- Verify dark mode is working with system theme
- Test both light and dark modes

## Key Files

- **`content.ts`**: Main logic, CSS styles, and injection logic
- **`popup-component.ts`**: Reusable popup component and event handling
- **`manifest.json`**: Chrome extension configuration
- **`vite.config.ts`**: Build system configuration

## Summary

This architecture provides a solid foundation for a Chrome extension with:

- **Modular design** with separated concerns
- **Automatic dark mode** support
- **Collapsible interface** for better UX
- **Easy maintenance** with inline CSS
- **Future-ready** for API integration

The extension can be easily extended with real AI analysis and backend integration while maintaining its clean, maintainable structure.
