import 'package:flutter/material.dart';

abstract final class NimbaColors {
  static const navy = Color(0xFF0B2430);
  static const red = Color(0xFFCE1126);
  static const green = Color(0xFF078B66);
  static const yellow = Color(0xFFF4B400);
  static const cream = Color(0xFFF7F5F1);
  static const muted = Color(0xFF69777D);
  static const border = Color(0xFFE3E7E5);
  static const softGreen = Color(0xFFE7F6F0);
  static const softRed = Color(0xFFFCE9EC);
}

ThemeData nimbaTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: NimbaColors.red,
    primary: NimbaColors.red,
    secondary: NimbaColors.green,
    surface: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: NimbaColors.cream,
    appBarTheme: const AppBarTheme(
      backgroundColor: NimbaColors.cream,
      foregroundColor: NimbaColors.navy,
      elevation: 0,
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: NimbaColors.border),
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: NimbaColors.border),
      ),
    ),
  );
}
