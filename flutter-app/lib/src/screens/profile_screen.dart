import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../controllers/app_controller.dart';
import '../theme.dart';
import '../widgets/states.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.controller});
  final AppController controller;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (_, _) => Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: controller.user == null ? _signedOut(context) : _signedIn(context),
    ),
  );

  Widget _signedOut(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      const SizedBox(height: 24),
      const Icon(Icons.account_circle, size: 86, color: NimbaColors.navy),
      const SizedBox(height: 18),
      const Text(
        'Bienvenue sur NIMBA 360',
        style: TextStyle(fontSize: 25, fontWeight: FontWeight.w900),
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 8),
      const Text(
        'Continuez à explorer sans compte, ou connectez-vous pour synchroniser vos favoris et gérer vos entreprises.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 24),
      FilledButton.icon(
        onPressed: () async {
          try {
            await controller.accounts.signInGoogle();
          } catch (error) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Connexion impossible : $error')),
              );
            }
          }
        },
        icon: const Icon(Icons.login),
        label: const Text('Continuer avec Google'),
      ),
      const SizedBox(height: 12),
      OutlinedButton(
        onPressed: () => context.push('/phone'),
        child: const Text('Continuer avec un téléphone'),
      ),
      const SizedBox(height: 24),
      _legalLinks(),
    ],
  );

  Widget _signedIn(BuildContext context) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                child: Text(
                  (controller.user!.displayName ?? 'N').characters.first
                      .toUpperCase(),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      controller.user!.displayName ?? 'Mon compte',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                    if (controller.user!.email != null)
                      Text(
                        controller.user!.email!,
                        style: const TextStyle(color: NimbaColors.muted),
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: controller.accounts.signOut,
                tooltip: 'Se déconnecter',
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 22),
      const Text(
        'Mes entreprises',
        style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
      ),
      const SizedBox(height: 8),
      StreamBuilder(
        stream: controller.directory.watchSubmissions(controller.user!.uid),
        builder: (_, snapshot) {
          if (snapshot.hasError) {
            return const Text('Impossible de charger vos fiches.');
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final docs = snapshot.data!.docs;
          const activeStatuses = {'pending', 'in_progress', 'in_review'};
          final hasActiveSubmission = docs.any(
            (doc) => activeStatuses.contains(doc.data()['status']),
          );
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (hasActiveSubmission)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF4D6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF3D47A)),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.hourglass_top_rounded,
                        color: NimbaColors.yellow,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Une fiche est en cours de vérification. Vous ne pouvez pas inscrire une autre entreprise avant la décision.',
                          style: TextStyle(
                            color: NimbaColors.navy,
                            fontWeight: FontWeight.w600,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                FilledButton.icon(
                  onPressed: () => context.push('/register'),
                  icon: const Icon(Icons.add_business),
                  label: Text(
                    docs.isEmpty
                        ? 'Enregistrer une entreprise'
                        : 'Ajouter une autre entreprise',
                  ),
                ),
              if (docs.isEmpty) ...[
                const SizedBox(height: 10),
                const EmptyState(
                  icon: Icons.storefront,
                  title: 'Aucune entreprise',
                  message:
                      'Commencez une demande pour faire vérifier votre activité.',
                ),
              ] else ...[
                const SizedBox(height: 4),
                ...docs.map((doc) {
                  final data = doc.data();
                  final status = data['status'] as String? ?? 'pending';
                  final editable = [
                    'approved',
                    'correction_required',
                    'rejected',
                  ].contains(status);
                  return Card(
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      leading: Icon(
                        status == 'approved'
                            ? Icons.verified_rounded
                            : status == 'correction_required' ||
                                  status == 'rejected'
                            ? Icons.edit_note_rounded
                            : Icons.hourglass_top_rounded,
                        color: status == 'approved'
                            ? NimbaColors.green
                            : status == 'correction_required' ||
                                  status == 'rejected'
                            ? NimbaColors.red
                            : NimbaColors.yellow,
                      ),
                      title: Text(
                        data['name'] as String? ?? 'Entreprise',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(_status(status)),
                      trailing: editable
                          ? IconButton(
                              tooltip: status == 'approved'
                                  ? 'Modifier l’entreprise'
                                  : 'Corriger la fiche',
                              onPressed: () => context.push(
                                '/register/edit',
                                extra: {'id': doc.id, 'data': data},
                              ),
                              icon: const Icon(Icons.edit_outlined),
                            )
                          : null,
                      onTap: editable
                          ? () => context.push(
                              '/register/edit',
                              extra: {'id': doc.id, 'data': data},
                            )
                          : null,
                    ),
                  );
                }),
              ],
            ],
          );
        },
      ),
      const SizedBox(height: 20),
      _legalLinks(),
    ],
  );

  String _status(String value) => switch (value) {
    'approved' => 'Approuvée',
    'rejected' => 'Refusée — vérifiez les corrections demandées',
    'correction_required' => 'Corrections demandées',
    _ => 'En cours de vérification',
  };

  Widget _legalLinks() => Column(
    children: [
      ListTile(
        leading: const Icon(Icons.help_outline),
        title: const Text('Assistance'),
        onTap: () => _open('https://guinee-directory-mvp.web.app/support'),
      ),
      ListTile(
        leading: const Icon(Icons.privacy_tip_outlined),
        title: const Text('Confidentialité'),
        onTap: () => _open('https://guinee-directory-mvp.web.app/privacy'),
      ),
      ListTile(
        leading: const Icon(Icons.delete_outline),
        title: const Text('Supprimer mon compte'),
        onTap: () =>
            _open('https://guinee-directory-mvp.web.app/delete-account'),
      ),
    ],
  );

  Future<void> _open(String value) =>
      launchUrl(Uri.parse(value), mode: LaunchMode.externalApplication);
}
