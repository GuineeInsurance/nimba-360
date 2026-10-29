import 'dart:async';

import 'package:flutter/material.dart';

import '../controllers/app_controller.dart';

class PhoneAuthScreen extends StatefulWidget {
  const PhoneAuthScreen({super.key, required this.controller});
  final AppController controller;

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final phone = TextEditingController(text: '+224');
  final code = TextEditingController();
  String? verificationId, error;
  bool busy = false;
  int remaining = 0;
  Timer? timer;

  @override
  void dispose() {
    phone.dispose();
    code.dispose();
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Connexion par téléphone')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Recevez un code par SMS. Utilisez ensuite le même numéro pour retrouver votre compte.',
          style: TextStyle(height: 1.5),
        ),
        const SizedBox(height: 18),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          enabled: !busy,
          decoration: const InputDecoration(
            labelText: 'Numéro complet',
            helperText: 'Incluez l’indicatif, par exemple +224.',
          ),
        ),
        if (verificationId != null) ...[
          const SizedBox(height: 14),
          TextField(
            controller: code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            enabled: !busy,
            decoration: const InputDecoration(labelText: 'Code reçu par SMS'),
          ),
          FilledButton(
            onPressed: busy ? null : _confirm,
            child: const Text('Vérifier le code'),
          ),
        ],
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: busy || remaining > 0 ? null : _send,
          child: Text(
            remaining > 0
                ? 'Renvoyer dans $remaining s'
                : verificationId == null
                ? 'Recevoir le code'
                : 'Renvoyer le code',
          ),
        ),
        if (busy)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        const SizedBox(height: 12),
        const Text(
          'Des frais opérateur peuvent s’appliquer. Google traite le numéro pour prévenir les abus.',
          style: TextStyle(fontSize: 12),
        ),
      ],
    ),
  );

  Future<void> _send() async {
    final normalized = phone.text.replaceAll(RegExp(r'[\s()-]'), '');
    if (!RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(normalized)) {
      setState(() => error = 'Saisissez un numéro complet avec son indicatif.');
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      verificationId = await widget.controller.accounts.sendPhoneCode(
        normalized,
      );
      if (verificationId == null && mounted) Navigator.pop(context);
      remaining = 60;
      timer?.cancel();
      timer = Timer.periodic(const Duration(seconds: 1), (value) {
        if (remaining <= 1) value.cancel();
        if (mounted) {
          setState(() => remaining = remaining > 0 ? remaining - 1 : 0);
        }
      });
    } catch (_) {
      error = 'Impossible d’envoyer le SMS. Vérifiez le numéro et réessayez.';
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _confirm() async {
    if (code.text.length != 6 || verificationId == null) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.controller.accounts.confirmPhoneCode(
        verificationId!,
        code.text,
      );
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        setState(() {
          busy = false;
          error = 'Code incorrect ou expiré.';
        });
      }
    }
  }
}
