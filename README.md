# Supabase Storage CLI

A command-line interface for managing Supabase Storage operations locally and remotely. Built with TypeScript and powered by yargs, this CLI provides a comprehensive set of commands for bucket management, file operations, and URL generation.

## Features

- **Bucket Management** - Create, list, update, delete, and empty storage buckets
- **File Operations** - Upload, download, list, move, copy, and delete files
- **URL Generation** - Create public URLs, signed URLs, and signed upload URLs
- **JSON Output** - All commands support JSON output for programmatic usage
- **Environment Configuration** - Support for environment variables and command-line flags
- **Local & Remote** - Works with both local development and production Supabase instances

## Storage Commands

### Bucket Operations

- `bucket list` - List all buckets
- `bucket create <name>` - Create a new bucket
- `bucket get <name>` - Get bucket details
- `bucket update <name>` - Update bucket settings
- `bucket empty <name>` - Empty bucket (remove all files)
- `bucket delete <name>` - Delete bucket

### File Operations

- `file upload <bucket>` - Upload files to a bucket
- `file download <bucket>` - Download files from a bucket
- `file list <bucket>` - List files in a bucket
- `file delete <bucket>` - Delete files from a bucket
- `file move <bucket>` - Move files within a bucket
- `file copy <bucket>` - Copy files within a bucket

### URL Generation

- `url public <bucket> <path>` - Get public URL for a file
- `url signed <bucket> <path>` - Create signed URL for private files
- `url signed-upload <bucket> <path>` - Create signed upload URL

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or pnpm

## Installation

```bash
# Clone or navigate to the directory
cd supabase-storage-cli

# Install dependencies
npm install

# Build the CLI
npm run build
```

## Configuration

Set up environment variables for easier usage:

```bash
export STORAGE_SERVICE_KEY="your-service-role-key"
export STORAGE_URL="http://localhost:5000/storage/v1"
```

Or create a `.env` file:

```env
STORAGE_SERVICE_KEY=your-service-role-key
STORAGE_URL=http://localhost:5000/storage/v1
```

You can also pass these via command-line flags:

- `--url <url>` - Storage URL
- `--key <key>` - Service role key
- `--json` - Output results as JSON

## Usage

The CLI provides three main command groups: **bucket**, **file**, and **url**. Each command follows a consistent pattern and supports common flags for configuration.

### Common Flags

All commands support these global options:

- `--url <url>` - Storage endpoint URL (default: `http://localhost:5000/storage/v1`)
- `--key <key>` - Service role key (required for all operations)
- `--json` - Output response as JSON for programmatic usage
- `--help` - Show help for a specific command

### Running in Development

```bash
# Use npm start with -- to pass arguments to the CLI
npm run start -- <command> [options]

# Examples
npm run start -- bucket list
npm run start -- file upload my-bucket --file ./photo.jpg
npm run start -- url public my-bucket photo.jpg
```

### Running in Production

After building, you can run the CLI directly:

```bash
./bin/run <command> [options]
```

Or install globally:

```bash
npm link
supastorage bucket list
supastorage file upload my-bucket --file ./photo.jpg
```

## Command Reference

### Bucket Commands

Buckets are containers that organize your files. They can be public (accessible to everyone) or private (require authentication).

#### `bucket list`

List all storage buckets with their visibility settings and size limits.

```bash
npm run start -- bucket list

# With JSON output
npm run start -- bucket list --json
```

**Output:**

```
📦 Buckets (2)

  🌐 Public  photos
    └─ Size Limit: 50 MB
  🔒 Private  documents
```

#### `bucket create <name> [--public]`

Create a new storage bucket. By default, buckets are private.

```bash
# Create a private bucket
npm run start -- bucket create documents

# Create a public bucket
npm run start -- bucket create photos --public
```

**Options:**

- `--public` - Make the bucket publicly accessible (default: false)

#### `bucket get <name>`

Get detailed information about a specific bucket including ID, visibility, creation date, size limits, and allowed MIME types.

```bash
npm run start -- bucket get photos
```

**Output:**

```
📦 Bucket: photos

  ID:          abc123-def456
  Public:      🌐 Yes
  Created:     2024-01-15T10:30:00Z
  Updated:     2024-01-20T14:45:00Z
  Size Limit:  50 MB
  MIME Types:  image/jpeg, image/png, image/webp
```

#### `bucket update <name> --public`

Update bucket settings. Currently supports changing public/private visibility.

