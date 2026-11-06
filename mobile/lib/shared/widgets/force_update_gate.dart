import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/models.dart';

class ForceUpdateGate extends StatelessWidget {
  const ForceUpdateGate({
    super.key,
    required this.settings,
    required this.currentVersion,
    required this.child,
  });

  final AppRemoteSettings settings;
  final String currentVersion;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final blocked = settings.forceUpdate &&
        AppRemoteSettings.isBelowMinimum(currentVersion, settings.minAppVersion);
    if (!blocked) return child;

    final updateUrl = settings.updateUrl;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Update required',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 12),
                Text(
                  'This version of Daily Tips ($currentVersion) is no longer supported. '
                  'Please update to ${settings.minAppVersion} or newer.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: updateUrl == null || updateUrl.isEmpty
                      ? null
                      : () => launchUrl(
                            Uri.parse(updateUrl),
                            mode: LaunchMode.externalApplication,
                          ),
                  child: const Text('Open update page'),
                ),
                if (updateUrl == null || updateUrl.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text(
                      'No update URL is configured yet. Contact support.',
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
