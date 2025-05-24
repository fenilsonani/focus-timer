# Focus Timer - Premium Study & Work App

A sophisticated, minimalist focus timer app built with React Native and Expo. Designed for professionals and students who need a powerful yet simple tool to manage their focus sessions, organize work into nested groups, and take notes.

## ✨ Features

### 🎯 Core Timer Functionality
- **Big, Beautiful Timer Display**: Large, readable circular progress timer with smooth animations
- **Gesture Support**: Intuitive touch controls with haptic feedback
- **Background Timer**: Continues running when app is in background
- **Smart Controls**: Large touch targets for easy interaction
- **Quick Time Adjustments**: Add 1m, 5m, or 10m with single taps

### 📁 Nested Group Management
- **Unlimited Nesting**: Create folders within folders for perfect organization
- **Color-Coded Groups**: Visual organization with customizable colors
- **Session Tracking**: Each group tracks its focus sessions
- **Hierarchical Navigation**: Easy browsing through nested structures

### 📝 Integrated Notes
- **Session Notes**: Take notes during or after focus sessions
- **Group Notes**: Organize notes by project or subject
- **Rich Text Support**: Format your notes for better readability
- **Quick Access**: Notes are always one tap away

### 🎨 Premium Design
- **Minimalist Interface**: Clean, distraction-free design
- **Dark/Light Themes**: Automatic or manual theme switching
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Haptic Feedback**: Tactile responses for better UX

### 💾 Data Management
- **Local Storage**: All data stored securely on device
- **Auto-Save**: Never lose your progress
- **Export/Import**: Backup and restore your data
- **Session History**: Track your productivity over time

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd focus-timer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## 🏗️ Architecture

### Tech Stack
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Context**: State management
- **AsyncStorage**: Local data persistence
- **React Native Reanimated**: Smooth animations
- **Expo Haptics**: Tactile feedback

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Basic components (Button, Card)
│   ├── timer/          # Timer-specific components
│   └── groups/         # Group management components
├── hooks/              # Custom React hooks
├── screens/            # Screen components
├── services/           # Data services (storage, etc.)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── constants/          # App constants and themes
```

### Key Components

#### Timer System
- `useTimer`: Custom hook managing timer state and background functionality
- `TimerDisplay`: Circular progress indicator with time display
- `TimerControls`: Play/pause/stop controls with haptic feedback

#### State Management
- `useAppState`: Global app state management with Context API
- `useTheme`: Theme switching and color management
- `storageService`: Persistent data storage with AsyncStorage

#### Group Management
- Nested folder structure with unlimited depth
- Color-coded organization
- Session tracking per group
- Hierarchical navigation

## 🎯 Usage

### Creating Focus Sessions
1. Set your desired focus duration (default 25 minutes)
2. Optionally select or create a group to organize your session
3. Tap the large play button to start
4. The app will track your progress and notify you when complete

### Managing Groups
1. Long-press anywhere to create a new group
2. Tap on a group to enter it
3. Create nested groups for detailed organization
4. Each group shows its session count and sub-groups

### Taking Notes
1. During a session, swipe up to access notes
2. Add session-specific notes or general project notes
3. Notes are automatically saved and organized by group

### Customization
- Switch between light and dark themes
- Adjust default focus duration
- Enable/disable haptic feedback
- Configure screen wake settings

## 🔧 Configuration

### App Settings
The app includes several customizable settings:

```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultFocusDuration: number;
  hapticFeedback: boolean;
  keepScreenAwake: boolean;
  autoStartBreaks: boolean;
  breakDuration: number;
  soundEnabled: boolean;
}
```

### Theme Customization
Colors and styling can be customized in `src/constants/theme.ts`:

```typescript
export const Colors = {
  light: {
    primary: '#6366F1',
    secondary: '#EC4899',
    // ... more colors
  },
  dark: {
    primary: '#818CF8',
    secondary: '#F472B6',
    // ... more colors
  },
};
```

## 📱 Platform Support

- **iOS**: Full feature support with native haptics
- **Android**: Full feature support with vibration feedback
- **Web**: Basic functionality (no haptics or background timer)

## 🚀 Performance

- **Optimized Rendering**: Minimal re-renders with proper memoization
- **Efficient Storage**: Incremental saves and smart caching
- **Background Processing**: Timer continues in background
- **Memory Management**: Proper cleanup and resource management

## 🔒 Privacy & Security

- **Local-First**: All data stored locally on device
- **No Analytics**: No tracking or data collection
- **Offline-First**: Works completely offline
- **Data Control**: Full export/import capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Pomodoro Technique
- Design influenced by modern productivity apps
- Built with the amazing Expo and React Native ecosystem

---

**Focus Timer** - Where productivity meets beautiful design. 🎯✨ 