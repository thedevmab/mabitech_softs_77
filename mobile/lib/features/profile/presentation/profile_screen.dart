import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../authentication/data/auth_repository.dart';
import '../../../shared/providers/core_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);
    final settings = ref.watch(remoteSettingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        children: [
          if (user == null)
            ListTile(
              title: const Text('Sign in'),
              subtitle: const Text('Sync bookmarks, favorites, and premium'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/auth/login'),
            )
          else ...[
            ListTile(
              leading: CircleAvatar(
                child: Text((user.name ?? user.email).substring(0, 1).toUpperCase()),
              ),
              title: Text(user.name ?? 'Member'),
              subtitle: Text(user.email),
            ),
            ListTile(
              title: const Text('Membership'),
              subtitle: Text(user.isPremium ? 'Premium active' : 'Free plan'),
              trailing: user.isPremium
                  ? const Icon(Icons.verified, color: Colors.amber)
                  : TextButton(
                      onPressed: () => context.push('/premium'),
                      child: const Text('Upgrade'),
                    ),
            ),
            ListTile(
              title: const Text('Sign out'),
              onTap: () async {
                await ref.read(authRepositoryProvider).logout();
              },
            ),
          ],
          const Divider(),
          ListTile(
            title: const Text('Premium'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/premium'),
          ),
          ListTile(
            title: const Text('Notifications'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/notifications'),
          ),
          ListTile(
            title: const Text('Settings'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/settings'),
          ),
          settings.when(
            data: (s) => ListTile(
              title: Text(s.platformName),
              subtitle: Text(s.tagline),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
