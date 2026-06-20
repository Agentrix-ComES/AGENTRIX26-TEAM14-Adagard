// A single chat bubble + optional plan card / service chip. Owner: Person B.
import 'package:flutter/material.dart';
import '../l10n/app_strings.dart';
import '../models/chat_message.dart';
import 'plan_card.dart';

class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final AppStrings s;

  const MessageBubble({super.key, required this.message, required this.s});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isUser = message.sender == Sender.user;

    final Color bg;
    final Color fg;
    if (isUser) {
      bg = scheme.primary;
      fg = scheme.onPrimary;
    } else if (message.isError) {
      bg = scheme.errorContainer;
      fg = scheme.onErrorContainer;
    } else {
      bg = scheme.surfaceContainerHighest;
      fg = scheme.onSurface;
    }

    final bubble = Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(isUser ? 16 : 4),
          topRight: Radius.circular(isUser ? 4 : 16),
          bottomLeft: const Radius.circular(16),
          bottomRight: const Radius.circular(16),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (message.isError)
            Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 16, color: fg),
              const SizedBox(width: 6),
              Flexible(child: Text(message.text, style: TextStyle(color: fg))),
            ])
          else
            Text(message.text, style: TextStyle(color: fg, height: 1.3)),
          if (!isUser && message.service != null && message.service!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: _ServiceChip(service: message.service!, label: s.serviceLabel),
            ),
        ],
      ),
    );

    return Column(
      crossAxisAlignment:
          isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(isUser ? 64 : 12, 4, isUser ? 12 : 64, 4),
          child: Align(
            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.82,
              ),
              child: bubble,
            ),
          ),
        ),
        if (message.plan != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: PlanCard(plan: message.plan!, s: s),
          ),
      ],
    );
  }
}

class _ServiceChip extends StatelessWidget {
  final String service;
  final String label;
  const _ServiceChip({required this.service, required this.label});

  String get _pretty =>
      service.replaceAll('_', ' ').replaceAll('-', ' ').trim();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: scheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.verified_outlined, size: 13, color: scheme.onPrimaryContainer),
        const SizedBox(width: 4),
        Text('$label: $_pretty',
            style: TextStyle(
                color: scheme.onPrimaryContainer,
                fontSize: 11,
                fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
