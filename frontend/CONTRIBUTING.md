# Contributing to Moove Mobility dApp

Thank you for your interest in contributing to the Moove Mobility dApp! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Git**
- **MetaMask** wallet
- **Sepolia ETH** for testing
- **Basic knowledge** of React, TypeScript, and Solidity

### Development Setup

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/Moove-Mobility-dApp.git
   cd Moove-Mobility-dApp/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Edit .env.local with your configuration
   # See docs/ENVIRONMENT_SETUP.md for details
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Verify setup**
   - Open http://localhost:3000
   - Connect MetaMask to Sepolia testnet
   - Verify contracts are loaded correctly

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports** - Report issues and bugs
- **Feature Requests** - Suggest new features
- **Code Contributions** - Submit code improvements
- **Documentation** - Improve documentation
- **Testing** - Add or improve tests
- **Design** - UI/UX improvements

### Before Contributing

1. **Check existing issues** - Look for similar issues or PRs
2. **Discuss major changes** - Open an issue for discussion
3. **Follow the coding standards** - See [Code Style](#code-style)
4. **Write tests** - Ensure your changes are tested
5. **Update documentation** - Keep docs up to date

## Pull Request Process

### Creating a Pull Request

1. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**

   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   ```bash
   # Run tests
   npm test

   # Run linting
   npm run lint

   # Build the project
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues
   - Request reviews from maintainers

### Pull Request Requirements

- **Clear description** of changes
- **Tests** for new functionality
- **Documentation** updates
- **No breaking changes** without discussion
- **Follows coding standards**
- **Passes all CI checks**

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, browser, Node version)
- **Screenshots** if applicable
- **Console logs** if available

### Feature Requests

When requesting features, please include:

- **Clear description** of the feature
- **Use case** and motivation
- **Proposed implementation** (if you have ideas)
- **Alternative solutions** considered
- **Additional context** or examples

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auctions): add sealed bid auction type
fix(contracts): resolve reentrancy vulnerability
docs(readme): update installation instructions
refactor(hooks): optimize useAuctionsEnhanced
test(components): add AuctionCard tests
```

### Types

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Build/tooling changes

## Code Style

### TypeScript

- **Strict mode** enabled
- **Explicit types** for all functions
- **Interface definitions** for complex objects
- **No `any` types** without justification
- **ESLint** rules enforced

### React

- **Functional components** preferred
- **Custom hooks** for logic reuse
- **Props interfaces** defined
- **Error boundaries** for error handling
- **Accessibility** considerations

### Solidity

- **Solidity ^0.8.20** version
- **OpenZeppelin** libraries used
- **NatSpec** documentation
- **Gas optimization** considered
- **Security** best practices followed

### CSS/Styling

- **Tailwind CSS** utility classes
- **Responsive design** principles
- **Dark/light mode** support
- **Accessibility** standards
- **Consistent spacing** and colors

## Testing

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Smart Contract Testing

```bash
# Run contract tests
npx hardhat test

# Run tests with gas reporting
npx hardhat test --gas-report

# Run specific test file
npx hardhat test test/Auction.test.js
```

### Testing Requirements

- **Unit tests** for all new functions
- **Integration tests** for component interactions
- **E2E tests** for critical user flows
- **Contract tests** for all smart contract functions
- **Test coverage** above 80%

## Documentation

### Documentation Standards

- **Clear and concise** writing
- **Code examples** where helpful
- **Screenshots** for UI changes
- **API documentation** for new functions
- **README updates** for major changes

### Documentation Types

- **README.md** - Project overview and setup
- **Technical docs** - Architecture and implementation
- **API docs** - Function and hook documentation
- **Deployment docs** - Deployment instructions
- **Contributing docs** - This file

## Code Review Process

### Review Checklist

- [ ] **Functionality** - Does it work as intended?
- [ ] **Code Quality** - Is the code clean and readable?
- [ ] **Performance** - Are there any performance issues?
- [ ] **Security** - Are there any security concerns?
- [ ] **Tests** - Are there adequate tests?
- [ ] **Documentation** - Is documentation updated?
- [ ] **Breaking Changes** - Are there any breaking changes?

### Review Process

1. **Automated Checks** - CI/CD pipeline runs
2. **Code Review** - Maintainers review code
3. **Testing** - Manual testing if needed
4. **Approval** - At least one approval required
5. **Merge** - Maintainer merges the PR

## Getting Help

### Resources

- **Documentation** - Check the `docs/` folder
- **Issues** - Search existing issues
- **Discussions** - Use GitHub Discussions
- **Discord** - Join our community Discord
- **Email** - Contact maintainers directly

### Community Guidelines

- **Be respectful** and inclusive
- **Help others** when you can
- **Ask questions** if you're stuck
- **Share knowledge** and experiences
- **Follow the code of conduct**

## Recognition

Contributors will be recognized in:

- **README.md** - Contributor list
- **CHANGELOG.md** - Release notes
- **GitHub** - Contributor statistics
- **Community** - Special recognition

## License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

## Questions?

If you have any questions about contributing, please:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/your-username/Moove-Mobility-dApp/issues)
3. Open a [new issue](https://github.com/your-username/Moove-Mobility-dApp/issues/new)
4. Join our [Discord community](https://discord.gg/your-discord)

Thank you for contributing to Moove Mobility dApp! 🚗✨



Thank you for your interest in contributing to the Moove Mobility dApp! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Git**
- **MetaMask** wallet
- **Sepolia ETH** for testing
- **Basic knowledge** of React, TypeScript, and Solidity

### Development Setup

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/Moove-Mobility-dApp.git
   cd Moove-Mobility-dApp/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Edit .env.local with your configuration
   # See docs/ENVIRONMENT_SETUP.md for details
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Verify setup**
   - Open http://localhost:3000
   - Connect MetaMask to Sepolia testnet
   - Verify contracts are loaded correctly

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports** - Report issues and bugs
- **Feature Requests** - Suggest new features
- **Code Contributions** - Submit code improvements
- **Documentation** - Improve documentation
- **Testing** - Add or improve tests
- **Design** - UI/UX improvements

### Before Contributing

1. **Check existing issues** - Look for similar issues or PRs
2. **Discuss major changes** - Open an issue for discussion
3. **Follow the coding standards** - See [Code Style](#code-style)
4. **Write tests** - Ensure your changes are tested
5. **Update documentation** - Keep docs up to date

## Pull Request Process

### Creating a Pull Request

1. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**

   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   ```bash
   # Run tests
   npm test

   # Run linting
   npm run lint

   # Build the project
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues
   - Request reviews from maintainers

### Pull Request Requirements

- **Clear description** of changes
- **Tests** for new functionality
- **Documentation** updates
- **No breaking changes** without discussion
- **Follows coding standards**
- **Passes all CI checks**

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, browser, Node version)
- **Screenshots** if applicable
- **Console logs** if available

### Feature Requests

When requesting features, please include:

- **Clear description** of the feature
- **Use case** and motivation
- **Proposed implementation** (if you have ideas)
- **Alternative solutions** considered
- **Additional context** or examples

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auctions): add sealed bid auction type
fix(contracts): resolve reentrancy vulnerability
docs(readme): update installation instructions
refactor(hooks): optimize useAuctionsEnhanced
test(components): add AuctionCard tests
```

### Types

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Build/tooling changes

## Code Style

### TypeScript

- **Strict mode** enabled
- **Explicit types** for all functions
- **Interface definitions** for complex objects
- **No `any` types** without justification
- **ESLint** rules enforced

### React

- **Functional components** preferred
- **Custom hooks** for logic reuse
- **Props interfaces** defined
- **Error boundaries** for error handling
- **Accessibility** considerations

### Solidity

- **Solidity ^0.8.20** version
- **OpenZeppelin** libraries used
- **NatSpec** documentation
- **Gas optimization** considered
- **Security** best practices followed

### CSS/Styling

- **Tailwind CSS** utility classes
- **Responsive design** principles
- **Dark/light mode** support
- **Accessibility** standards
- **Consistent spacing** and colors

## Testing

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Smart Contract Testing

```bash
# Run contract tests
npx hardhat test

# Run tests with gas reporting
npx hardhat test --gas-report

# Run specific test file
npx hardhat test test/Auction.test.js
```

### Testing Requirements

- **Unit tests** for all new functions
- **Integration tests** for component interactions
- **E2E tests** for critical user flows
- **Contract tests** for all smart contract functions
- **Test coverage** above 80%

## Documentation

### Documentation Standards

- **Clear and concise** writing
- **Code examples** where helpful
- **Screenshots** for UI changes
- **API documentation** for new functions
- **README updates** for major changes

### Documentation Types

- **README.md** - Project overview and setup
- **Technical docs** - Architecture and implementation
- **API docs** - Function and hook documentation
- **Deployment docs** - Deployment instructions
- **Contributing docs** - This file

## Code Review Process

### Review Checklist

- [ ] **Functionality** - Does it work as intended?
- [ ] **Code Quality** - Is the code clean and readable?
- [ ] **Performance** - Are there any performance issues?
- [ ] **Security** - Are there any security concerns?
- [ ] **Tests** - Are there adequate tests?
- [ ] **Documentation** - Is documentation updated?
- [ ] **Breaking Changes** - Are there any breaking changes?

### Review Process

1. **Automated Checks** - CI/CD pipeline runs
2. **Code Review** - Maintainers review code
3. **Testing** - Manual testing if needed
4. **Approval** - At least one approval required
5. **Merge** - Maintainer merges the PR

## Getting Help

### Resources

- **Documentation** - Check the `docs/` folder
- **Issues** - Search existing issues
- **Discussions** - Use GitHub Discussions
- **Discord** - Join our community Discord
- **Email** - Contact maintainers directly

### Community Guidelines

- **Be respectful** and inclusive
- **Help others** when you can
- **Ask questions** if you're stuck
- **Share knowledge** and experiences
- **Follow the code of conduct**

## Recognition

Contributors will be recognized in:

- **README.md** - Contributor list
- **CHANGELOG.md** - Release notes
- **GitHub** - Contributor statistics
- **Community** - Special recognition

## License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

## Questions?

If you have any questions about contributing, please:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/your-username/Moove-Mobility-dApp/issues)
3. Open a [new issue](https://github.com/your-username/Moove-Mobility-dApp/issues/new)
4. Join our [Discord community](https://discord.gg/your-discord)

Thank you for contributing to Moove Mobility dApp! 🚗✨




