import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';

typedef _ProcessFileNative = Int32 Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Int32 presetId);
typedef _ProcessFileDart = int Function(
    Pointer<Utf8> input, Pointer<Utf8> output, int presetId);

typedef _ProcessFileWithChainNative = Int32 Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> chainJson);
typedef _ProcessFileWithChainDart = int Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> chainJson);

typedef _GetStringNative = Pointer<Utf8> Function();
typedef _GetStringDart = Pointer<Utf8> Function();

typedef _FreeStringNative = Void Function(Pointer<Utf8> ptr);
typedef _FreeStringDart = void Function(Pointer<Utf8> ptr);

final DynamicLibrary _nativeLib = Platform.isAndroid
    ? DynamicLibrary.open('libvozoo_ffi.so')
    : DynamicLibrary.process();

final _ProcessFileDart _processFile = _nativeLib
    .lookup<NativeFunction<_ProcessFileNative>>('process_file')
    .asFunction();

final _ProcessFileWithChainDart _processFileWithChain = _nativeLib
    .lookup<NativeFunction<_ProcessFileWithChainNative>>('process_file_with_chain')
    .asFunction();

final _GetStringDart _getAvailableNodes = _nativeLib
    .lookup<NativeFunction<_GetStringNative>>('get_available_nodes')
    .asFunction();

final _GetStringDart _getPresets = _nativeLib
    .lookup<NativeFunction<_GetStringNative>>('get_presets')
    .asFunction();

final _FreeStringDart _freeString = _nativeLib
    .lookup<NativeFunction<_FreeStringNative>>('free_string')
    .asFunction();

/// Process a WAV file with the given preset ID (legacy API).
/// Returns 0 on success, -1 on read error, -2 on write error.
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

/// Process a WAV file with a JSON chain definition.
/// Returns 0 on success, -1 on read error, -2 on write error, -3 on invalid JSON.
Future<int> processFileWithChain(String inputPath, String outputPath, String chainJson) async {
  final input = inputPath.toNativeUtf8();
  final output = outputPath.toNativeUtf8();
  final chain = chainJson.toNativeUtf8();
  try {
    return _processFileWithChain(input, output, chain);
  } finally {
    malloc.free(input);
    malloc.free(output);
    malloc.free(chain);
  }
}

/// Get JSON string of all available node types.
String getAvailableNodes() {
  final ptr = _getAvailableNodes();
  final json = ptr.toDartString();
  _freeString(ptr);
  return json;
}

/// Get JSON string of all built-in preset chain definitions.
String getPresets() {
  final ptr = _getPresets();
  final json = ptr.toDartString();
  _freeString(ptr);
  return json;
}
