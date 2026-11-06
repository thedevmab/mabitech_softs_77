class AppUser {
  AppUser({
    required this.id,
    required this.email,
    this.name,
    this.image,
    this.bio,
    required this.isPremium,
    this.premiumExpiresAt,
  });

  final String id;
  final String email;
  final String? name;
  final String? image;
  final String? bio;
  final bool isPremium;
  final DateTime? premiumExpiresAt;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String?,
        image: json['image'] as String?,
        bio: json['bio'] as String?,
        isPremium: json['isPremium'] as bool? ?? false,
        premiumExpiresAt: json['premiumExpiresAt'] != null
            ? DateTime.tryParse(json['premiumExpiresAt'].toString())
            : null,
      );
}

enum DeliveryType { none, file, link }

DeliveryType deliveryTypeFrom(Object? raw) {
  switch ((raw ?? 'none').toString().toLowerCase()) {
    case 'file':
      return DeliveryType.file;
    case 'link':
      return DeliveryType.link;
    default:
      return DeliveryType.none;
  }
}

class PostFileInfo {
  PostFileInfo({
    required this.name,
    required this.extension,
    required this.mimeType,
    required this.sizeBytes,
    required this.isApk,
    this.downloadCount,
    this.apkPackage,
    this.apkVersionName,
    this.apkVersionCode,
  });

  final String name;
  final String extension;
  final String mimeType;
  final int sizeBytes;
  final bool isApk;
  final int? downloadCount;
  final String? apkPackage;
  final String? apkVersionName;
  final int? apkVersionCode;

  String get sizeLabel {
    if (sizeBytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    var value = sizeBytes.toDouble();
    var i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    final digits = i == 0 ? 0 : 1;
    return '${value.toStringAsFixed(digits)} ${units[i]}';
  }

  factory PostFileInfo.fromJson(Map<String, dynamic> json) {
    final apk = json['apk'] is Map
        ? Map<String, dynamic>.from(json['apk'] as Map)
        : null;
    return PostFileInfo(
      name: (json['name'] ?? 'file').toString(),
      extension: (json['extension'] ?? '').toString().toLowerCase(),
      mimeType: (json['mimeType'] ?? 'application/octet-stream').toString(),
      sizeBytes: (json['sizeBytes'] as num?)?.toInt() ?? 0,
      isApk: json['isApk'] as bool? ??
          (json['extension']?.toString().toLowerCase() == 'apk'),
      downloadCount: (json['downloadCount'] as num?)?.toInt(),
      apkPackage: apk?['packageName']?.toString(),
      apkVersionName: apk?['versionName']?.toString(),
      apkVersionCode: (apk?['versionCode'] as num?)?.toInt(),
    );
  }
}

class PostSummary {
  PostSummary({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    this.featuredImage,
    this.readingTimeMinutes,
    this.publishedAt,
    this.isSponsored = false,
    this.deliveryType = DeliveryType.none,
    this.externalUrl,
    this.linkDescription,
    this.file,
    this.categoryName,
    this.version,
    this.publisher,
    this.releaseDate,
  });

  final String id;
  final String title;
  final String slug;
  final String? excerpt;
  final String? featuredImage;
  final int? readingTimeMinutes;
  final DateTime? publishedAt;
  final bool isSponsored;
  final DeliveryType deliveryType;
  final String? externalUrl;
  final String? linkDescription;
  final PostFileInfo? file;
  final String? categoryName;
  final String? version;
  final String? publisher;
  final DateTime? releaseDate;

  String? get actionLabel {
    switch (deliveryType) {
      case DeliveryType.link:
        return 'GET NOW';
      case DeliveryType.file:
        if (file?.isApk == true) return 'DOWNLOAD APK';
        return 'DOWNLOAD';
      case DeliveryType.none:
        return null;
    }
  }

