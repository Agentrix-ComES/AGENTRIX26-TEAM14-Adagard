// Brand widgets shared across screens. Owner: Person B.
import 'package:flutter/material.dart';
import '../theme.dart';

/// The GovPath seal — a garnet official seal with a saffron ring + path glyph.
class SealMark extends StatelessWidget {
  final double size;
  const SealMark({super.key, this.size = 28});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: GovColors.garnet,
        shape: BoxShape.circle,
        border: Border.all(color: GovColors.saffron, width: 1.5),
      ),
      child: Icon(Icons.route_rounded, size: size * 0.55, color: GovColors.paper),
    );
  }
}

class Wordmark extends StatelessWidget {
  final double size;
  const Wordmark({super.key, this.size = 28});
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SealMark(size: size),
        const SizedBox(width: 8),
        Text('GovPath', style: GovType.display(size: size * 0.72, color: GovColors.garnet)),
      ],
    );
  }
}

/// A small uppercase, letter-spaced mono eyebrow label.
class Eyebrow extends StatelessWidget {
  final String text;
  final Color color;
  const Eyebrow(this.text, {super.key, this.color = GovColors.saffron});
  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: GovType.mono(color: color));
}

/// Renders a completed plan as an official "permit" card.
class PlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  const PlanCard({super.key, required this.plan});

  @override
  Widget build(BuildContext context) {
    final checklist = (plan['checklist'] as List?) ?? const [];
    final forms = (plan['forms'] as List?) ?? const [];
    final citations = (plan['citations'] as List?) ?? const [];
    final draftDocs = (plan['draft_docs'] as List?) ?? const [];

    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 8),
      decoration: BoxDecoration(
        color: GovColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GovColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 3, decoration: const BoxDecoration(color: GovColors.saffron)),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('Where to go'),
                const SizedBox(height: 4),
                Text(plan['office']?.toString() ?? '',
                    style: GovType.display(size: 18)),
                Text('Officer · ${plan['officer'] ?? ''}',
                    style: const TextStyle(fontSize: 12, color: GovColors.muted)),
                const SizedBox(height: 14),
                const Eyebrow('Documents to bring'),
                const SizedBox(height: 6),
                ...checklist.map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 7, right: 8),
                            child: SizedBox(
                                width: 5, height: 5,
                                child: DecoratedBox(decoration: BoxDecoration(
                                    color: GovColors.garnet, shape: BoxShape.circle))),
                          ),
                          Expanded(child: Text(c.toString(), style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                    )),
                if (forms.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Eyebrow('Pre-filled forms'),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    children: forms.map((f) {
                      final m = f as Map<String, dynamic>;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: GovColors.saffronSoft,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(m['name']?.toString() ?? '',
                            style: GovType.mono(size: 11, color: GovColors.garnet, weight: FontWeight.w600)),
                      );
                    }).toList(),
                  ),
                ],
                if (citations.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Eyebrow('Cited authority'),
                  const SizedBox(height: 4),
                  ...citations.map((c) {
                    final m = c as Map<String, dynamic>;
                    return Text('• ${m['title'] ?? ''}',
                        style: const TextStyle(fontSize: 12, color: GovColors.muted));
                  }),
                ],
                if (draftDocs.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Eyebrow('Drafted documents'),
                  const SizedBox(height: 4),
                  ...draftDocs.map((d) => _DraftDoc(doc: d as Map<String, dynamic>)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A drafted supporting document (e.g. an affidavit). Collapsed by default;
/// long content is capped and scrolls. Text is selectable for copying.
class _DraftDoc extends StatelessWidget {
  final Map<String, dynamic> doc;
  const _DraftDoc({required this.doc});

  @override
  Widget build(BuildContext context) {
    final rawType = (doc['type']?.toString() ?? '').replaceAll('_', ' ').trim();
    final title = rawType.isEmpty
        ? 'Document'
        : '${rawType[0].toUpperCase()}${rawType.substring(1)}';
    final content = doc['content']?.toString() ?? '';

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      // Material carries the bg + border so the ListTile inside ExpansionTile
      // paints its ink/background correctly (avoids the DecoratedBox warning).
      child: Material(
        color: GovColors.paper,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: GovColors.line),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Theme(
          // hide ExpansionTile's default divider lines for a clean card look
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            dense: true,
            tilePadding: const EdgeInsets.symmetric(horizontal: 10),
            childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
            title: Text(
              title,
              style: GovType.mono(size: 12, color: GovColors.garnet, weight: FontWeight.w600),
            ),
            children: [
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 240),
                child: SingleChildScrollView(
                  child: SelectableText(
                    content,
                    style: const TextStyle(fontSize: 12, height: 1.4, color: GovColors.ink),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
