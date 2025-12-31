// Cliente HTTP minimal para Flutter (usa paquete `http`)
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  String? token;

  ApiClient({required this.baseUrl, this.token});

  Map<String, String> _jsonHeaders() {
    final headers = { 'Content-Type': 'application/json' };
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Future<dynamic> getProducts() async {
    final uri = Uri.parse('$baseUrl/products/');
    final res = await http.get(uri, headers: { 'Accept': '*/*', ..._jsonHeaders() });
    if (res.statusCode >= 200 && res.statusCode < 300) return json.decode(res.body);
    throw HttpException('GET /products failed: ${res.statusCode} ${res.reasonPhrase}');
  }

  Future<dynamic> calculatePrice(Map<String, dynamic> payload) async {
    final uri = Uri.parse('$baseUrl/printing-price');
    final res = await http.post(uri, headers: _jsonHeaders(), body: json.encode(payload));
    if (res.statusCode >= 200 && res.statusCode < 300) return json.decode(res.body);
    final body = res.body.isNotEmpty ? res.body : null;
    throw HttpException('POST /printing-price failed: ${res.statusCode} ${body ?? ''}');
  }

  Future<dynamic> registerFile(Map<String, dynamic> payload) async {
    final uri = Uri.parse('$baseUrl/files');
    final res = await http.post(uri, headers: _jsonHeaders(), body: json.encode(payload));
    if (res.statusCode >= 200 && res.statusCode < 300) return json.decode(res.body);
    throw HttpException('POST /files failed: ${res.statusCode}');
  }

  Future<dynamic> uploadFile(File file, {String? username}) async {
    final uri = Uri.parse('$baseUrl/file-manager?service=file');
    final req = http.MultipartRequest('POST', uri);
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    if (username != null) req.fields['username'] = username;
    final stream = http.ByteStream(file.openRead());
    final length = await file.length();
    final multipart = http.MultipartFile('files', stream, length, filename: file.path.split('/').last);
    req.files.add(multipart);
    final streamed = await req.send();
    final resp = await http.Response.fromStream(streamed);
    if (resp.statusCode >= 200 && resp.statusCode < 300) return json.decode(resp.body);
    throw HttpException('Multipart upload failed: ${resp.statusCode} ${resp.body}');
  }
}
