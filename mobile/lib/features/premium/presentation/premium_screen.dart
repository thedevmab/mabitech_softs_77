import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../shared/models/models.dart';
import '../../../shared/providers/core_providers.dart';
import '../../../shared/widgets/empty_state.dart';

final plansProvider = FutureProvider.autoDispose<List<SubscriptionPlan>>((ref) async {
  final data = await ref.watch(apiClientProvider).get('/subscriptions/plans');
  final items = data['items'] ?? data['plans'] ?? data;
  if (items is! List) return const [];
  return items
      .whereType<Map>()
      .map((e) => SubscriptionPlan.fromJson(Map<String, dynamic>.from(e)))
      .where((p) => p.priceCents > 0)
      .toList();
});

final monetizationProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(apiClientProvider).get('/monetization/config');
});

class PremiumScreen extends ConsumerStatefulWidget {
  const PremiumScreen({super.key});

  @override
  ConsumerState<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends ConsumerState<PremiumScreen> {
  final _txRef = TextEditingController();
  String? _selectedPlanId;
  bool _verifying = false;
  String? _message;

  @override
  void dispose() {
    _txRef.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final user = ref.read(authUserProvider);
    if (user == null) {
      setState(() => _message = 'Sign in first to verify premium.');
      return;
    }
    if (_selectedPlanId == null || _txRef.text.trim().isEmpty) {
      setState(() => _message = 'Select a plan and enter the payment reference.');
      return;
    }
    setState(() {
      _verifying = true;
      _message = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      await api.post(
        '/subscriptions/verify',
        data: {
          'planId': _selectedPlanId,
          'providerRef': _txRef.text.trim(),
          'provider': 'CHAPA',
        },
      );
      final me = await api.get('/users/me');
      ref.read(authUserProvider.notifier).state =
          AppUser.fromJson(me);
      setState(() => _message = 'Premium activated. Ads are disabled for your account.');
    } catch (e) {
      setState(() => _message = e.toString());
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plans = ref.watch(plansProvider);
    final monetization = ref.watch(monetizationProvider);
    final user = ref.watch(authUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Premium')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user?.isPremium == true)
            const Card(
              child: ListTile(
                leading: Icon(Icons.verified, color: Colors.amber),
                title: Text('You are Premium'),
                subtitle: Text('Ad-free experience is enabled.'),
              ),
            ),
          monetization.when(
            data: (cfg) {
              final checkoutUrl = cfg['checkoutUrl']?.toString() ??
                  cfg['paymentUrl']?.toString();
              if (checkoutUrl == null) {
                return const Text(
                  'Complete payment with Chapa/Telebirr via the provider flow, then verify with your transaction reference below. No Play Billing for digital subscriptions in v1.',
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pay with Chapa / Telebirr, then paste your provider reference to activate premium.',
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () => launchUrl(
                      Uri.parse(checkoutUrl),
                      mode: LaunchMode.externalApplication,
                    ),
                    child: const Text('Open payment page'),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 220,
                    child: WebViewWidget(
                      controller: WebViewController()
                        ..setJavaScriptMode(JavaScriptMode.unrestricted)
                        ..loadRequest(Uri.parse(checkoutUrl)),
                    ),
                  ),
                ],
              );
            },
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const Text(
              'Complete payment externally, then verify with your transaction reference. Premium uses server-side Chapa/Telebirr verification (no Play Billing).',
            ),
          ),
          const SizedBox(height: 16),
          Text('Plans', style: Theme.of(context).textTheme.titleMedium),
          plans.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => EmptyState(title: 'Plans unavailable', subtitle: e.toString()),
            data: (items) {
              if (items.isEmpty) {
                return const EmptyState(title: 'No paid plans configured');
              }
              return Column(
                children: items
                    .map(
                      (p) => RadioListTile<String>(
                        value: p.id,
                        groupValue: _selectedPlanId,
                        onChanged: (v) => setState(() => _selectedPlanId = v),
                        title: Text(p.name),
                        subtitle: Text(
                          '${(p.priceCents / 100).toStringAsFixed(2)} ${p.currency}',
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
          TextField(
            controller: _txRef,
            decoration: const InputDecoration(
              labelText: 'Payment / provider reference',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _verifying ? null : _verify,
            child: Text(_verifying ? 'Verifying…' : 'Verify subscription'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!),
          ],
        ],
      ),
    );
  }
}
