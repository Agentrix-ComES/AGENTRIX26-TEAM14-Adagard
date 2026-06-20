// Document upload + submit flow (steps 4-8). Owner: Person B.
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../services/api.dart';
import '../theme.dart';
import '../widgets/brand.dart';

class RequestScreen extends StatefulWidget {
  final String service;
  final String? sessionId;
  const RequestScreen({super.key, required this.service, this.sessionId});
  @override
  State<RequestScreen> createState() => _RequestScreenState();
}

class _RequestScreenState extends State<RequestScreen> {
  final _api = GovPathApi();
  String? _requestId;
  Map<String, dynamic>? _plan;
  final Set<String> _uploaded = {};   // required-doc types already uploaded
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _create();
  }

  Future<void> _create() async {
    try {
      final r = await _api.createRequest(widget.service, widget.sessionId);
      setState(() {
        _requestId = r['id'];
        _plan = r['plan'] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Could not start the application';
        _loading = false;
      });
    }
  }

  Future<void> _pickAndUpload(String type) async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
      withData: true,
    );
    if (res == null || res.files.isEmpty) return;
    final f = res.files.first;
    if (f.bytes == null) return;
    setState(() => _error = null);
    try {
      await _api.uploadDocument(_requestId!, type, f.bytes!, f.name);
      setState(() => _uploaded.add(type));
    } catch (e) {
      setState(() => _error = 'Upload failed for $type');
    }
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final r = await _api.submitRequest(_requestId!);
      setState(() => _result = r);
    } catch (e) {
      setState(() => _error = 'Submit failed');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Wordmark(size: 24)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _result != null
              ? _resultView()
              : _uploadView(),
    );
  }

  Widget _uploadView() {
    final required = (_plan?['required_documents'] as List?) ?? const [];
    final mandatory = required.where((d) => d['mandatory'] == true).map((d) => d['type']).toSet();
    final allMandatoryDone = mandatory.every(_uploaded.contains);
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Eyebrow('Required documents'),
              const SizedBox(height: 4),
              Text('Upload what you have', style: GovType.display(size: 22)),
              const SizedBox(height: 16),
              ...required.map((d) {
                final type = d['type'] as String;
                final done = _uploaded.contains(type);
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: GovColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: done ? GovColors.palm : GovColors.line),
                  ),
                  child: Row(
                    children: [
                      Icon(done ? Icons.check_circle : Icons.upload_file,
                          color: done ? GovColors.palm : GovColors.garnet, size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(d['label'] ?? type, style: const TextStyle(fontWeight: FontWeight.w600)),
                            Text(d['mandatory'] == true ? 'Required' : 'Optional',
                                style: const TextStyle(fontSize: 11, color: GovColors.muted)),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => _pickAndUpload(type),
                        child: Text(done ? 'Replace' : 'Upload'),
                      ),
                    ],
                  ),
                );
              }),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: GovColors.garnet)),
              ],
            ],
          ),
        ),
        SafeArea(
          minimum: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: (allMandatoryDone && !_submitting) ? _submit : null,
            child: Text(_submitting ? 'Submitting…' : 'Submit request'),
          ),
        ),
      ],
    );
  }

  Widget _resultView() {
    final r = _result!;
    final status = r['status'] as String? ?? '';
    final appt = r['appointment'] as Map<String, dynamic>?;
    final gap = r['gap_check'] as Map<String, dynamic>?;
    final conf = (r['verification'] as Map<String, dynamic>?)?['confidence'];
    IconData icon;
    String title;
    if (status == 'needs_docs') {
      icon = Icons.error_outline;
      title = 'More documents needed';
    } else if (status == 'needs_appointment') {
      icon = Icons.event_available;
      title = 'Appointment booked';
    } else {
      icon = Icons.verified;
      title = 'Submitted for officer review';
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: GovColors.garnet),
            const SizedBox(height: 14),
            Text(title, style: GovType.display(size: 24), textAlign: TextAlign.center),
            const SizedBox(height: 10),
            if (status == 'needs_docs' && gap != null)
              Text('Missing: ${(gap['missing'] as List).join(', ')}',
                  textAlign: TextAlign.center, style: const TextStyle(color: GovColors.muted)),
            if (appt != null)
              Text('${DateTime.parse(appt['slot_start']).toLocal()}\nwith ${appt['officer']}',
                  textAlign: TextAlign.center, style: const TextStyle(height: 1.4)),
            if (conf != null) ...[
              const SizedBox(height: 8),
              Eyebrow('AI verification confidence $conf%', color: GovColors.palm),
            ],
            const SizedBox(height: 24),
            if (status == 'needs_docs')
              FilledButton(onPressed: () => setState(() => _result = null), child: const Text('Add documents')),
            if (status != 'needs_docs')
              OutlinedButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Done')),
          ],
        ),
      ),
    );
  }
}
