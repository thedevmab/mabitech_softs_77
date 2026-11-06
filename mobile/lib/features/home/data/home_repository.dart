import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';

class HomeRepository {
  HomeRepository(this._ref);

  final Ref _ref;

  Future<List<HomeSection>> fetchHome() async {
    final api = _ref.read(apiClientProvider);
    final cache = _ref.read(offlineCacheProvider);
    try {
      final data = await api.get('/home');
      await cache.putJson('home', data);
      final sections = data['sections'];
      if (sections is! List) return const [];
      return sections
          .whereType<Map>()
          .map((e) => HomeSection.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      final cached = await cache.getJson('home');
      if (cached == null) rethrow;
      final sections = cached['sections'];
      if (sections is! List) return const [];
      return sections
          .whereType<Map>()
          .map((e) => HomeSection.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
  }
}

final homeRepositoryProvider = Provider((ref) => HomeRepository(ref));

final homeSectionsProvider =
    FutureProvider.autoDispose<List<HomeSection>>((ref) {
  return ref.watch(homeRepositoryProvider).fetchHome();
});
