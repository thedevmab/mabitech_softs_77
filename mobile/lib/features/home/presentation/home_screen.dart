import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/ads/ad_configuration_service.dart';
import '../../../core/ads/ad_remote_config.dart';
import '../../../core/ads/native_ad_widget.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/post_card.dart';
import '../../../shared/widgets/software_card.dart';
import '../data/home_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(remoteSettingsProvider);
    final home = ref.watch(homeSectionsProvider);
    final platformName = settings.maybeWhen(
      data: (s) => s.platformName,
      orElse: () => 'Daily Tips',
    );
    final tagline = settings.maybeWhen(
      data: (s) => s.tagline,
      orElse: () => 'Technology • Knowledge • Innovation',
    );

    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: () async {
        ref.invalidate(homeSectionsProvider);
        await ref.read(homeSectionsProvider.future);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            title: Text(platformName),
            actions: [
              IconButton(
                tooltip: 'Search',
                onPressed: () => context.go('/explore'),
                icon: const Icon(Icons.search),
              ),
              IconButton(
                tooltip: 'Notifications',
                onPressed: () => context.push('/notifications'),
                icon: const Icon(Icons.notifications_outlined),
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 22),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.heroFrom,
                    AppColors.heroVia,
                    AppColors.heroTo,
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tagline.toUpperCase(),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    platformName,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Container(width: 42, height: 3, color: AppColors.gold),
                  const SizedBox(height: 12),
                  Text(
                    'News, AI, and verified downloads — every day.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                        ),
                  ),
                ],
              ),
            ),
          ),
          settings.maybeWhen(
            data: (s) {
              if (!s.announcementEnabled ||
                  ((s.announcementTitle ?? '').isEmpty &&
                      (s.announcementBody ?? '').isEmpty)) {
                return const SliverToBoxAdapter(child: SizedBox.shrink());
              }
              return SliverToBoxAdapter(
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.14),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.45)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (s.announcementTitle != null)
                        Text(
                          s.announcementTitle!,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      if (s.announcementBody != null) Text(s.announcementBody!),
                    ],
                  ),
                ),
              );
            },
            orElse: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),
          home.when(
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => SliverFillRemaining(
              child: EmptyState(
                title: 'Could not load home',
                subtitle: e.toString(),
                icon: Icons.cloud_off,
              ),
            ),
            data: (sections) {
              if (sections.isEmpty) {
                return const SliverFillRemaining(
                  child: EmptyState(
                    title: 'Nothing here yet',
                    subtitle:
                        'Home sections will appear when content is published.',
                  ),
                );
              }
              return SliverList.builder(
                itemCount: sections.length,
                itemBuilder: (context, index) {
                  return _SectionBlock(section: sections[index]);
                },
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
        ],
      ),
    );
  }
}

class _SectionBlock extends ConsumerWidget {
  const _SectionBlock({required this.section});

  final HomeSection section;

  String _eyebrowFor(String type) {
    switch (type) {
      case 'software':
        return 'STORE';
      case 'sponsored':
        return 'PARTNER';
      default:
        return 'EDITORIAL';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget body;
    if (section.items.isEmpty) {
      body = const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Text('No items in this section yet.'),
      );
    } else if (section.type == 'sponsored') {
      body = Column(
        children: section.items.whereType<Map>().map((raw) {
          final item =
              SponsoredBanner.fromJson(Map<String, dynamic>.from(raw));
          return _SponsoredTile(item: item);
        }).toList(),
      );
    } else if (section.type == 'software') {
      body = SizedBox(
        height: 168,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: section.items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (context, i) {
            final raw = section.items[i];
            if (raw is! Map) return const SizedBox.shrink();
            final item =
                SoftwareSummary.fromJson(Map<String, dynamic>.from(raw));
            return SoftwareCard(item: item);
          },
        ),
      );
    } else {
      final posts = section.items
          .whereType<Map>()
          .map((raw) => PostSummary.fromJson(Map<String, dynamic>.from(raw)))
          .toList();
      final postWidgets = <Widget>[
        if (posts.isNotEmpty) PostCard(item: posts.first, featured: true),
        ...posts.skip(1).map(
              (item) => Column(
                children: [
                  const Divider(height: 1),
                  PostCard(item: item, compact: true),
                ],
              ),
            ),
      ];
      final frequency =
          ref.watch(adConfigurationServiceProvider).config.nativeAdFrequency;
      body = Column(
        children: withNativeAds(
          children: postWidgets,
          frequency: frequency,
          placement: AdNativePlacement.home,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _eyebrowFor(section.type),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.3,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            section.title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 14),
          body,
        ],
      ),
    );
  }
}

class _SponsoredTile extends StatelessWidget {
  const _SponsoredTile({required this.item});

  final SponsoredBanner item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => launchUrl(
          Uri.parse(item.destinationUrl),
          mode: LaunchMode.externalApplication,
        ),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item.bannerUrl != null)
                CachedNetworkImage(
                  imageUrl: item.bannerUrl!,
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      color: AppColors.gold.withValues(alpha: 0.2),
                      child: const Text(
                        'SPONSORED',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.navy,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (item.sponsorName != null)
                      Text(
                        item.sponsorName!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
