import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'controllers/app_controller.dart';
import 'screens/business_details_screen.dart';
import 'screens/explore_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/phone_auth_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/registration_screen.dart';
import 'screens/search_screen.dart';
import 'theme.dart';

class NimbaApp extends StatelessWidget {
  NimbaApp({super.key, required this.controller})
    : router = _router(controller);
  final AppController controller;
  final GoRouter router;

  static GoRouter _router(AppController controller) => GoRouter(
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (_, _, navigationShell) =>
            _Shell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (_, _) => ExploreScreen(controller: controller),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/favorites',
                builder: (_, _) => FavoritesScreen(controller: controller),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, _) => ProfileScreen(controller: controller),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/search',
        builder: (_, state) => SearchScreen(
          controller: controller,
          initialCategory: state.uri.queryParameters['category'],
        ),
      ),
      GoRoute(
        path: '/business/:id',
        builder: (_, state) => BusinessDetailsScreen(
          controller: controller,
          businessId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/phone',
        builder: (_, _) => PhoneAuthScreen(controller: controller),
      ),
      GoRoute(
        path: '/register',
        builder: (_, _) => RegistrationScreen(controller: controller),
      ),
      GoRoute(
        path: '/register/edit',
        builder: (_, state) {
          final existing = state.extra! as Map<String, dynamic>;
          return RegistrationScreen(
            controller: controller,
            existingId: existing['id'] as String,
            existing: existing['data'] as Map<String, dynamic>,
          );
        },
      ),
    ],
  );

  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'NIMBA 360',
    debugShowCheckedModeBanner: false,
    theme: nimbaTheme(),
    routerConfig: router,
  );
}

class _Shell extends StatelessWidget {
  const _Shell({required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: navigationShell,
    bottomNavigationBar: NavigationBar(
      selectedIndex: navigationShell.currentIndex,
      onDestinationSelected: (index) => navigationShell.goBranch(
        index,
        initialLocation: index == navigationShell.currentIndex,
      ),
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.explore_outlined),
          selectedIcon: Icon(Icons.explore),
          label: 'Explorer',
        ),
        NavigationDestination(
          icon: Icon(Icons.favorite_outline),
          selectedIcon: Icon(Icons.favorite),
          label: 'Favoris',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profil',
        ),
      ],
    ),
  );
}
