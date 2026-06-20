// Chat UI with language selector (en/tanglish/singlish). Owner: Person B.
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/api.dart';
import '../services/auth.dart';
import '../theme.dart';
import '../widgets/brand.dart';
import 'auth_screen.dart';
import 'request_screen.dart';

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
  final List<Map<String, dynamic>> _msgs = [];
  String _lang = 'en';
  bool _sending = false;

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _msgs.add({'role': 'user', 'text': text});
      _sending = true;
    });
    _ctrl.clear();
    _scrollToEnd();
    try {
      final r = await _api.chat(_sessionId, text, _lang);
      setState(() {
        _msgs.add({
          'role': 'bot',
          'text': r['reply']?.toString() ?? '',
          'plan': r['plan'],
          'service': r['service'],
        });
      });
    } on UnauthorizedException {
      _goToLogin();
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToEnd();
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
    );
  }

  Future<void> _logout() async {
    await AuthService().logout();
    _goToLogin();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: const Wordmark(size: 26),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(2),
          child: ColoredBox(color: GovColors.saffron, child: SizedBox(height: 2, width: double.infinity)),
        ),
        actions: [
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _lang,
              borderRadius: BorderRadius.circular(12),
              style: GovType.mono(size: 12, color: GovColors.ink),
              items: const [
                DropdownMenuItem(value: 'en', child: Text('EN')),
                DropdownMenuItem(value: 'tanglish', child: Text('TA')),
                DropdownMenuItem(value: 'singlish', child: Text('SI')),
              ],
              onChanged: (v) => setState(() => _lang = v ?? 'en'),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Sign out',
            onPressed: _logout,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _msgs.isEmpty
                ? _emptyState()
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount: _msgs.length,
                    itemBuilder: (_, i) => _bubble(_msgs[i]),
                  ),
          ),
          _composer(),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SealMark(size: 48),
            const SizedBox(height: 16),
            Text('Where are you headed?', style: GovType.display(size: 22)),
            const SizedBox(height: 6),
            const Text(
              'Tell me which service you need — a birth certificate, NIC, '
              'passport, and more. I’ll find the right office and documents.',
              textAlign: TextAlign.center,
              style: TextStyle(color: GovColors.muted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bubble(Map<String, dynamic> msg) {
    final isUser = msg['role'] == 'user';
    final plan = msg['plan'] as Map<String, dynamic>?;

    final textBubble = Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
      decoration: BoxDecoration(
        color: isUser ? GovColors.garnet : GovColors.card,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isUser ? 16 : 4),
          bottomRight: Radius.circular(isUser ? 4 : 16),
        ),
        border: isUser ? null : Border.all(color: GovColors.line),
      ),
      child: Text(
        msg['text']?.toString() ?? '',
        style: TextStyle(
          color: isUser ? GovColors.paper : GovColors.ink,
          height: 1.35,
        ),
      ),
    );

    return Column(
      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser) ...[
              const Padding(padding: EdgeInsets.only(top: 2, right: 8), child: SealMark(size: 24)),
            ],
            Flexible(child: textBubble),
          ],
        ),
        if (plan != null)
          Padding(
            padding: const EdgeInsets.only(left: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                PlanCard(plan: plan),
                if (msg['service'] != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: FilledButton.icon(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => RequestScreen(
                          service: msg['service'] as String,
                          sessionId: _sessionId,
                        ),
                      )),
                      icon: const Icon(Icons.upload_file, size: 18),
                      label: const Text('Upload documents & apply'),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _composer() {
    return Container(
      decoration: const BoxDecoration(
        color: GovColors.card,
        border: Border(top: BorderSide(color: GovColors.line)),
      ),
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: 'Describe what you need…',
                  fillColor: GovColors.paper,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: GovColors.line),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: GovColors.garnet, width: 1.6),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: GovColors.garnet,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: _sending ? null : _send,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Icon(
                    _sending ? Icons.more_horiz : Icons.arrow_upward_rounded,
                    color: GovColors.paper,
                    size: 22,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
