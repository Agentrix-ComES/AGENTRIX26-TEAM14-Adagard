// Chat UI: live /chat, needs_input clarifying loop, plan rendering,
// multilingual labels, loading + error states. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

import '../l10n/app_strings.dart';
import '../models/chat_message.dart';
import '../services/api.dart';
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
    final scheme = Theme.of(context).colorScheme;
    // +1 row for the typing indicator while a request is in flight.
    final itemCount = _msgs.length + (_sending ? 1 : 0);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        title: Text(s.appTitle),
        actions: [
          LanguageSelector(value: _lang, onChanged: (v) => setState(() => _lang = v)),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: _msgs.isEmpty && !_sending
              ? _EmptyState(s: s)
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.symmetric(vertical: 8),
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

class _EmptyState extends StatelessWidget {
  final AppStrings s;
  const _EmptyState({required this.s});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.account_balance, size: 64, color: scheme.primary.withValues(alpha: 0.6)),
          const SizedBox(height: 16),
          Text(s.welcome,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: scheme.onSurfaceVariant, height: 1.4)),
        ]),
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
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
        decoration: BoxDecoration(
          color: scheme.surface,
          border: Border(top: BorderSide(color: scheme.outlineVariant)),
        ),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              decoration: InputDecoration(
                hintText: hint,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: scheme.outlineVariant),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: scheme.outlineVariant),
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
          IconButton.filled(
            icon: const Icon(Icons.send),
            onPressed: enabled ? () => onSend() : null,
            tooltip: 'Send',
          ),
        ]),
      ),
    );
  }
}
