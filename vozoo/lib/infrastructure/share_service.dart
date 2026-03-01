import 'package:share_plus/share_plus.dart';
import '../../domain/interfaces/i_share_service.dart';

class ShareService implements IShareService {
  @override
  Future<void> shareFile(String path, {String? text}) async {
    await SharePlus.instance.share(
      ShareParams(files: [XFile(path)], text: text),
    );
  }
}
