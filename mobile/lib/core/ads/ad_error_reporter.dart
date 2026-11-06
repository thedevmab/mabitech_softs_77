import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/providers/core_providers.dart';

class AdErrorReporter {
  AdErrorReporter(this._ref);

  final Ref _ref;

  Future<void> report({
    required String format,
    String? code,
    required String message,
  }) async {
    try {
      final api = _ref.read(apiClientProvider);
      await api.post(
        '/ads/errors',
        data: {
          'format': format,
          'code': code,
          'message': message.length > 500 ? message.substring(0, 500) : message,
        },
      );
    } catch (_) {
      // Never surface reporting failures to the user.
    }
  }
}

final adErrorReporterProvider = Provider((ref) => AdErrorReporter(ref));
