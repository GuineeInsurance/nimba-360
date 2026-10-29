import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/controllers/app_controller.dart';
import 'src/data/repositories.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  final controller = AppController(
    directory: DirectoryRepository(),
    accounts: AccountRepository(),
  );
  await controller.initialize();
  runApp(NimbaApp(controller: controller));
}
