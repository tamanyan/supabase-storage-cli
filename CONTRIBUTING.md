# Contributing to Supabase Storage CLI

Thank you for your interest in contributing to Supabase Storage CLI! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or pnpm
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/supabase-storage-cli.git
   cd supabase-storage-cli
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:

   ```bash
   # Create a .env file
   cp .env.example .env

   # Edit .env with your Supabase credentials
   STORAGE_SERVICE_KEY=your-service-role-key
   STORAGE_URL=http://localhost:5000/storage/v1
   ```

## Development Workflow

### Available Scripts

- `npm run build` - Build the project using `tsup`
- `npm run build:watch` - Automatically rebuild on file changes
- `npm run compile` - Compile TypeScript files using `tsc`
- `npm run clean` - Remove compiled code from `dist/` directory
- `npm run format` - Check files for code style issues using Prettier
- `npm run format:fix` - Automatically fix code formatting issues
- `npm run lint` - Check code for style issues with ESLint
- `npm run lint:fix` - Automatically fix code style issues
- `npm run start -- <command>` - Run the CLI using `ts-node`
- `npm run start:node -- <command>` - Run the CLI from `dist/` directory
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests and watch for file changes

### Running the CLI in Development

```bash
# Use npm start with -- to pass arguments to the CLI
npm run start -- <command> [options]

# Examples
npm run start -- bucket list
npm run start -- file upload my-bucket --file ./photo.jpg
npm run start -- url public my-bucket photo.jpg
```

## Coding Standards

### Code Style

This project uses ESLint and Prettier to maintain consistent code quality:

- **Formatting**: We use Prettier for automatic code formatting
- **Linting**: ESLint ensures code quality and catches common errors
- **TypeScript**: All code should be written in TypeScript with proper type annotations

Before committing, ensure your code passes all checks:

```bash
npm run lint
npm run format
npm test
```

### Git Hooks

The project uses Husky for Git hooks that automatically run checks before commits:

- **Pre-commit**: Runs linting and formatting checks
- **Commit-msg**: Validates commit message format

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages. This enables automatic semantic versioning and changelog generation.

### Using Commitizen

The easiest way to create properly formatted commit messages is to use Commitizen:

```bash
npm run commit
```

This will guide you through creating a commit message in the correct format.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type

Must be one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

#### Scope

Optional. Can be anything specifying the place of the commit change:

- `bucket` - Bucket-related commands
- `file` - File operation commands
- `url` - URL generation commands
- `cli` - CLI infrastructure
- `tests` - Test files

#### Examples

```
feat(bucket): add support for bucket size limits

fix(file): resolve issue with file path encoding

docs(readme): update installation instructions

test(url): add unit tests for signed URL generation
```

## Testing

### Writing Tests

- Write unit tests for all new features using Jest
- Place test files next to the code they test with `.test.ts` extension
- Aim for high code coverage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes** following the coding standards

3. **Write or update tests** for your changes

4. **Run all checks**:

   ```bash
   npm run lint
   npm run format
   npm test
   ```

5. **Commit your changes** using conventional commits:

   ```bash
   npm run commit
   ```

6. **Push to your fork**:

   ```bash
   git push origin feat/my-new-feature
   ```

7. **Open a Pull Request** against the `main` branch

8. **Address review feedback** if any

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if adding new features
- Add tests for new functionality
- Ensure all CI checks pass
- Write a clear PR description explaining the changes

## Getting Help

- **Documentation**: Check the [README](README.md) for usage information
- **Issues**: Search [existing issues](https://github.com/tamanyan/supabase-storage-cli/issues) or open a new one
- **Discussions**: Start a discussion for questions or ideas

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other contributors

## License

By contributing to Supabase Storage CLI, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
