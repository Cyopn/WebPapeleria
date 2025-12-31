import 'dart:io';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

/// Flujo recomendado: 1) subir archivo (multipart) => 2) tomar storedName y registrar metadata
Future<void> uploadAndRegisterExample(File file, {String? username, required ApiClient api}) async {
  try {
    final uploadResp = await api.uploadFile(file, username: username);
    // uploadResp is expected to be an array; the app uses the first element
    final entry = (uploadResp is List && uploadResp.isNotEmpty) ? uploadResp[0] : uploadResp;
    debugPrint('Upload response: $entry');

    final payload = {
      'id_user': 1,
      'filename': entry['originalName'] ?? file.path.split('/').last,
      'type': entry['service'] ?? 'file',
      'filehash': entry['storedName'] ?? ''
    };

    final reg = await api.registerFile(payload);
    debugPrint('Registro archivo: $reg');
  } catch (e) {
    debugPrint('Error upload/register: $e');
    rethrow;
  }
}
