import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/services/download_manager.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';

final softwareDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) {
  return ref.watch(apiClientProvider).get('/software/$slug');
});

class SoftwareDetailScreen extends ConsumerWidget {
  const SoftwareDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(softwareDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Software'),
        actions: [
          IconButton(
            tooltip: 'Favorite',
            onPressed: () async {
              final user = ref.read(authUserProvider);
              if (user == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sign in to favorite software')),
                );
                return;
              }
              try {
                await ref.read(apiClientProvider).post('/software/$slug/favorite');
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Favorites updated')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString())),
                  );
                }
              }
            },
            icon: const Icon(Icons.favorite_border),
          ),
        ],
      ),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => EmptyState(title: 'Unavailable', subtitle: e.toString()),
        data: (data) {
          final name = (data['name'] ?? data['title'] ?? 'Software').toString();
          final description =
              (data['description'] ?? data['shortDescription'] ?? '').toString();
          final iconUrl = data['iconUrl'] as String?;
          final channel = data['channel'] as String?;
          final channelPayload = data['distribution'] is Map
              ? Map<String, dynamic>.from(data['distribution'] as Map)
              : data['channelPayload'] is Map
                  ? Map<String, dynamic>.from(data['channelPayload'] as Map)
                  : <String, dynamic>{};
          final action = channelPayload['action']?.toString() ?? 'download';

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            children: [
              Text(
                'SOFTWARE',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.3,
                    ),
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: iconUrl != null
                        ? CachedNetworkImage(
                            imageUrl: iconUrl,
                            width: 72,
                            height: 72,
                            fit: BoxFit.cover,
                          )
                        : Icon(
                            Icons.apps,
                            size: 36,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      name,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                description,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      height: 1.55,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.78),
                    ),
              ),
              if (channelPayload['installGuidance'] != null) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    color: AppColors.gold.withValues(alpha: 0.08),
                  ),
                  child: Text(channelPayload['installGuidance'].toString()),
                ),
              ],
              const SizedBox(height: 28),
              FilledButton(
                onPressed: () => _handleAction(
                  context,
                  ref,
                  data: data,
                  action: action,
                  channel: channel,
                  channelPayload: channelPayload,
                ),
                child: Text(_ctaLabel(action, channel)),
              ),
              const SizedBox(height: 10),
              Text(
                'A completed download is not an installation. Use Install only after the file is verified.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.6),
                    ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _ctaLabel(String action, String? channel) {
    switch (action) {
      case 'visit':
      case 'external':
        return 'Visit website';
      case 'play':
      case 'google_play':
        return 'Open on Google Play';
      case 'download':
      default:
        if (channel == 'HOSTED_FILE') return 'Download';
        return 'Get software';
    }
  }

  Future<void> _handleAction(
    BuildContext context,
    WidgetRef ref, {
    required Map<String, dynamic> data,
    required String action,
    required String? channel,
    required Map<String, dynamic> channelPayload,
  }) async {
    final slug = data['slug']?.toString() ?? this.slug;
    final id = data['id']?.toString() ?? slug;
    final name = (data['name'] ?? data['title'] ?? slug).toString();

    if (action == 'visit' ||
        action == 'external' ||
        action == 'play' ||
        action == 'google_play') {
      final url = channelPayload['url']?.toString() ??
          channelPayload['destinationUrl']?.toString() ??
          data['externalUrl']?.toString();
      if (url != null) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
      return;
    }

    // Hosted download: ask API for signed/download URL
    try {
      final api = ref.read(apiClientProvider);
      final download = await api.get('/software/$slug/download');
      final url = download['downloadUrl']?.toString() ??
          download['url']?.toString() ??
          download['signedUrl']?.toString();
      if (url == null) {
        throw Exception('No download URL returned');
      }
      final file = download['file'];
      final checksum = download['checksumSha256']?.toString() ??
          (file is Map ? file['checksumSha256']?.toString() : null) ??
          channelPayload['checksumSha256']?.toString();
      await ref.read(downloadManagerProvider.notifier).enqueue(
            softwareId: id,
            softwareSlug: slug,
            title: name,
            url: url,
            checksumSha256: checksum,
            eventKey: download['eventKey']?.toString(),
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Download started. Open Downloads to install when ready.'),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }
}
