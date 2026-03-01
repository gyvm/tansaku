import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vozoo/presentation/home_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: VozooApp(),
    ),
  );
}

class VozooApp extends StatelessWidget {
  const VozooApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vozoo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
