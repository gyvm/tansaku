abstract class IStorageService {
  Future<String> getTemporaryDirectoryPath();
  Future<String> getApplicationDocumentsDirectoryPath();
  Future<String> createTempFile(String extension);
}
