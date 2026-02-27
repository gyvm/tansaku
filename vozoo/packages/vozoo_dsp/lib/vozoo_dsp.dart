import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';

final DynamicLibrary _nativeLib = Platform.isAndroid
    ? DynamicLibrary.open('libvozoo_dsp.so')
    : DynamicLibrary.process();

typedef ProcessFileFunc = Int32 Function(Pointer<Utf8> input, Pointer<Utf8> output, Int32 presetId);
typedef ProcessFile = int Function(Pointer<Utf8> input, Pointer<Utf8> output, int presetId);

final ProcessFile _processFile = _nativeLib
    .lookup<NativeFunction<ProcessFileFunc>>('process_file')
    .asFunction();

Future<int> processFile(String inputPath, String outputPath, int presetId) async {
  final input = inputPath.toNativeUtf8();
  final output = outputPath.toNativeUtf8();

  try {
    return _processFile(input, output, presetId);
  } finally {
    malloc.free(input);
    malloc.free(output);
  }
}
