import { Argv, ArgumentsCamelCase } from 'yargs'
import { StorageClient } from '@supabase/storage-js'
import { getStorageClient, formatBytes } from '../utils'
import { logger } from '../logger'

interface BucketArguments {
  action: 'list' | 'create' | 'get' | 'update' | 'empty' | 'delete'
  name?: string
  url: string
  key: string
  json: boolean
  public?: boolean
}

export const command = 'bucket <action> [name]'
export const describe = 'Manage storage buckets'

export function builder(yargs: Argv): Argv<BucketArguments> {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['list', 'create', 'get', 'update', 'empty', 'delete'] as const,
      demandOption: true,
    })
    .positional('name', {
      describe: 'Bucket name',
      type: 'string',
    })
    .option('public', {
      describe: 'Make bucket public',
      type: 'boolean',
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
    }) as Argv<BucketArguments>
}

export async function handler(argv: ArgumentsCamelCase<BucketArguments>): Promise<void> {
  const { action, name, url, key, json, public: isPublic } = argv

  if (!key) {
    logger.error('Storage key not set')
    logger.info('Set STORAGE_SERVICE_KEY or use --key option')
    process.exit(1)
  }

  const client = getStorageClient(url, key)

  try {
    switch (action) {
      case 'list':
        await listBuckets(client, json)
        break
      case 'create':
        if (!name) throw new Error('Bucket name required')
        await createBucket(client, name, isPublic, json)
        break
      case 'get':
        if (!name) throw new Error('Bucket name required')
        await getBucket(client, name, json)
        break
      case 'update':
        if (!name) throw new Error('Bucket name required')
        await updateBucket(client, name, isPublic, json)
        break
      case 'empty':
        if (!name) throw new Error('Bucket name required')
        await emptyBucket(client, name)
        break
      case 'delete':
        if (!name) throw new Error('Bucket name required')
        await deleteBucket(client, name)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    logger.error(`${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

async function listBuckets(client: StorageClient, asJson: boolean) {
  const { data, error } = await client.listBuckets()
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n📦 Buckets (${data.length})\n`)
    data.forEach((bucket) => {
      const visibility = bucket.public ? '🌐 Public' : '🔒 Private'
      logger.log(`  ${visibility}  ${bucket.name}`)
      if (bucket.file_size_limit) {
        logger.log(`    └─ Size Limit: ${formatBytes(bucket.file_size_limit)}`)
      }
    })
  }
}

async function createBucket(client: StorageClient, name: string, isPublic: boolean = false, asJson: boolean) {
  const { data, error } = await client.createBucket(name, {
    public: isPublic,
  })
  if (error) throw error

  logger.success(`Bucket created: ${name}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}

async function getBucket(client: StorageClient, name: string, asJson: boolean) {
  const { data, error } = await client.getBucket(name)
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n📦 Bucket: ${data.name}\n`)
    logger.log(`  ID:          ${data.id}`)
    logger.log(`  Public:      ${data.public ? '🌐 Yes' : '🔒 No'}`)
    logger.log(`  Created:     ${data.created_at}`)
    logger.log(`  Updated:     ${data.updated_at}`)
    if (data.file_size_limit) {
      logger.log(`  Size Limit:  ${formatBytes(data.file_size_limit)}`)
    }
    if (data.allowed_mime_types) {
      logger.log(`  MIME Types:  ${data.allowed_mime_types.join(', ')}`)
    }
  }
}

async function updateBucket(client: StorageClient, name: string, isPublic: boolean | undefined, asJson: boolean) {
  if (isPublic === undefined) {
    throw new Error('--public flag required for update')
  }

  const { data, error } = await client.updateBucket(name, {
    public: isPublic,
  })
  if (error) throw error

  logger.success(`Bucket updated: ${name}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}

async function emptyBucket(client: StorageClient, name: string) {
  const { error } = await client.emptyBucket(name)
  if (error) throw error

  logger.success(`Bucket emptied: ${name}`)
}

async function deleteBucket(client: StorageClient, name: string) {
  const { error } = await client.deleteBucket(name)
  if (error) throw error

  logger.success(`Bucket deleted: ${name}`)
}
