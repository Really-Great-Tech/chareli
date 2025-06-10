# Testing Setup Documentation

## Overview
This document outlines the current testing setup for the Chareli application. Our testing strategy evolves with the application - we add, modify, and remove tests as needed to maintain quality while staying practical.

## Testing Philosophy
- **Focus on business logic** over UI rendering
- **Test critical paths** that affect user experience
- **Maintain tests that add value** - remove tests that don't
- **Evolve with the codebase** - tests should grow and change with features

## Testing Libraries Used

### Frontend (Client)
- **Vitest** - Modern testing framework optimized for Vite
- **@testing-library/jest-dom** - Additional DOM matchers for assertions
- **Node environment** - Simplified testing without DOM complexity

### Backend (Server)
- **Jest** - Popular testing framework for Node.js
- **Supertest** - HTTP assertion library for testing APIs
- **@types/jest** - TypeScript definitions for Jest
- **ts-jest** - TypeScript preprocessor for Jest

## Test Commands

### Frontend Tests
```bash
cd Client
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Backend Tests
```bash
cd Server
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Current Test Coverage

### Backend Tests
**Controllers Currently Tested:**
- Authentication (login, registration, OTP, password reset)
- Analytics (data aggregation, reporting)
- Games (CRUD operations, status management)
- Categories, Users, Files, System Config
- Admin Dashboard and User Management

*Note: We add controller tests as we build new features*

### Frontend Tests
**Current Test Areas:**
- **Authentication Logic** - Role validation, login flows, access control
- **Form Validation** - Password requirements, email/phone validation
- **Business Logic** - Game filtering, search, status management
- **Error Handling** - User-friendly error messages
- **Route Protection** - Access control and navigation logic

*Note: We focus on testing business logic functions rather than UI components*

## Test Structure

### Backend Test Files
```
Server/src/controllers/__tests__/
├── analyticsController.test.ts
├── authController.test.ts
├── gameController.test.ts
└── [other controllers as needed]
```

### Frontend Test Files
```
Client/src/
├── validation/__tests__/
│   └── password.test.ts
├── context/__tests__/
│   └── AuthContext.logic.test.ts
├── routing/__tests__/
│   └── ProtectedRoute.logic.test.ts
├── components/__tests__/
│   └── [component logic tests as needed]
├── backend/__tests__/
│   └── [service logic tests]
└── utils/__tests__/
    └── [utility function tests]
```

## Configuration Files

### Frontend Configuration
- `Client/vitest.config.ts` - Vitest configuration
- `Client/src/test/setup.ts` - Test setup and global configurations

### Backend Configuration
- `Server/jest.config.js` - Jest configuration
- `Server/src/test/setup.ts` - Test setup and service mocks

## CI/CD Integration

### Pipeline Commands
```bash
# Install dependencies
cd Client && npm install
cd ../Server && npm install

# Run tests
cd Client && npm run test:run
cd ../Server && npm test
```



## Testing Strategy

### What We Prioritize Testing
- **Authentication & Security** - Critical for app security
- **Business Logic Functions** - Core app functionality
- **Form Validation** - Data integrity and user experience
- **API Integration Logic** - Request/response handling
- **Error Handling** - User-friendly error messages



### When We Add New Tests
- **New critical features** get corresponding tests
- **Bug fixes** often include regression tests
- **Security features** always get comprehensive tests
- **Complex business logic** gets thorough coverage

### When We Remove Tests
- **Outdated functionality** - remove tests for removed features
- **Flaky tests** - fix or remove unreliable tests
- **Redundant tests** - consolidate overlapping test coverage
- **Low-value tests** - remove tests that don't catch real issues


## Adding New Tests

### When Adding Backend Tests
1. Create test file in appropriate `__tests__` directory
2. Follow existing naming conventions
3. Mock external dependencies appropriately
4. Test both success and error scenarios

### When Adding Frontend Tests
1. Focus on **business logic** rather than UI rendering
2. Test **user interaction logic** (event handlers, form processing)
3. Test **state management** and data processing
4. Avoid testing implementation details


## Summary

This testing setup is **designed to evolve**. We maintain tests that provide value and remove those that don't. The goal is reliable, maintainable test coverage that supports confident deployments and catches real issues.


*Last Updated: 6/09/2025 - Update this document as the testing strategy evolves*
