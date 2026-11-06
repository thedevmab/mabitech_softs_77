import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:daily_tips/core/services/download_manager.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('verifySha256 accepts matching digest', () async {
    final dir = Directory.systemTemp.createTempSync('dt_checksum');
    final file = File('${dir.path}/sample.bin');
    await file.writeAsBytes([1, 2, 3, 4, 5]);
    final digest = (await sha256.bind(file.openRead()).first).toString();
    expect(await DownloadManager.verifySha256(file.path, digest), isTrue);
    expect(await DownloadManager.verifySha256(file.path, 'deadbeef'), isFalse);
    dir.deleteSync(recursive: true);
  });
}
