// GovPath app entry. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'screens/chat_screen.dart';

void main() => runApp(const GovPathApp());

class GovPathApp extends StatelessWidget {
  const GovPathApp({super.key});

  @override
  Widget build(BuildContext context) {
    const seed = Color(0xFF1F4E79);
    return MaterialApp(
      title: 'GovPath',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: seed,
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: seed,
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      // App chrome is English Material; tanglish/singlish are app-level labels
      // (see lib/l10n/app_strings.dart) and the LLM handles free text.
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en')],
      home: const ChatScreen(),
    );
  }
}
