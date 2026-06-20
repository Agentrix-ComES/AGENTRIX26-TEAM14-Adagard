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
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            isDense: true,
            icon: const Icon(Icons.language, color: Colors.white, size: 16),
            dropdownColor: const Color(0xFF1F4E79),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13),
            selectedItemBuilder: (context) => AppLang.all
                .map((l) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      alignment: Alignment.center,
                      child: Text(
                        AppLang.labels[l]!,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ))
                .toList(),
            items: AppLang.all
                .map((l) => DropdownMenuItem(
                      value: l,
                      child: Text(AppLang.labels[l]!,
                          style: const TextStyle(color: Colors.white)),
                    ))
                .toList(),
            onChanged: (v) {
              if (v != null) onChanged(v);
            },
          ),
        ),
      ),
    );
  }
}
