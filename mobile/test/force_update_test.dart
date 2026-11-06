import 'package:daily_tips/shared/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('isBelowMinimum compares dotted versions', () {
    expect(AppRemoteSettings.isBelowMinimum('1.0.0', '1.0.1'), isTrue);
    expect(AppRemoteSettings.isBelowMinimum('1.2.0', '1.1.9'), isFalse);
    expect(AppRemoteSettings.isBelowMinimum('1.0.0', '1.0.0'), isFalse);
  });

  test('parses force-update fields from settings json', () {
    final s = AppRemoteSettings.fromJson({
      'platformName': 'Daily Tips',
      'tagline': 'Technology • Knowledge • Innovation',
      'minAppVersion': '2.0.0',
      'forceUpdate': true,
      'updateUrl': 'https://example.com/app',
    });
    expect(s.forceUpdate, isTrue);
    expect(s.minAppVersion, '2.0.0');
    expect(s.updateUrl, 'https://example.com/app');
    expect(AppRemoteSettings.isBelowMinimum('1.0.0', s.minAppVersion), isTrue);
  });
}
