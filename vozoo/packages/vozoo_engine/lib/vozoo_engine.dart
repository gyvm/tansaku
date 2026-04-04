import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';
import 'package:ffi/ffi.dart';

// ── Batch processing types ────────────────────────────────────────

typedef _ProcessFileNative = Int32 Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Int32 presetId);
typedef _ProcessFileDart = int Function(
    Pointer<Utf8> input, Pointer<Utf8> output, int presetId);

typedef _ProcessFileWithChainNative = Int32 Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> chainJson);
typedef _ProcessFileWithChainDart = int Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> chainJson);

typedef _ProcessFileWithGraphNative = Int32 Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> graphJson);
typedef _ProcessFileWithGraphDart = int Function(
    Pointer<Utf8> input, Pointer<Utf8> output, Pointer<Utf8> graphJson);

typedef _GetStringNative = Pointer<Utf8> Function();
typedef _GetStringDart = Pointer<Utf8> Function();

typedef _FreeStringNative = Void Function(Pointer<Utf8> ptr);
typedef _FreeStringDart = void Function(Pointer<Utf8> ptr);

// ── Real-time engine types ────────────────────────────────────────

typedef _EngineCreateNative = Pointer<Void> Function();
typedef _EngineCreateDart = Pointer<Void> Function();

typedef _EngineDestroyNative = Void Function(Pointer<Void> handle);
typedef _EngineDestroyDart = void Function(Pointer<Void> handle);

typedef _EngineSetChainNative = Int32 Function(Pointer<Void> handle, Pointer<Utf8> chainJson);
typedef _EngineSetChainDart = int Function(Pointer<Void> handle, Pointer<Utf8> chainJson);

typedef _EngineStartNative = Int32 Function(Pointer<Void> handle);
typedef _EngineStartDart = int Function(Pointer<Void> handle);

typedef _EngineStopNative = Void Function(Pointer<Void> handle);
typedef _EngineStopDart = void Function(Pointer<Void> handle);

typedef _EngineStartRecordingNative = Int32 Function(Pointer<Void> handle, Pointer<Utf8> path);
typedef _EngineStartRecordingDart = int Function(Pointer<Void> handle, Pointer<Utf8> path);

typedef _EngineStopRecordingNative = Uint64 Function(Pointer<Void> handle);
typedef _EngineStopRecordingDart = int Function(Pointer<Void> handle);

typedef _EngineGetDurationNative = Uint64 Function(Pointer<Void> handle);
typedef _EngineGetDurationDart = int Function(Pointer<Void> handle);

typedef _EngineIsRunningNative = Int32 Function(Pointer<Void> handle);
typedef _EngineIsRunningDart = int Function(Pointer<Void> handle);

// ── Library loading ───────────────────────────────────────────────

final DynamicLibrary _nativeLib = Platform.isAndroid
    ? DynamicLibrary.open('libvozoo_ffi.so')
    : DynamicLibrary.process();

final _ProcessFileDart _processFile = _nativeLib
    .lookup<NativeFunction<_ProcessFileNative>>('process_file')
    .asFunction();

final _ProcessFileWithChainDart _processFileWithChain = _nativeLib
    .lookup<NativeFunction<_ProcessFileWithChainNative>>('process_file_with_chain')
    .asFunction();

final _ProcessFileWithGraphDart _processFileWithGraph = _nativeLib
    .lookup<NativeFunction<_ProcessFileWithGraphNative>>('process_file_with_graph')
    .asFunction();

final _GetStringDart _getAvailableNodes = _nativeLib
    .lookup<NativeFunction<_GetStringNative>>('get_available_nodes')
    .asFunction();

final _GetStringDart _getPresets = _nativeLib
    .lookup<NativeFunction<_GetStringNative>>('get_presets')
    .asFunction();

final _GetStringDart _getGraphPresets = _nativeLib
    .lookup<NativeFunction<_GetStringNative>>('get_graph_presets')
    .asFunction();

final _FreeStringDart _freeString = _nativeLib
    .lookup<NativeFunction<_FreeStringNative>>('free_string')
    .asFunction();

final _EngineCreateDart _engineCreate = _nativeLib
    .lookup<NativeFunction<_EngineCreateNative>>('engine_create')
    .asFunction();

final _EngineDestroyDart _engineDestroy = _nativeLib
    .lookup<NativeFunction<_EngineDestroyNative>>('engine_destroy')
    .asFunction();

final _EngineSetChainDart _engineSetChain = _nativeLib
    .lookup<NativeFunction<_EngineSetChainNative>>('engine_set_chain')
    .asFunction();

final _EngineSetChainDart _engineSetGraph = _nativeLib
    .lookup<NativeFunction<_EngineSetChainNative>>('engine_set_graph')
    .asFunction();

final _EngineStartDart _engineStartRealtime = _nativeLib
    .lookup<NativeFunction<_EngineStartNative>>('engine_start_realtime')
    .asFunction();

final _EngineStopDart _engineStopRealtime = _nativeLib
    .lookup<NativeFunction<_EngineStopNative>>('engine_stop_realtime')
    .asFunction();

final _EngineStartRecordingDart _engineStartRecording = _nativeLib
    .lookup<NativeFunction<_EngineStartRecordingNative>>('engine_start_recording')
    .asFunction();

