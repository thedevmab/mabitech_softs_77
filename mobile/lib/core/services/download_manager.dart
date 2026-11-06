import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_ce_flutter.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../../shared/providers/core_providers.dart';

enum DownloadStatus { downloading, completed, failed, cancelled }

enum DownloadSourceType { software, post }

class DownloadTask {
  DownloadTask({
    required this.id,
    required this.sourceType,
    required this.sourceId,
    required this.sourceSlug,
    required this.title,
    required this.url,
    this.fileName,
    this.extension,
    this.checksumSha256,
    this.eventKey,
    this.localPath,
    this.progress = 0,
    this.status = DownloadStatus.downloading,
    this.error,
    // Legacy aliases kept for older Hive records
    String? softwareId,
    String? softwareSlug,
  })  : softwareId = softwareId ?? sourceId,
        softwareSlug = softwareSlug ?? sourceSlug;

  final String id;
  final DownloadSourceType sourceType;
  final String sourceId;
  final String sourceSlug;
  final String title;
  String url;
  final String? fileName;
  final String? extension;
  final String? checksumSha256;
  final String? eventKey;
  String? localPath;
  double progress;
  DownloadStatus status;
  String? error;

  /// Legacy fields (software downloads)
  final String softwareId;
  final String softwareSlug;

  bool get isApk => (extension ?? '').toLowerCase() == 'apk';

  Map<String, dynamic> toJson() => {
        'id': id,
        'sourceType': sourceType.name,
        'sourceId': sourceId,
        'sourceSlug': sourceSlug,
        'softwareId': softwareId,
        'softwareSlug': softwareSlug,
        'title': title,
        'url': url,
        'fileName': fileName,
        'extension': extension,
        'checksumSha256': checksumSha256,
        'eventKey': eventKey,
        'localPath': localPath,
        'progress': progress,
        'status': status.name,
        'error': error,
      };

  factory DownloadTask.fromJson(Map<String, dynamic> json) {
    final sourceTypeName = (json['sourceType'] as String?) ?? 'software';
    final sourceType = DownloadSourceType.values.firstWhere(
      (e) => e.name == sourceTypeName,
      orElse: () => DownloadSourceType.software,
    );
    final sourceId =
        (json['sourceId'] ?? json['softwareId'] ?? '').toString();
    final sourceSlug =
        (json['sourceSlug'] ?? json['softwareSlug'] ?? '').toString();
    return DownloadTask(
      id: json['id'] as String,
      sourceType: sourceType,
      sourceId: sourceId,
      sourceSlug: sourceSlug,
      softwareId: json['softwareId'] as String? ?? sourceId,
      softwareSlug: json['softwareSlug'] as String? ?? sourceSlug,
      title: json['title'] as String,
      url: json['url'] as String,
      fileName: json['fileName'] as String?,
      extension: json['extension'] as String?,
      checksumSha256: json['checksumSha256'] as String?,
      eventKey: json['eventKey'] as String?,
      localPath: json['localPath'] as String?,
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      status: DownloadStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => DownloadStatus.failed,
      ),
      error: json['error'] as String?,
    );
  }
}

class DownloadManager extends StateNotifier<List<DownloadTask>> {
  DownloadManager(this._ref) : super(const []) {
    _load();
  }

  final Ref _ref;

  static const _boxName = 'downloads';
  final _dio = Dio();
  final _uuid = const Uuid();
  final Map<String, CancelToken> _tokens = {};
  bool _installInProgress = false;

  /// True while a download is active or an install/open was just started.
  bool get blocksFullscreenAds {
    if (_installInProgress) return true;
    return state.any((t) => t.status == DownloadStatus.downloading);
  }

  bool get hasActiveDownload =>
      state.any((t) => t.status == DownloadStatus.downloading);

  Future<Box> _box() async {
    if (!Hive.isBoxOpen(_boxName)) return Hive.openBox(_boxName);
    return Hive.box(_boxName);
  }

  Future<void> _load() async {
    final box = await _box();
    final items = <DownloadTask>[];
    for (final value in box.values) {
      if (value is String) {
        items.add(DownloadTask.fromJson(jsonDecode(value) as Map<String, dynamic>));
      }
    }
    state = items;
  }

  Future<void> _persist(DownloadTask task) async {
    final box = await _box();
    await box.put(task.id, jsonEncode(task.toJson()));
    final exists = state.any((t) => t.id == task.id);
    if (exists) {
      state = [
        for (final t in state)
          if (t.id == task.id) task else t,
      ];
    } else {
      state = [...state, task];
    }
  }

  Future<Directory> _downloadsDirectory() async {
    Directory base;
    try {
      final external = await getExternalStorageDirectory();
      base = external ?? await getApplicationDocumentsDirectory();
    } catch (_) {
      base = await getApplicationDocumentsDirectory();
    }
    final downloadsDir = Directory('${base.path}/Download');
    if (!await downloadsDir.exists()) {
      await downloadsDir.create(recursive: true);
    }
    return downloadsDir;
  }

  Future<DownloadTask> enqueue({
    required String softwareId,
    required String softwareSlug,
    required String title,
    required String url,
    String? checksumSha256,
    String? eventKey,
    String? fileName,
    String? extension,
    DownloadSourceType sourceType = DownloadSourceType.software,
  }) async {
    final task = DownloadTask(
      id: _uuid.v4(),
      sourceType: sourceType,
      sourceId: softwareId,
      sourceSlug: softwareSlug,
      softwareId: softwareId,
      softwareSlug: softwareSlug,
      title: title,
      url: url,
      fileName: fileName,
      extension: extension,
      checksumSha256: checksumSha256,
      eventKey: eventKey,
    );
    state = [...state, task];
    await _persist(task);
    // ignore: unawaited_futures
    _run(task);
    return task;
  }

