// Chat UI: live /chat, needs_input clarifying loop, plan rendering,
// multilingual labels, loading + error states. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

import '../l10n/app_strings.dart';
import '../models/chat_message.dart';
import '../services/api.dart';
import '../widgets/gov_lion.dart';
import '../widgets/language_selector.dart';
import '../widgets/message_bubble.dart';
import '../widgets/typing_indicator.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _api = GovPathApi();
  final _sessionId = const Uuid().v4();
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMessage> _msgs = [];

  String _lang = AppLang.en;
  bool _sending = false;

  /// Last user message, kept so the error bubble's Retry can resend it.
  String? _lastFailed;

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _send([String? override]) async {
    final text = (override ?? _ctrl.text).trim();
    if (text.isEmpty || _sending) return;

    setState(() {
      _msgs.add(ChatMessage.user(text));
      _sending = true;
      _lastFailed = null;
    });
    _ctrl.clear();
    _scrollToBottom();

    try {
      final r = await _api.chat(_sessionId, text, _lang);
      setState(() {
        _msgs.add(ChatMessage(
          sender: Sender.bot,
          text: r.reply,
          service: r.service,
          plan: r.plan,
          // needs_input => clarifying-question turn in the loop.
          isQuestion: r.needsInput,
        ));
      });
    } on ApiException catch (e) {
      setState(() {
        _lastFailed = text;
        _msgs.add(ChatMessage.error(e.message));
      });
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = AppStrings.of(_lang);
    // +1 row for the typing indicator while a request is in flight.
    final itemCount = _msgs.length + (_sending ? 1 : 0);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      appBar: _GovAppBar(
        s: s,
        lang: _lang,
        onLangChanged: (v) => setState(() => _lang = v),
      ),
      body: Column(children: [
        Expanded(
          child: _msgs.isEmpty && !_sending
              ? _EmptyState(s: s, onSuggest: _send)
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  itemCount: itemCount,
                  itemBuilder: (_, i) {
                    if (i >= _msgs.length) {
                      return TypingIndicator(label: s.thinking);
                    }
                    final m = _msgs[i];
                    final isLast = i == _msgs.length - 1;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        MessageBubble(message: m, s: s),
                        if (m.isError && isLast && _lastFailed != null)
                          _RetryButton(label: s.retry, onTap: () => _send(_lastFailed)),
                      ],
                    );
                  },
                ),
        ),
        _Composer(
          controller: _ctrl,
          hint: s.inputHint,
          enabled: !_sending,
          onSend: _send,
        ),
      ]),
    );
  }
}

/// Gradient AppBar with GovPath branding.
class _GovAppBar extends StatelessWidget implements PreferredSizeWidget {
  final AppStrings s;
  final String lang;
  final ValueChanged<String> onLangChanged;

  const _GovAppBar({
    required this.s,
    required this.lang,
    required this.onLangChanged,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      flexibleSpace: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF173A5A), Color(0xFF1F4E79), Color(0xFF2C6AA0)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
      ),
      title: Row(children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: const GovPathLion(size: 22, color: Colors.white),
        ),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s.appTitle,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17, height: 1.1)),
          const Text('Sri Lanka Gov Services',
              style: TextStyle(
                  color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w400, height: 1.1)),
        ]),
      ]),
      actions: [
        LanguageSelector(value: lang, onChanged: onLangChanged),
      ],
    );
  }
}

/// Welcome screen with GovPath branding + suggestion chips.
class _EmptyState extends StatelessWidget {
  final AppStrings s;
  final void Function(String) onSuggest;
  const _EmptyState({required this.s, required this.onSuggest});

  static const _suggestions = [
    ('I need a new NIC', Icons.credit_card_outlined),
    ('Apply for passport', Icons.book_outlined),
    ('GN certificate', Icons.workspace_premium_outlined),
    ('Birth certificate', Icons.child_care_outlined),
    ('Driving license', Icons.drive_eta_outlined),
    ('Death certificate', Icons.assignment_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // Logo
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1F4E79), Color(0xFF2C6AA0)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1F4E79).withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const GovPathLion(size: 52),
        ),
        const SizedBox(height: 24),
        const Text('GovPath',
            style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF173A5A),
                letterSpacing: -0.5)),
        const SizedBox(height: 6),
        // Gold accent line
        Container(width: 40, height: 3, decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFFC8A04F), Color(0xFFE8C06A)]),
          borderRadius: BorderRadius.circular(2),
        )),
        const SizedBox(height: 16),
        Text(s.welcome,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 14, color: Color(0xFF64748B), height: 1.6)),
        const SizedBox(height: 32),
        // Section label
        const Align(
          alignment: Alignment.centerLeft,
          child: Text('Quick start',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.8)),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _suggestions
              .map((t) => _SuggestionChip(
                  label: t.$1, icon: t.$2, onTap: () => onSuggest(t.$1)))
              .toList(),
        ),
      ]),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _SuggestionChip({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFF1F4E79).withValues(alpha: 0.2)),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2)),
            ],
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 15, color: const Color(0xFF1F4E79)),
            const SizedBox(width: 7),
            Text(label,
                style: const TextStyle(
                    fontSize: 13, color: Color(0xFF1F4E79), fontWeight: FontWeight.w500)),
          ]),
        ),
      ),
    );
  }
}

class _RetryButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _RetryButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 0, 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(
          icon: const Icon(Icons.refresh, size: 18),
          label: Text(label),
          onPressed: onTap,
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool enabled;
  final void Function([String?]) onSend;

  const _Composer({
    required this.controller,
    required this.hint,
    required this.enabled,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: TextField(
                controller: controller,
                enabled: enabled,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                style: const TextStyle(fontSize: 15, color: Color(0xFF1E293B)),
                decoration: InputDecoration(
                  hintText: hint,
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 15),
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: enabled ? () => onSend() : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: enabled
                    ? const LinearGradient(
                        colors: [Color(0xFF1F4E79), Color(0xFF2C6AA0)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: enabled ? null : const Color(0xFFCBD5E1),
                shape: BoxShape.circle,
                boxShadow: enabled
                    ? [
                        BoxShadow(
                          color: const Color(0xFF1F4E79).withValues(alpha: 0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ]),
      ),
    );
  }
}
