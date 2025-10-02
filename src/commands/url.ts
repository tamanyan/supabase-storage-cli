import { Argv, ArgumentsCamelCase } from 'yargs'
import { StorageClient } from '@supabase/storage-js'
import { getStorageClient } from '../utils'
import { logger } from '../logger'

interface UrlArguments {
  action: 'public' | 'signed' | 'signed-upload' | 'signed-urls'
  bucket: string
  path?: string
  paths?: string[]
  args?: string[]
  expires: number
  url: string
  key: string
  json: boolean
  download?: boolean | string
}

export const command = 'url <action> <bucket> [path] [args..]'
export const describe = 'Generate URLs for files'
export const aliases = ['u']

export function builder(yargs: Argv): Argv<UrlArguments> {
  return yargs
    .positional('action', {
      describe: 'URL type to generate',
      type: 'string',
      choices: ['public', 'signed', 'signed-upload', 'signed-urls'] as const,
      demandOption: true,
    })
    .positional('bucket', {
      describe: 'Bucket name',
      type: 'string',
      demandOption: true,
    })
    .positional('path', {
      describe: 'File path in bucket (or multiple paths for signed-urls)',
      type: 'string',
    })
    .option('download', {
      describe: 'Trigger download (or specify filename)',
      type: 'string',
    })
    .option('expires', {
      describe: 'Expiry time in seconds (for signed URLs)',
      type: 'number',
      default: 3600,
    })
    .option('url', {
      describe: 'Storage URL',
      type: 'string',
      default: process.env.STORAGE_URL || 'http://localhost:5000/storage/v1',
    })
    .option('key', {
      describe: 'Service role key',
      type: 'string',
      default: process.env.STORAGE_SERVICE_KEY || '',
    })
    .option('json', {
      describe: 'Output as JSON',
      type: 'boolean',
      default: false,
    }) as Argv<UrlArguments>
}

export async function handler(argv: ArgumentsCamelCase<UrlArguments>): Promise<void> {
  const { action, bucket, path, url, key, json, expires, download } = argv

  if (!key) {
    logger.error('Storage key not set')
    logger.info('Set STORAGE_SERVICE_KEY or use --key option')
    process.exit(1)
  }

  if (!bucket) {
    logger.error('Bucket name required')
    process.exit(1)
  }

  const client = getStorageClient(url, key)

  try {
    switch (action) {
      case 'public':
        if (!path) throw new Error('Path required for public URL')
        await getPublicUrl(client, bucket, path, download, json)
        break
      case 'signed':
        if (!path) throw new Error('Path required for signed URL')
        await getSignedUrl(client, bucket, path, expires, download, json)
        break
      case 'signed-upload':
        if (!path) throw new Error('Path required for signed upload URL')
        await getSignedUploadUrl(client, bucket, path, json)
        break
      case 'signed-urls': {
        const paths = argv.args || []
        if (path) paths.unshift(path)
        if (paths.length === 0) throw new Error('At least one path required for signed URLs')
        await getSignedUrls(client, bucket, paths, expires, download, json)
        break
      }
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    logger.error(`${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

async function getPublicUrl(
  client: StorageClient,
  bucket: string,
  filePath: string,
  download: boolean | string | undefined,
  asJson: boolean,
) {
  const { data } =
    download !== undefined
      ? client.from(bucket).getPublicUrl(filePath, { download })
      : client.from(bucket).getPublicUrl(filePath)

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n🔗 Public URL:\n`)
    logger.log(`  ${data.publicUrl}`)
    if (download) {
      logger.log(`  (Download mode: ${typeof download === 'string' ? download : 'enabled'})`)
    }
  }
}

async function getSignedUrl(
  client: StorageClient,
  bucket: string,
  filePath: string,
  expiresIn: number,
  download: boolean | string | undefined,
  asJson: boolean,
) {
  const { data, error } =
    download !== undefined
      ? await client.from(bucket).createSignedUrl(filePath, expiresIn, { download })
      : await client.from(bucket).createSignedUrl(filePath, expiresIn)
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n🔐 Signed URL (expires in ${expiresIn}s):\n`)
    logger.log(`  ${data.signedUrl}`)
  }
}

async function getSignedUploadUrl(client: StorageClient, bucket: string, filePath: string, asJson: boolean) {
  const { data, error } = await client.from(bucket).createSignedUploadUrl(filePath)
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n🔐 Signed Upload URL:\n`)
    logger.log(`  Path:  ${data.path}`)
    logger.log(`  Token: ${data.token}`)
    logger.log(`  Signed URL: ${data.signedUrl}`)
  }
}

async function getSignedUrls(
  client: StorageClient,
  bucket: string,
  filePaths: string[],
  expiresIn: number,
  download: boolean | string | undefined,
  asJson: boolean,
) {
  logger.info(`Creating signed URLs for ${filePaths.length} file(s)...`)

  const { data, error } =
    download !== undefined
      ? await client.from(bucket).createSignedUrls(filePaths, expiresIn, { download })
      : await client.from(bucket).createSignedUrls(filePaths, expiresIn)
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n🔐 Signed URLs (expires in ${expiresIn}s):\n`)
    data.forEach((item) => {
      if (item.error) {
        logger.log(`  ✗ ${item.path}: ${item.error}`)
      } else {
        logger.log(`  ✓ ${item.path}`)
        logger.log(`    ${item.signedUrl}`)
      }
    })
    const successCount = data.filter((item) => !item.error).length
    logger.success(`\n${successCount}/${data.length} URLs generated successfully`)
  }
}
