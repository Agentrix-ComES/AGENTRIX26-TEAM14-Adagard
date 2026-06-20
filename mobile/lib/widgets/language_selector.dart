// Language dropdown (en / tanglish / singlish). Owner: Person B.
import 'package:flutter/material.dart';
import '../l10n/app_strings.dart';

class LanguageSelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const LanguageSelector({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          icon: Icon(Icons.language, color: onPrimary),
          dropdownColor: Theme.of(context).colorScheme.surface,
          style: TextStyle(color: onPrimary, fontWeight: FontWeight.w500),
          selectedItemBuilder: (context) => AppLang.all
              .map((l) => Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      AppLang.labels[l]!,
                      style: TextStyle(color: onPrimary),
                    ),
                  ))
              .toList(),
          items: AppLang.all
              .map((l) => DropdownMenuItem(
                    value: l,
                    child: Text(AppLang.labels[l]!),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}
