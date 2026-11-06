import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../shared/providers/core_providers.dart';
import 'ad_remote_config.dart';

class AdConfigurationService extends ChangeNotifier {
  AdConfigurationService(this._ref);

  final Ref _ref;
  static const _cacheKey = 'admob_remote_config_v1';

  AdRemoteConfig _config = AdRemoteConfig.disabled;
  bool _loaded = false;

  AdRemoteConfig get config => _config;
  bool get isLoaded => _loaded;

  SharedPreferences get _prefs => _ref.read(sharedPrefsProvider);

  Future<AdRemoteConfig> load({required bool isPremium}) async {
    if (isPremium) {
      _config = AdRemoteConfig.disabled;
      _loaded = true;
      notifyListeners();
      return _config;
    }

    try {
      final api = _ref.read(apiClientProvider);
      final data = await api.get('/ads/config');
      _config = AdRemoteConfig.fromJson(Map<String, dynamic>.from(data));
      await _prefs.setString(_cacheKey, jsonEncode(_config.toJson()));
    } catch (_) {
      final cached = _prefs.getString(_cacheKey);
      if (cached != null) {
        try {
          _config = AdRemoteConfig.fromJson(
            Map<String, dynamic>.from(jsonDecode(cached) as Map),
          );
        } catch (_) {
          _config = AdRemoteConfig.disabled;
        }
      } else {
        _config = AdRemoteConfig.disabled;
      }
    }

    _loaded = true;
    notifyListeners();
    return _config;
  }
}

final adConfigurationServiceProvider =
    ChangeNotifierProvider<AdConfigurationService>((ref) {
  return AdConfigurationService(ref);
});
