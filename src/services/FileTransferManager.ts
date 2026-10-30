/**
 * FileTransferManager: Production-grade streaming file I/O for P2P transfers
 *
 * Implements chunked streaming directly to/from disk using react-native-fs.
 * Avoids loading large files or chunk arrays into JavaScript V8 memory.
 */

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { DEFAULT_CHUNK_SIZE } from '../protocol/ProtocolMessages';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  checksum?: string;
  uri?: string;
}

export class FileTransferManager {
  private static chunkSize = DEFAULT_CHUNK_SIZE;

  /**
   * Configures the chunk size for transfers (default 64 KB).
   */
  public static setChunkSize(size: number): void {
    if (size >= 1024 && size <= 4 * 1024 * 1024) {
      this.chunkSize = size;
    }
  }

  public static getChunkSize(): number {
    return this.chunkSize;
  }

  /**
   * Sanitizes file name to prevent path traversal attacks (e.g. "../../etc/passwd").
   */
  public static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') return 'received_file';
    // Extract only the base name (strip any leading directory traversal)
    const base = fileName.split(/[/\\]/).pop() || 'received_file';
    let sanitized = base
      .replace(/[\0\r\n\t]/g, '')
      .replace(/[?%*:|"<>]/g, '_')
      .replace(/\.{2,}/g, '.')
      .trim();

    sanitized = sanitized.replace(/^_+/, '').replace(/^\.+/, '');
    return sanitized || 'received_file';
  }

  /**
   * Normalizes platform file URI to absolute file path for RNFS.
   */
  public static normalizePath(uri: string): string {
    if (!uri) return '';
    let path = uri;
    if (Platform.OS === 'ios') {
      path = uri.replace('file://', '');
    } else if (Platform.OS === 'android') {
      if (path.startsWith('file://')) {
        path = path.replace('file://', '');
      }
    }
    return decodeURI(path);
  }

  /**
   * Inspects a local file and generates full transfer metadata with optional checksum.
   */
  public static async prepareSenderFile(
    fileUri: string,
    id: string,
    customName?: string,
    mimeType: string = 'file',
  ): Promise<FileMetadata> {
    const filePath = this.normalizePath(fileUri);
    const fileStat = await RNFS.stat(filePath);
    const size = Number(fileStat.size);
    const chunkSize = this.chunkSize;
    const totalChunks = Math.max(1, Math.ceil(size / chunkSize));

    let checksum: string | undefined;
    try {
      // Calculate SHA-256 natively via streaming without loading whole file into JS
      checksum = await RNFS.hash(filePath, 'sha256');
    } catch (e) {
      console.warn('[FileTransferManager] Native SHA-256 computation warning:', e);
    }

    const rawName = customName || filePath.split('/').pop() || 'transferred_file';
    const name = this.sanitizeFileName(rawName);

    return {
      id,
      name,
      size,
      mimeType,
      totalChunks,
      chunkSize,
      checksum,
      uri: filePath,
    };
  }

  /**
   * Reads a single chunk from disk at the specified index without loading the rest of the file.
   */
  public static async readChunk(
    filePath: string,
    chunkIndex: number,
    chunkSize: number = this.chunkSize,
  ): Promise<string> {
    const normalized = this.normalizePath(filePath);
    const position = chunkIndex * chunkSize;
    // RNFS.read(filepath, length, position, 'base64')
    return await RNFS.read(normalized, chunkSize, position, 'base64');
  }

  /**
   * Returns default destination directory for downloads.
   */
  public static getDownloadDirectory(): string {
    return Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;
  }

  /**
   * Prepares a temporary file (.part) for streaming incoming chunks.
   */
  public static getTempFilePath(transferId: string, fileName: string): string {
    const destDir = this.getDownloadDirectory();
    const cleanName = this.sanitizeFileName(fileName);
    return `${destDir}/.${transferId}_${cleanName}.part`;
  }

  /**
   * Writes a received chunk directly to disk at the chunk's offset.
   */
  public static async writeChunk(
    tempFilePath: string,
    chunkIndex: number,
    chunkSize: number,
    base64Data: string,
  ): Promise<void> {
    const position = chunkIndex * chunkSize;
    const exists = await RNFS.exists(tempFilePath);
    if (!exists) {
      // Create empty file initially if it does not exist
      await RNFS.writeFile(tempFilePath, '', 'base64');
    }
    // RNFS.write(filepath, contents, position, 'base64')
    await RNFS.write(tempFilePath, base64Data, position, 'base64');
  }

  /**
   * Verifies completed download integrity and moves file to final destination.
   */
  public static async finalizeReceivedFile(
    tempFilePath: string,
    fileName: string,
    expectedChecksum?: string,
  ): Promise<{ finalPath: string; verified: boolean }> {
    const destDir = this.getDownloadDirectory();
    const cleanName = this.sanitizeFileName(fileName);
    const finalPath = await this.resolveFilenameCollision(destDir, cleanName);

    // Verify SHA-256 if provided
    let verified = true;
    if (expectedChecksum) {
      try {
        const computedChecksum = await RNFS.hash(tempFilePath, 'sha256');
        verified = computedChecksum.toLowerCase() === expectedChecksum.toLowerCase();
        if (!verified) {
          console.error(
            `[FileTransferManager] Checksum mismatch! Expected ${expectedChecksum}, got ${computedChecksum}`,
          );
        }
      } catch (e) {
        console.warn('[FileTransferManager] Could not verify hash:', e);
      }
    }

    // Move file to final path
    await RNFS.moveFile(tempFilePath, finalPath);
    console.log(`[FileTransferManager] Finalized file at: ${finalPath}`);

    return { finalPath, verified };
  }

  /**
   * Resolves collision if a file with the same name already exists in destination.
   */
  public static async resolveFilenameCollision(
    dir: string,
    fileName: string,
  ): Promise<string> {
    let candidate = `${dir}/${fileName}`;
    const exists = await RNFS.exists(candidate);
    if (!exists) return candidate;

    const dotIndex = fileName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    const ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '';

    let counter = 1;
    while (true) {
      candidate = `${dir}/${baseName} (${counter})${ext}`;
      const conflict = await RNFS.exists(candidate);
      if (!conflict) return candidate;
      counter++;
    }
  }

  /**
   * Cleans up temporary or aborted transfer file.
   */
  public static async cleanupTempFile(tempFilePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(tempFilePath);
      if (exists) {
        await RNFS.unlink(tempFilePath);
        console.log(`[FileTransferManager] Cleaned up temporary file: ${tempFilePath}`);
      }
    } catch (e) {
      console.warn('[FileTransferManager] Error cleaning up temp file:', e);
    }
  }
}
