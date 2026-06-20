// Backend client — matches /API_CONTRACT.md. Owner: Person B.
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/chat_response.dart';

/// Default base URL — the deployed backend on Render.
/// Override at build time for local dev, e.g.:
///   --dart-define=API_BASE_URL=http://10.0.2.2:8000     (Android emulator -> host)
///   --dart-define=API_BASE_URL=http://localhost:8000    (web/desktop/iOS-sim)
const String _kDefaultBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://govpath-backend.onrender.com',
);

/// Public base URL used to resolve relative form/citation paths
/// (e.g. "/files/b63.pdf") into absolute, launchable links.
const String kBaseUrlForLinks = _kDefaultBaseUrl;

/// Thrown for any network / server / parse failure so the UI can show a clean
/// message instead of a raw exception.
class ApiException implements Exception {
  final String message;
  const ApiException(this.message);
  @override
  String toString() => message;
}

class GovPathApi {
  // 60s default: Render's free tier can cold-start (~30-60s) on the first request.
  GovPathApi({String? baseUrl, http.Client? client, this.timeout = const Duration(seconds: 60)})
      : baseUrl = baseUrl ?? _kDefaultBaseUrl,
        _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;
  final Duration timeout;

  /// POST /chat — drives the agent graph. Same [sessionId] across the
  /// conversation so the backend keeps the clarifying-question loop stateful.
  Future<ChatResponse> chat(String sessionId, String message, String lang) async {
    final uri = Uri.parse('$baseUrl/chat');
    try {
      final res = await _client
          .post(
            uri,
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode({
              'session_id': sessionId,
              'message': message,
              'lang': lang,
            }),
          )
          .timeout(timeout);

      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw ApiException('Server error (${res.statusCode}). Please try again.');
      }

      final decoded = jsonDecode(utf8.decode(res.bodyBytes));
      if (decoded is! Map<String, dynamic>) {
        throw const ApiException('Unexpected response from server.');
      }
      return ChatResponse.fromJson(decoded);
    } on TimeoutException {
      throw const ApiException('Request timed out. Is the backend running?');
    } on FormatException {
      throw const ApiException('Could not read the server response.');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(
          'Cannot reach the server. Check your connection and the API URL.');
    }
  }

  /// GET /health — quick connectivity check.
  Future<bool> health() async {
    try {
      final res =
          await _client.get(Uri.parse('$baseUrl/health')).timeout(timeout);
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  void dispose() => _client.close();
}
