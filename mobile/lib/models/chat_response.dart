// Parsed /chat response — mirrors /API_CONTRACT.md. Owner: Person B.
import 'plan.dart';

class ChatResponse {
  final String sessionId;
  final String reply;

  /// true => the agent is asking a clarifying question; keep the loop going.
  final bool needsInput;

  /// Classified service id (nullable until classification happens).
  final String? service;

  /// Present only when the agent graph has produced a complete plan.
  final Plan? plan;

  const ChatResponse({
    required this.sessionId,
    required this.reply,
    required this.needsInput,
    this.service,
    this.plan,
  });

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    final rawPlan = json['plan'];
    final plan = rawPlan is Map
        ? Plan.fromJson(rawPlan.cast<String, dynamic>())
        : null;
    return ChatResponse(
      sessionId: (json['session_id'] ?? '').toString(),
      reply: (json['reply'] ?? '').toString(),
      needsInput: json['needs_input'] == true,
      service: json['service']?.toString(),
      plan: (plan != null && !plan.isEmpty) ? plan : null,
    );
  }
}
