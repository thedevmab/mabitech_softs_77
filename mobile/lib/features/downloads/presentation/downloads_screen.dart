import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/services/download_manager.dart';
import '../../../shared/widgets/empty_state.dart';

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(downloadManagerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Downloads')),
      body: tasks.isEmpty
          ? const EmptyState(
              title: 'No downloads yet',
              subtitle:
                  'APKs, documents, and other files you download from posts or software will appear here.',
              icon: Icons.download_outlined,
            )
          : ListView.separated(
              itemCount: tasks.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final task = tasks[index];
                final sourceLabel =
                    task.sourceType == DownloadSourceType.post ? 'POST' : 'SOFTWARE';
                return ListTile(
                  title: Text(task.title),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$sourceLabel · ${task.status.name.toUpperCase()}'),
                      if (task.status == DownloadStatus.downloading)
                        LinearProgressIndicator(value: task.progress > 0 ? task.progress : null),
                      if (task.error != null)
                        Text(task.error!, style: const TextStyle(color: Colors.red)),
                    ],
                  ),
                  isThreeLine: true,
                  trailing: Wrap(
                    spacing: 4,
                    children: [
                      if (task.status == DownloadStatus.downloading)
                        IconButton(
                          tooltip: 'Cancel',
                          icon: const Icon(Icons.close),
                          onPressed: () => ref
                              .read(downloadManagerProvider.notifier)
                              .cancel(task.id),
                        ),
                      if (task.status == DownloadStatus.failed ||
                          task.status == DownloadStatus.cancelled)
                        IconButton(
                          icon: const Icon(Icons.refresh),
                          onPressed: () => ref
                              .read(downloadManagerProvider.notifier)
                              .retry(task.id),
                        ),
                      if (task.status == DownloadStatus.completed) ...[
                        IconButton(
                          tooltip: task.isApk ? 'Install' : 'Open',
                          icon: Icon(
                            task.isApk ? Icons.install_mobile : Icons.open_in_new,
                          ),
                          onPressed: () async {
                            final result = await ref
                                .read(downloadManagerProvider.notifier)
                                .open(task.id);
                            if (!context.mounted) return;
                            if (task.isApk) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    result.message.isNotEmpty
                                        ? result.message
                                        : 'Downloaded. Follow the Android install prompt if shown.',
                                  ),
                                ),
                              );
                            }
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.share),
                          onPressed: () {
                            if (task.localPath != null) {
                              SharePlus.instance.share(
                                ShareParams(files: [XFile(task.localPath!)]),
                              );
                            }
                          },
                        ),
                      ],
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => ref
                            .read(downloadManagerProvider.notifier)
                            .delete(task.id),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
