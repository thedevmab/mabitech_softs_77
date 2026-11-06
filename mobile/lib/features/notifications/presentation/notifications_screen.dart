import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';

final notificationsInboxProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(authUserProvider);
  if (user == null) return const [];
  final data = await ref.watch(apiClientProvider).get('/notifications');
  final items = data['items'] as List? ?? const [];
  return items
      .whereType<Map>()
      .map((e) => Map<String, dynamic>.from(e))
      .toList();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);
    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/auth/login'),
            child: const Text('Sign in to view notifications'),
          ),
        ),
      );
    }

    final inbox = ref.watch(notificationsInboxProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(notificationsInboxProvider);
          await ref.read(notificationsInboxProvider.future);
        },
        child: inbox.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => EmptyState(title: 'Unavailable', subtitle: e.toString()),
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  EmptyState(
                    title: 'No notifications',
                    subtitle: 'Push and in-app messages will appear here.',
                  ),
                ],
              );
            }
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final n = items[i];
                return ListTile(
                  title: Text(n['title']?.toString() ?? 'Notification'),
                  subtitle: Text(n['body']?.toString() ?? ''),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