  factory PostSummary.fromJson(Map<String, dynamic> json) {
    String? categoryName;
    final categories = json['categories'];
    if (categories is List && categories.isNotEmpty) {
      final first = categories.first;
      if (first is Map) categoryName = first['name']?.toString();
    }

    return PostSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String,
      excerpt: json['excerpt'] as String?,
      featuredImage: json['featuredImage'] as String?,
      readingTimeMinutes: json['readingTimeMinutes'] as int?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'].toString())
          : null,
      isSponsored: json['isSponsored'] as bool? ?? false,
      deliveryType: deliveryTypeFrom(json['deliveryType']),
      externalUrl: json['externalUrl'] as String?,
      linkDescription: json['linkDescription'] as String?,
      file: json['file'] is Map
          ? PostFileInfo.fromJson(Map<String, dynamic>.from(json['file'] as Map))
          : null,
      categoryName: categoryName,
      version: json['version'] as String?,
      publisher: json['publisher'] as String?,
      releaseDate: json['releaseDate'] != null
          ? DateTime.tryParse(json['releaseDate'].toString())
          : null,
    );
  }
}

class PostDetail extends PostSummary {
  PostDetail({
    required super.id,
    required super.title,
    required super.slug,
    super.excerpt,
    super.featuredImage,
    super.readingTimeMinutes,
    super.publishedAt,
    super.isSponsored,
    super.deliveryType,
    super.externalUrl,
    super.linkDescription,
    super.file,
    super.categoryName,
    super.version,
    super.publisher,
    super.releaseDate,
    this.content,
    this.authorName,
  });

  final String? content;
  final String? authorName;

  factory PostDetail.fromJson(Map<String, dynamic> json) {
    final summary = PostSummary.fromJson(json);
    return PostDetail(
      id: summary.id,
      title: summary.title,
      slug: summary.slug,
      excerpt: summary.excerpt,
      featuredImage: summary.featuredImage,
      readingTimeMinutes: summary.readingTimeMinutes,
      publishedAt: summary.publishedAt,
      isSponsored: summary.isSponsored,
      deliveryType: summary.deliveryType,
      externalUrl: summary.externalUrl,
      linkDescription: summary.linkDescription,
      file: summary.file,
      categoryName: summary.categoryName,
      version: summary.version,
      publisher: summary.publisher,
      releaseDate: summary.releaseDate,
      content: json['content'] as String?,
      authorName: json['author'] is Map
          ? (json['author'] as Map)['name'] as String?
          : null,
    );
  }
}

class SoftwareSummary {
  SoftwareSummary({
    required this.id,
    required this.name,
    required this.slug,
    this.shortDescription,
    this.iconUrl,
    this.channel,
    this.downloadCount,
    this.isPremium = false,
  });

  final String id;
  final String name;
  final String slug;
  final String? shortDescription;
  final String? iconUrl;
  final String? channel;
  final int? downloadCount;
  final bool isPremium;

  factory SoftwareSummary.fromJson(Map<String, dynamic> json) =>
      SoftwareSummary(
        id: json['id'] as String,
        name: (json['name'] ?? json['title'] ?? '') as String,
        slug: json['slug'] as String,
        shortDescription:
            (json['shortDescription'] ?? json['description']) as String?,
        iconUrl: json['iconUrl'] as String?,
        channel: json['channel'] as String?,
        downloadCount: json['downloadCount'] as int?,
        isPremium: json['isPremium'] as bool? ?? false,
      );
}

class HomeSection {
  HomeSection({
    required this.key,
    required this.title,
    required this.type,
    required this.items,
  });

  final String key;
  final String title;
  final String type;
  final List<dynamic> items;

  factory HomeSection.fromJson(Map<String, dynamic> json) {
    final raw = json['items'];
    return HomeSection(
      key: json['key'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      items: raw is List ? List<dynamic>.from(raw) : const [],
    );
  }
}

class CategoryItem {
  CategoryItem({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.description,
  });

  final String id;
  final String name;
  final String slug;
  final String? icon;
  final String? description;

  factory CategoryItem.fromJson(Map<String, dynamic> json) => CategoryItem(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        icon: json['icon'] as String?,
        description: json['description'] as String?,
      );
}

class SponsoredBanner {
  SponsoredBanner({
    required this.id,
    required this.title,
    required this.destinationUrl,
    this.sponsorName,
    this.bannerUrl,
    this.description,
  });

  final String id;
  final String title;
  final String destinationUrl;
  final String? sponsorName;
  final String? bannerUrl;
  final String? description;

