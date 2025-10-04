import { StorageClient } from '@supabase/storage-js'
import { handler } from '../../src/commands/url'
import { logger } from '../../src/logger'
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

interface MockBucketClient {
  getPublicUrl: jest.Mock
  createSignedUrl: jest.Mock
  createSignedUploadUrl: jest.Mock
  createSignedUrls: jest.Mock
}

describe('url command', () => {
  let mockClient: jest.Mocked<StorageClient>
  let mockBucketClient: MockBucketClient

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock bucket client methods
    mockBucketClient = {
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
      createSignedUploadUrl: jest.fn(),
      createSignedUrls: jest.fn(),
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

  describe('public action', () => {
    it('should generate public URL', async () => {
      mockBucketClient.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'http://localhost:5000/storage/v1/object/public/test-bucket/test.txt' },
      })

      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockClient.from).toHaveBeenCalledWith('test-bucket')
      expect(mockBucketClient.getPublicUrl).toHaveBeenCalledWith('test.txt')
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5000/storage/v1/object/public/test-bucket/test.txt'),
      )
    })

    it('should generate public URL with download option', async () => {
      mockBucketClient.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'http://localhost:5000/storage/v1/object/public/test-bucket/test.txt' },
      })

      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        path: 'test.txt',
        download: true,
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.getPublicUrl).toHaveBeenCalledWith('test.txt', { download: true })
    })

    it('should generate public URL with custom download filename', async () => {
      mockBucketClient.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'http://localhost:5000/storage/v1/object/public/test-bucket/test.txt' },
      })

      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        path: 'test.txt',
        download: 'custom-name.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.getPublicUrl).toHaveBeenCalledWith('test.txt', { download: 'custom-name.txt' })
    })

    it('should output JSON when json flag is true', async () => {
      const publicUrlData = { publicUrl: 'http://localhost:5000/storage/v1/object/public/test-bucket/test.txt' }
      mockBucketClient.getPublicUrl.mockReturnValue({
        data: publicUrlData,
      })

      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: true,
      })

      expect(logger.log).toHaveBeenCalledWith(JSON.stringify(publicUrlData, null, 2))
    })

    it('should throw error when path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Path required for public URL')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('signed action', () => {
    it('should generate signed URL', async () => {
      mockBucketClient.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'http://localhost:5000/storage/v1/object/sign/test-bucket/test.txt?token=abc123' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUrl).toHaveBeenCalledWith('test.txt', 3600)
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Signed URL'))
    })

    it('should generate signed URL with custom expiry', async () => {
      mockBucketClient.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'http://localhost:5000/storage/v1/object/sign/test-bucket/test.txt?token=abc123' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 7200,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUrl).toHaveBeenCalledWith('test.txt', 7200)
    })

    it('should generate signed URL with download option', async () => {
      mockBucketClient.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'http://localhost:5000/storage/v1/object/sign/test-bucket/test.txt?token=abc123' },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed',
        bucket: 'test-bucket',
        path: 'test.txt',
        download: 'filename.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUrl).toHaveBeenCalledWith('test.txt', 3600, { download: 'filename.txt' })
    })

    it('should throw error when path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'signed',
        bucket: 'test-bucket',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Path required for signed URL')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('signed-upload action', () => {
    it('should generate signed upload URL', async () => {
      mockBucketClient.createSignedUploadUrl.mockResolvedValue({
        data: {
          path: 'test.txt',
          token: 'upload-token-123',
          signedUrl: 'http://localhost:5000/storage/v1/object/upload/sign/test-bucket/test.txt',
        },
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-upload',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUploadUrl).toHaveBeenCalledWith('test.txt')
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Signed Upload URL'))
    })

    it('should output JSON when json flag is true', async () => {
      const uploadData = {
        path: 'test.txt',
        token: 'upload-token-123',
        signedUrl: 'http://localhost:5000/storage/v1/object/upload/sign/test-bucket/test.txt',
      }
      mockBucketClient.createSignedUploadUrl.mockResolvedValue({
        data: uploadData,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-upload',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: true,
      })

      expect(logger.log).toHaveBeenCalledWith(JSON.stringify(uploadData, null, 2))
    })

    it('should throw error when path is missing', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'signed-upload',
        bucket: 'test-bucket',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Path required for signed upload URL')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('signed-urls action', () => {
    it('should generate multiple signed URLs', async () => {
      mockBucketClient.createSignedUrls.mockResolvedValue({
        data: [
          { path: 'file1.txt', signedUrl: 'http://localhost/file1.txt?token=abc', error: null },
          { path: 'file2.txt', signedUrl: 'http://localhost/file2.txt?token=def', error: null },
        ],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-urls',
        bucket: 'test-bucket',
        path: 'file1.txt',
        args: ['file2.txt'],
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUrls).toHaveBeenCalledWith(['file1.txt', 'file2.txt'], 3600)
      expect(logger.success).toHaveBeenCalledWith('\n2/2 URLs generated successfully')
    })

    it('should handle URLs with errors', async () => {
      mockBucketClient.createSignedUrls.mockResolvedValue({
        data: [
          { path: 'file1.txt', signedUrl: 'http://localhost/file1.txt?token=abc', error: null },
          { path: 'missing.txt', signedUrl: null, error: 'File not found' },
        ],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-urls',
        bucket: 'test-bucket',
        args: ['file1.txt', 'missing.txt'],
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('✓ file1.txt'))
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('✗ missing.txt'))
      expect(logger.success).toHaveBeenCalledWith('\n1/2 URLs generated successfully')
    })

    it('should generate signed URLs with download option', async () => {
      mockBucketClient.createSignedUrls.mockResolvedValue({
        data: [{ path: 'file1.txt', signedUrl: 'http://localhost/file1.txt?token=abc', error: null }],
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-urls',
        bucket: 'test-bucket',
        args: ['file1.txt'],
        download: true,
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(mockBucketClient.createSignedUrls).toHaveBeenCalledWith(['file1.txt'], 3600, { download: true })
    })

    it('should output JSON when json flag is true', async () => {
      const urlsData = [
        { path: 'file1.txt', signedUrl: 'http://localhost/file1.txt?token=abc', error: null },
        { path: 'file2.txt', signedUrl: 'http://localhost/file2.txt?token=def', error: null },
      ]
      mockBucketClient.createSignedUrls.mockResolvedValue({
        data: urlsData,
        error: null,
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed-urls',
        bucket: 'test-bucket',
        args: ['file1.txt', 'file2.txt'],
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: true,
      })

      expect(logger.log).toHaveBeenCalledWith(JSON.stringify(urlsData, null, 2))
    })

    it('should throw error when no paths provided', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'signed-urls',
        bucket: 'test-bucket',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('At least one path required for signed URLs')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })

  describe('validation', () => {
    it('should exit when key is not set', async () => {
      await handler({
        _: [],
        $0: '',
        action: 'public',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
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
        action: 'public',
        bucket: '',
        path: 'test.txt',
        expires: 3600,
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
      mockBucketClient.createSignedUrl.mockResolvedValue({
        data: null,
        error: new Error('Storage error'),
      })

      await handler({
        _: [],
        $0: '',
        action: 'signed',
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Storage error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should handle unknown action', async () => {
      await handler({
        _: [],
        $0: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action: 'unknown' as any,
        bucket: 'test-bucket',
        path: 'test.txt',
        expires: 3600,
        url: 'http://localhost:5000/storage/v1',
        key: 'test-key',
        json: false,
      })

      expect(logger.error).toHaveBeenCalledWith('Unknown action: unknown')
      expect(process.exit).toHaveBeenCalledWith(1)
    })
  })
})
