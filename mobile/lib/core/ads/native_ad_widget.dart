import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../shared/providers/core_providers.dart';
import '../theme/app_colors.dart';
import 'ad_configuration_service.dart';
import 'ad_error_reporter.dart';
import 'ad_remote_config.dart';
import 'ad_unit_ids.dart';
import 'admob_service.dart';

class NativeAdWidget extends ConsumerStatefulWidget {
  const NativeAdWidget({super.key, required this.placement});

  final AdNativePlacement placement;

  @override
  ConsumerState<NativeAdWidget> createState() => _NativeAdWidgetState();
}

class _NativeAdWidgetState extends ConsumerState<NativeAdWidget> {
  NativeAd? _ad;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final user = ref.read(authUserProvider);
    if (user?.isPremium == true) return;

    final ads = ref.read(adsServiceProvider);
    final config = ref.read(adConfigurationServiceProvider).config;
    if (!ads.canRequestAds || !config.nativeAllowed(widget.placement)) {
      return;
    }
    final unitId = AdUnitIds.native;
    if (unitId.isEmpty || _ad != null) return;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surface = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final text = isDark ? AppColors.darkText : AppColors.lightText;
    final muted = isDark ? AppColors.darkMuted : AppColors.lightMuted;

    final ad = NativeAd(
      adUnitId: unitId,
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (ad) {
          if (!mounted) {
            ad.dispose();
            return;
          }
          setState(() => _loaded = true);
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          if (_ad == ad) _ad = null;
          // ignore: unawaited_futures
          ref.read(adErrorReporterProvider).report(
                format: 'native',
                code: '${error.code}',
                message: error.message,
              );
          if (mounted) setState(() => _loaded = false);
        },
      ),
      nativeTemplateStyle: NativeTemplateStyle(
        templateType: TemplateType.medium,
        mainBackgroundColor: surface,
        cornerRadius: 4,
        callToActionTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white,
          backgroundColor: AppColors.navy,
          style: NativeTemplateFontStyle.bold,
          size: 14,
        ),
        primaryTextStyle: NativeTemplateTextStyle(
          textColor: text,
          style: NativeTemplateFontStyle.bold,
          size: 16,
        ),
        secondaryTextStyle: NativeTemplateTextStyle(
          textColor: muted,
          style: NativeTemplateFontStyle.normal,
          size: 13,
        ),
        tertiaryTextStyle: NativeTemplateTextStyle(
          textColor: muted,
          style: NativeTemplateFontStyle.normal,
          size: 12,
        ),
      ),
    );
    _ad = ad;
    await ad.load();
  }

  @override
  void dispose() {
    _ad?.dispose();
    _ad = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authUserProvider);
    if (user?.isPremium == true) return const SizedBox.shrink();

    final config = ref.watch(adConfigurationServiceProvider).config;
    if (!config.nativeAllowed(widget.placement)) {
      return const SizedBox.shrink();
    }
    if (!_loaded || _ad == null) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            color: AppColors.gold.withValues(alpha: 0.2),
            child: Text(
              'Advertisement',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.gold : AppColors.navy,
                    letterSpacing: 0.6,
                  ),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            height: 320,
            decoration: BoxDecoration(
              border: Border.all(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              ),
            ),
            child: AdWidget(ad: _ad!),
          ),
        ],
      ),
    );
  }
}

/// Inserts a native ad widget after every [frequency] organic posts.
List<Widget> withNativeAds({
  required List<Widget> children,
  required int frequency,
  required AdNativePlacement placement,
}) {
  if (frequency < 3 || children.isEmpty) return children;
  final out = <Widget>[];
  for (var i = 0; i < children.length; i++) {
    out.add(children[i]);
    if ((i + 1) % frequency == 0 && i != children.length - 1) {
      out.add(NativeAdWidget(key: ValueKey('native-$placement-$i'), placement: placement));
    }
  }
  return out;
}
