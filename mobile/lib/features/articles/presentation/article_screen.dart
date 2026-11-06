import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:uuid/uuid.dart';

import '../../../core/ads/ad_remote_config.dart';
import '../../../core/ads/banner_ad_widget.dart';
import '../../../core/ads/interstitial_ad_manager.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/post_action_button.dart';

String _stripHtml(String html) {
  return html
      .replaceAll(RegExp(r'<script[\s\S]*?</script>', caseSensitive: false), ' ')
      .replaceAll(RegExp(r'<style[\s\S]*?</style>', caseSensitive: false), ' ')
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
      .replaceAll(RegExp(r'<[^>]+>'), ' ')
      .replaceAll(RegExp(r'&nbsp;'), ' ')
      .replaceAll(RegExp(r'&amp;'), '&')
      .replaceAll(RegExp(r'&lt;'), '<')
      .replaceAll(RegExp(r'&gt;'), '>')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();
}

final articleProvider =
    FutureProvider.autoDispose.family<PostDetail, String>((ref, slug) async {
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  try {
    final data = await api.get('/posts/$slug');
    await cache.putJson('post:$slug', data);
    final eventKey = 'view-$slug-${const Uuid().v4()}';
    // ignore: unawaited_futures
    api.post('/posts/$slug/views', data: {'eventKey': eventKey});
    return PostDetail.fromJson(data);
  } catch (_) {
    final cached = await cache.getJson('post:$slug');
    if (cached != null) return PostDetail.fromJson(cached);
    rethrow;
  }
});

class ArticleScreen extends ConsumerStatefulWidget {
  const ArticleScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<ArticleScreen> createState() => _ArticleScreenState();
}

class _ArticleScreenState extends ConsumerState<ArticleScreen> {
  double _fontScale = 1;
  bool? _bookmarked;

  Future<void> _toggleBookmark() async {
    final user = ref.read(authUserProvider);
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to save articles')),
      );
      return;
    }
    final api = ref.read(apiClientProvider);
    final currently = _bookmarked == true;
    if (currently) {
      await api.delete('/posts/${widget.slug}/bookmark');
      setState(() => _bookmarked = false);
    } else {
      await api.post('/posts/${widget.slug}/bookmark');
      setState(() => _bookmarked = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final article = ref.watch(articleProvider(widget.slug));

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) return;
        // ignore: unawaited_futures
        ref.read(interstitialAdManagerProvider).maybeShow(
              reason: 'leave_article',
            );
      },
      child: Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            tooltip: 'Font size',
            onPressed: () {
              setState(() {
                _fontScale = _fontScale >= 1.3 ? 0.9 : _fontScale + 0.2;
              });
            },
            icon: const Icon(Icons.text_fields),
          ),
          IconButton(
            tooltip: 'Bookmark',
            onPressed: _toggleBookmark,
            icon: Icon(
              _bookmarked == true ? Icons.bookmark : Icons.bookmark_border,
            ),
          ),
          IconButton(
            tooltip: 'Share',
            onPressed: () {
              article.whenData((p) {
                SharePlus.instance.share(
                  ShareParams(text: '${p.title}\n/posts/${p.slug}'),
                );
              });
            },
            icon: const Icon(Icons.share),
          ),
        ],
      ),
      body: article.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => EmptyState(
          title: 'Article unavailable',
          subtitle: e.toString(),
        ),
        data: (post) {
          ref.read(offlineCacheProvider).putJson(
                'post:${post.slug}',
                {
                  'id': post.id,
                  'title': post.title,
                  'slug': post.slug,
                  'excerpt': post.excerpt,
                  'featuredImage': post.featuredImage,
                  'content': post.content,
                  'readingTimeMinutes': post.readingTimeMinutes,
                  'publishedAt': post.publishedAt?.toIso8601String(),
                  'isSponsored': post.isSponsored,
                  'deliveryType': post.deliveryType.name,
                  'externalUrl': post.externalUrl,
                  'linkDescription': post.linkDescription,
                  'version': post.version,
                  'publisher': post.publisher,
                  'releaseDate': post.releaseDate?.toIso8601String(),
                  'file': post.file == null
                      ? null
                      : {
                          'name': post.file!.name,
                          'extension': post.file!.extension,
                          'mimeType': post.file!.mimeType,
                          'sizeBytes': post.file!.sizeBytes,
                          'isApk': post.file!.isApk,
                        },
                  'categories': post.categoryName == null
                      ? []
                      : [
                          {'name': post.categoryName},
                        ],
                  'author': {'name': post.authorName},
                },
              );
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
            children: [
              Text(
                'ARTICLE',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.3,
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                post.title,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 10),
              Container(width: 40, height: 3, color: AppColors.gold),
              const SizedBox(height: 12),
              Text(
                [
                  if (post.authorName != null) post.authorName!,
                  if (post.readingTimeMinutes != null)
                    '${post.readingTimeMinutes} min read',
                  if (post.categoryName != null) post.categoryName!,
                ].join(' · '),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.65),
                    ),
              ),
              if (post.version != null ||
                  post.publisher != null ||
                  post.releaseDate != null) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (post.version != null)
                      _MetaChip(label: 'v${post.version}'),
                    if (post.publisher != null)
                      _MetaChip(label: post.publisher!),
                    if (post.releaseDate != null)
                      _MetaChip(
                        label: DateFormat.yMMMd().format(post.releaseDate!),
                      ),
                    if (post.file != null)
                      _MetaChip(
                        label:
                            '${post.file!.extension.toUpperCase()} · ${post.file!.sizeLabel}',
                      ),
                  ],
                ),
              ],
              if (post.featuredImage != null) ...[
                const SizedBox(height: 20),
                CachedNetworkImage(imageUrl: post.featuredImage!),
              ],
              if (post.actionLabel != null) ...[
                const SizedBox(height: 20),
                PostActionButton(post: post),
                if (post.deliveryType == DeliveryType.link &&
                    post.linkDescription != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    post.linkDescription!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.65),
                        ),
                  ),
                ],
                if (post.deliveryType == DeliveryType.file)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'A completed download is not an installation. Use Install only after the file is verified.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withValues(alpha: 0.6),
                          ),
                    ),
                  ),
              ],
              const SizedBox(height: 22),
              MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  textScaler: TextScaler.linear(_fontScale),
                ),
                child: SelectableText(
                  _stripHtml(post.content ?? ''),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        height: 1.7,
                      ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: const BannerAdWidget(
        placement: AdBannerPlacement.article,
      ),
    ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.primary,
            ),
      ),
    );
  }
}
