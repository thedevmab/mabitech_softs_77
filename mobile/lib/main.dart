import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_ce_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/ads/admob_service.dart';
import 'core/ads/app_open_ad_manager.dart';
import 'core/config/env.dart';
import 'core/routing/app_router.dart';
import 'core/services/fcm_service.dart';
import 'core/theme/app_theme.dart';
import 'shared/providers/core_providers.dart';
import 'shared/widgets/force_update_gate.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPrefsProvider.overrideWithValue(prefs),
      ],
      child: const DailyTipsApp(),
    ),
  );
}

class DailyTipsApp extends ConsumerStatefulWidget {
  const DailyTipsApp({super.key});

  @override
  ConsumerState<DailyTipsApp> createState() => _DailyTipsAppState();
}

class _DailyTipsAppState extends ConsumerState<DailyTipsApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() async {
      await ref.read(authBootstrapProvider.future);
      final user = ref.read(authUserProvider);
      await ref.read(adsServiceProvider).init(
            isPremium: user?.isPremium ?? false,
          );
      // Cold start: show app open only if already loaded (never block startup).
      // ignore: unawaited_futures
      ref.read(appOpenAdManagerProvider).maybeShowColdStart();
      final prefs = ref.read(sharedPrefsProvider);
      if (prefs.getBool('fcm_enabled') ?? true) {
        await ref.read(fcmServiceProvider).init();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final appOpen = ref.read(appOpenAdManagerProvider);
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      // Only treat paused as a real background for cooldown; inactive alone
      // is ignored for showing. We still record paused.
      if (state == AppLifecycleState.paused) {
        appOpen.onAppPaused();
      }
    } else if (state == AppLifecycleState.resumed) {
      // ignore: unawaited_futures
      appOpen.maybeShowOnResume();
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    final settings = ref.watch(remoteSettingsProvider);
    final title = settings.maybeWhen(
      data: (s) => s.platformName,
      orElse: () => 'Daily Tips',
    );

    final app = MaterialApp.router(
      title: title,
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );

    return settings.when(
      data: (s) => ForceUpdateGate(
        settings: s,
        currentVersion: Env.appVersion,
        child: app,
      ),
      loading: () => app,
      error: (_, __) => app,
    );
  }
}
