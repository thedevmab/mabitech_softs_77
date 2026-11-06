class AdRemoteConfig {
  const AdRemoteConfig({
    required this.adsEnabled,
    required this.bannerEnabled,
    required this.interstitialEnabled,
    required this.nativeEnabled,
    required this.appOpenEnabled,
    required this.bannerOnHome,
    required this.bannerOnExplore,
    required this.bannerOnArticle,
    required this.nativeOnHome,
    required this.nativeOnExplore,
    required this.interstitialCooldown,
    required this.interstitialSessionLimit,
    required this.nativeAdFrequency,
    required this.appOpenCooldown,
    required this.consentRequired,
    required this.childDirected,
    this.updatedAt,
  });

  final bool adsEnabled;
  final bool bannerEnabled;
  final bool interstitialEnabled;
  final bool nativeEnabled;
  final bool appOpenEnabled;
  final bool bannerOnHome;
  final bool bannerOnExplore;
  final bool bannerOnArticle;
  final bool nativeOnHome;
  final bool nativeOnExplore;
  final int interstitialCooldown;
  final int interstitialSessionLimit;
  final int nativeAdFrequency;
  final int appOpenCooldown;
  final bool consentRequired;
  final bool childDirected;
  final String? updatedAt;

  static const disabled = AdRemoteConfig(
    adsEnabled: false,
    bannerEnabled: false,
    interstitialEnabled: false,
    nativeEnabled: false,
    appOpenEnabled: false,
    bannerOnHome: true,
    bannerOnExplore: true,
    bannerOnArticle: true,
    nativeOnHome: true,
    nativeOnExplore: true,
    interstitialCooldown: 300,
    interstitialSessionLimit: 5,
    nativeAdFrequency: 5,
    appOpenCooldown: 14400,
    consentRequired: true,
    childDirected: false,
  );

  factory AdRemoteConfig.fromJson(Map<String, dynamic> json) {
    return AdRemoteConfig(
      adsEnabled: json['adsEnabled'] as bool? ?? false,
      bannerEnabled: json['bannerEnabled'] as bool? ?? false,
      interstitialEnabled: json['interstitialEnabled'] as bool? ?? false,
      nativeEnabled: json['nativeEnabled'] as bool? ?? false,
      appOpenEnabled: json['appOpenEnabled'] as bool? ?? false,
      bannerOnHome: json['bannerOnHome'] as bool? ?? true,
      bannerOnExplore: json['bannerOnExplore'] as bool? ?? true,
      bannerOnArticle: json['bannerOnArticle'] as bool? ?? true,
      nativeOnHome: json['nativeOnHome'] as bool? ?? true,
      nativeOnExplore: json['nativeOnExplore'] as bool? ?? true,
      interstitialCooldown: (json['interstitialCooldown'] as num?)?.toInt() ?? 300,
      interstitialSessionLimit:
          (json['interstitialSessionLimit'] as num?)?.toInt() ?? 5,
      nativeAdFrequency: (json['nativeAdFrequency'] as num?)?.toInt() ?? 5,
      appOpenCooldown: (json['appOpenCooldown'] as num?)?.toInt() ?? 14400,
      consentRequired: json['consentRequired'] as bool? ?? true,
      childDirected: json['childDirected'] as bool? ?? false,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'adsEnabled': adsEnabled,
        'bannerEnabled': bannerEnabled,
        'interstitialEnabled': interstitialEnabled,
        'nativeEnabled': nativeEnabled,
        'appOpenEnabled': appOpenEnabled,
        'bannerOnHome': bannerOnHome,
        'bannerOnExplore': bannerOnExplore,
        'bannerOnArticle': bannerOnArticle,
        'nativeOnHome': nativeOnHome,
        'nativeOnExplore': nativeOnExplore,
        'interstitialCooldown': interstitialCooldown,
        'interstitialSessionLimit': interstitialSessionLimit,
        'nativeAdFrequency': nativeAdFrequency,
        'appOpenCooldown': appOpenCooldown,
        'consentRequired': consentRequired,
        'childDirected': childDirected,
        'updatedAt': updatedAt,
      };

  bool get canShowAny => adsEnabled;

  bool bannerAllowed(AdBannerPlacement placement) {
    if (!adsEnabled || !bannerEnabled) return false;
    switch (placement) {
      case AdBannerPlacement.home:
        return bannerOnHome;
      case AdBannerPlacement.explore:
        return bannerOnExplore;
      case AdBannerPlacement.article:
        return bannerOnArticle;
    }
  }

  bool nativeAllowed(AdNativePlacement placement) {
    if (!adsEnabled || !nativeEnabled) return false;
    switch (placement) {
      case AdNativePlacement.home:
        return nativeOnHome;
      case AdNativePlacement.explore:
        return nativeOnExplore;
    }
  }
}

enum AdBannerPlacement { home, explore, article }

enum AdNativePlacement { home, explore }
