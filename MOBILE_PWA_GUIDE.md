# PsyFi Mobile & PWA Guide

## 📱 Progressive Web App Features

PsyFi is now a fully functional Progressive Web App that can be installed on mobile devices and used offline.

### Installation Instructions

#### iOS (iPhone/iPad)
1. Open Safari and navigate to `http://your-domain.com`
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. PsyFi will appear as an app icon on your home screen

#### Android (Chrome)
1. Open Chrome and navigate to `http://your-domain.com`
2. Tap the menu (⋮) and select "Add to Home Screen"
3. Or look for the "Install app" prompt at the bottom
4. Confirm installation
5. PsyFi will appear in your app drawer

#### Desktop (Chrome/Edge)
1. Open Chrome or Edge and navigate to `http://your-domain.com`
2. Look for the install icon (⊕) in the address bar
3. Click "Install PsyFi"
4. App will open in standalone window

---

## ⚡ Quick Presets

Four optimized presets for different use cases:

### Quick Test (⚡)
- **Size**: 32×32 pixels
- **Steps**: 10 iterations
- **Use case**: Fast validation, testing, mobile quick runs
- **Speed**: ~0.1-0.3 seconds

### Standard (⬡)
- **Size**: 64×64 pixels
- **Steps**: 20 iterations
- **Use case**: Default balanced simulation
- **Speed**: ~0.5-1.5 seconds

### Detailed (✨)
- **Size**: 128×128 pixels
- **Steps**: 50 iterations
- **Use case**: High-quality results, research
- **Speed**: ~3-8 seconds

### Deep Dive (🌀)
- **Size**: 256×256 pixels
- **Steps**: 100 iterations
- **Use case**: Maximum detail, publication quality
- **Speed**: ~15-60 seconds

---

## 📐 Mobile Optimizations

### Touch Targets
- All interactive elements meet the 44×44px minimum touch target
- Preset buttons have larger touch areas (100px+ height)
- Form inputs sized for comfortable thumb typing
- Primary action button optimized for one-handed use

### Responsive Layout

#### Tablet (≤768px)
- Two-column preset grid
- Single-column input fields
- Single-column metrics display
- Optimized spacing and padding

#### Mobile (≤480px)
- Single-column preset grid
- Full-width buttons
- Reduced font sizes
- Compact header and footer

### Typography
- Base font size: 16px (prevents iOS zoom)
- System fonts for fast loading
- JetBrains Mono for code/metrics
- Optimized letter-spacing for readability

---

## 🔌 Offline Capabilities

### Service Worker Features
- **Caching Strategy**: Cache-first for static assets
- **Cached Resources**:
  - Home page (/)
  - CSS stylesheet
  - JavaScript app
  - PWA manifest
- **Network-first** for API calls (/simulate/)

### Offline Behavior
1. **First Visit**: Requires network connection
2. **Subsequent Visits**: App loads from cache
3. **Simulations**: Requires network (API call)
4. **UI Interaction**: Works offline

---

## 🎨 Mobile UI Features

### Dark Mode
- Near-black backgrounds (#0a0a0f)
- Cyan/magenta/violet accents
- Optimized for OLED screens
- Reduces battery usage

### Visual Feedback
- Active states on preset buttons
- Loading spinner during computation
- Error messages with clear styling
- Animated metric bars
- Smooth transitions

### Gestures
- Tap preset buttons to apply
- Scroll to view all metrics
- Pull-to-refresh (browser dependent)
- Touch-friendly form controls

---

## ⚙️ Technical Specifications

### PWA Manifest
```json
{
  "name": "PsyFi - Consciousness Field Simulator",
  "short_name": "PsyFi",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#00ffff",
  "orientation": "portrait"
}
```

### Viewport Configuration
```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0,
               maximum-scale=1.0, user-scalable=no">
```

### iOS Specific
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style"
      content="black-translucent">
```

---

## 📊 Performance Metrics

### Load Times (on mobile)
- **Initial Load**: ~1-2 seconds (with network)
- **Cached Load**: ~200-500ms (offline)
- **Simulation**: Varies by preset (see above)

### Data Usage
- **First Load**: ~150KB (HTML + CSS + JS + fonts)
- **Subsequent**: ~20KB (API responses only)
- **Offline**: 0KB (cached)

### Battery Impact
- **Idle**: Minimal (dark mode optimized)
- **Simulation**: Moderate (CPU intensive)
- **Recommendation**: Use lower presets on battery

---

## 🔒 Security Considerations

### HTTPS Required
- Service workers require HTTPS in production
- Localhost exempted for development
- Install fails on HTTP in production

### Data Privacy
- All simulations run server-side
- No user data stored locally
- No tracking or analytics
- API calls are ephemeral

---

## 🐛 Troubleshooting

### PWA Won't Install
1. **Check HTTPS**: Must use secure connection
2. **Check Manifest**: Verify manifest.json loads
3. **Check Service Worker**: Verify sw.js loads
4. **Clear Cache**: Try hard refresh (Ctrl+Shift+R)

### Presets Don't Work
1. **Check JavaScript**: Look for console errors
2. **Verify Elements**: Ensure preset buttons exist
3. **Check Network**: API must be reachable

### Offline Mode Issues
1. **Clear Service Worker**: Dev tools → Application → Service Workers
2. **Unregister**: Click "Unregister" and refresh
3. **Reinstall**: Re-register service worker

### Mobile Layout Broken
1. **Check Viewport**: Verify viewport meta tag
2. **Check Media Queries**: Test at different widths
3. **Check Browser**: Test in Chrome/Safari
4. **Check Cache**: Clear browser cache

---

## 📱 Best Practices

### For Users
- Use Quick Test preset on mobile to save battery
- Install as PWA for better performance
- Use landscape mode for larger presets
- Close other tabs during heavy simulations

### For Developers
- Test on real devices, not just emulators
- Monitor performance with DevTools
- Check all touch targets are 44px+
- Validate on iOS Safari and Chrome Android
- Test offline mode thoroughly

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Native app wrapper (Capacitor/React Native)
- [ ] Push notifications for long simulations
- [ ] Local storage for simulation history
- [ ] Background sync for queued simulations
- [ ] WebGL field visualization
- [ ] Haptic feedback on interactions
- [ ] Share results to social media
- [ ] Export simulation data

### Performance Ideas
- [ ] WebAssembly for faster computation
- [ ] Web Workers for parallel processing
- [ ] IndexedDB for result caching
- [ ] Lazy loading for code splitting

---

## 📚 Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

<div align="center">

**⬡ Built for consciousness, optimized for mobile ⬡**

[PsyFi Main](/) • [API Docs](/docs) • [GitHub](https://github.com/scrimshawlife-ctrl/Psy-Fi)

</div>
