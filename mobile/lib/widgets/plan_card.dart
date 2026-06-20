// Renders the agent `plan`: office, officer, checklist, forms, citations.
// Owner: Person B. Mirrors the `plan` object in /API_CONTRACT.md.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_strings.dart';
import '../models/plan.dart';
import '../services/api.dart' show kBaseUrlForLinks;

class PlanCard extends StatelessWidget {
  final Plan plan;
  final AppStrings s;

  const PlanCard({super.key, required this.plan, required this.s});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      color: scheme.surface,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(Icons.assignment_turned_in, color: scheme.primary, size: 20),
              const SizedBox(width: 8),
              Text(s.planTitle,
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: scheme.primary)),
            ]),
            const SizedBox(height: 12),
            if (_has(plan.office))
              _InfoRow(icon: Icons.location_city, label: s.office, value: plan.office!),
            if (_has(plan.officer))
              _InfoRow(icon: Icons.badge_outlined, label: s.officer, value: plan.officer!),
            if (plan.checklist.isNotEmpty) ...[
              const SizedBox(height: 8),
              _SectionHeader(icon: Icons.checklist, title: s.checklist),
              const SizedBox(height: 4),
              ...plan.checklist.map((c) => _ChecklistItem(text: c)),
            ],
            if (plan.forms.isNotEmpty) ...[
              const SizedBox(height: 12),
              _SectionHeader(icon: Icons.description_outlined, title: s.forms),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: plan.forms
                    .map((f) => _FormChip(form: f, openLabel: s.openForm, linkError: s.linkError))
                    .toList(),
              ),
            ],
            if (plan.citations.isNotEmpty) ...[
              const SizedBox(height: 12),
              _SectionHeader(icon: Icons.menu_book_outlined, title: s.citations),
              const SizedBox(height: 4),
              ...plan.citations.map((c) => _CitationItem(citation: c, linkError: s.linkError)),
            ],
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
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 18, color: scheme.onSurfaceVariant),
        const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: DefaultTextStyle.of(context).style,
              children: [
                TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                TextSpan(text: value),
              ],
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
    final scheme = Theme.of(context).colorScheme;
    return Row(children: [
      Icon(icon, size: 16, color: scheme.primary),
      const SizedBox(width: 6),
      Text(title,
          style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: scheme.primary,
              letterSpacing: 0.3)),
    ]);
  }
}

class _ChecklistItem extends StatelessWidget {
  final String text;
  const _ChecklistItem({required this.text});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(Icons.check_circle_outline, size: 16, color: scheme.primary),
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(height: 1.3))),
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
    final scheme = Theme.of(context).colorScheme;
    final hasUrl = form.url != null && form.url!.trim().isNotEmpty;
    return ActionChip(
      avatar: Icon(hasUrl ? Icons.download : Icons.insert_drive_file_outlined,
          size: 16, color: scheme.onSecondaryContainer),
      label: Text(hasUrl ? '${form.name} · $openLabel' : form.name),
      backgroundColor: scheme.secondaryContainer,
      labelStyle: TextStyle(color: scheme.onSecondaryContainer, fontSize: 12),
      onPressed: hasUrl
          ? () => _open(context, _resolve(form.url!), linkError)
          : null,
    );
  }
}

class _CitationItem extends StatelessWidget {
  final Citation citation;
  final String linkError;
  const _CitationItem({required this.citation, required this.linkError});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasSrc = citation.source != null && citation.source!.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: InkWell(
        onTap: hasSrc
            ? () => _open(context, _resolve(citation.source!), linkError)
            : null,
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(Icons.link, size: 15, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(citation.title, style: const TextStyle(fontSize: 13, height: 1.25)),
              if (hasSrc)
                Text(citation.source!,
                    style: TextStyle(
                        fontSize: 11,
                        color: scheme.primary,
                        decoration: TextDecoration.underline)),
            ]),
          ),
        ]),
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
  final ok = uri != null &&
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok) {
    messenger.showSnackBar(SnackBar(content: Text(linkError)));
  }
}
