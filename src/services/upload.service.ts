import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

/**
 * Azure Blob Storage Service
 * Handles image uploads to Azure Blob Storage
 */

export class UploadService {
  private containerClient: ContainerClient;
  private containerName: string;
  private accountName: string;
  private accountKey: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'dog-images';

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }

    // Parse connection string to get account name and key
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
    
    this.accountName = accountNameMatch ? accountNameMatch[1] : '';
    this.accountKey = accountKeyMatch ? accountKeyMatch[1] : '';

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(this.containerName);
    
    // Ensure container exists
    this.initializeContainer();
  }

  private async initializeContainer() {
    try {
      // Create container WITHOUT public access (private)
      await this.containerClient.createIfNotExists();
      console.log(`📦 Azure Blob container '${this.containerName}' is ready`);
    } catch (error) {
      console.error('Error initializing Azure container:', error);
    }
  }

  /**
   * Generate a SAS URL for a blob (allows temporary public access)
   */
  private generateSasUrl(blobName: string): string {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('r'), // Read only
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      sharedKeyCredential
    ).toString();

    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
  }

  /**
   * Upload a file from multer to Azure Blob Storage
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileExtension = this.getExtension(file.originalname) || 'jpg';
    const blobName = `${uuidv4()}.${fileExtension}`;
    
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.buffer.length, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    // Return SAS URL for private container
    const sasUrl = this.generateSasUrl(blobName);
    console.log(`📁 File uploaded to Azure: ${blobName}`);
    return sasUrl;
  }

  /**
   * Upload from base64 string to Azure Blob Storage
   */
  async uploadBase64(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const extension = mimeType.split('/')[1] || 'jpg';
    const blobName = `${uuidv4()}.${extension}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    // Return SAS URL for private container
    const sasUrl = this.generateSasUrl(blobName);
    console.log(`📁 Base64 file uploaded to Azure: ${blobName}`);
    return sasUrl;
  }

  /**
   * Upload from a URI (for React Native)
   * Receives the image as buffer from the request
   */
  async uploadBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const extension = this.getExtension(originalName) || mimeType.split('/')[1] || 'jpg';
    const blobName = `${uuidv4()}.${extension}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    // Return SAS URL for private container
    const sasUrl = this.generateSasUrl(blobName);
    console.log(`📁 Buffer uploaded to Azure: ${blobName}`);
    return sasUrl;
  }

  /**
   * Delete a file from Azure Blob Storage
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const blobName = this.getBlobNameFromUrl(fileUrl);
      if (!blobName) return false;

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();

      console.log(`🗑️ File deleted from Azure: ${blobName}`);
      return true;
    } catch (error) {
      console.error('Error deleting file from Azure:', error);
      return false;
    }
  }

  /**
   * Check if a file exists in Azure Blob Storage
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      const blobName = this.getBlobNameFromUrl(fileUrl);
      if (!blobName) return false;

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch {
      return false;
    }
  }

  /**
   * Get file info from Azure
   */
  async getFileInfo(fileUrl: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    try {
      const blobName = this.getBlobNameFromUrl(fileUrl);
      if (!blobName) return { exists: false };

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();

      return {
        exists: true,
        size: properties.contentLength,
        contentType: properties.contentType,
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Extract blob name from full URL (handles SAS URLs too)
   */
  private getBlobNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // URL format: /container-name/blob-name
      return pathParts[pathParts.length - 1];
    } catch {
      return null;
    }
  }

  /**
   * Get file extension from filename
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}

export default new UploadService();
