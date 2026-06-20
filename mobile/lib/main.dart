// GovPath app entry. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
      theme: _theme(Brightness.light, seed),
      darkTheme: _theme(Brightness.dark, seed),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en')],
      home: const ChatScreen(),
    );
  }

  ThemeData _theme(Brightness brightness, Color seed) {
    final base = ThemeData(
      colorSchemeSeed: seed,
      useMaterial3: true,
      brightness: brightness,
    );
    return base.copyWith(
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
