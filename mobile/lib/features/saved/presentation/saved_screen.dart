import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/post_card.dart';
import '../../../shared/widgets/software_card.dart';

final bookmarksProvider =
    FutureProvider.autoDispose<List<PostSummary>>((ref) async {
  final user = ref.watch(authUserProvider);
  if (user == null) return const [];
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  try {
    final data = await api.get('/users/me/bookmarks');
    await cache.putJson('bookmarks', data);
    final items = data['items'] as List? ?? const [];
    return items.whereType<Map>().map((row) {
      final post = row['post'];
      if (post is Map) {
        return PostSummary.fromJson(Map<String, dynamic>.from(post));
      }
      return PostSummary.fromJson(Map<String, dynamic>.from(row));
    }).toList();
  } catch (_) {
    final cached = await cache.getJson('bookmarks');
    if (cached == null) rethrow;
    final items = cached['items'] as List? ?? const [];
    return items.whereType<Map>().map((row) {
      final post = row['post'];
      if (post is Map) {
        return PostSummary.fromJson(Map<String, dynamic>.from(post));
      }
      return PostSummary.fromJson(Map<String, dynamic>.from(row));
    }).toList();
  }
});

final favoritesProvider =
    FutureProvider.autoDispose<List<SoftwareSummary>>((ref) async {
  final user = ref.watch(authUserProvider);
  if (user == null) return const [];
  final data = await ref.watch(apiClientProvider).get('/users/me/favorites');
  final items = data['items'] as List? ?? const [];
  return items.whereType<Map>().map((row) {
    final software = row['software'] ?? row;
    return SoftwareSummary.fromJson(Map<String, dynamic>.from(software as Map));
  }).toList();
});

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);
    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Saved')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const EmptyState(
                  title: 'Sign in to sync',
                  subtitle: 'Bookmarks and favorites follow your account.',
                  icon: Icons.bookmark_outline,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.push('/auth/login'),
                  child: const Text('Sign in'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final bookmarks = ref.watch(bookmarksProvider);
    final favorites = ref.watch(favoritesProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Saved'),
          bottom: TabBar(
            indicatorColor: AppColors.gold,
            labelColor: Theme.of(context).colorScheme.primary,
            tabs: const [
              Tab(text: 'Articles'),
              Tab(text: 'Software'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            RefreshIndicator(
              color: AppColors.gold,
              onRefresh: () async {
                ref.invalidate(bookmarksProvider);
                await ref.read(bookmarksProvider.future);
              },
              child: bookmarks.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  children: [
                    const SizedBox(height: 80),
                    EmptyState(title: 'Error', subtitle: e.toString()),
                  ],
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          title: 'No bookmarks',
                          subtitle:
                              'Save articles while reading to find them here offline.',
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      return PostCard(item: items[i], compact: true);
                    },
                  );
                },
              ),
            ),
            RefreshIndicator(
              color: AppColors.gold,
              onRefresh: () async {
                ref.invalidate(favoritesProvider);
                await ref.read(favoritesProvider.future);
              },
              child: favorites.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  children: [
                    const SizedBox(height: 80),
                    EmptyState(title: 'Error', subtitle: e.toString()),
                  ],
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          title: 'No favorites',
                          subtitle:
                              'Favorite software to keep it in your list.',
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      return SoftwareCard(item: items[i], compact: true);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