```bash
# Make bucket public
npm run start -- bucket update documents --public

# Make bucket private
npm run start -- bucket update photos --public=false
```

**Note:** The `--public` flag is required for update operations.

#### `bucket empty <name>`

Remove all files from a bucket without deleting the bucket itself. Useful for clearing test data or resetting storage.

```bash
npm run start -- bucket empty test-uploads
```

**Warning:** This operation cannot be undone. All files will be permanently deleted.

#### `bucket delete <name>`

Permanently delete a bucket and all its contents.

```bash
npm run start -- bucket delete old-backups
```

**Warning:** This operation cannot be undone. The bucket and all files will be permanently deleted.

### File Commands

File commands operate on a specific bucket and support various operations for managing files.

#### `file upload <bucket> --file <path> [options]`

Upload a file to a storage bucket. The file can be stored at the root level or in a nested directory structure.

```bash
# Upload to bucket root with original filename
npm run start -- file upload photos --file ./vacation.jpg

# Upload with custom path (creates nested structure)
npm run start -- file upload photos --file ./vacation.jpg --path 2024/summer/vacation.jpg

# Overwrite existing file
npm run start -- file upload photos --file ./vacation.jpg --upsert
```

**Options:**

- `--file <path>` - Local file path to upload (required)
- `--path <path>` - Remote path in bucket (default: original filename)
- `--upsert` - Overwrite if file already exists (default: false)

**Output:**

```
Uploading 2.5 MB...
✅ Uploaded: photos/2024/summer/vacation.jpg
```

#### `file download <bucket> --path <path> [--output <path>]`

Download a file from a storage bucket to your local machine.

```bash
# Download to current directory with original filename
npm run start -- file download photos --path 2024/summer/vacation.jpg

# Download with custom output filename
npm run start -- file download photos --path vacation.jpg --output my-vacation.jpg
```

**Options:**

- `--path <path>` - Remote file path in bucket (required)
- `--output <path>` - Local output path (default: original filename)

**Output:**

```
Downloading...
✅ Downloaded: my-vacation.jpg (2.5 MB)
```

#### `file list <bucket> [options]`

List files in a bucket with optional filtering and search capabilities.

```bash
# List all files
npm run start -- file list photos

# List files in specific directory
npm run start -- file list photos --prefix 2024/summer/

# Search for files by name
npm run start -- file list photos --search "vacation"

# Limit number of results
npm run start -- file list photos --limit 50

# Combine filters
npm run start -- file list photos --prefix 2024/ --search "vacation" --limit 10
```

**Options:**

- `--prefix <path>` - Filter files by path prefix
- `--search <term>` - Search files by name
- `--limit <n>` - Maximum number of results (default: 100)

**Output:**

```
📂 Files in photos/2024/summer/ (3)

  📄 beach.jpg (3.2 MB)
     └─ Updated: 1/15/2024, 2:30:00 PM
  📄 sunset.png (1.8 MB)
     └─ Updated: 1/16/2024, 6:45:00 PM
  📁 videos/
```

#### `file move <bucket> --from <path> --to <path>`

Move a file to a different location within the same bucket. This is useful for reorganizing files or renaming.

```bash
# Rename a file
npm run start -- file move photos --from old-name.jpg --to new-name.jpg

# Move to different directory
npm run start -- file move photos --from temp/file.jpg --to archive/2024/file.jpg
```

**Options:**

- `--from <path>` - Source file path (required)
- `--to <path>` - Destination file path (required)

**Output:**

```
✅ Moved: temp/file.jpg → archive/2024/file.jpg
```

#### `file copy <bucket> --from <path> --to <path>`

Create a copy of a file within the same bucket. The original file remains unchanged.

```bash
# Create a backup copy
npm run start -- file copy photos --from important.jpg --to backups/important.jpg

# Duplicate for editing
npm run start -- file copy documents --from original.pdf --to drafts/copy.pdf
```

**Options:**

- `--from <path>` - Source file path (required)
- `--to <path>` - Destination file path (required)

**Output:**

```
✅ Copied: important.jpg → backups/important.jpg
```

#### `file delete <bucket> <path> [<path>...]`

Delete one or more files from a bucket. Multiple files can be deleted in a single command.

```bash
# Delete single file
npm run start -- file delete photos vacation.jpg

# Delete multiple files
npm run start -- file delete photos file1.jpg file2.png file3.gif

# Delete with paths
npm run start -- file delete photos 2024/old/image1.jpg 2024/old/image2.jpg
```

