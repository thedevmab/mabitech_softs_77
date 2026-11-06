import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/services/download_manager.dart';
import '../../core/theme/app_colors.dart';
import '../models/models.dart';
import '../providers/core_providers.dart';

class PostActionButton extends ConsumerWidget {
  const PostActionButton({
    super.key,
    required this.post,
    this.fullWidth = true,
    this.compact = false,
  });

  final PostSummary post;
  final bool fullWidth;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final label = post.actionLabel;
    if (label == null) return const SizedBox.shrink();

    final tasks = ref.watch(downloadManagerProvider);
    final active = tasks
        .where(
          (t) =>
              t.sourceType == DownloadSourceType.post &&
              (t.sourceId == post.id || t.sourceSlug == post.slug),
        )
        .toList();
    final current = active.isEmpty ? null : active.last;

    if (current?.status == DownloadStatus.downloading) {
      return _ProgressButton(
        progress: current!.progress,
        fullWidth: fullWidth,
        onCancel: () =>
            ref.read(downloadManagerProvider.notifier).cancel(current.id),
      );
    }

    if (current?.status == DownloadStatus.completed) {
      final isApk = current!.isApk || post.file?.isApk == true;
      return _PrimaryButton(
        label: isApk ? 'INSTALL' : 'OPEN',
        icon: isApk ? Icons.install_mobile : Icons.open_in_new,
        fullWidth: fullWidth,
        compact: compact,
        onPressed: () => _openDownloaded(context, ref, current),
      );
    }

    if (current?.status == DownloadStatus.failed) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PrimaryButton(
            label: 'RETRY',
            icon: Icons.refresh,
            fullWidth: fullWidth,
            compact: compact,
            onPressed: () =>
                ref.read(downloadManagerProvider.notifier).retry(current!.id),
          ),
          if (current?.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                current!.error!,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.error),
              ),
            ),
        ],
      );
    }

    return _PrimaryButton(
      label: label,
      icon: post.deliveryType == DeliveryType.link
          ? Icons.open_in_new
          : Icons.download_rounded,
      fullWidth: fullWidth,
      compact: compact,
      onPressed: () => _onPressed(context, ref),
    );
  }

  Future<void> _onPressed(BuildContext context, WidgetRef ref) async {
    if (post.deliveryType == DeliveryType.link) {
      await _openExternal(context, post.externalUrl);
      return;
    }
    if (post.deliveryType != DeliveryType.file) return;

    try {
      final api = ref.read(apiClientProvider);
      final download = await api.get('/posts/${post.slug}/download');
      final url = download['url']?.toString();
      if (url == null || url.isEmpty) {
        throw Exception('No download URL returned');
      }
      final fileMap = download['file'] is Map
          ? Map<String, dynamic>.from(download['file'] as Map)
          : null;
      await ref.read(downloadManagerProvider.notifier).enqueuePost(
            postId: post.id,
            postSlug: post.slug,
            title: post.title,
            url: url,
            checksumSha256: download['checksumSha256']?.toString(),
            fileName: fileMap?['name']?.toString() ?? post.file?.name,
            extension:
                fileMap?['extension']?.toString() ?? post.file?.extension,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Download started'),
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

  Future<void> _openExternal(BuildContext context, String? raw) async {
    if (raw == null || raw.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No external URL available')),
      );
      return;
    }
    final uri = Uri.tryParse(raw);
    if (uri == null ||
        !(uri.scheme == 'https' || uri.scheme == 'http') ||
        uri.host.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid external link')),
      );
      return;
    }
    final ok = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
    if (!ok && context.mounted) {
      final fallback = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!fallback && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open link')),
        );
      }
    }
  }

  Future<void> _openDownloaded(
    BuildContext context,
    WidgetRef ref,
    DownloadTask task,
  ) async {
    final result = await ref.read(downloadManagerProvider.notifier).open(task.id);
    if (!context.mounted) return;
    if (result.type.name == 'done' || result.type.name == 'noApp') {
      // OpenFilex reports done when the system install/open sheet was shown.
      // Never claim the APK was installed — only that the file was opened.
      if (task.isApk) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Downloaded. Follow the Android install prompt if shown — download does not mean installed.',
            ),
          ),
        );
      }
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.message.isNotEmpty
              ? result.message
              : 'Could not open file. Enable install from this app in Android settings if installing an APK.',
        ),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    required this.fullWidth,
    required this.compact,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool fullWidth;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final child = FilledButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: compact ? 16 : 18),
      label: Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: 0.6,
          fontSize: compact ? 12 : 13,
        ),
      ),
      style: FilledButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 12 : 16,
          vertical: compact ? 10 : 14,
        ),
      ),
    );
    if (fullWidth) {
      return SizedBox(width: double.infinity, child: child);
    }
    return child;
  }
}

class _ProgressButton extends StatelessWidget {
  const _ProgressButton({
    required this.progress,
    required this.fullWidth,
    required this.onCancel,
  });

  final double progress;
  final bool fullWidth;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: progress > 0 ? progress : null,
            minHeight: 10,
            backgroundColor: Theme.of(context).dividerColor,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Text(
                progress > 0
                    ? 'Downloading ${(progress * 100).clamp(0, 100).toStringAsFixed(0)}%'
                    : 'Downloading…',
                style: Theme.of(context).textTheme.labelMedium,
              ),
            ),
            TextButton(
              onPressed: onCancel,
              child: const Text('Cancel'),
            ),
          ],
        ),
      ],
    );
    return fullWidth ? body : SizedBox(width: 220, child: body);
  }
}
