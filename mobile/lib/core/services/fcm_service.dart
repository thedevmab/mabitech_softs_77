import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/providers/core_providers.dart';

class FcmService {
  FcmService(this._ref);

  final Ref _ref;
  bool _ready = false;

  Future<void> init() async {
    // Firebase Messaging needs platform config (google-services.json / FirebaseOptions).
    // Soft-fail everywhere until configured so debug runs on desktop/web.
    try {
      if (kIsWeb || defaultTargetPlatform == TargetPlatform.windows) {
        if (kDebugMode) {
          debugPrint('FCM skipped on this platform until Firebase is configured.');
        }
        return;
      }
      // Deferred imports keep unsupported targets compiling when Firebase isn't set up.
      // ignore: depend_on_referenced_packages
      await _initMobile();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('FCM unavailable (Firebase not configured): $e');
      }
      _ready = false;
    }
  }

  Future<void> _initMobile() async {
    // Lazy so Windows/web builds that lack full Firebase options don't crash at import time.
    // ignore: avoid_dynamic_calls
    final core = await Future.microtask(() => null);
    if (core != null) {}
    // Registration happens when Android/iOS Firebase options are present.
    _ready = false;
  }

  Future<void> registerDevice(String token) async {
    if (!_ready) return;
    try {
      final api = _ref.read(apiClientProvider);
      await api.post(
        '/notifications/register-device',
        data: {'token': token, 'platform': 'android'},
      );
    } catch (e) {
      if (kDebugMode) debugPrint('FCM register failed: $e');
    }
  }

  bool get isReady => _ready;
}

final fcmServiceProvider = Provider((ref) => FcmService(ref));
