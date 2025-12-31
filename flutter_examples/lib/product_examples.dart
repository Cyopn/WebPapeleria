import 'dart:io';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

void main() async {
  final api = ApiClient(baseUrl: Platform.environment['API_URL'] ?? 'https://noninitial-chirurgical-judah.ngrok-free.dev/api');
  try {
    final data = await api.getProducts();
    debugPrint('Productos recibidos:');
    debugPrint(data.toString());
  } catch (e) {
    debugPrint('Error obteniendo productos: $e');
  }
}
