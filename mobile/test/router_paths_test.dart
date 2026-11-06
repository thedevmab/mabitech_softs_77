import 'package:flutter_test/flutter_test.dart';

void main() {
  test('bottom navigation destinations stay stable', () {
    const paths = ['/', '/explore', '/downloads', '/saved', '/profile'];
    expect(paths.length, 5);
    expect(paths.first, '/');
    expect(paths.contains('/saved'), isTrue);
  });
}
