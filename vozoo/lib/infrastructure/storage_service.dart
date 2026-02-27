import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../domain/interfaces/i_storage_service.dart';

class StorageService implements IStorageService {
  @override
  Future<String> getTemporaryDirectoryPath() async {
    final dir = await getTemporaryDirectory();
    return dir.path;
  }

  @override
  Future<String> getApplicationDocumentsDirectoryPath() async {
    final dir = await getApplicationDocumentsDirectory();
    return dir.path;
  }

  @override
  Future<String> createTempFile(String extension) async {
    final dir = await getTemporaryDirectory();
    return '${dir.path}/${DateTime.now().millisecondsSinceEpoch}.$extension';
  }
}
