// Plan models — mirror the `plan` object in /API_CONTRACT.md. Owner: Person B.

/// A downloadable / pre-filled government form referenced by a plan.
class FormDoc {
  final String name;
  final String? url;

  const FormDoc({required this.name, this.url});

  factory FormDoc.fromJson(Map<String, dynamic> json) => FormDoc(
        name: (json['name'] ?? '').toString(),
        url: json['url']?.toString(),
      );
}

/// A legal / gazette citation backing the plan.
class Citation {
  final String title;
  final String? source;

  const Citation({required this.title, this.source});

  factory Citation.fromJson(Map<String, dynamic> json) => Citation(
        title: (json['title'] ?? '').toString(),
        source: json['source']?.toString(),
      );
}

/// A drafted supporting document (e.g. an affidavit) the agent prepared.
class DraftDoc {
  final String type;
  final String content;

  const DraftDoc({required this.type, required this.content});

  factory DraftDoc.fromJson(Map<String, dynamic> json) => DraftDoc(
        type: (json['type'] ?? '').toString(),
        content: (json['content'] ?? '').toString(),
      );

  bool get isEmpty => type.trim().isEmpty && content.trim().isEmpty;
}

/// The actionable plan returned once the agent graph is complete.
class Plan {
  final String? office;
  final String? officer;
  final List<String> checklist;
  final List<FormDoc> forms;
  final List<DraftDoc> draftDocs;
  final List<Citation> citations;

  const Plan({
    this.office,
    this.officer,
    this.checklist = const [],
    this.forms = const [],
    this.draftDocs = const [],
    this.citations = const [],
  });

  factory Plan.fromJson(Map<String, dynamic> json) => Plan(
        office: json['office']?.toString(),
        officer: json['officer']?.toString(),
        checklist: _stringList(json['checklist']),
        forms: _objList(json['forms']).map(FormDoc.fromJson).toList(),
        draftDocs: _objList(json['draft_docs'])
            .map(DraftDoc.fromJson)
            .where((d) => !d.isEmpty)
            .toList(),
        citations: _objList(json['citations']).map(Citation.fromJson).toList(),
      );

  bool get isEmpty =>
      (office == null || office!.isEmpty) &&
      (officer == null || officer!.isEmpty) &&
      checklist.isEmpty &&
      forms.isEmpty &&
      draftDocs.isEmpty &&
      citations.isEmpty;

  static List<String> _stringList(dynamic v) =>
      v is List ? v.map((e) => e.toString()).toList() : const [];

  static List<Map<String, dynamic>> _objList(dynamic v) => v is List
      ? v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList()
      : const [];
}
