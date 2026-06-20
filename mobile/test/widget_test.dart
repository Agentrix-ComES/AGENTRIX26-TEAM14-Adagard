// Smoke test: the citizen entry screen renders the wordmark + sign-in form.
// The app boots through RootGate (auth) into AuthScreen when no token is stored;
// we pump AuthScreen directly since secure-storage isn't available under test.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:govpath/screens/auth_screen.dart';

void main() {
  testWidgets('GovPath boots to the citizen sign-in screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: AuthScreen()));
    await tester.pumpAndSettle();

    // Wordmark is shown.
    expect(find.text('GovPath'), findsOneWidget);
    // Sign-in affordance is present.
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign in'), findsWidgets);
  });
}
