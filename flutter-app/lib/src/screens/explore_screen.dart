import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../controllers/app_controller.dart';
import '../theme.dart';
import '../widgets/business_card.dart';
import '../widgets/states.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key, required this.controller});
  final AppController controller;
  static const categories = [
    'Restaurants',
    'Santé',
    'Automobile',
    'Hôtels',
    'Services professionnels',
  ];
  static const icons = [
    Icons.restaurant_rounded,
    Icons.medical_services_rounded,
    Icons.directions_car_filled_rounded,
    Icons.hotel_rounded,
    Icons.business_center_rounded,
  ];
  static const categoryLabels = [
    'Restaurants',
    'Santé',
    'Auto',
    'Hôtels',
    'Services',
  ];
  static const categoryColors = [
    NimbaColors.red,
    NimbaColors.green,
    NimbaColors.navy,
    NimbaColors.yellow,
    Color(0xFF536779),
  ];

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (_, _) => SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SvgPicture.asset(
                        'assets/logo.svg',
                        width: 150,
                        height: 40,
                      ),
                      const Text(
                        'La Guinée à portée de main',
                        style: TextStyle(
                          color: NimbaColors.muted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Chip(
                  avatar: Icon(Icons.location_on, size: 17),
                  label: Text('Conakry'),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
                children: [
                  const Text(
                    'Qu’est-ce qu’on cherche aujourd’hui ?',
                    style: TextStyle(
                      color: NimbaColors.navy,
                      fontSize: 29,
                      height: 1.08,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 7),
                  const Text(
                    'Trouvez les meilleures adresses en Guinée',
                    style: TextStyle(color: NimbaColors.muted),
                  ),
                  const SizedBox(height: 18),
                  InkWell(
                    onTap: () => context.push('/search'),
                    borderRadius: BorderRadius.circular(15),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 17,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: NimbaColors.border),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.search),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Restaurant, garage, hôtel…',
                              style: TextStyle(color: NimbaColors.muted),
                            ),
                          ),
                          Icon(Icons.tune, color: NimbaColors.red),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    height: 100,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(
                        categories.length,
                        (index) => _CategoryShortcut(
                          label: categoryLabels[index],
                          icon: icons[index],
                          color: categoryColors[index],
                          darkIcon: index == 3,
                          onTap: () => context.push(
                            '/search?category=${Uri.encodeComponent(categories[index])}',
                          ),
                        ),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Adresses vérifiées',
                        style: TextStyle(
                          color: NimbaColors.navy,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/search'),
                        child: const Text('Voir tout'),
                      ),
                    ],
                  ),
                  if (controller.loading)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (controller.error != null)
                    EmptyState(
                      icon: Icons.cloud_off,
                      title: 'Connexion impossible',
                      message: controller.error!,
                      action: FilledButton(
                        onPressed: controller.refresh,
                        child: const Text('Réessayer'),
                      ),
                    )
                  else if (controller.businesses.isEmpty)
                    const EmptyState(
                      icon: Icons.storefront,
                      title: 'Le catalogue se prépare',
                      message:
                          'Les entreprises apparaîtront ici après vérification.',
                    )
                  else
                    ...controller.businesses
                        .take(5)
                        .map(
                          (business) => BusinessCard(
                            business: business,
                            controller: controller,
                          ),
                        ),
                  const SizedBox(height: 10),
                  const Card(
                    color: NimbaColors.softGreen,
                    child: Padding(
                      padding: EdgeInsets.all(18),
                      child: Row(
                        children: [
                          Icon(
                            Icons.verified_user,
                            color: NimbaColors.green,
                            size: 34,
                          ),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Choisissez en confiance',
                                  style: TextStyle(fontWeight: FontWeight.w900),
                                ),
                                Text(
                                  'Les fiches vérifiées confirment les coordonnées essentielles.',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _CategoryShortcut extends StatelessWidget {
  const _CategoryShortcut({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
    this.darkIcon = false,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool darkIcon;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Catégorie $label',
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: SizedBox(
        width: 64,
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(17),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [color, Color.lerp(color, Colors.black, 0.15)!],
                ),
                border: Border.all(color: Colors.white.withAlpha(120)),
                boxShadow: [
                  BoxShadow(
                    color: color.withAlpha(55),
                    blurRadius: 14,
                    offset: const Offset(0, 7),
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: darkIcon ? NimbaColors.navy : Colors.white,
                size: 27,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: NimbaColors.navy,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.15,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
