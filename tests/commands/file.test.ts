import { StorageClient } from '@supabase/storage-js'
import { handler } from '../../src/commands/file'
import { logger } from '../../src/logger'
import * as fs from 'fs'
import * as utils from '../../src/utils'

// Mock dependencies
jest.mock('@supabase/storage-js')
jest.mock('../../src/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}))
jest.mock('fs')

interface MockBucketClient {
  upload: jest.Mock
  download: jest.Mock
  list: jest.Mock
  remove: jest.Mock
  move: jest.Mock
  copy: jest.Mock
  info: jest.Mock
  exists: jest.Mock
  update: jest.Mock
}

describe('file command', () => {
  let mockClient: jest.Mocked<StorageClient>
  let mockBucketClient: MockBucketClient

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock bucket client methods
    mockBucketClient = {
      upload: jest.fn(),
      download: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
      move: jest.fn(),
      copy: jest.fn(),
      info: jest.fn(),
      exists: jest.fn(),
      update: jest.fn(),
    }

    mockClient = {
      from: jest.fn().mockReturnValue(mockBucketClient),
    } as unknown as jest.Mocked<StorageClient>

    // Mock getStorageClient to return our mock client
    jest.spyOn(utils, 'getStorageClient').mockReturnValue(mockClient)

    // Mock process.exit
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('upload action', () => {
    beforeEach(() => {
      ;(fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test content'))
      ;(fs.statSync as jest.Mock).mockReturnValue({ size: 12 })
    })

    it('should upload a file', async () => {
      mockBucketClient.upload.mockResolvedValue({
        data: { path: 'test.txt' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'upload',
        bucket: 'test-bucket',
        file: '/local/test.txt',
        upsert: false,
        limit: 100,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockClient.from).toHaveBeenCalledWith('test-bucket')
      expect(mockBucketClient.upload).toHaveBeenCalled()
      expect(logger.success).toHaveBeenCalledWith('Uploaded: test-bucket/test.txt')
    })

    it('should upload with custom remote path', async () => {
      mockBucketClient.upload.mockResolvedValue({
        data: { path: 'custom/path.txt' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'upload',
        bucket: 'test-bucket',
        file: '/local/test.txt',
        path: 'custom/path.txt',
        upsert: false,
        limit: 100,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.upload).toHaveBeenCalledWith('custom/path.txt', expect.any(Buffer), expect.any(Object))
    })

    it('should handle upsert flag', async () => {
      mockBucketClient.upload.mockResolvedValue({
        data: { path: 'test.txt' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'upload',
        bucket: 'test-bucket',
        file: '/local/test.txt',
        upsert: true,
        limit: 100,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({ upsert: true }),
      )
    })

    it('should throw error when file path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'upload',
        bucket: 'test-bucket',
        upsert: false,
        limit: 100,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('File path required (use --file)')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('download action', () => {
    it('should download a file', async () => {
      const mockBlob = new Blob(['test content'])
      mockBucketClient.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      })
      ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {})

      await handler({
        _: [],
        $0: '',
        action: 'download',
        bucket: 'test-bucket',
        path: 'remote/test.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.download).toHaveBeenCalledWith('remote/test.txt')
      expect(logger.success).toHaveBeenCalled()
    })

    it('should download with custom output path', async () => {
      const mockBlob = new Blob(['test content'])
      mockBucketClient.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      })
      ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {})

      await handler({
        _: [],
        $0: '',
        action: 'download',
        bucket: 'test-bucket',
        path: 'remote/test.txt',
        output: '/local/custom.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(fs.writeFileSync).toHaveBeenCalledWith('/local/custom.txt', expect.any(Buffer))
    })

    it('should throw error when remote path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'download',
        bucket: 'test-bucket',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Remote path required (use --path or provide as argument)')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('list action', () => {
    it('should list files in a bucket', async () => {
      const mockFiles = [
        { id: '1', name: 'file1.txt', metadata: { size: 100 }, updated_at: '2024-01-01' },
        { id: '2', name: 'file2.txt', metadata: { size: 200 }, updated_at: '2024-01-02' },
      ]

      mockBucketClient.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: 'test-bucket',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.list).toHaveBeenCalledWith('', { limit: 100, search: undefined })
      expect(logger.log).toHaveBeenCalled()
    })

    it('should list files with prefix', async () => {
      mockBucketClient.list.mockResolvedValue({
        data: [],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: 'test-bucket',
        prefix: 'folder/',
        limit: 50,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.list).toHaveBeenCalledWith('folder/', { limit: 50, search: undefined })
    })

    it('should list files with search', async () => {
      mockBucketClient.list.mockResolvedValue({
        data: [],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: 'test-bucket',
        search: 'test',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.list).toHaveBeenCalledWith('', { limit: 100, search: 'test' })
    })
  })

  describe('delete action', () => {
    it('should delete files', async () => {
      mockBucketClient.remove.mockResolvedValue({
        data: [{ name: 'file1.txt' }, { name: 'file2.txt' }],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'delete',
        bucket: 'test-bucket',
        args: ['file1.txt', 'file2.txt'],
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.remove).toHaveBeenCalledWith(['file1.txt', 'file2.txt'])
      expect(logger.success).toHaveBeenCalledWith('Deleted 2 file(s)')
    })

    it('should throw error when no paths provided', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'delete',
        bucket: 'test-bucket',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('At least one path required')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('move action', () => {
    it('should move a file', async () => {
      mockBucketClient.move.mockResolvedValue({
        data: { message: 'Success' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'move',
        bucket: 'test-bucket',
        from: 'old/path.txt',
        to: 'new/path.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.move).toHaveBeenCalledWith('old/path.txt', 'new/path.txt')
      expect(logger.success).toHaveBeenCalledWith('Moved: old/path.txt → new/path.txt')
    })

    it('should throw error when from or to is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'move',
        bucket: 'test-bucket',
        from: 'old/path.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Both --from and --to required')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('copy action', () => {
    it('should copy a file', async () => {
      mockBucketClient.copy.mockResolvedValue({
        data: { path: 'new/path.txt' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'copy',
        bucket: 'test-bucket',
        from: 'source.txt',
        to: 'destination.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.copy).toHaveBeenCalledWith('source.txt', 'destination.txt')
      expect(logger.success).toHaveBeenCalledWith('Copied: source.txt → destination.txt')
    })
  })

  describe('info action', () => {
    it('should get file info', async () => {
      const fileInfo = {
        id: '123',
        name: 'test.txt',
        bucketId: 'test-bucket',
        metadata: {
          size: 1024,
          mimetype: 'text/plain',
          cacheControl: 'max-age=3600',
          eTag: 'abc123',
        },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        lastAccessedAt: '2024-01-03',
      }

      mockBucketClient.info.mockResolvedValue({
        data: fileInfo,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'info',
        bucket: 'test-bucket',
        path: 'test.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.info).toHaveBeenCalledWith('test.txt')
      expect(logger.log).toHaveBeenCalled()
    })

    it('should output JSON when json flag is true', async () => {
      const fileInfo = {
        id: '123',
        name: 'test.txt',
        bucketId: 'test-bucket',
        metadata: { size: 1024 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      mockBucketClient.info.mockResolvedValue({
        data: fileInfo,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'info',
        bucket: 'test-bucket',
        path: 'test.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: true,
      })

      expect(logger.log).toHaveBeenCalledWith(JSON.stringify(fileInfo, null, 2))
    })
  })

  describe('exists action', () => {
    it('should check if file exists', async () => {
      mockBucketClient.exists.mockResolvedValue({
        data: true,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'exists',
        bucket: 'test-bucket',
        path: 'test.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.exists).toHaveBeenCalledWith('test.txt')
      expect(logger.success).toHaveBeenCalledWith('File exists: test.txt')
    })

    it('should handle file not existing', async () => {
      mockBucketClient.exists.mockResolvedValue({
        data: false,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'exists',
        bucket: 'test-bucket',
        path: 'missing.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.info).toHaveBeenCalledWith('File does not exist: missing.txt')
    })
  })

  describe('update action', () => {
    beforeEach(() => {
      ;(fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('updated content'))
      ;(fs.statSync as jest.Mock).mockReturnValue({ size: 15 })
    })

    it('should update a file', async () => {
      mockBucketClient.update.mockResolvedValue({
        data: { path: 'test.txt' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'update',
        bucket: 'test-bucket',
        file: '/local/test.txt',
        path: 'remote/test.txt',
        upsert: false,
        limit: 100,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.update).toHaveBeenCalledWith(
        'remote/test.txt',
        expect.any(Buffer),
        expect.objectContaining({ upsert: false }),
      )
      expect(logger.success).toHaveBeenCalledWith('Updated: test-bucket/test.txt')
    })

    it('should throw error when file or path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'update',
        bucket: 'test-bucket',
        file: '/local/test.txt',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Remote path required (use --path to specify destination)')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('validation', () => {
    it('should exit when key is not set', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: 'test-bucket',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: '',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Storage key not set')
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should exit when bucket is not set', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: '',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Bucket name required')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('error handling', () => {
    it('should handle storage errors', async () => {
      mockBucketClient.list.mockResolvedValue({
        data: null,
        error: new Error('Storage error'),
      })

      await handler({
        _: [],
        $0: '',
        action: 'list',
        bucket: 'test-bucket',
        limit: 100,
        upsert: false,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Storage error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})