**Arguments:**

- `<path>` - One or more file paths to delete

**Output:**

```
Deleting 3 file(s)...
✅ Deleted 3 file(s)
  ✓ file1.jpg
  ✓ file2.png
  ✓ file3.gif
```

**Warning:** This operation cannot be undone. Files will be permanently deleted.

### URL Commands

Generate URLs for accessing files stored in Supabase Storage.

#### `url public <bucket> <path>`

Generate a public URL for accessing a file. This works for files in public buckets or files with public access policies.

```bash
npm run start -- url public photos vacation.jpg
```

**Output:**

```
🔗 Public URL:

  https://your-project.supabase.co/storage/v1/object/public/photos/vacation.jpg
```

**Use Cases:**

- Displaying images on websites
- Sharing links to publicly accessible files
- Embedding media in applications

#### `url signed <bucket> <path> [--expires <seconds>]`

Generate a temporary signed URL for accessing private files. The URL expires after the specified time.

```bash
# Create URL that expires in 1 hour (default)
npm run start -- url signed documents contract.pdf

# Create URL that expires in 2 hours
npm run start -- url signed documents contract.pdf --expires 7200

# Create URL that expires in 1 day
npm run start -- url signed documents contract.pdf --expires 86400
```

**Options:**

- `--expires <seconds>` - URL expiration time in seconds (default: 3600)

**Output:**

```
🔐 Signed URL (expires in 3600s):

  https://your-project.supabase.co/storage/v1/object/sign/documents/contract.pdf?token=...
```

**Use Cases:**

- Sharing private files temporarily
- Generating download links for authenticated users
- Creating time-limited access to sensitive documents

#### `url signed-upload <bucket> <path>`

Generate a signed URL that allows uploading a file to a specific path. This enables secure client-side uploads without exposing service keys.

```bash
npm run start -- url signed-upload photos user-123/avatar.jpg
```

**Output:**

```
🔐 Signed Upload URL:

  Path:  photos/user-123/avatar.jpg
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Use Cases:**

- Secure file uploads from web/mobile clients
- User-generated content uploads
- Direct-to-storage uploads without backend proxying

## Practical Examples

### Example 1: Setting up a Photo Gallery

Complete workflow for creating a public photo gallery:

```bash
# 1. Create a public bucket for photos
npm run start -- bucket create gallery --public

# 2. Upload multiple photos
npm run start -- file upload gallery --file ./photo1.jpg --path 2024/photo1.jpg
npm run start -- file upload gallery --file ./photo2.jpg --path 2024/photo2.jpg
npm run start -- file upload gallery --file ./photo3.jpg --path 2024/photo3.jpg

# 3. List all uploaded photos
npm run start -- file list gallery --prefix 2024/

# 4. Get public URLs for displaying on website
npm run start -- url public gallery 2024/photo1.jpg
npm run start -- url public gallery 2024/photo2.jpg
```

### Example 2: Managing Private Documents

Workflow for secure document management:

```bash
# 1. Create a private bucket
npm run start -- bucket create documents

# 2. Upload sensitive documents
npm run start -- file upload documents --file ./contract.pdf --path contracts/2024/contract.pdf
npm run start -- file upload documents --file ./invoice.pdf --path invoices/2024/invoice.pdf

# 3. Create temporary signed URLs for sharing (expires in 1 hour)
npm run start -- url signed documents contracts/2024/contract.pdf --expires 3600

# 4. Create backup copies
npm run start -- file copy documents --from contracts/2024/contract.pdf --to backups/contract-backup.pdf

