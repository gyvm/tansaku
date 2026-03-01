import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String resultText = 'Tap button to test DSP';

  Future<void> _testProcessFile() async {
    // This is just a placeholder example.
    // In real usage, you'd provide actual WAV file paths.
    setState(() {
      resultText = 'processFile requires actual WAV file paths.\n'
          'See the main Vozoo app for full usage.';
    });
  }

  @override
  Widget build(BuildContext context) {
    const textStyle = TextStyle(fontSize: 20);
    const spacerSmall = SizedBox(height: 10);
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Vozoo DSP Example'),
        ),
        body: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                const Text(
                  'This plugin provides FFI bindings to the Vozoo DSP C++ library '
                  'for audio processing with voice effects.',
                  style: textStyle,
                  textAlign: TextAlign.center,
                ),
                spacerSmall,
                Text(
                  resultText,
                  style: textStyle,
                  textAlign: TextAlign.center,
                ),
                spacerSmall,
                ElevatedButton(
                  onPressed: _testProcessFile,
                  child: const Text('Test DSP'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
