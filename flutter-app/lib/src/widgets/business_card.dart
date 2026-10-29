import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../controllers/app_controller.dart';
import '../models/business.dart';
import '../theme.dart';

class BusinessCard extends StatelessWidget {
  const BusinessCard({
    super.key,
    required this.business,
    required this.controller,
  });
  final Business business;
  final AppController controller;

  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => context.push('/business/${business.id}'),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(13),
              child: business.imageUrl.isEmpty
                  ? Container(
                      width: 76,
                      height: 76,
                      color: NimbaColors.softGreen,
                      child: const Icon(
                        Icons.storefront,
                        color: NimbaColors.green,
                        size: 34,
                      ),
                    )
                  : _BusinessThumbnail(source: business.imageUrl),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          business.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      if (business.verified)
                        const Icon(
                          Icons.verified,
                          color: NimbaColors.green,
                          size: 18,
                        ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    business.category,
                    style: const TextStyle(
                      color: NimbaColors.red,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    business.location,
                    style: const TextStyle(color: NimbaColors.muted),
                  ),
                ],
              ),
            ),
            IconButton(
              tooltip: controller.favorites.contains(business.id)
                  ? 'Retirer des favoris'
                  : 'Ajouter aux favoris',
              onPressed: () => controller.toggleFavorite(business.id),
              icon: Icon(
                controller.favorites.contains(business.id)
                    ? Icons.favorite
                    : Icons.favorite_border,
                color: NimbaColors.red,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _BusinessThumbnail extends StatelessWidget {
  const _BusinessThumbnail({required this.source});

  final String source;

  @override
  Widget build(BuildContext context) {
    Widget fallback() => const SizedBox(
      width: 76,
      height: 76,
      child: Icon(Icons.storefront, color: NimbaColors.green),
    );
    if (source.startsWith('data:image/') && source.contains(',')) {
      try {
        return Image.memory(
          base64Decode(source.split(',').last),
          width: 76,
          height: 76,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => fallback(),
        );
      } catch (_) {
        return fallback();
      }
    }
    return Image.network(
      source,
      width: 76,
      height: 76,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => fallback(),
    );
  }
}
