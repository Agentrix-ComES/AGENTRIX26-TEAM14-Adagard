// GovPath app entry. Owner: Person B.
import 'package:flutter/material.dart';
import 'screens/chat_screen.dart';

void main() => runApp(const GovPathApp());

class GovPathApp extends StatelessWidget {
  const GovPathApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'GovPath',
        theme: ThemeData(colorSchemeSeed: const Color(0xFF1F4E79), useMaterial3: true),
        home: const ChatScreen(),
      );
}
