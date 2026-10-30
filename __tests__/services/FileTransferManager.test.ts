import RNFS from 'react-native-fs';
import { FileTransferManager } from '../../src/services/FileTransferManager';

describe('FileTransferManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareSenderFile calculates metadata correctly', async () => {
    (RNFS.stat as jest.Mock).mockResolvedValueOnce({
      size: 131072, // 128 KB
      isFile: () => true,
    });
    (RNFS.hash as jest.Mock).mockResolvedValueOnce('mock-sha256-hash');

    const meta = await FileTransferManager.prepareSenderFile(
      'file:///storage/emulated/0/DCIM/photo.jpg',
      'tx-1',
      'photo.jpg',
      'image/jpeg',
    );

    expect(meta.id).toBe('tx-1');
    expect(meta.name).toBe('photo.jpg');
    expect(meta.size).toBe(131072);
    expect(meta.totalChunks).toBe(2); // 128KB / 64KB = 2 chunks
    expect(meta.checksum).toBe('mock-sha256-hash');
  });

  test('readChunk reads file slice at calculated offset', async () => {
    (RNFS.read as jest.Mock).mockResolvedValueOnce('base64ChunkData');

    const chunk = await FileTransferManager.readChunk('/path/to/file.mp4', 3, 65536);

    expect(RNFS.read).toHaveBeenCalledWith(
      '/path/to/file.mp4',
      65536,
      3 * 65536, // position offset = 196608
      'base64',
    );
    expect(chunk).toBe('base64ChunkData');
  });

  test('writeChunk writes directly to disk at offset', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValueOnce(false);
    (RNFS.writeFile as jest.Mock).mockResolvedValueOnce(undefined);
    (RNFS.write as jest.Mock).mockResolvedValueOnce(undefined);

    await FileTransferManager.writeChunk('/tmp/file.part', 2, 65536, 'chunkBase64');

    expect(RNFS.exists).toHaveBeenCalledWith('/tmp/file.part');
    expect(RNFS.writeFile).toHaveBeenCalledWith('/tmp/file.part', '', 'base64');
    expect(RNFS.write).toHaveBeenCalledWith('/tmp/file.part', 'chunkBase64', 131072, 'base64');
  });

  test('resolveFilenameCollision increments counter when filename already exists', async () => {
    (RNFS.exists as jest.Mock)
      .mockResolvedValueOnce(true)  // test.pdf exists
      .mockResolvedValueOnce(true)  // test (1).pdf exists
      .mockResolvedValueOnce(false); // test (2).pdf does not exist

    const result = await FileTransferManager.resolveFilenameCollision('/downloads', 'test.pdf');
    expect(result).toBe('/downloads/test (2).pdf');
  });

  test('finalizeReceivedFile verifies checksum and moves file', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.hash as jest.Mock).mockResolvedValueOnce('EXPECTED_HASH');
    (RNFS.moveFile as jest.Mock).mockResolvedValueOnce(undefined);

    const { finalPath, verified } = await FileTransferManager.finalizeReceivedFile(
      '/downloads/.tx1_song.mp3.part',
      'song.mp3',
      'expected_hash',
    );

    const expectedDir = FileTransferManager.getDownloadDirectory();
    expect(verified).toBe(true);
    expect(finalPath).toBe(`${expectedDir}/song.mp3`);
    expect(RNFS.moveFile).toHaveBeenCalledWith('/downloads/.tx1_song.mp3.part', `${expectedDir}/song.mp3`);
  });

  test('sanitizeFileName prevents directory traversal and illegal characters', () => {
    expect(FileTransferManager.sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(FileTransferManager.sanitizeFileName('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
    expect(FileTransferManager.sanitizeFileName('normal_file.pdf')).toBe('normal_file.pdf');
    expect(FileTransferManager.sanitizeFileName('')).toBe('received_file');
  });

  test('cleanupTempFile unlinks file if it exists', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValueOnce(true);
    (RNFS.unlink as jest.Mock).mockResolvedValueOnce(undefined);

    await FileTransferManager.cleanupTempFile('/downloads/.temp.part');
    expect(RNFS.unlink).toHaveBeenCalledWith('/downloads/.temp.part');
  });
});
