import 'package:daily_tips/core/network/api_client.dart';
import 'package:daily_tips/core/network/api_exception.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('unwrap extracts data envelope', () {
    final data = ApiClient.unwrap({
      'data': {'platformName': 'Daily Tips'},
    });
    expect(data['platformName'], 'Daily Tips');
  });

  test('unwrap throws ApiException on error envelope', () {
    expect(
      () => ApiClient.unwrap({
        'error': {'code': 'UNAUTHORIZED', 'message': 'Invalid token'},
      }),
      throwsA(isA<ApiException>()),
    );
  });
}
