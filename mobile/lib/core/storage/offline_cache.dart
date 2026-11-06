import 'dart:convert';

import 'package:hive_ce_flutter/hive_ce_flutter.dart';

class OfflineCache {
  static const boxName = 'offline_cache';

  Future<Box> _box() async {
    if (!Hive.isBoxOpen(boxName)) {
      return Hive.openBox(boxName);
    }
    return Hive.box(boxName);
  }

  Future<void> putJson(String key, Map<String, dynamic> value) async {
    final box = await _box();
    await box.put(key, jsonEncode(value));
  }

  Future<Map<String, dynamic>?> getJson(String key) async {
    final box = await _box();
    final raw = box.get(key);
    if (raw is! String) return null;
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return Map<String, dynamic>.from(decoded);
    return null;
  }

  Future<void> putList(String key, List<dynamic> value) async {
    final box = await _box();
    await box.put(key, jsonEncode(value));
  }

  Future<List<dynamic>?> getList(String key) async {
    final box = await _box();
    final raw = box.get(key);
    if (raw is! String) return null;
    final decoded = jsonDecode(raw);
    if (decoded is List) return decoded;
    return null;
  }

  Future<void> remove(String key) async {
    final box = await _box();
    await box.delete(key);
  }
}