  Future<DownloadTask> enqueuePost({
    required String postId,
    required String postSlug,
    required String title,
    required String url,
    String? checksumSha256,
    String? fileName,
    String? extension,
  }) {
    return enqueue(
      softwareId: postId,
      softwareSlug: postSlug,
      title: title,
      url: url,
      checksumSha256: checksumSha256,
      fileName: fileName,
      extension: extension,
      sourceType: DownloadSourceType.post,
    );
  }

  Future<void> cancel(String id) async {
    _tokens[id]?.cancel('Cancelled by user');
    _tokens.remove(id);
    final task = state.where((t) => t.id == id).firstOrNull;
    if (task == null) return;
    task.status = DownloadStatus.cancelled;
    task.error = 'Cancelled';
    await _persist(task);
  }

  Future<void> retry(String id) async {
    final task = state.firstWhere((t) => t.id == id);
    if (task.sourceType == DownloadSourceType.post) {
      try {
        final fresh = await _ref
            .read(apiClientProvider)
            .get('/posts/${task.sourceSlug}/download');
        final url = fresh['url']?.toString();
        if (url != null && url.isNotEmpty) {
          task.url = url;
        }
      } catch (_) {
        // Fall through and reuse the previous URL if the refresh fails.
      }
    } else if (task.sourceType == DownloadSourceType.software) {
      try {
        final fresh = await _ref
            .read(apiClientProvider)
            .get('/software/${task.sourceSlug}/download');
        final url = fresh['url']?.toString() ??
            fresh['downloadUrl']?.toString() ??
            fresh['signedUrl']?.toString();
        if (url != null && url.isNotEmpty) {
          task.url = url;
        }
      } catch (_) {}
    }
    task.status = DownloadStatus.downloading;
    task.progress = 0;
    task.error = null;
    await _persist(task);
    await _run(task);
  }

  Future<void> delete(String id) async {
    await cancel(id);
    final box = await _box();
    final task = state.where((t) => t.id == id).firstOrNull;
    if (task?.localPath != null) {
      final file = File(task!.localPath!);
      if (await file.exists()) await file.delete();
    }
    await box.delete(id);
    state = state.where((t) => t.id != id).toList();
  }

  Future<OpenResult> open(String id) async {
    final task = state.firstWhere((t) => t.id == id);
    if (task.localPath == null) {
      return OpenResult(type: ResultType.error, message: 'File missing');
    }
    final mime = task.isApk
        ? 'application/vnd.android.package-archive'
        : null;
    _installInProgress = true;
    try {
      return await OpenFilex.open(task.localPath!, type: mime);
    } finally {
      // Keep the guard briefly so interstitials do not fire over the installer.
      Future<void>.delayed(const Duration(seconds: 45), () {
        _installInProgress = false;
      });
    }
  }

  Future<void> _run(DownloadTask task, {int attempt = 0}) async {
    final token = CancelToken();
    _tokens[task.id] = token;
    try {
      final dir = await _downloadsDirectory();
      final ext = (task.extension ??
              task.fileName?.split('.').last ??
              task.url.split('?').first.split('.').last)
          .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
      final safeName = (task.fileName ?? '${task.id}.${ext.isEmpty ? 'bin' : ext}')
          .replaceAll(RegExp(r'[/\\?%*:|"<>]'), '_');
      final path = '${dir.path}/$safeName';

      await _dio.download(
        task.url,
        path,
        cancelToken: token,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            task.progress = received / total;
            state = [
              for (final t in state)
                if (t.id == task.id) task else t,
            ];
          }
        },
      );

      if (task.checksumSha256 != null && task.checksumSha256!.isNotEmpty) {
        final ok = await verifySha256(path, task.checksumSha256!);
        if (!ok) {
          task.status = DownloadStatus.failed;
          task.error = 'Checksum verification failed';
          await _persist(task);
          return;
        }
      }

      task.localPath = path;
      task.progress = 1;
      task.status = DownloadStatus.completed;
      await _persist(task);
      if (task.eventKey != null && task.eventKey!.isNotEmpty) {
        try {
          await _ref.read(apiClientProvider).post(
            '/downloads/complete',
            data: {'eventKey': task.eventKey},
          );
        } catch (_) {}
      }
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        task.status = DownloadStatus.cancelled;
        task.error = 'Cancelled';
        await _persist(task);
        return;
      }
      if (attempt < 2 && _isTransient(e)) {
        await Future<void>.delayed(Duration(milliseconds: 500 * (attempt + 1)));
        await _run(task, attempt: attempt + 1);
        return;
      }
      task.status = DownloadStatus.failed;
      task.error = e.message ?? e.toString();
      await _persist(task);
    } catch (e) {
      task.status = DownloadStatus.failed;
      task.error = e.toString();
      await _persist(task);
    } finally {
      _tokens.remove(task.id);
    }
  }

  bool _isTransient(DioException e) {
    return e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.connectionError;
  }

  static Future<bool> verifySha256(String path, String expected) async {
    final file = File(path);
    final digest = await sha256.bind(file.openRead()).first;
    return digest.toString().toLowerCase() == expected.toLowerCase();
  }
}

final downloadManagerProvider =
    StateNotifierProvider<DownloadManager, List<DownloadTask>>(
  (ref) => DownloadManager(ref),
);