final _EngineStopRecordingDart _engineStopRecording = _nativeLib
    .lookup<NativeFunction<_EngineStopRecordingNative>>('engine_stop_recording')
    .asFunction();

final _EngineGetDurationDart _engineGetDurationMs = _nativeLib
    .lookup<NativeFunction<_EngineGetDurationNative>>('engine_get_duration_ms')
    .asFunction();

final _EngineIsRunningDart _engineIsRunning = _nativeLib
    .lookup<NativeFunction<_EngineIsRunningNative>>('engine_is_running')
    .asFunction();

final _EngineIsRunningDart _engineIsRecording = _nativeLib
    .lookup<NativeFunction<_EngineIsRunningNative>>('engine_is_recording')
    .asFunction();

// ── Batch processing API (runs on background isolate) ─────────────

int _processFileSync(List<String> args) {
  final input = args[0].toNativeUtf8();
  final output = args[1].toNativeUtf8();
  final presetId = int.parse(args[2]);
  try {
    return _processFile(input, output, presetId);
  } finally {
    malloc.free(input);
    malloc.free(output);
  }
}

int _processFileWithChainSync(List<String> args) {
  final input = args[0].toNativeUtf8();
  final output = args[1].toNativeUtf8();
  final chain = args[2].toNativeUtf8();
  try {
    return _processFileWithChain(input, output, chain);
  } finally {
    malloc.free(input);
    malloc.free(output);
    malloc.free(chain);
  }
}

/// Process a WAV file with the given preset ID.
/// Runs on a background isolate to avoid blocking the UI thread.
Future<int> processFile(String inputPath, String outputPath, int presetId) {
  return Isolate.run(() => _processFileSync([inputPath, outputPath, '$presetId']));
}

/// Process a WAV file with a JSON chain definition.
/// Runs on a background isolate to avoid blocking the UI thread.
Future<int> processFileWithChain(String inputPath, String outputPath, String chainJson) {
  return Isolate.run(() => _processFileWithChainSync([inputPath, outputPath, chainJson]));
}

int _processFileWithGraphSync(List<String> args) {
  final input = args[0].toNativeUtf8();
  final output = args[1].toNativeUtf8();
  final graph = args[2].toNativeUtf8();
  try {
    return _processFileWithGraph(input, output, graph);
  } finally {
    malloc.free(input);
    malloc.free(output);
    malloc.free(graph);
  }
}

/// Process a WAV file with a JSON graph definition (DAG routing).
/// Runs on a background isolate to avoid blocking the UI thread.
Future<int> processFileWithGraph(String inputPath, String outputPath, String graphJson) {
  return Isolate.run(() => _processFileWithGraphSync([inputPath, outputPath, graphJson]));
}

String getGraphPresets() {
  final ptr = _getGraphPresets();
  final json = ptr.toDartString();
  _freeString(ptr);
  return json;
}

String getAvailableNodes() {
  final ptr = _getAvailableNodes();
  final json = ptr.toDartString();
  _freeString(ptr);
  return json;
}

String getPresets() {
  final ptr = _getPresets();
  final json = ptr.toDartString();
  _freeString(ptr);
  return json;
}

// ── Real-time engine API ──────────────────────────────────────────

/// Manages the lifecycle of a real-time audio engine handle.
class VozooEngine {
  Pointer<Void> _handle;

  VozooEngine() : _handle = _engineCreate();

  void _ensureNotDisposed() {
    if (_handle == nullptr) {
      throw StateError('VozooEngine has been disposed');
    }
  }

  bool get isInitialized => _handle != nullptr;

  int setChain(String chainJson) {
    _ensureNotDisposed();
    final json = chainJson.toNativeUtf8();
    try {
      return _engineSetChain(_handle, json);
    } finally {
      malloc.free(json);
    }
  }

  int setGraph(String graphJson) {
    _ensureNotDisposed();
    final json = graphJson.toNativeUtf8();
    try {
      return _engineSetGraph(_handle, json);
    } finally {
      malloc.free(json);
    }
  }

  int startRealtime() {
    _ensureNotDisposed();
    return _engineStartRealtime(_handle);
  }

  void stopRealtime() {
    _ensureNotDisposed();
    _engineStopRealtime(_handle);
  }

  int startRecording(String outputPath) {
    _ensureNotDisposed();
    final path = outputPath.toNativeUtf8();
    try {
      return _engineStartRecording(_handle, path);
    } finally {
      malloc.free(path);
    }
  }

  int stopRecording() {
    _ensureNotDisposed();
    return _engineStopRecording(_handle);
  }

  int getDurationMs() {
    _ensureNotDisposed();
    return _engineGetDurationMs(_handle);
  }

  bool get isRunning {
    if (_handle == nullptr) return false;
    return _engineIsRunning(_handle) != 0;
  }

  bool get isRecording {
    if (_handle == nullptr) return false;
    return _engineIsRecording(_handle) != 0;
  }

  void dispose() {
    if (_handle != nullptr) {
      _engineStopRealtime(_handle);
      _engineDestroy(_handle);
      _handle = nullptr;
    }
  }
}
