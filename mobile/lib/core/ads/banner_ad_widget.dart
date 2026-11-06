import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../shared/providers/core_providers.dart';
import 'ad_configuration_service.dart';
import 'ad_error_reporter.dart';
import 'ad_remote_config.dart';
import 'ad_unit_ids.dart';
import 'admob_service.dart';

class BannerAdWidget extends ConsumerStatefulWidget {
  const BannerAdWidget({super.key, required this.placement});

  final AdBannerPlacement placement;

  @override
  ConsumerState<BannerAdWidget> createState() => _BannerAdWidgetState();
}

class _BannerAdWidgetState extends ConsumerState<BannerAdWidget> {
  BannerAd? _banner;
  bool _loaded = false;
  bool _retried = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _ensureLoaded();
  }

  Future<void> _ensureLoaded() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final user = ref.read(authUserProvider);
    if (user?.isPremium == true) return;

    final ads = ref.read(adsServiceProvider);
    final config = ref.read(adConfigurationServiceProvider).config;
    if (!ads.canRequestAds || !config.bannerAllowed(widget.placement)) {
      return;
    }
    final unitId = AdUnitIds.banner;
    if (unitId.isEmpty || _banner != null) return;

    final width = MediaQuery.sizeOf(context).width.truncate();
    final size = await AdSize.getLargeAnchoredAdaptiveBannerAdSize(width);
    if (size == null || !mounted) return;

    final banner = BannerAd(
      adUnitId: unitId,
      size: size,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (!mounted) {
            ad.dispose();
            return;
          }
          setState(() => _loaded = true);
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          if (_banner == ad) _banner = null;
          // ignore: unawaited_futures
          ref.read(adErrorReporterProvider).report(
                format: 'banner',
                code: '${error.code}',
                message: error.message,
              );
          if (!_retried && mounted) {
            _retried = true;
            Future<void>.delayed(const Duration(seconds: 2), _ensureLoaded);
          } else if (mounted) {
            setState(() => _loaded = false);
          }
        },
      ),
    );
    _banner = banner;
    await banner.load();
  }

  @override
  void dispose() {
    _banner?.dispose();
    _banner = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authUserProvider);
    if (user?.isPremium == true) return const SizedBox.shrink();

    final config = ref.watch(adConfigurationServiceProvider).config;
    if (!config.bannerAllowed(widget.placement)) {
      return const SizedBox.shrink();
    }

    if (!_loaded || _banner == null) return const SizedBox.shrink();

    return SafeArea(
      top: false,
      child: SizedBox(
        width: _banner!.size.width.toDouble(),
        height: _banner!.size.height.toDouble(),
        child: AdWidget(ad: _banner!),
      ),
    );
  }
}
