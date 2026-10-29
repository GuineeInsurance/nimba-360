import 'package:flutter/material.dart';

import '../controllers/app_controller.dart';
import '../widgets/business_card.dart';
import '../widgets/states.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({
    super.key,
    required this.controller,
    this.initialCategory,
  });
  final AppController controller;
  final String? initialCategory;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final search = TextEditingController();
  String? category;

  @override
  void initState() {
    super.initState();
    category = widget.initialCategory;
    search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _normalize(search.text);
    final categories =
        widget.controller.businesses
            .map((b) => b.category)
            .where((v) => v.isNotEmpty)
            .toSet()
            .toList()
          ..sort();
    final results = widget.controller.businesses.where((business) {
      final categoryMatch = category == null || business.category == category;
      final haystack = _normalize(
        [
          business.name,
          business.category,
          business.location,
          ...business.services,
        ].join(' '),
      );
      return categoryMatch && haystack.contains(query);
    }).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Explorer')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 10),
            child: TextField(
              controller: search,
              autofocus: widget.initialCategory == null,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Nom, service ou quartier',
              ),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: const Text('Tout'),
                    selected: category == null,
                    onSelected: (_) => setState(() => category = null),
                  ),
                ),
                ...categories.map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(item),
                      selected: category == item,
                      onSelected: (_) => setState(() => category = item),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '${results.length} adresse${results.length == 1 ? '' : 's'}',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          Expanded(
            child: results.isEmpty
                ? const EmptyState(
                    icon: Icons.search_off,
                    title: 'Aucun résultat',
                    message:
                        'Essayez une autre catégorie ou un terme plus général.',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    itemCount: results.length,
                    itemBuilder: (_, index) => BusinessCard(
                      business: results[index],
                      controller: widget.controller,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  String _normalize(String value) => value
      .toLowerCase()
      .replaceAll(RegExp(r'[àáâä]'), 'a')
      .replaceAll(RegExp(r'[éèêë]'), 'e')
      .replaceAll(RegExp(r'[îï]'), 'i')
      .replaceAll(RegExp(r'[ôö]'), 'o')
      .replaceAll(RegExp(r'[ùûü]'), 'u');
}
