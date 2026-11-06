import 'package:dio/dio.dart';

import '../config/env.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

typedef LogoutCallback = Future<void> Function();

class ApiClient {
  ApiClient({
    required TokenStorage tokenStorage,
    LogoutCallback? onAuthFailure,
    Dio? dio,
  })  : _tokenStorage = tokenStorage,
        _onAuthFailure = onAuthFailure {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: Env.apiBaseUrl,
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 30),
            headers: {'Accept': 'application/json'},
          ),
        );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              !error.requestOptions.path.contains('/auth/refresh') &&
              !error.requestOptions.extra.containsKey('retried')) {
            final refreshed = await _refresh();
            if (refreshed) {
              final req = error.requestOptions;
              req.extra['retried'] = true;
              final token = await _tokenStorage.readAccessToken();
              if (token != null) {
                req.headers['Authorization'] = 'Bearer $token';
              }
              try {
                final response = await _dio.fetch(req);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
            await _tokenStorage.clear();
            await _onAuthFailure?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final TokenStorage _tokenStorage;
  final LogoutCallback? _onAuthFailure;

  Dio get dio => _dio;

  Future<bool> _refresh() async {
    final refresh = await _tokenStorage.readRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final res = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refresh},
        options: Options(extra: {'retried': true}),
      );
      final data = unwrap(res.data);
      final access = data['accessToken'] as String?;
      final nextRefresh = data['refreshToken'] as String? ?? refresh;
      if (access == null) return false;
      await _tokenStorage.saveTokens(
        accessToken: access,
        refreshToken: nextRefresh,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  static Map<String, dynamic> unwrap(dynamic body) {
    if (body is Map<String, dynamic>) {
      if (body.containsKey('data')) {
        final data = body['data'];
        if (data is Map<String, dynamic>) return data;
        throw ApiException('Unexpected response shape');
      }
      if (body.containsKey('error')) {
        final err = body['error'];
        throw ApiException(
          err is Map ? (err['message']?.toString() ?? 'Request failed') : 'Request failed',
          code: err is Map ? err['code']?.toString() : null,
        );
      }
      return body;
    }
    throw ApiException('Unexpected response');
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    try {
      final res = await _dio.post(path, data: data, queryParameters: query);
      return unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    Object? data,
  }) async {
    try {
      final res = await _dio.delete(path, data: data);
      return unwrap(res.data);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  ApiException _mapDio(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['error'] is Map) {
      final err = data['error'] as Map;
      return ApiException(
        err['message']?.toString() ?? e.message ?? 'Network error',
        code: err['code']?.toString(),
        statusCode: e.response?.statusCode,
      );
    }
    return ApiException(
      e.message ?? 'Network error',
      statusCode: e.response?.statusCode,
    );
  }
}
