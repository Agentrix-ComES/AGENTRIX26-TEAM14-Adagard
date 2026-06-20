// Renders the agent `plan`: office, officer, checklist, forms, citations.
// Owner: Person B. Mirrors the `plan` object in /API_CONTRACT.md.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_strings.dart';
import '../models/plan.dart';
import '../services/api.dart' show kBaseUrlForLinks;
import 'gov_lion.dart';

class PlanCard extends StatelessWidget {
  final Plan plan;
  final AppStrings s;

  const PlanCard({super.key, required this.plan, required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1F4E79).withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gradient header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF173A5A), Color(0xFF1F4E79)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const GovPathLion(size: 22, color: Colors.white),
                ),
                const SizedBox(width: 10),
                Text(s.planTitle,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        letterSpacing: 0.2)),
              ]),
            ),

            // Body
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_has(plan.office))
                    _InfoRow(icon: Icons.location_city_outlined, label: s.office, value: plan.office!),
                  if (_has(plan.officer))
                    _InfoRow(icon: Icons.badge_outlined, label: s.officer, value: plan.officer!),
                  if (plan.checklist.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _SectionHeader(icon: Icons.checklist_rounded, title: s.checklist),
                    const SizedBox(height: 8),
                    ...plan.checklist.asMap().entries.map((e) =>
                        _ChecklistItem(text: e.value, index: e.key + 1)),
                  ],
                  if (plan.forms.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionHeader(icon: Icons.description_outlined, title: s.forms),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: plan.forms
                          .map((f) => _FormChip(
                              form: f,
                              openLabel: s.openForm,
                              linkError: s.linkError))
                          .toList(),
                    ),
                  ],
                  if (plan.draftDocs.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionHeader(icon: Icons.article_outlined, title: s.draftDocs),
                    const SizedBox(height: 8),
                    ...plan.draftDocs.map((d) => _DraftDocTile(doc: d)),
                  ],
                  if (plan.citations.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionHeader(icon: Icons.menu_book_outlined, title: s.citations),
                    const SizedBox(height: 8),
                    ...plan.citations.map((c) =>
                        _CitationItem(citation: c, linkError: s.linkError)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static bool _has(String? v) => v != null && v.trim().isNotEmpty;
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF4FB),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: const Color(0xFF1F4E79)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: RichText(
              text: TextSpan(
                style: DefaultTextStyle.of(context).style,
                children: [
                  TextSpan(
                      text: '$label: ',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                  TextSpan(
                      text: value,
                      style: const TextStyle(color: Color(0xFF4B5563))),
                ],
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 15, color: const Color(0xFF1F4E79)),
      const SizedBox(width: 6),
      Text(title,
          style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
              color: Color(0xFF1F4E79),
              letterSpacing: 0.6)),
    ]);
  }
}

class _ChecklistItem extends StatelessWidget {
  final String text;
  final int index;
  const _ChecklistItem({required this.text, required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: const Color(0xFF059669).withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check, size: 12, color: Color(0xFF059669)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Text(text,
                style: const TextStyle(height: 1.4, fontSize: 13, color: Color(0xFF374151))),
          ),
        ),
      ]),
    );
  }
}

class _FormChip extends StatelessWidget {
  final FormDoc form;
  final String openLabel;
  final String linkError;
  const _FormChip(
      {required this.form, required this.openLabel, required this.linkError});

  @override
  Widget build(BuildContext context) {
    final hasUrl = form.url != null && form.url!.trim().isNotEmpty;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: hasUrl ? () => _open(context, _resolve(form.url!), linkError) : null,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF4FB),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFF1F4E79).withValues(alpha: 0.2)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(hasUrl ? Icons.download_outlined : Icons.insert_drive_file_outlined,
                size: 15, color: const Color(0xFF1F4E79)),
            const SizedBox(width: 6),
            Text(hasUrl ? '${form.name} · $openLabel' : form.name,
                style: const TextStyle(
                    color: Color(0xFF1F4E79), fontSize: 12, fontWeight: FontWeight.w500)),
          ]),
        ),
      ),
    );
  }
}

class _CitationItem extends StatelessWidget {
  final Citation citation;
  final String linkError;
  const _CitationItem({required this.citation, required this.linkError});

  @override
  Widget build(BuildContext context) {
    final hasSrc = citation.source != null && citation.source!.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: InkWell(
        onTap:
            hasSrc ? () => _open(context, _resolve(citation.source!), linkError) : null,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Padding(
              padding: EdgeInsets.only(top: 2),
              child: Icon(Icons.link, size: 14, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(citation.title,
                    style: const TextStyle(
                        fontSize: 12, height: 1.3, color: Color(0xFF374151))),
                if (hasSrc)
                  Text(citation.source!,
                      style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF2C6AA0),
                          decoration: TextDecoration.underline)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// A drafted document (e.g. an affidavit). Content can be long, so it is
/// collapsed by default; when expanded it scrolls within a capped height so a
/// long affidavit doesn't balloon the chat. Text is selectable for copying.
class _DraftDocTile extends StatelessWidget {
  final DraftDoc doc;
  const _DraftDocTile({required this.doc});

  String get _prettyType {
    final t = doc.type.replaceAll('_', ' ').trim();
    if (t.isEmpty) return 'Document';
    return '${t[0].toUpperCase()}${t.substring(1)}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          dense: true,
          tilePadding: const EdgeInsets.symmetric(horizontal: 12),
          childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          leading: const Icon(Icons.description_outlined,
              size: 18, color: Color(0xFF1F4E79)),
          title: Text(_prettyType,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F4E79))),
          children: [
            // Cap long affidavits and let them scroll in place.
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: SingleChildScrollView(
                child: SelectableText(
                  doc.content,
                  style: const TextStyle(fontSize: 12, height: 1.45, color: Color(0xFF374151)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Resolves relative API paths (e.g. "/files/b63.pdf") and bare hosts
/// (e.g. "documents.gov.lk/...") into absolute, launchable URLs.
String _resolve(String raw) {
  final v = raw.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  if (v.startsWith('/')) return '$kBaseUrlForLinks$v';
  return 'https://$v';
}

Future<void> _open(BuildContext context, String url, String linkError) async {
  final messenger = ScaffoldMessenger.of(context);
  final uri = Uri.tryParse(url);
  final ok =
      uri != null && await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok) {
    messenger.showSnackBar(SnackBar(content: Text(linkError)));
  }
}
