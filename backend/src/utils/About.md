# Application Documentation

## Table of Contents
1. Application Overview
2. Project Structure
3. Environment Setup
4. Key Components
5. State Management with Redux
6. Routing
7. Creating New Modules
8. Styling Approach
9. Testing Framework
10. Build and Deployment
11. API Integration
12. Troubleshooting
13. Contribution Guidelines

## 1. Application Overview
This React-based application serves as a flexible platform for hosting various experiments, with the current focus on integrating the Number Switching Task. It utilizes Redux for state management and React Router for navigation.

## 2. Project Structure
Key directories and files:
- `/src/components`: React components
- `/src/redux`: Redux store, slices, and actions
- `/src/routes`: Route definitions
- `/src/styles`: Global styles and CSS modules
- `/src/utils`: Utility functions
- `App.js`: Main application component
- `index.js`: Entry point

## 3. Environment Setup
- Required: Node.js 14.x or higher
- Install dependencies: `npm install`
- Start development server: `npm start`
- Build for production: `npm run build`

## 4. Key Components
Example: EventDetail component in `src/components/EventDetail.js`
- Demonstrates fetching data with Redux actions
- Displays event details
- Handles user interactions (edit, delete)
- Integrates with React Router

## 5. State Management with Redux
- Store configuration: `src/redux/store.js`
- Event slice: `src/redux/eventSlice.js`
- Key concepts: Actions, reducers, selectors, and async thunks

## 6. Routing
- Defined in `src/App.js` using React Router
- Current routes: event detail (/event/:id), edit event (/edit/:id)
- To add routes: Define in App.js, create component, update navigation

## 7. Creating New Modules
Steps for adding a new module (e.g., Number Switching Task):
1. Create directory in `src/components/`
2. Implement main component and sub-components
3. Create Redux slice if needed
4. Add routes in `App.js`
5. Update main navigation

## 8. Styling Approach
- CSS Modules for component-specific styles
- Global styles in `src/styles/global.css`
- Example usage: Import styles from `[ComponentName].module.css`

## 9. Testing Framework
- Jest and React Testing Library
- Run tests: `npm test`
- Example test file: `src/components/EventDetail.test.js`

## 10. Build and Deployment
- Development: `npm start`
- Production build: `npm run build`
- Continuous deployment via Netlify (triggered by push to `main` branch)

## 11. API Integration
- Centralized API calls in `src/api/index.js`
- Uses axios for HTTP requests
- Environment-based API URL configuration

## 12. Troubleshooting
Common issues and solutions:
- State updates: Check Redux actions and reducers
- Routing: Verify route definitions and component rendering
- Performance: Use React DevTools and Redux DevTools

## 13. Contribution Guidelines
1. Fork repository
2. Create feature branch
3. Make changes and commit
4. Push to fork
5. Create pull request
6. Address code review feedback

Code Style:
- Use ESLint and Prettier
- Follow React Hooks best practices
- Write meaningful commit messages

Note: For full code implementations, please refer to the respective files in the project repository.
