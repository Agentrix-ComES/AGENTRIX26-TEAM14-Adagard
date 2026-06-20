// Backend client — matches /API_CONTRACT.md. Owner: Person B.
import 'dart:convert';
import 'package:http/http.dart' as http;

const String kBaseUrl = 'http://10.0.2.2:8000'; // Android emulator -> host

class GovPathApi {
  Future<Map<String, dynamic>> chat(String sessionId, String message, String lang) async {
    final res = await http.post(
      Uri.parse('$kBaseUrl/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'session_id': sessionId, 'message': message, 'lang': lang}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
