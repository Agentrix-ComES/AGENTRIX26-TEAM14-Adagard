// A single chat bubble + optional plan card / service chip. Owner: Person B.
import 'package:flutter/material.dart';
import '../l10n/app_strings.dart';
import '../models/chat_message.dart';
import 'gov_lion.dart';
import 'plan_card.dart';

class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final AppStrings s;

  const MessageBubble({super.key, required this.message, required this.s});

  @override
  Widget build(BuildContext context) {
    final isUser = message.sender == Sender.user;

    return Column(
      crossAxisAlignment:
          isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        // Bot avatar label
        if (!isUser)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 0, 4),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Container(
                width: 26,
                height: 26,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF173A5A), Color(0xFF1F4E79)],
                  ),
                  borderRadius: BorderRadius.circular(7),
                ),
                child: const GovPathLion(size: 20, color: Colors.white),
              ),
              const SizedBox(width: 6),
              const Text('GovPath',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B))),
            ]),
          ),

        // Bubble
        Padding(
          padding: EdgeInsets.fromLTRB(isUser ? 72 : 16, 2, isUser ? 16 : 72, 4),
          child: Align(
            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.82),
              child: isUser
                  ? _UserBubble(text: message.text)
                  : message.isError
                      ? _ErrorBubble(text: message.text)
                      : _BotBubble(message: message, s: s),
            ),
          ),
        ),

        // Plan card below bubble
        if (message.plan != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: PlanCard(plan: message.plan!, s: s),
          ),
      ],
    );
  }
}

class _UserBubble extends StatelessWidget {
  final String text;
  const _UserBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1F4E79), Color(0xFF2C6AA0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(18),
          topRight: Radius.circular(4),
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(18),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1F4E79).withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Text(text,
          style: const TextStyle(color: Colors.white, height: 1.4, fontSize: 15)),
    );
  }
}

class _BotBubble extends StatelessWidget {
  final ChatMessage message;
  final AppStrings s;
  const _BotBubble({required this.message, required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(4),
          topRight: Radius.circular(18),
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(18),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      // ClipRRect so the inner Row is clipped to the border radius.
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(4),
          topRight: Radius.circular(18),
          bottomLeft: Radius.circular(18),
          bottomRight: Radius.circular(18),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Gold left accent strip
              Container(
                width: 4,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFC8A04F), Color(0xFFE8C06A)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Flexible(
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(message.text,
                          style: const TextStyle(
                              color: Color(0xFF1E293B), height: 1.45, fontSize: 15)),
                      if (message.service != null && message.service!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 9),
                          child: _ServiceChip(
                              service: message.service!, label: s.serviceLabel),
                        ),
                    ],
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

class _ErrorBubble extends StatelessWidget {
  final String text;
  const _ErrorBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
        const SizedBox(width: 6),
        Flexible(
            child: Text(text,
                style: const TextStyle(color: Color(0xFFDC2626), fontSize: 14))),
      ]),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF173A5A), Color(0xFF1F4E79)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.verified_outlined, size: 12, color: Colors.white),
        const SizedBox(width: 5),
        Text('$label: $_pretty',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
