# 75 Hard Habit Tracker

A React Native mobile application for tracking the 75 Hard challenge - a mental toughness program that requires completing daily tasks for 75 consecutive days.

## 🎯 Features

- **Daily Task Tracking**: Monitor completion of the core 75 Hard tasks
- **Mood Tracking**: Record your daily mood with emoji selection
- **Weight Tracking**: Log your daily weight to monitor progress
- **Progress Photos**: Capture daily photos to visualize your transformation
- **Day Navigation**: Navigate through all 75 days with unlock progression
- **Dark Theme**: Beautiful dark theme with custom DM-Sans font
- **Data Persistence**: All progress is saved locally using AsyncStorage
- **MVVM Architecture**: Clean, testable code structure with separation of concerns

## 📱 The 75 Hard Challenge

The 75 Hard challenge consists of completing these tasks every day for 75 consecutive days:

1. **Follow a Diet**: Stick to a structured eating plan (no cheat meals or alcohol)
2. **Workout Twice**: Complete two 45-minute workouts (one must be outdoors)
3. **Drink Water**: Consume 1 gallon (3.8L) of water daily
4. **Read**: Read 10 pages of a non-fiction, educational book
5. **Take a Photo**: Capture a daily progress photo

If you miss any task on any day, you must restart from Day 1.

## 🏗️ Architecture

This app follows the **MVVM (Model-View-ViewModel)** pattern for clean separation of concerns:

### Models (`/src/models`)
- **Task.ts**: Defines task structure and default 75 Hard tasks
- **Attempt.ts**: Represents daily attempt with task completions, mood, weight, and photo
- **Day.ts**: Represents a single day in the 75-day challenge

### Services (`/src/services`)
- **StorageService.ts**: Handles data persistence with AsyncStorage
- **ImageService.ts**: Manages photo capture and selection using Expo ImagePicker
- **ValidationService.ts**: Provides input validation and formatting utilities

### ViewModels (`/src/viewmodels`)
- **AppViewModel.ts**: Manages overall application state and navigation
- **DayViewModel.ts**: Handles business logic for individual day operations

### Views (`/src/screens` & `/src/components`)
- **MainScreen.tsx**: Primary application screen
- **TaskRow.tsx**: Individual task display and toggle component
- **EmojiPicker.tsx**: Mood selection interface
- **PhotoPicker.tsx**: Photo capture and display component
- **DayCard.tsx**: Day navigation card component
- **WeightInput.tsx**: Weight input with validation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 75-hard-habit-tracker-oss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🧪 Testing

The project includes comprehensive unit tests for ViewModels and business logic.

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Test Structure
- **ViewModel Tests**: Located in `/src/viewmodels/__tests__/`
- **Service Tests**: Can be added in `/src/services/__tests__/`
- **Component Tests**: Can be added in `/src/components/__tests__/`

## 🎨 Styling & Theme

The app uses a custom dark theme with:
- **Colors**: Dark charcoal backgrounds with green/blue accents
- **Typography**: DM-Sans font family with consistent sizing scale
- **Spacing**: 8px base unit with consistent spacing scale
- **Components**: Rounded corners, subtle shadows, and smooth animations

Theme configuration is centralized in `/src/styles/theme.ts`.

## 📁 Project Structure

```
src/
├── assets/           # Fonts and static assets
├── components/       # Reusable UI components
├── models/          # Data models and interfaces
├── screens/         # Screen components
├── services/        # Business logic services
├── styles/          # Theme and styling
├── utils/           # Utility functions
└── viewmodels/      # MVVM ViewModels
```

## 🔧 Configuration

### TypeScript Configuration
- Strict mode enabled
- Path mapping configured for `@/*` imports
- Includes proper type checking for React Native

### Jest Configuration
- Configured for React Native testing
- Mocks for AsyncStorage, Expo ImagePicker, and fonts
- Coverage collection for ViewModels and services

### ESLint Configuration
- React Native and TypeScript rules
- Consistent code formatting and best practices

## 📱 Key Features Explained

### Day Progression System
- Days unlock sequentially as previous days are completed
- Current day is highlighted with special styling
- Progress indicators show completion percentage for each day

### Data Persistence
- All data is stored locally using AsyncStorage
- Automatic migration handling for app updates
- Data survives app restarts and device reboots

### Photo Management
- Integration with device camera and photo library
- Proper permission handling
- Image validation and error handling

### Input Validation
- Weight input with proper numeric validation
- Required field validation for day completion
- User-friendly error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing MVVM architecture
- Write unit tests for new ViewModels and services
- Use TypeScript strictly (no `any` types)
- Follow the established naming conventions
- Update documentation for new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Andy Frisella** - Creator of the 75 Hard challenge
- **Expo Team** - For the excellent React Native development platform
- **React Native Community** - For the amazing ecosystem and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include device information, error messages, and steps to reproduce

---

**Start your 75 Hard journey today and build mental toughness that lasts a lifetime! 💪**
