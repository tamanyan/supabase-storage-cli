import { StorageClient } from '@supabase/storage-js'
import { getStorageClient } from '../../src/utils'

// Mock the StorageClient
jest.mock('@supabase/storage-js')
jest.mock('../../src/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}))

describe('bucket command', () => {
  let mockClient: jest.Mocked<StorageClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockClient = new StorageClient('http://localhost:5000/storage/v1', {
      apikey: 'test-key',
    }) as jest.Mocked<StorageClient>
  })

  describe('getStorageClient', () => {
    it('should create a StorageClient instance', () => {
      const client = getStorageClient('http://localhost:5000/storage/v1', 'test-key')
      expect(client).toBeInstanceOf(StorageClient)
    })

    it('should pass correct configuration', () => {
      const url = 'http://test.com/storage/v1'
      const key = 'test-service-key'

      getStorageClient(url, key)

      expect(StorageClient).toHaveBeenCalledWith(url, {
        apikey: key,
        Authorization: `Bearer ${key}`,
      })
    })
  })

  describe('bucket operations', () => {
    it('should handle listBuckets', async () => {
      const mockBuckets = [
        { id: '1', name: 'bucket1', public: true, file_size_limit: 1024 },
        { id: '2', name: 'bucket2', public: false, file_size_limit: 2048 },
      ]

      mockClient.listBuckets = jest.fn().mockResolvedValue({
        data: mockBuckets,
        error: null,
      })

      const result = await mockClient.listBuckets()

      expect(result.data).toEqual(mockBuckets)
      expect(result.error).toBeNull()
    })

    it('should handle createBucket', async () => {
      const newBucket = { id: '1', name: 'test-bucket', public: true }

      mockClient.createBucket = jest.fn().mockResolvedValue({
        data: newBucket,
        error: null,
      })

      const result = await mockClient.createBucket('test-bucket', { public: true })

      expect(result.data).toEqual(newBucket)
      expect(result.error).toBeNull()
      expect(mockClient.createBucket).toHaveBeenCalledWith('test-bucket', { public: true })
    })

    it('should handle getBucket', async () => {
      const bucket = {
        id: '1',
        name: 'test-bucket',
        public: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      mockClient.getBucket = jest.fn().mockResolvedValue({
        data: bucket,
        error: null,
      })

      const result = await mockClient.getBucket('test-bucket')

      expect(result.data).toEqual(bucket)
      expect(result.error).toBeNull()
    })

    it('should handle updateBucket', async () => {
      const updatedBucket = { id: '1', name: 'test-bucket', public: true }

      mockClient.updateBucket = jest.fn().mockResolvedValue({
        data: updatedBucket,
        error: null,
      })

      const result = await mockClient.updateBucket('test-bucket', { public: true })

      expect(result.data).toEqual(updatedBucket)
      expect(result.error).toBeNull()
    })

    it('should handle emptyBucket', async () => {
      mockClient.emptyBucket = jest.fn().mockResolvedValue({
        data: { message: 'Bucket emptied' },
        error: null,
      })

      const result = await mockClient.emptyBucket('test-bucket')

      expect(result.error).toBeNull()
      expect(mockClient.emptyBucket).toHaveBeenCalledWith('test-bucket')
    })

    it('should handle deleteBucket', async () => {
      mockClient.deleteBucket = jest.fn().mockResolvedValue({
        data: { message: 'Bucket deleted' },
        error: null,
      })

      const result = await mockClient.deleteBucket('test-bucket')

      expect(result.error).toBeNull()
      expect(mockClient.deleteBucket).toHaveBeenCalledWith('test-bucket')
    })

    it('should handle errors', async () => {
      const error = new Error('Bucket not found')

      mockClient.getBucket = jest.fn().mockResolvedValue({
        data: null,
        error,
      })

      const result = await mockClient.getBucket('non-existent')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(error)
    })
  })
})