# 5. Move old documents to archive
npm run start -- file move documents --from contracts/2023/old.pdf --to archive/2023/old.pdf
```

### Example 3: Batch File Operations

Working with multiple files efficiently:

```bash
# 1. Upload multiple files with a loop
for file in ./images/*.jpg; do
  filename=$(basename "$file")
  npm run start -- file upload photos --file "$file" --path "batch/$filename"
done

# 2. List all files and save to JSON for processing
npm run start -- file list photos --json > files.json

# 3. Delete multiple old files at once
npm run start -- file delete photos old1.jpg old2.jpg old3.jpg

# 4. Search for specific files
npm run start -- file list photos --search "vacation" --prefix 2024/
```

### Example 4: Migration Between Buckets

Moving content from one bucket to another:

```bash
# 1. List files in source bucket
npm run start -- file list old-bucket --json > migration-list.json

# 2. Download files from old bucket
npm run start -- file download old-bucket --path file1.jpg --output ./temp/file1.jpg
npm run start -- file download old-bucket --path file2.jpg --output ./temp/file2.jpg

# 3. Upload to new bucket
npm run start -- file upload new-bucket --file ./temp/file1.jpg --path file1.jpg
npm run start -- file upload new-bucket --file ./temp/file2.jpg --path file2.jpg

# 4. Verify migration
npm run start -- file list new-bucket
```

### Example 5: Working with Remote Supabase Project

Connect to your production Supabase instance:

```bash
# Set environment variables for convenience
export STORAGE_URL="https://abcdefg.supabase.co/storage/v1"
export STORAGE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Now all commands use remote instance
npm run start -- bucket list
npm run start -- file upload production-assets --file ./logo.png

# Or use flags explicitly
npm run start -- bucket list \
  --url https://abcdefg.supabase.co/storage/v1 \
  --key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example 6: Automation with Scripts

Create a shell script for automated backups:

```bash
#!/bin/bash
# backup-storage.sh

BUCKET="production-data"
BACKUP_DIR="./backups/$(date +%Y-%m-%d)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get list of all files
npm run start -- file list "$BUCKET" --json > "$BACKUP_DIR/file-list.json"

# Download all files (example with specific files)
npm run start -- file download "$BUCKET" --path important.pdf --output "$BACKUP_DIR/important.pdf"
npm run start -- file download "$BUCKET" --path data.json --output "$BACKUP_DIR/data.json"

echo "Backup completed: $BACKUP_DIR"
```

### Example 7: JSON Output for Programmatic Usage

Parse JSON output in scripts:

```bash
# Get bucket list as JSON and process with jq
npm run start -- bucket list --json | jq '.[] | select(.public == true) | .name'

# Get file count
npm run start -- file list photos --json | jq 'length'

# Extract all file paths
npm run start -- file list photos --json | jq -r '.[].name'

# Get total size of files
npm run start -- file list photos --json | jq '[.[].metadata.size] | add'
```

## Troubleshooting

### Common Issues and Solutions

#### Error: "Storage key not set"

**Problem:** The CLI cannot authenticate with the storage service.

**Solution:**

```bash
# Set environment variable
export STORAGE_SERVICE_KEY="your-service-role-key"

# Or use --key flag
npm run start -- bucket list --key your-service-role-key
```

**Where to find your service key:**

- Local: Check `.env` file in your Supabase project
- Cloud: Supabase Dashboard → Settings → API → service_role key

#### Error: "Bucket not found" or "404"

**Problem:** The specified bucket doesn't exist.

**Solution:**

```bash
# List all available buckets
npm run start -- bucket list

# Create the bucket if needed
npm run start -- bucket create your-bucket-name
```

#### Error: "File already exists"

**Problem:** Trying to upload a file that already exists without the upsert flag.

**Solution:**

```bash
# Use --upsert flag to overwrite
npm run start -- file upload my-bucket --file ./photo.jpg --upsert

# Or delete the existing file first
npm run start -- file delete my-bucket photo.jpg
npm run start -- file upload my-bucket --file ./photo.jpg
```

#### Error: "Permission denied" or "403"

**Problem:** The service key doesn't have proper permissions.

**Solution:**

- Verify you're using the **service_role** key, not the anon key
- Check bucket policies in Supabase Dashboard
- Ensure the bucket exists and you have access

#### Error: "Invalid JWT" or "Token expired"

**Problem:** The service key is invalid or malformed.

**Solution:**

```bash
# Verify your key format (should be a long JWT string)
echo $STORAGE_SERVICE_KEY

# Get a fresh key from Supabase Dashboard
# Settings → API → service_role key (click to reveal)

# Test with the new key
npm run start -- bucket list --key "your-new-key"
```

#### Error: "Network error" or "Connection refused"

**Problem:** Cannot connect to the storage endpoint.

**Solution:**

```bash
# For local development, ensure Supabase is running
docker ps  # Check if containers are running

# Verify the URL is correct
npm run start -- bucket list --url http://localhost:5000/storage/v1

# For remote, check the project URL
npm run start -- bucket list --url https://your-project.supabase.co/storage/v1
```

#### Files Not Appearing After Upload

**Problem:** Files uploaded but don't show in list.

**Solution:**

```bash
# Check if file was uploaded to correct path
npm run start -- file list my-bucket --prefix path/to/

# Search for the file by name
npm run start -- file list my-bucket --search filename

# Verify bucket name is correct
npm run start -- bucket list
```

#### Large File Upload Fails

**Problem:** Timeout or error when uploading large files.

**Solution:**

- Check bucket file size limits: `npm run start -- bucket get your-bucket`
- For very large files (>5MB), consider using TUS protocol instead
- Increase network timeout if using programmatically

### Debug Mode

For detailed debugging information:

```bash
# Enable Node.js debug output
NODE_DEBUG=* npm run start -- bucket list

# Check TypeScript compilation
npm run compile

# Run tests to verify functionality
npm test

# Check for linting issues
npm run lint
```

### Getting Help

```bash
# Show general help
npm run start -- --help

# Show help for specific command
npm run start -- bucket --help
npm run start -- file --help
npm run start -- url --help
```

### Performance Tips

1. **Batch Operations:** Delete multiple files in one command instead of individual calls
2. **Use JSON Output:** Parse JSON in scripts instead of screen scraping text output
3. **Limit Results:** Use `--limit` flag when listing large buckets
4. **Prefixes:** Use `--prefix` to narrow down file listings
5. **Environment Variables:** Set `STORAGE_URL` and `STORAGE_SERVICE_KEY` to avoid repeating flags

## Development

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

### Project Structure

```
supabase-storage-cli/
├── src/
│   ├── commands/
│   │   ├── bucket.ts      # Bucket management commands
│   │   ├── file.ts        # File operation commands
│   │   ├── url.ts         # URL generation commands
│   │   └── index.ts       # Command exports
│   ├── utils.ts           # Shared utility functions
│   └── logger.ts          # Logging utilities
├── bin/
│   └── run                # CLI entry point
├── dist/                  # Compiled output
└── package.json
```

### Adding New Commands

1. Create a new file in `src/commands/` (e.g., `mycommand.ts`)
2. Implement the yargs command pattern:
   ```typescript
   export const command = 'mycommand <arg>'
   export const describe = 'Description of my command'
   export function builder(yargs: Argv): Argv { ... }
   export async function handler(argv: any) { ... }
   ```
3. Export it from `src/commands/index.ts`
4. Build and test

## CI/CD and Automation

### Automated Version Management and NPM Publishing with Semantic-Release

This project utilizes `semantic-release` to automate version management and the NPM publishing
process. `Semantic-release` automates the workflow of releasing new versions, including the generation of detailed
release notes based on commit messages that follow the conventional commit format.

The publishing process is triggered automatically when changes are merged into the main branch. Here's how it works:

1. **Automated Versioning:** Based on the commit messages, `semantic-release` determines the type of version change (
   major, minor, or patch) and updates the version accordingly.
2. **Release Notes:** It then generates comprehensive release notes detailing new features, bug fixes, and any breaking
   changes, enhancing clarity and communication with users.
3. **NPM Publishing:** Finally, `semantic-release` publishes the new version to the NPM registry and creates a GitHub
   release with the generated notes.

To ensure a smooth `semantic-release` process:

- Merge feature or fix branches into the main branch following thorough review and testing.
- Use conventional commit messages to help `semantic-release` accurately determine version changes and generate
  meaningful release notes.
- Configure an NPM access token as a GitHub secret under the name `NPM_TOKEN` for authentication during the publication
  process.

By integrating `semantic-release`, this project streamlines its release process, ensuring that versions are managed
efficiently and that users are well-informed of each update through automatically generated release notes.

### Development Guidelines

1. **Code Style:** Use Prettier for formatting and ESLint for linting
2. **Commit Messages:** Follow conventional commit format using `commitizen`
   - Run `npm run commit` for guided commit messages
3. **Testing:** Write unit tests for new features using Jest
4. **Environment Variables:** Use `.env` file for local development
5. **Git Hooks:** Pre-commit hooks automatically run linting and formatting

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull request workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Write tests for new features
5. Run `npm run lint` and `npm run format` before committing
6. Use `npm run commit` for conventional commit messages
7. Submit a pull request

## Technology Stack

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Yargs](https://github.com/yargs/yargs)** - Command-line argument parsing
- **[@supabase/storage-js](https://github.com/supabase/storage-js)** - Supabase Storage client
- **[TSUP](https://tsup.egoist.dev/)** - TypeScript bundler
- **[Jest](https://jestjs.io/)** - Testing framework
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality

## License

MIT

## Related Projects

- [Supabase Storage](https://github.com/supabase/storage)
- [Supabase Storage JS](https://github.com/supabase/storage-js)
