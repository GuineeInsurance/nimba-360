import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../controllers/app_controller.dart';
import '../theme.dart';
import '../widgets/states.dart';

class BusinessDetailsScreen extends StatelessWidget {
  const BusinessDetailsScreen({
    super.key,
    required this.controller,
    required this.businessId,
  });
  final AppController controller;
  final String businessId;

  @override
  Widget build(BuildContext context) {
    final business = controller.byId(businessId);
    if (business == null) {
      return const Scaffold(
        body: EmptyState(
          icon: Icons.storefront,
          title: 'Fiche indisponible',
          message: 'Cette entreprise n’est plus accessible.',
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(business.name),
        actions: [
          IconButton(
            onPressed: () => controller.toggleFavorite(business.id),
            icon: Icon(
              controller.favorites.contains(business.id)
                  ? Icons.favorite
                  : Icons.favorite_border,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          _BusinessGallery(images: business.imageUrls),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Text(
                  business.name,
                  style: const TextStyle(
                    fontSize: 27,
                    fontWeight: FontWeight.w900,
                    color: NimbaColors.navy,
                  ),
                ),
              ),
              if (business.verified)
                const Icon(Icons.verified, color: NimbaColors.green),
            ],
          ),
          Text(
            business.category,
            style: const TextStyle(
              color: NimbaColors.red,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (business.location.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(business.location),
            ),
          if (business.address.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                business.address,
                style: const TextStyle(color: NimbaColors.muted),
              ),
            ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (business.phone.isNotEmpty)
                FilledButton.icon(
                  onPressed: () => _open('tel:${business.phone}'),
                  icon: const Icon(Icons.call),
                  label: const Text('Appeler'),
                ),
              if (business.whatsApp.isNotEmpty)
                OutlinedButton.icon(
                  onPressed: () => _open(
                    'https://wa.me/${business.whatsApp.replaceAll(RegExp(r'[^0-9]'), '')}',
                  ),
                  icon: const Icon(Icons.chat),
                  label: const Text('WhatsApp'),
                ),
              if (business.latitude != null && business.longitude != null)
                OutlinedButton.icon(
                  onPressed: () => _open(
                    'https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}',
                  ),
                  icon: const Icon(Icons.directions),
                  label: const Text('Itinéraire'),
                ),
            ],
          ),
          if (business.description.isNotEmpty) ...[
            const SizedBox(height: 26),
            const Text(
              'À propos',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(business.description, style: const TextStyle(height: 1.55)),
          ],
          if (business.services.isNotEmpty) ...[
            const SizedBox(height: 22),
            const Text(
              'Services',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 9),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: business.services
                  .map((item) => Chip(label: Text(item)))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _BusinessGallery extends StatefulWidget {
  const _BusinessGallery({required this.images});

  final List<String> images;

  @override
  State<_BusinessGallery> createState() => _BusinessGalleryState();
}

class _BusinessGalleryState extends State<_BusinessGallery> {
  int current = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return Container(
        height: 220,
        decoration: BoxDecoration(
          color: NimbaColors.softGreen,
          borderRadius: BorderRadius.circular(22),
        ),
        child: const Icon(Icons.storefront, size: 72, color: NimbaColors.green),
      );
    }
    return Column(
      children: [
        SizedBox(
          height: 230,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              children: [
                PageView.builder(
                  itemCount: widget.images.length,
                  onPageChanged: (value) => setState(() => current = value),
                  itemBuilder: (_, index) =>
                      _GalleryImage(source: widget.images[index]),
                ),
                if (widget.images.length > 1)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xCC0B2430),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Text(
                        '${current + 1}/${widget.images.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (widget.images.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.images.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: index == current ? 22 : 7,
                height: 7,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: index == current
                      ? NimbaColors.green
                      : NimbaColors.border,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _GalleryImage extends StatelessWidget {
  const _GalleryImage({required this.source});

  final String source;

  @override
  Widget build(BuildContext context) {
    Widget fallback() => Container(
      color: NimbaColors.softGreen,
      child: const Icon(Icons.storefront, size: 72, color: NimbaColors.green),
    );
    if (source.startsWith('data:image/') && source.contains(',')) {
      try {
        return Image.memory(
          base64Decode(source.split(',').last),
          width: double.infinity,
          height: 230,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => fallback(),
        );
      } catch (_) {
        return fallback();
      }
    }
    return Image.network(
      source,
      width: double.infinity,
      height: 230,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => fallback(),
    );
  }
}
