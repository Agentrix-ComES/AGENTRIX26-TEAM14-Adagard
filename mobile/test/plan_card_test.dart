// Verifies the plan `draft_docs` (affidavit) path: Plan.fromJson parsing +
// PlanCard rendering the collapsible, selectable Draft Documents section.
// The live backend only emits draft_docs when an LLM key is present, so this
// test exercises the rendering deterministically without the backend.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:govpath/l10n/app_strings.dart';
import 'package:govpath/models/plan.dart';
import 'package:govpath/widgets/plan_card.dart';

void main() {
  testWidgets('PlanCard renders draft_docs and expands the affidavit', (tester) async {
    // Mirrors a real /chat plan for an archived birth record.
    final plan = Plan.fromJson(<String, dynamic>{
      'office': 'District Secretariat (Kachcheri)',
      'officer': 'Additional District Registrar',
      'checklist': ['Bring your NIC'],
      'draft_docs': [
        {
          'type': 'affidavit',
          'content': 'I do solemnly affirm — AFFIDAVIT_BODY_MARKER — sworn this day.',
        }
      ],
    });

    // Parsing sanity.
    expect(plan.draftDocs, hasLength(1));
    expect(plan.draftDocs.first.type, 'affidavit');

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: PlanCard(plan: plan, s: AppStrings.of(AppLang.en)),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    // Section header + tile title show while collapsed; body is hidden.
    expect(find.text('Draft Documents'), findsOneWidget);
    expect(find.text('Affidavit'), findsOneWidget);
    expect(find.textContaining('AFFIDAVIT_BODY_MARKER'), findsNothing);

    // Expanding the tile reveals the selectable affidavit text.
    await tester.tap(find.text('Affidavit'));
    await tester.pumpAndSettle();
    expect(find.textContaining('AFFIDAVIT_BODY_MARKER'), findsOneWidget);
  });
}
