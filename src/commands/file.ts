import { Argv, ArgumentsCamelCase } from 'yargs'
import { StorageClient } from '@supabase/storage-js'
import fs from 'fs'
import path from 'path'
import { getStorageClient, formatBytes, getContentType } from '../utils'
import { logger } from '../logger'

interface FileArguments {
  action: 'upload' | 'download' | 'list' | 'delete' | 'move' | 'copy' | 'info' | 'exists' | 'update'
  bucket: string
  args?: string[]
  file?: string
  path?: string
  output?: string
  from?: string
  to?: string
  prefix?: string
  limit: number
  search?: string
  upsert: boolean
  url: string
  key: string
  json: boolean
  width?: number
  height?: number
  quality?: number
  resize?: string
  format?: string
  download?: boolean | string
}

export const command = 'file <action> <bucket> [args..]'
export const describe = 'Manage files in storage'
export const aliases = ['f']

export function builder(yargs: Argv): Argv<FileArguments> {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['upload', 'download', 'list', 'delete', 'move', 'copy', 'info', 'exists', 'update'] as const,
      demandOption: true,
    })
    .positional('bucket', {
      describe: 'Bucket name',
      type: 'string',
      demandOption: true,
    })
    .option('file', {
      describe: 'Local file path to upload',
      type: 'string',
    })
    .option('path', {
      describe: 'Remote path in bucket',
      type: 'string',
    })
    .option('output', {
      describe: 'Output path for downloaded file',
      type: 'string',
    })
    .option('from', {
      describe: 'Source path',
      type: 'string',
    })
    .option('to', {
      describe: 'Destination path',
      type: 'string',
    })
    .option('prefix', {
      describe: 'Path prefix to list',
      type: 'string',
    })
    .option('limit', {
      describe: 'Limit results',
      type: 'number',
      default: 100,
    })
    .option('search', {
      describe: 'Search term',
      type: 'string',
    })
    .option('upsert', {
      describe: 'Overwrite if exists',
      type: 'boolean',
      default: false,
    })
    .option('width', {
      describe: 'Image width in pixels (for transformations)',
      type: 'number',
    })
    .option('height', {
      describe: 'Image height in pixels (for transformations)',
      type: 'number',
    })
    .option('quality', {
      describe: 'Image quality 20-100 (for transformations)',
      type: 'number',
    })
    .option('resize', {
      describe: 'Resize mode: cover, contain, fill',
      type: 'string',
      choices: ['cover', 'contain', 'fill'],
    })
    .option('format', {
      describe: 'Image format (origin to keep original)',
      type: 'string',
    })
    .option('download', {
      describe: 'Trigger download (or specify filename)',
      type: 'string',
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
    }) as Argv<FileArguments>
}