  factory SponsoredBanner.fromJson(Map<String, dynamic> json) =>
      SponsoredBanner(
        id: json['id'] as String,
        title: json['title'] as String,
        destinationUrl: json['destinationUrl'] as String,
        sponsorName: json['sponsorName'] as String?,
        bannerUrl: json['bannerUrl'] as String?,
        description: json['description'] as String?,
      );
}

class AppRemoteSettings {
  AppRemoteSettings({
    required this.platformName,
    required this.tagline,
    this.logoUrl,
    this.branding,
    this.registrationEnabled = true,
    this.maintenanceMode = false,
    this.maintenanceMessage,
    this.adsEnabled = false,
    this.monetizationEnabled = true,
    this.minAppVersion = '1.0.0',
    this.recommendedAppVersion = '1.0.0',
    this.forceUpdate = false,
    this.updateUrl,
    this.announcementEnabled = false,
    this.announcementTitle,
    this.announcementBody,
    this.contentRefreshSeconds = 300,
    this.privacyPolicyUrl,
    this.termsOfServiceUrl,
  });

  final String platformName;
  final String tagline;
  final String? logoUrl;
  final Map<String, dynamic>? branding;
  final bool registrationEnabled;
  final bool maintenanceMode;
  final String? maintenanceMessage;
  final bool adsEnabled;
  final bool monetizationEnabled;
  final String minAppVersion;
  final String recommendedAppVersion;
  final bool forceUpdate;
  final String? updateUrl;
  final bool announcementEnabled;
  final String? announcementTitle;
  final String? announcementBody;
  final int contentRefreshSeconds;
  final String? privacyPolicyUrl;
  final String? termsOfServiceUrl;

  factory AppRemoteSettings.fromJson(Map<String, dynamic> json) =>
      AppRemoteSettings(
        platformName: json['platformName'] as String? ?? 'Daily Tips',
        tagline:
            json['tagline'] as String? ?? 'Technology • Knowledge • Innovation',
        logoUrl: json['logoUrl'] as String?,
        branding: json['branding'] is Map
            ? Map<String, dynamic>.from(json['branding'] as Map)
            : null,
        registrationEnabled: json['registrationEnabled'] as bool? ?? true,
        maintenanceMode: json['maintenanceMode'] as bool? ?? false,
        maintenanceMessage: json['maintenanceMessage'] as String?,
        adsEnabled: json['adsEnabled'] as bool? ?? false,
        monetizationEnabled: json['monetizationEnabled'] as bool? ?? true,
        minAppVersion: json['minAppVersion'] as String? ?? '1.0.0',
        recommendedAppVersion:
            json['recommendedAppVersion'] as String? ??
                json['minAppVersion'] as String? ??
                '1.0.0',
        forceUpdate: json['forceUpdate'] as bool? ?? false,
        updateUrl: json['updateUrl'] as String?,
        announcementEnabled: json['announcementEnabled'] as bool? ?? false,
        announcementTitle: json['announcementTitle'] as String?,
        announcementBody: json['announcementBody'] as String?,
        contentRefreshSeconds: json['contentRefreshSeconds'] as int? ?? 300,
        privacyPolicyUrl: json['privacyPolicyUrl'] as String?,
        termsOfServiceUrl: json['termsOfServiceUrl'] as String?,
      );

  /// Returns true when [current] is strictly below [minimum] (semver-ish dotted ints).
  static bool isBelowMinimum(String current, String minimum) {
    List<int> parts(String v) => v
        .split('.')
        .map((p) => int.tryParse(p.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0)
        .toList();
    final a = parts(current);
    final b = parts(minimum);
    final len = a.length > b.length ? a.length : b.length;
    for (var i = 0; i < len; i++) {
      final av = i < a.length ? a[i] : 0;
      final bv = i < b.length ? b[i] : 0;
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }
}

class SubscriptionPlan {
  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.slug,
    required this.priceCents,
    required this.currency,
    this.description,
    this.features = const [],
  });

  final String id;
  final String name;
  final String slug;
  final int priceCents;
  final String currency;
  final String? description;
  final List<String> features;

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) =>
      SubscriptionPlan(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        priceCents: json['priceCents'] as int? ?? 0,
        currency: json['currency'] as String? ?? 'ETB',
        description: json['description'] as String?,
        features: json['features'] is List
            ? (json['features'] as List).map((e) => e.toString()).toList()
            : const [],
      );
}
