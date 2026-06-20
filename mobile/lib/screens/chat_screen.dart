// Chat UI with language selector (en/tanglish/singlish). Owner: Person B.
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/api.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _api = GovPathApi();
  final _sessionId = const Uuid().v4();
  final _ctrl = TextEditingController();
  final List<Map<String, String>> _msgs = [];
  String _lang = 'en';

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _msgs.add({'role': 'user', 'text': text}));
    _ctrl.clear();
    final r = await _api.chat(_sessionId, text, _lang);
    setState(() => _msgs.add({'role': 'bot', 'text': r['reply']?.toString() ?? ''}));
    // TODO: render r['plan'] (office, officer, checklist, forms, citations) as a card.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GovPath'), actions: [
        DropdownButton<String>(
          value: _lang,
          items: const [
            DropdownMenuItem(value: 'en', child: Text('English')),
            DropdownMenuItem(value: 'tanglish', child: Text('Tanglish')),
            DropdownMenuItem(value: 'singlish', child: Text('Singlish')),
          ],
          onChanged: (v) => setState(() => _lang = v ?? 'en'),
        ),
      ]),
      body: Column(children: [
        Expanded(
          child: ListView.builder(
            itemCount: _msgs.length,
            itemBuilder: (_, i) => ListTile(
              title: Align(
                alignment: _msgs[i]['role'] == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                child: Text(_msgs[i]['text'] ?? ''),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Row(children: [
            Expanded(child: TextField(controller: _ctrl, decoration: const InputDecoration(hintText: 'Describe what you need...'))),
            IconButton(icon: const Icon(Icons.send), onPressed: _send),
          ]),
        ),
      ]),
    );
  }
}