export async function handler(argv: ArgumentsCamelCase<FileArguments>): Promise<void> {
  const { action, bucket, url, key, json } = argv

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
      case 'upload': {
        const { file, path: remotePath, upsert } = argv
        if (!file) throw new Error('File path required (use --file)')
        await uploadFile(client, bucket, file, remotePath, upsert, json)
        break
      }
      case 'download': {
        const { path: remotePath, output } = argv
        const pathsFromArgs = argv.args || []
        const actualPath = remotePath || pathsFromArgs[0]
        if (!actualPath) throw new Error('Remote path required (use --path or provide as argument)')
        await downloadFile(client, bucket, actualPath, output, json)
        break
      }
      case 'list': {
        const { prefix, limit, search } = argv
        await listFiles(client, bucket, prefix, limit, search, json)
        break
      }
      case 'delete': {
        const paths = argv.args || []
        if (!paths || paths.length === 0) throw new Error('At least one path required')
        await deleteFiles(client, bucket, paths, json)
        break
      }
      case 'move': {
        const { from, to } = argv
        if (!from || !to) throw new Error('Both --from and --to required')
        await moveFile(client, bucket, from, to, json)
        break
      }
      case 'copy': {
        const { from, to } = argv
        if (!from || !to) throw new Error('Both --from and --to required')
        await copyFile(client, bucket, from, to, json)
        break
      }
      case 'info': {
        const { path: remotePath } = argv
        const pathsFromArgs = argv.args || []
        const actualPath = remotePath || pathsFromArgs[0]
        if (!actualPath) throw new Error('File path required (use --path or provide as argument)')
        await getFileInfo(client, bucket, actualPath, json)
        break
      }
      case 'exists': {
        const { path: remotePath } = argv
        const pathsFromArgs = argv.args || []
        const actualPath = remotePath || pathsFromArgs[0]
        if (!actualPath) throw new Error('File path required (use --path or provide as argument)')
        await checkFileExists(client, bucket, actualPath, json)
        break
      }
      case 'update': {
        const { file, path: remotePath, upsert } = argv
        if (!file) throw new Error('File path required (use --file)')
        if (!remotePath) throw new Error('Remote path required (use --path to specify destination)')
        await updateFile(client, bucket, file, remotePath, upsert, json)
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

async function uploadFile(
  client: StorageClient,
  bucket: string,
  filePath: string,
  remotePath: string | undefined,
  upsert: boolean,
  asJson: boolean,
) {
  const fileName = remotePath || path.basename(filePath)
  const fileBuffer = fs.readFileSync(filePath)
  const stats = fs.statSync(filePath)

  logger.info(`Uploading ${formatBytes(stats.size)}...`)

  const { data, error } = await client.from(bucket).upload(fileName, fileBuffer, {
    upsert,
    contentType: getContentType(filePath),
  })

  if (error) throw error

  logger.success(`Uploaded: ${bucket}/${data.path}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}

async function downloadFile(
  client: StorageClient,
  bucket: string,
  remotePath: string,
  outputPath: string | undefined,
  _asJson: boolean,
) {
  logger.info(`Downloading...`)

  const { data, error } = await client.from(bucket).download(remotePath)
  if (error) throw error

  const output = outputPath || path.basename(remotePath)
  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(output, buffer)

  logger.success(`Downloaded: ${output} (${formatBytes(buffer.length)})`)
}

async function listFiles(
  client: StorageClient,
  bucket: string,
  prefix: string | undefined,
  limit: number,
  search: string | undefined,
  asJson: boolean,
) {
  const { data, error } = await client.from(bucket).list(prefix || '', {
    limit,
    search,
  })

  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n📂 Files in ${bucket}${prefix ? `/${prefix}` : ''} (${data.length})\n`)
    data.forEach((file) => {
      const icon = file.id ? '📄' : '📁'
      const size = file.metadata?.size ? ` (${formatBytes(file.metadata.size)})` : ''
      logger.log(`  ${icon} ${file.name}${size}`)
      if (file.updated_at) {
        logger.log(`     └─ Updated: ${new Date(file.updated_at).toLocaleString()}`)
      }
    })
  }
}

async function deleteFiles(client: StorageClient, bucket: string, paths: string[], asJson: boolean) {
  logger.info(`Deleting ${paths.length} file(s)...`)

  const { data, error } = await client.from(bucket).remove(paths)
  if (error) throw error

  logger.success(`Deleted ${data.length} file(s)`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    data.forEach((file) => logger.log(`  ✓ ${file.name}`))
  }
}

async function moveFile(client: StorageClient, bucket: string, from: string, to: string, asJson: boolean) {
  const { data, error } = await client.from(bucket).move(from, to)
  if (error) throw error

  logger.success(`Moved: ${from} → ${to}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}

async function copyFile(client: StorageClient, bucket: string, from: string, to: string, asJson: boolean) {
  const { data, error } = await client.from(bucket).copy(from, to)
  if (error) throw error

  logger.success(`Copied: ${from} → ${to}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}

async function getFileInfo(client: StorageClient, bucket: string, filePath: string, asJson: boolean) {
  logger.info(`Getting file info...`)

  const { data, error } = await client.from(bucket).info(filePath)
  if (error) throw error

  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  } else {
    logger.log(`\n📄 File: ${data.name}\n`)
    logger.log(`  ID:             ${data.id}`)
    logger.log(`  Bucket:         ${data.bucketId}`)
    logger.log(`  Size:           ${formatBytes(data.metadata?.size || 0)}`)
    logger.log(`  Content Type:   ${data.metadata?.mimetype || 'unknown'}`)
    logger.log(`  Created:        ${data.createdAt}`)
    logger.log(`  Updated:        ${data.updatedAt}`)
    logger.log(`  Last Accessed:  ${data.lastAccessedAt || 'N/A'}`)
    if (data.metadata?.cacheControl) {
      logger.log(`  Cache Control:  ${data.metadata.cacheControl}`)
    }
    if (data.metadata?.eTag) {
      logger.log(`  ETag:           ${data.metadata.eTag}`)
    }
  }
}

async function checkFileExists(client: StorageClient, bucket: string, filePath: string, asJson: boolean) {
  const { data, error } = await client.from(bucket).exists(filePath)

  if (asJson) {
    logger.log(JSON.stringify({ exists: data, error: error?.message || null }, null, 2))
  } else {
    if (data) {
      logger.success(`File exists: ${filePath}`)
    } else {
      logger.info(`File does not exist: ${filePath}`)
    }
  }
}

async function updateFile(
  client: StorageClient,
  bucket: string,
  filePath: string,
  remotePath: string,
  upsert: boolean,
  asJson: boolean,
) {
  const fileBuffer = fs.readFileSync(filePath)
  const stats = fs.statSync(filePath)

  logger.info(`Updating ${formatBytes(stats.size)}...`)

  const { data, error } = await client.from(bucket).update(remotePath, fileBuffer, {
    upsert,
    contentType: getContentType(filePath),
  })

  if (error) throw error

  logger.success(`Updated: ${bucket}/${data.path}`)
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2))
  }
}
