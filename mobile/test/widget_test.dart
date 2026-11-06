import 'package:daily_tips/core/theme/app_colors.dart';
import 'package:daily_tips/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Daily Tips brand colors match official palette', () {
    expect(AppColors.navy, const Color(0xFF083687));
    expect(AppColors.gold, const Color(0xFFFFAE00));
    expect(AppColors.lightBg, const Color(0xFFF5F7FA));
    expect(AppColors.darkBg, const Color(0xFF0B1220));
  });

  testWidgets('light theme uses navy primary and gold secondary', (tester) async {
    final theme = buildLightTheme();
    expect(theme.colorScheme.primary, AppColors.navy);
    expect(theme.colorScheme.secondary, AppColors.gold);

    await tester.pumpWidget(
      MaterialApp(
        theme: theme,
        home: Scaffold(
          floatingActionButton: FloatingActionButton(
            onPressed: () {},
            child: const Icon(Icons.add),
          ),
          body: const Center(child: Text('Daily Tips')),
        ),
      ),
    );
    expect(find.text('Daily Tips'), findsOneWidget);
  });
}
