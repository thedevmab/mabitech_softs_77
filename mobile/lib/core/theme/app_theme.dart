import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

TextTheme _buildTextTheme(Brightness brightness) {
  final base = brightness == Brightness.dark
      ? ThemeData(brightness: Brightness.dark).textTheme
      : ThemeData(brightness: Brightness.light).textTheme;
  final colored = GoogleFonts.sourceSans3TextTheme(base).apply(
    bodyColor:
        brightness == Brightness.dark ? AppColors.darkText : AppColors.lightText,
    displayColor:
        brightness == Brightness.dark ? AppColors.darkText : AppColors.lightText,
  );
  final display = GoogleFonts.outfitTextTheme(colored);
  return colored.copyWith(
    displayLarge: display.displayLarge?.copyWith(fontWeight: FontWeight.w800),
    displayMedium: display.displayMedium?.copyWith(fontWeight: FontWeight.w800),
    displaySmall: display.displaySmall?.copyWith(fontWeight: FontWeight.w700),
    headlineLarge: display.headlineLarge?.copyWith(fontWeight: FontWeight.w700),
    headlineMedium:
        display.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
    headlineSmall: display.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
    titleLarge: display.titleLarge?.copyWith(fontWeight: FontWeight.w700),
    titleMedium: display.titleMedium?.copyWith(fontWeight: FontWeight.w600),
  );
}

ThemeData buildLightTheme() {
  final scheme = ColorScheme.light(
    primary: AppColors.navy,
    onPrimary: Colors.white,
    secondary: AppColors.gold,
    onSecondary: AppColors.lightText,
    surface: AppColors.lightSurface,
    onSurface: AppColors.lightText,
    error: AppColors.error,
    onError: Colors.white,
    outline: AppColors.lightBorder,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.lightBg,
    textTheme: _buildTextTheme(Brightness.light),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.lightSurface.withValues(alpha: 0.92),
      foregroundColor: AppColors.lightText,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: GoogleFonts.outfit(
        color: AppColors.lightText,
        fontWeight: FontWeight.w700,
        fontSize: 20,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.gold,
      foregroundColor: AppColors.lightText,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.lightText,
        textStyle: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.lightSurface,
      indicatorColor: AppColors.gold.withValues(alpha: 0.22),
      elevation: 0,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.sourceSans3(
          color: selected ? AppColors.navy : AppColors.lightMuted,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 12,
        );
      }),
    ),
    cardTheme: CardThemeData(
      color: AppColors.lightSurface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: const BorderSide(color: AppColors.lightBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.lightSurface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.lightBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.lightBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.navy, width: 1.4),
      ),
    ),
    dividerColor: AppColors.lightBorder,
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.navy.withValues(alpha: 0.06),
      selectedColor: AppColors.gold.withValues(alpha: 0.25),
      labelStyle: GoogleFonts.sourceSans3(
        color: AppColors.lightText,
        fontWeight: FontWeight.w600,
      ),
      side: BorderSide(color: AppColors.navy.withValues(alpha: 0.12)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  );
}

ThemeData buildDarkTheme() {
  final scheme = ColorScheme.dark(
    primary: AppColors.darkPrimary,
    onPrimary: Colors.white,
    secondary: AppColors.gold,
    onSecondary: AppColors.darkBg,
    surface: AppColors.darkSurface,
    onSurface: AppColors.darkText,
    error: AppColors.error,
    onError: Colors.white,
    outline: AppColors.darkBorder,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.darkBg,
    textTheme: _buildTextTheme(Brightness.dark),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.darkSurface.withValues(alpha: 0.94),
      foregroundColor: AppColors.darkText,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: GoogleFonts.outfit(
        color: AppColors.darkText,
        fontWeight: FontWeight.w700,
        fontSize: 20,
      ),
      systemOverlayStyle: SystemUiOverlayStyle.light,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.gold,
      foregroundColor: AppColors.darkBg,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.darkBg,
        textStyle: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.darkSurface,
      indicatorColor: AppColors.gold.withValues(alpha: 0.22),
      elevation: 0,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.sourceSans3(
          color: selected ? AppColors.gold : AppColors.darkMuted,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          fontSize: 12,
        );
      }),
    ),
    cardTheme: CardThemeData(
      color: AppColors.darkElevated,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: const BorderSide(color: AppColors.darkBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.darkElevated,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.gold, width: 1.4),
      ),
    ),
    dividerColor: AppColors.darkBorder,
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.darkElevated,
      selectedColor: AppColors.gold.withValues(alpha: 0.22),
      labelStyle: GoogleFonts.sourceSans3(
        color: AppColors.darkText,
        fontWeight: FontWeight.w600,
      ),
      side: const BorderSide(color: AppColors.darkBorder),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  );
}
