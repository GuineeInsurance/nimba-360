import 'package:flutter/material.dart';

import '../controllers/app_controller.dart';
import '../widgets/business_card.dart';
import '../widgets/states.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key, required this.controller});
  final AppController controller;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (_, _) {
      final items = controller.businesses
          .where((item) => controller.favorites.contains(item.id))
          .toList();
      return Scaffold(
        appBar: AppBar(title: const Text('Favoris')),
        body: items.isEmpty
            ? const EmptyState(
                icon: Icons.favorite_border,
                title: 'Aucun favori',
                message:
                    'Enregistrez une entreprise pour la retrouver facilement ici.',
              )
            : ListView.builder(
                padding: const EdgeInsets.all(14),
                itemCount: items.length,
                itemBuilder: (_, index) => BusinessCard(
                  business: items[index],
                  controller: controller,
                ),
              ),
      );
    },
  );
}
