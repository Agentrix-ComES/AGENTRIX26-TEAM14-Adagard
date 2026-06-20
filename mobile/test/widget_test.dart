// Smoke test: the app boots and shows the title + composer. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:govpath/main.dart';

void main() {
  testWidgets('GovPath boots to chat screen', (tester) async {
    await tester.pumpWidget(const GovPathApp());
    await tester.pump();

    // App bar title is shown.
    expect(find.text('GovPath'), findsOneWidget);
    // Composer send button is present.
    expect(find.byIcon(Icons.send), findsWidgets);
  });
}
