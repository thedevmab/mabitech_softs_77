import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/ads/ad_remote_config.dart';
import '../../core/ads/banner_ad_widget.dart';
import '../../core/ads/interstitial_ad_manager.dart';
import '../../core/theme/app_colors.dart';
import '../providers/core_providers.dart';

class ShellScaffold extends ConsumerWidget {
  const ShellScaffold({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  AdBannerPlacement? get _bannerPlacement {
    switch (navigationShell.currentIndex) {
      case 0:
        return AdBannerPlacement.home;
      case 1:
        return AdBannerPlacement.explore;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);
    final offline = connectivity.maybeWhen(
      data: (results) =>
          results.isEmpty || results.every((r) => r.name == 'none'),
      orElse: () => false,
    );
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bannerPlacement = _bannerPlacement;

    return Scaffold(
      body: Column(
        children: [
          if (offline)
            Material(
              color: AppColors.warning,
              child: SafeArea(
                bottom: false,
                child: SizedBox(
                  width: double.infinity,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    child: Text(
                      'You are offline. Showing cached content when available.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.lightText,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                ),
              ),
            ),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (bannerPlacement != null)
            BannerAdWidget(
              key: ValueKey('shell-banner-$bannerPlacement'),
              placement: bannerPlacement,
            ),
          DecoratedBox(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Theme.of(context).dividerColor),
              ),
            ),
            child: NavigationBar(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: (index) {
                final from = navigationShell.currentIndex;
                navigationShell.goBranch(index);
                final major =
                    (from == 0 && index == 1) || (from == 1 && index == 0);
                if (major) {
                  // ignore: unawaited_futures
                  ref.read(interstitialAdManagerProvider).maybeShow(
                        reason: 'section_transition',
                      );
                }
              },
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined),
                  selectedIcon: Icon(
                    Icons.home,
                    color: isDark ? AppColors.gold : AppColors.navy,
                  ),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.explore_outlined),
                  selectedIcon: Icon(
                    Icons.explore,
                    color: isDark ? AppColors.gold : AppColors.navy,
                  ),
                  label: 'Explore',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.download_outlined),
                  selectedIcon: Icon(
                    Icons.download,
                    color: isDark ? AppColors.gold : AppColors.navy,
                  ),
                  label: 'Downloads',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.bookmark_outline),
                  selectedIcon: Icon(
                    Icons.bookmark,
                    color: isDark ? AppColors.gold : AppColors.navy,
                  ),
                  label: 'Saved',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.person_outline),
                  selectedIcon: Icon(
                    Icons.person,
                    color: isDark ? AppColors.gold : AppColors.navy,
                  ),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
