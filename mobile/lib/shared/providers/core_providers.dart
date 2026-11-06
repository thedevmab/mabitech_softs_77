import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/offline_cache.dart';
import '../../core/storage/token_storage.dart';
import '../models/models.dart';

final sharedPrefsProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Override sharedPrefsProvider in main');
});

final tokenStorageProvider = Provider((ref) => TokenStorage());

final apiClientProvider = Provider((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return ApiClient(
    tokenStorage: storage,
    onAuthFailure: () async {
      ref.read(authUserProvider.notifier).state = null;
    },
  );
});

final offlineCacheProvider = Provider((ref) => OfflineCache());

final connectivityProvider = StreamProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().onConnectivityChanged;
});

final themeModeProvider =
    StateNotifierProvider<ThemeModeController, ThemeMode>((ref) {
  return ThemeModeController(ref.watch(sharedPrefsProvider));
});

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController(this._prefs) : super(_read(_prefs));

  final SharedPreferences _prefs;
  static const _key = 'theme_mode';

  static ThemeMode _read(SharedPreferences prefs) {
    switch (prefs.getString(_key)) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    await _prefs.setString(
      _key,
      mode == ThemeMode.light
          ? 'light'
          : mode == ThemeMode.dark
              ? 'dark'
              : 'system',
    );
  }
}

final authUserProvider = StateProvider<AppUser?>((ref) => null);

final remoteSettingsProvider = FutureProvider<AppRemoteSettings>((ref) async {
  final api = ref.watch(apiClientProvider);
  final data = await api.get('/app/settings');
  return AppRemoteSettings.fromJson(data);
});

final authBootstrapProvider = FutureProvider<AppUser?>((ref) async {
  final storage = ref.watch(tokenStorageProvider);
  final token = await storage.readAccessToken();
  if (token == null) return null;
  try {
    final api = ref.watch(apiClientProvider);
    final data = await api.get('/users/me');
    final user = AppUser.fromJson(data);
    ref.read(authUserProvider.notifier).state = user;
    return user;
  } catch (_) {
    await storage.clear();
    return null;
  }
});
