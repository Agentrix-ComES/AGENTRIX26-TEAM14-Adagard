// A single chat bubble in the conversation. Owner: Person B.
import 'plan.dart';

enum Sender { user, bot }

class ChatMessage {
  final Sender sender;
  final String text;

  /// Attached when the bot turn produced a complete plan card.
  final Plan? plan;

  /// Classified service id, shown as a small chip on the bot bubble.
  final String? service;

  /// true => this bot turn is a clarifying question (needs_input).
  final bool isQuestion;

  /// true => render an error-styled bubble.
  final bool isError;

  const ChatMessage({
    required this.sender,
    required this.text,
    this.plan,
    this.service,
    this.isQuestion = false,
    this.isError = false,
  });

  factory ChatMessage.user(String text) =>
      ChatMessage(sender: Sender.user, text: text);

  factory ChatMessage.error(String text) =>
      ChatMessage(sender: Sender.bot, text: text, isError: true);
}
