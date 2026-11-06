import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ads/admob_service.dart';
import '../../../shared/providers/core_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final prefs = ref.watch(sharedPrefsProvider);
    final ads = ref.watch(adsServiceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const ListTile(title: Text('Appearance')),
          RadioListTile<ThemeMode>(
            title: const Text('System'),
            value: ThemeMode.system,
            groupValue: mode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            value: ThemeMode.light,
            groupValue: mode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            value: ThemeMode.dark,
            groupValue: mode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          const Divider(),
          SwitchListTile(
            title: const Text('Push notifications'),
            subtitle: const Text('Allow FCM alerts when Firebase is configured'),
            value: prefs.getBool('fcm_enabled') ?? true,
            onChanged: (v) async {
              await prefs.setBool('fcm_enabled', v);
              (context as Element).markNeedsBuild();
            },
          ),
          if (ads.privacyOptionsRequired)
            ListTile(
              title: const Text('Ad privacy options'),
              subtitle: const Text('Update how ads are personalized'),
              onTap: () => ads.showPrivacyOptions(),
            ),
          ListTile(
            title: const Text('API base URL'),
            subtitle: Text(
              const String.fromEnvironment(
                'API_BASE_URL',
                defaultValue: 'https://mabitechsofts77.vercel.app/api/v1',
              ),
            ),
          ),
          ListTile(
            title: const Text('Clear offline cache'),
            onTap: () async {
              final cache = ref.read(offlineCacheProvider);
              await cache.remove('home');
              await cache.remove('bookmarks');
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cache cleared')),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
