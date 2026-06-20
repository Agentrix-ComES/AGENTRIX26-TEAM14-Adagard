// Verifies the plan `draft_docs` (affidavit) path: PlanCard renders the
// collapsible, selectable Drafted Documents section from a raw /chat plan map.
// The live backend only emits draft_docs when an LLM key is present, so this
// test exercises the rendering deterministically without the backend.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:govpath/widgets/brand.dart';

void main() {
  testWidgets('PlanCard renders draft_docs and expands the affidavit', (tester) async {
    // Mirrors a real /chat plan for an archived birth record.
    final plan = <String, dynamic>{
      'office': 'District Secretariat (Kachcheri)',
      'officer': 'Additional District Registrar',
      'checklist': ['Bring your NIC'],
      'draft_docs': [
        {
          'type': 'affidavit',
          'content': 'I do solemnly affirm — AFFIDAVIT_BODY_MARKER — sworn this day.',
        }
      ],
    };

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: PlanCard(plan: plan),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    // Section header + tile title show while collapsed; body is hidden.
    expect(find.text('Drafted documents'.toUpperCase()), findsOneWidget);
    expect(find.text('Affidavit'), findsOneWidget);
    expect(find.textContaining('AFFIDAVIT_BODY_MARKER'), findsNothing);

    // Expanding the tile reveals the selectable affidavit text.
    await tester.tap(find.text('Affidavit'));
    await tester.pumpAndSettle();
    expect(find.textContaining('AFFIDAVIT_BODY_MARKER'), findsOneWidget);
  });
}
