import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ads/ad_configuration_service.dart';
import '../../../core/ads/ad_remote_config.dart';
import '../../../core/ads/native_ad_widget.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/post_card.dart';
import '../../../shared/widgets/software_card.dart';

final categoriesProvider =
    FutureProvider.autoDispose<List<CategoryItem>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/categories');
  final items = data['items'] ?? data['categories'] ?? data;
  if (items is! List) return const [];
  return items
      .whereType<Map>()
      .map((e) => CategoryItem.fromJson(Map<String, dynamic>.from(e)))
      .toList();
});

final exploreSearchProvider = FutureProvider.autoDispose
    .family<Map<String, List<dynamic>>, String>((ref, q) async {
  if (q.trim().isEmpty) return {'posts': [], 'software': []};
  final api = ref.watch(apiClientProvider);
  final posts = await api.get('/posts', query: {'q': q, 'limit': 20});
  final software = await api.get('/software', query: {'q': q, 'limit': 20});
  return {
    'posts': (posts['items'] as List?) ?? const [],
    'software': (software['items'] as List?) ?? const [],
  };
});

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    final search = ref.watch(exploreSearchProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore'),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
          if (_query.isNotEmpty) {
            ref.invalidate(exploreSearchProvider(_query));
          }
          await ref.read(categoriesProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Search articles & software',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _controller.clear();
                    setState(() => _query = '');
                  },
                ),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
            const SizedBox(height: 18),
            if (_query.isEmpty) ...[
              Text(
                'CATEGORIES',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Browse topics',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              categories.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text(e.toString()),
                data: (items) {
                  if (items.isEmpty) {
                    return const EmptyState(
                      title: 'No categories yet',
                      subtitle:
                          'Categories appear when the CMS publishes them.',
                    );
                  }
                  return Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: items
                        .map(
                          (c) => ActionChip(
                            label: Text(c.name),
                            onPressed: () {
                              _controller.text = c.name;
                              setState(() => _query = c.name);
                            },
                          ),
                        )
                        .toList(),
                  );
                },
              ),
            ] else
              search.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => Text(e.toString()),
                data: (result) {
                  final posts = result['posts'] ?? [];
                  final software = result['software'] ?? [];
                  if (posts.isEmpty && software.isEmpty) {
                    return const EmptyState(
                      title: 'No results',
                      subtitle: 'Try a different search term.',
                    );
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (posts.isNotEmpty) ...[
                        Text(
                          'Articles',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        ...() {
                          final postWidgets = posts
                              .whereType<Map>()
                              .map((raw) {
                                final p = PostSummary.fromJson(
                                  Map<String, dynamic>.from(raw),
                                );
                                return Column(
                                  children: [
                                    PostCard(item: p, compact: true),
                                    const Divider(height: 1),
                                  ],
                                );
                              })
                              .toList();
                          final frequency = ref
                              .watch(adConfigurationServiceProvider)
                              .config
                              .nativeAdFrequency;
                          return withNativeAds(
                            children: postWidgets,
                            frequency: frequency,
                            placement: AdNativePlacement.explore,
                          );
                        }(),
                      ],
                      if (software.isNotEmpty) ...[
                        const SizedBox(height: 18),
                        Text(
                          'Software',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 10),
                        ...software.whereType<Map>().map((raw) {
                          final s = SoftwareSummary.fromJson(
                            Map<String, dynamic>.from(raw),
                          );
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: SoftwareCard(item: s, compact: true),
                          );
                        }),
                      ],
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
