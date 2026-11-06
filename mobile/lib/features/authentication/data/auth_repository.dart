import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';

class AuthRepository {
  AuthRepository(this._api, this._ref);

  final ApiClient _api;
  final Ref _ref;

  Future<AppUser> login(String email, String password) async {
    final data = await _api.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    await _persistTokens(data);
    final user = AppUser.fromJson(Map<String, dynamic>.from(data['user'] as Map));
    _ref.read(authUserProvider.notifier).state = user;
    return user;
  }

  Future<AppUser> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final data = await _api.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        if (name != null && name.isNotEmpty) 'name': name,
      },
    );
    await _persistTokens(data);
    final user = AppUser.fromJson(Map<String, dynamic>.from(data['user'] as Map));
    _ref.read(authUserProvider.notifier).state = user;
    return user;
  }

  Future<void> forgotPassword(String email) async {
    await _api.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await _api.post(
      '/auth/reset-password',
      data: {'token': token, 'password': password},
    );
  }

  Future<void> logout() async {
    try {
      final refresh =
          await _ref.read(tokenStorageProvider).readRefreshToken();
      if (refresh != null) {
        await _api.post('/auth/logout', data: {'refreshToken': refresh});
      }
    } catch (_) {
      // best-effort
    }
    await _ref.read(tokenStorageProvider).clear();
    _ref.read(authUserProvider.notifier).state = null;
    final cache = _ref.read(offlineCacheProvider);
    await cache.remove('bookmarks');
    await cache.remove('favorites');
    await cache.remove('home');
  }

  Future<void> _persistTokens(Map<String, dynamic> data) async {
    final access = data['accessToken'] as String?;
    final refresh = data['refreshToken'] as String?;
    if (access != null && refresh != null) {
      await _ref.read(tokenStorageProvider).saveTokens(
            accessToken: access,
            refreshToken: refresh,
          );
    }
  }
}

final authRepositoryProvider = Provider((ref) {
  return AuthRepository(ref.watch(apiClientProvider), ref);
});
