import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/ads/ad_remote_config.dart';
import '../../core/ads/banner_ad_widget.dart';

/// Adaptive banner slot for shell and detail screens.
class AdBannerSlot extends ConsumerWidget {
  const AdBannerSlot({
    super.key,
    this.placement = AdBannerPlacement.explore,
  });

  final AdBannerPlacement placement;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BannerAdWidget(placement: placement);
  }
}
