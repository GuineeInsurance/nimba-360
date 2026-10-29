import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/repositories.dart';
import '../models/business.dart';

class AppController extends ChangeNotifier {
  AppController({required this.directory, required this.accounts});

  final DirectoryRepository directory;
  final AccountRepository accounts;
  List<Business> businesses = const [];
  Set<String> favorites = {};
  User? user;
  bool loading = true;
  String? error;
  StreamSubscription<User?>? _accountSubscription;
  StreamSubscription<Set<String>>? _favoritesSubscription;

  Future<void> initialize() async {
    _accountSubscription = accounts.changes.listen(_onAccount);
    await refresh();
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      businesses = await directory.loadApproved();
    } catch (_) {
      error = 'Impossible de charger les adresses. Vérifiez votre connexion.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _onAccount(User? next) async {
    user = next;
    await _favoritesSubscription?.cancel();
    final prefs = await SharedPreferences.getInstance();
    final guest = prefs.getStringList('guest_favorites')?.toSet() ?? <String>{};
    if (next == null) {
      favorites = guest;
    } else {
      await accounts.ensureProfile(next);
      for (final id in guest) {
        await directory.saveFavorite(next.uid, id, true);
      }
      if (guest.isNotEmpty) await prefs.remove('guest_favorites');
      _favoritesSubscription = directory.watchFavorites(next.uid).listen((ids) {
        favorites = ids;
        notifyListeners();
      });
    }
    notifyListeners();
  }

  Future<void> toggleFavorite(String id) async {
    final saved = !favorites.contains(id);
    favorites = {...favorites};
    saved ? favorites.add(id) : favorites.remove(id);
    notifyListeners();
    if (user != null) {
      try {
        await directory.saveFavorite(user!.uid, id, saved);
      } catch (_) {
        saved ? favorites.remove(id) : favorites.add(id);
        notifyListeners();
      }
    } else {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('guest_favorites', favorites.toList());
    }
  }

  Business? byId(String id) {
    for (final item in businesses) {
      if (item.id == id) return item;
    }
    return null;
  }

  @override
  void dispose() {
    _accountSubscription?.cancel();
    _favoritesSubscription?.cancel();
    super.dispose();
  }
}
