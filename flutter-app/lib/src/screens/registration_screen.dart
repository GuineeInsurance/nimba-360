import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../controllers/app_controller.dart';
import '../theme.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({
    super.key,
    required this.controller,
    this.existingId,
    this.existing,
  });
  final AppController controller;
  final String? existingId;
  final Map<String, dynamic>? existing;

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final formKey = GlobalKey<FormState>();
  final values = <String, TextEditingController>{
    for (final key in [
      'name',
      'district',
      'quartier',
      'postalCode',
      'streetAddress',
      'phone',
      'email',
      'website',
      'whatsapp',
      'description',
      'latitude',
      'longitude',
    ])
      key: TextEditingController(),
  };
  Map<String, List<String>> taxonomy = {};
  List<String> cities = [];
  String? category, subcategory, city;
  List<String> photos = [];
  int step = 0;
  bool consent = false, sending = false, blockedByActiveSubmission = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.existingId == null &&
        await widget.controller.directory.hasActiveSubmission(
          widget.controller.user!.uid,
        )) {
      if (mounted) setState(() => blockedByActiveSubmission = true);
      return;
    }
    final decoded =
        jsonDecode(await rootBundle.loadString('assets/registration.json'))
            as Map<String, dynamic>;
    taxonomy = (decoded['taxonomy'] as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, (value as List).cast<String>()),
    );
    cities = (decoded['cities'] as List).cast<String>();
    if (widget.existing != null) {
      final record = widget.existing!;
      for (final entry in values.entries) {
        entry.value.text = record[entry.key]?.toString() ?? '';
      }
      category = record['category'] as String?;
      subcategory = record['subcategory'] as String?;
      city = record['city'] as String?;
      photos = [
        if (record['photo'] case final String value when value.isNotEmpty)
          value,
        ...(record['imagePaths'] as List? ?? const [])
            .whereType<String>()
            .where((value) => value.startsWith('data:image/')),
      ].take(5).toList();
      if (mounted) setState(() {});
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(
      'registration_draft_${widget.controller.user?.uid}',
    );
    if (stored != null) {
      final draft = jsonDecode(stored) as Map<String, dynamic>;
      for (final entry in values.entries) {
        entry.value.text = draft[entry.key] as String? ?? '';
      }
      category = draft['category'] as String?;
      subcategory = draft['subcategory'] as String?;
      city = draft['city'] as String?;
    }
    if (mounted) setState(() {});
  }

  Future<void> _saveDraft() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'registration_draft_${widget.controller.user?.uid}',
      jsonEncode({
        for (final entry in values.entries) entry.key: entry.value.text,
        'category': category,
        'subcategory': subcategory,
        'city': city,
      }),
    );
  }

  @override
  void dispose() {
    for (final controller in values.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.controller.user == null) {
      return const Scaffold(
        body: Center(
          child: Text('Connectez-vous pour enregistrer une entreprise.'),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Mon entreprise')),
      body: blockedByActiveSubmission
          ? _activeSubmissionNotice()
          : taxonomy.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: formKey,
              child: Stepper(
                currentStep: step,
                onStepTapped: (value) {
                  if (value < step) setState(() => step = value);
                },
                controlsBuilder: (_, details) => Padding(
                  padding: const EdgeInsets.only(top: 18),
                  child: Row(
                    children: [
                      FilledButton(
                        onPressed: sending ? null : _continue,
                        child: Text(step == 3 ? 'Envoyer' : 'Continuer'),
                      ),
                      if (step > 0)
                        TextButton(
                          onPressed: sending
                              ? null
                              : () => setState(() => step--),
                          child: const Text('Retour'),
                        ),
                    ],
                  ),
                ),
                steps: [
                  Step(
                    title: const Text('Identité'),
                    isActive: step >= 0,
                    content: _identity(),
                  ),
                  Step(
                    title: const Text('Localisation et contact'),
                    isActive: step >= 1,
                    content: _contact(),
                  ),
                  Step(
                    title: const Text('Présentation'),
                    isActive: step >= 2,
                    content: _presentation(),
                  ),
                  Step(
                    title: const Text('Vérifier et envoyer'),
                    isActive: step >= 3,
                    content: _review(),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _activeSubmissionNotice() => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFF4D6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.hourglass_top_rounded,
                  color: NimbaColors.yellow,
                  size: 34,
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Vérification en cours',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: NimbaColors.navy,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Votre entreprise a bien été envoyée. Vous pourrez modifier sa fiche dès qu’elle sera approuvée ou si des corrections sont demandées.',
                textAlign: TextAlign.center,
                style: TextStyle(color: NimbaColors.muted, height: 1.45),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Retour à mon profil'),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _identity() => Column(
    children: [
      _field('name', 'Nom de l’entreprise', required: true, max: 100),
      const SizedBox(height: 12),
      _SelectionField(
        label: 'Catégorie',
        value: category,
        placeholder: 'Choisir une catégorie',
        icon: Icons.category_outlined,
        onTap: () async {
          final value = await _pickOption(
            title: 'Choisir une catégorie',
            subtitle: 'Quel est le secteur principal de votre entreprise ?',
            options: taxonomy.keys.toList(),
            selected: category,
          );
          if (value == null || !mounted) return;
          setState(() {
            category = value;
            if (!(taxonomy[value] ?? const <String>[]).contains(subcategory)) {
              subcategory = null;
            }
          });
        },
      ),
      const SizedBox(height: 12),
      _SelectionField(
        label: 'Sous-catégorie',
        value: subcategory,
        placeholder: category == null
            ? 'Choisissez d’abord une catégorie'
            : 'Choisir une sous-catégorie',
        icon: Icons.account_tree_outlined,
        enabled: category != null,
        onTap: () async {
          final selectedCategory = category;
          if (selectedCategory == null) return;
          final value = await _pickOption(
            title: 'Choisir une sous-catégorie',
            subtitle: selectedCategory,
            options: taxonomy[selectedCategory] ?? const [],
            selected: subcategory,
          );
          if (value != null && mounted) {
            setState(() => subcategory = value);
          }
        },
      ),
    ],
  );

  Widget _contact() => Column(
    children: [
      _SelectionField(
        label: 'Ville / Préfecture',
        value: city,
        placeholder: 'Choisir une ville ou préfecture',
        icon: Icons.location_city_outlined,
        onTap: () async {
          final value = await _pickOption(
            title: 'Ville / Préfecture',
            subtitle: 'Sélectionnez la zone où se trouve votre entreprise.',
            options: cities,
            selected: city,
          );
          if (value != null && mounted) setState(() => city = value);
        },
      ),
      const SizedBox(height: 12),
      _field('district', 'Commune', required: true, max: 100),
      const SizedBox(height: 12),
      _field('quartier', 'Quartier', max: 100),
      const SizedBox(height: 12),
      _field('postalCode', 'Code postal', max: 20),
      const SizedBox(height: 12),
      _field('streetAddress', 'Adresse / repère précis', max: 180),
      const SizedBox(height: 12),
      _field(
        'phone',
        'Téléphone',
        required: true,
        max: 30,
        keyboard: TextInputType.phone,
      ),
      const SizedBox(height: 12),
      _field('email', 'E-mail', max: 150, keyboard: TextInputType.emailAddress),
      const SizedBox(height: 12),
      _field('website', 'Site web', keyboard: TextInputType.url),
      const SizedBox(height: 12),
      _field('whatsapp', 'WhatsApp', max: 30, keyboard: TextInputType.phone),
      const SizedBox(height: 12),
      OutlinedButton.icon(
        onPressed: _locate,
        icon: const Icon(Icons.my_location),
        label: const Text('Utiliser ma position actuelle'),
      ),
      if (values['latitude']!.text.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Position : ${values['latitude']!.text}, ${values['longitude']!.text}',
                ),
              ),
              TextButton.icon(
                onPressed: _clearLocation,
                icon: const Icon(Icons.close_rounded, size: 18),
                label: const Text('Supprimer'),
              ),
            ],
          ),
        ),
    ],
  );

  Widget _presentation() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: NimbaColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                _SectionIcon(icon: Icons.auto_awesome_outlined),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Présentez votre entreprise',
                        style: TextStyle(
                          color: NimbaColors.navy,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Expliquez clairement vos services et ce qui vous distingue.',
                        style: TextStyle(
                          color: NimbaColors.muted,
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _descriptionField(),
          ],
        ),
      ),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: NimbaColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const _SectionIcon(icon: Icons.photo_library_outlined),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Photos de l’entreprise',
                        style: TextStyle(
                          color: NimbaColors.navy,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Ajoutez jusqu’à 5 photos. La première sera la couverture.',
                        style: TextStyle(
                          color: NimbaColors.muted,
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: NimbaColors.softGreen,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${photos.length}/5',
                    style: const TextStyle(
                      color: NimbaColors.green,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (photos.isEmpty)
              _EmptyPhotoPicker(onTap: _pickPhotos)
            else ...[
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.08,
                ),
                itemCount: photos.length,
                itemBuilder: (context, index) => _PhotoTile(
                  data: photos[index],
                  isCover: index == 0,
                  onMakeCover: index == 0 ? null : () => _makeCover(index),
                  onRemove: () => setState(() => photos.removeAt(index)),
                ),
              ),
              if (photos.length < 5) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickPhotos,
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(
                    'Ajouter des photos (${5 - photos.length} restantes)',
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    ],
  );

  Widget _descriptionField() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: 'Description des services',
              style: TextStyle(
                color: NimbaColors.navy,
                fontWeight: FontWeight.w700,
              ),
            ),
            TextSpan(
              text: '  *',
              style: TextStyle(
                color: NimbaColors.red,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 8),
      TextFormField(
        controller: values['description'],
        minLines: 6,
        maxLines: 8,
        maxLength: 800,
        textCapitalization: TextCapitalization.sentences,
        decoration: const InputDecoration(
          labelText: null,
          hintText:
              'Ex. Nous proposons des services de restauration guinéenne, des commandes pour événements et la livraison…',
          hintMaxLines: 4,
          alignLabelWithHint: true,
          contentPadding: EdgeInsets.all(16),
        ),
        validator: (value) => (value?.trim().isEmpty ?? true)
            ? 'Description des services : champ obligatoire.'
            : null,
      ),
    ],
  );

  Widget _review() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        values['name']!.text,
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
      ),
      Text('$category · $subcategory'),
      Text('${values['district']!.text}, $city'),
      Text(values['phone']!.text),
      const SizedBox(height: 12),
      Text(values['description']!.text),
      if (photos.isNotEmpty) ...[
        const SizedBox(height: 10),
        Text(
          '${photos.length} photo${photos.length > 1 ? 's' : ''} sélectionnée${photos.length > 1 ? 's' : ''}',
          style: const TextStyle(
            color: NimbaColors.green,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
      const SizedBox(height: 16),
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        value: consent,
        onChanged: (value) => setState(() => consent = value ?? false),
        title: const Text(
          'Je confirme être autorisé à transmettre ces informations pour vérification.',
        ),
        controlAffinity: ListTileControlAffinity.leading,
      ),
    ],
  );

  Widget _field(
    String key,
    String label, {
    bool required = false,
    int? max,
    int lines = 1,
    TextInputType? keyboard,
  }) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: label,
              style: const TextStyle(
                color: NimbaColors.navy,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (required)
              const TextSpan(
                text: '  *',
                style: TextStyle(
                  color: NimbaColors.red,
                  fontWeight: FontWeight.w800,
                ),
              ),
          ],
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      const SizedBox(height: 7),
      TextFormField(
        controller: values[key],
        maxLength: max,
        maxLines: lines,
        keyboardType: keyboard,
        textCapitalization:
            keyboard == TextInputType.emailAddress ||
                keyboard == TextInputType.url ||
                keyboard == TextInputType.phone
            ? TextCapitalization.none
            : TextCapitalization.sentences,
        decoration: InputDecoration(
          labelText: null,
          hintText: _fieldHint(key),
          alignLabelWithHint: lines > 1,
        ),
        validator: (value) {
          final text = value?.trim() ?? '';
          if (required && text.isEmpty) return '$label : champ obligatoire.';
          if (key == 'email' &&
              text.isNotEmpty &&
              !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(text)) {
            return 'Adresse e-mail invalide.';
          }
          if (key == 'website' && text.isNotEmpty) {
            final uri = Uri.tryParse(text);
            if (uri == null ||
                !['http', 'https'].contains(uri.scheme) ||
                uri.host.isEmpty) {
              return 'Adresse web invalide.';
            }
          }
          return null;
        },
      ),
    ],
  );

  String? _fieldHint(String key) => switch (key) {
    'name' => 'Ex. Nimba Services',
    'district' => 'Ex. Ratoma',
    'quartier' => 'Ex. Kipé',
    'postalCode' => 'Facultatif',
    'streetAddress' => 'Rue, immeuble ou repère',
    'phone' => 'Ex. +224 620 00 00 00',
    'email' => 'Ex. contact@entreprise.com',
    'website' => 'Ex. https://entreprise.com',
    'whatsapp' => 'Ex. +224 620 00 00 00',
    _ => null,
  };

  Future<void> _continue() async {
    if (step < 3) {
      final error = _stepError(step);
      if (error != null) {
        _showError(error);
        return;
      }
      await _saveDraft();
      setState(() => step++);
      return;
    }
    for (var index = 0; index < 3; index++) {
      final error = _stepError(index);
      if (error != null) {
        setState(() => step = index);
        _showError(error);
        return;
      }
    }
    if (!consent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Confirmez votre autorisation avant l’envoi.'),
        ),
      );
      return;
    }
    if (widget.existingId == null &&
        await widget.controller.directory.hasActiveSubmission(
          widget.controller.user!.uid,
        )) {
      if (mounted) {
        setState(() => blockedByActiveSubmission = true);
        _showError('Une entreprise est déjà en cours de vérification.');
      }
      return;
    }
    setState(() => sending = true);
    try {
      final uid = widget.controller.user!.uid;
      final fields = <String, dynamic>{
        'submitterId': uid,
        'name': values['name']!.text.trim(),
        'category': category!,
        'subcategory': subcategory!,
        'categoryId': _slug(category!),
        'subcategoryId': _slug(subcategory!),
        'city': city!,
        'cityId': _slug(city!),
        'district': values['district']!.text.trim(),
        'communeId': _slug(values['district']!.text),
        'quartier': values['quartier']!.text.trim(),
        'postalCode': values['postalCode']!.text.trim(),
        'streetAddress': values['streetAddress']!.text.trim(),
        'address': values['streetAddress']!.text.trim(),
        'phone': values['phone']!.text.trim(),
        'email': values['email']!.text.trim(),
        'website': values['website']!.text.trim(),
        'whatsapp': values['whatsapp']!.text.trim(),
        'latitude': double.tryParse(values['latitude']!.text),
        'longitude': double.tryParse(values['longitude']!.text),
        'description': values['description']!.text.trim(),
        'imagePaths': photos.skip(1).toList(),
        'photo': photos.isEmpty ? '' : photos.first,
      };
      if (widget.existingId == null) {
        await widget.controller.directory.submit(const Uuid().v4(), fields);
      } else {
        await widget.controller.directory.resubmit(
          widget.existingId!,
          const Uuid().v4(),
          fields,
        );
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('registration_draft_$uid');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fiche envoyée — en cours de vérification.'),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Envoi impossible : $error')));
      }
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  String? _stepError(int index) {
    if (index == 0) {
      if (values['name']!.text.trim().length < 2) {
        return 'Le nom doit contenir au moins 2 caractères.';
      }
      if (category == null || subcategory == null) {
        return 'Choisissez une catégorie et une sous-catégorie.';
      }
    }
    if (index == 1) {
      if (city == null) return 'Choisissez une ville / préfecture.';
      if (values['district']!.text.trim().isEmpty) {
        return 'Commune : champ obligatoire.';
      }
      if (values['phone']!.text.trim().isEmpty) {
        return 'Téléphone : champ obligatoire.';
      }
      final email = values['email']!.text.trim();
      if (email.isNotEmpty &&
          !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
        return 'Saisissez une adresse e-mail valide.';
      }
      final website = values['website']!.text.trim();
      if (website.isNotEmpty) {
        final uri = Uri.tryParse(website);
        if (uri == null ||
            !['http', 'https'].contains(uri.scheme) ||
            uri.host.isEmpty) {
          return 'Utilisez une adresse web https:// ou http:// valide.';
        }
      }
      final latitude = values['latitude']!.text.trim();
      final longitude = values['longitude']!.text.trim();
      if (latitude.isNotEmpty || longitude.isNotEmpty) {
        final lat = double.tryParse(latitude.replaceAll(',', '.'));
        final lon = double.tryParse(longitude.replaceAll(',', '.'));
        if (lat == null ||
            lon == null ||
            lat < 7 ||
            lat > 13 ||
            lon < -16 ||
            lon > -7) {
          return 'Renseignez les deux coordonnées en Guinée, ou laissez-les vides.';
        }
      }
    }
    if (index == 2 && values['description']!.text.trim().isEmpty) {
      return 'Description des services : champ obligatoire.';
    }
    return null;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<String?> _pickOption({
    required String title,
    required String subtitle,
    required List<String> options,
    String? selected,
  }) => showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _OptionSheet(
      title: title,
      subtitle: subtitle,
      options: options,
      selected: selected,
    ),
  );

  Future<void> _locate() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return;
    }
    final position = await Geolocator.getCurrentPosition();
    final isInGuinea =
        position.latitude >= 7 &&
        position.latitude <= 13 &&
        position.longitude >= -16 &&
        position.longitude <= -7;
    if (!isInGuinea) {
      _clearLocation();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Votre position actuelle est hors de Guinée. Elle a été laissée vide et vous pouvez continuer sans position GPS.',
            ),
          ),
        );
      }
      return;
    }
    setState(() {
      values['latitude']!.text = position.latitude.toStringAsFixed(6);
      values['longitude']!.text = position.longitude.toStringAsFixed(6);
    });
  }

  void _clearLocation() {
    if (!mounted) return;
    setState(() {
      values['latitude']!.clear();
      values['longitude']!.clear();
    });
  }

  Future<void> _pickPhotos() async {
    final remaining = 5 - photos.length;
    if (remaining <= 0) return;
    final selected = await ImagePicker().pickMultiImage(limit: remaining);
    if (selected.isEmpty) return;
    final next = <String>[];
    for (final file in selected.take(remaining)) {
      final encoded = await _compressPhoto(await file.readAsBytes());
      if (encoded != null) next.add(encoded);
    }
    if (!mounted) return;
    if (next.isEmpty) {
      _showError('Impossible de préparer ces photos. Essayez d’autres images.');
      return;
    }
    setState(() => photos = [...photos, ...next].take(5).toList());
    if (next.length < selected.take(remaining).length) {
      _showError(
        'Certaines photos étaient trop volumineuses et ont été ignorées.',
      );
    }
  }

  Future<String?> _compressPhoto(Uint8List source) async {
    final decoded = img.decodeImage(source);
    if (decoded == null) return null;
    final oriented = img.bakeOrientation(decoded);
    final resized = oriented.width >= oriented.height
        ? (oriented.width > 900
              ? img.copyResize(oriented, width: 900)
              : oriented)
        : (oriented.height > 900
              ? img.copyResize(oriented, height: 900)
              : oriented);
    var quality = 68;
    var bytes = Uint8List.fromList(img.encodeJpg(resized, quality: quality));
    while (bytes.length > 90000 && quality > 28) {
      quality -= 8;
      bytes = Uint8List.fromList(img.encodeJpg(resized, quality: quality));
    }
    final encoded = 'data:image/jpeg;base64,${base64Encode(bytes)}';
    return encoded.length <= 140000 ? encoded : null;
  }

  void _makeCover(int index) {
    setState(() {
      final selected = photos.removeAt(index);
      photos.insert(0, selected);
    });
  }

  String _slug(String value) => value
      .toLowerCase()
      .replaceAll(RegExp(r'[àáâä]'), 'a')
      .replaceAll(RegExp(r'[éèêë]'), 'e')
      .replaceAll(RegExp(r'[îï]'), 'i')
      .replaceAll(RegExp(r'[ôö]'), 'o')
      .replaceAll(RegExp(r'[ùûü]'), 'u')
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-|-$'), '');
}

class _SectionIcon extends StatelessWidget {
  const _SectionIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    width: 44,
    height: 44,
    decoration: BoxDecoration(
      color: NimbaColors.softGreen,
      borderRadius: BorderRadius.circular(13),
    ),
    child: Icon(icon, color: NimbaColors.green, size: 22),
  );
}

class _EmptyPhotoPicker extends StatelessWidget {
  const _EmptyPhotoPicker({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: NimbaColors.cream,
    borderRadius: BorderRadius.circular(16),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
        decoration: BoxDecoration(
          border: Border.all(color: NimbaColors.border),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Column(
          children: [
            CircleAvatar(
              radius: 27,
              backgroundColor: NimbaColors.softGreen,
              child: Icon(
                Icons.add_photo_alternate_outlined,
                color: NimbaColors.green,
                size: 28,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Ajouter des photos',
              style: TextStyle(
                color: NimbaColors.navy,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Choisissez jusqu’à 5 images depuis votre galerie',
              textAlign: TextAlign.center,
              style: TextStyle(color: NimbaColors.muted, fontSize: 13),
            ),
          ],
        ),
      ),
    ),
  );
}

class _PhotoTile extends StatelessWidget {
  const _PhotoTile({
    required this.data,
    required this.isCover,
    required this.onRemove,
    this.onMakeCover,
  });

  final String data;
  final bool isCover;
  final VoidCallback onRemove;
  final VoidCallback? onMakeCover;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(16),
    child: Stack(
      fit: StackFit.expand,
      children: [
        Image.memory(
          base64Decode(data.split(',').last),
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => Container(
            color: NimbaColors.softGreen,
            child: const Icon(Icons.broken_image_outlined),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            height: 48,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Color(0xCC0B2430)],
              ),
            ),
          ),
        ),
        Positioned(
          left: 9,
          bottom: 8,
          child: Material(
            color: isCover ? NimbaColors.green : const Color(0xCC0B2430),
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              onTap: onMakeCover,
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isCover ? Icons.star_rounded : Icons.star_border_rounded,
                      color: Colors.white,
                      size: 15,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isCover ? 'Couverture' : 'Choisir',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: Material(
            color: const Color(0xDD0B2430),
            shape: const CircleBorder(),
            child: IconButton(
              onPressed: onRemove,
              tooltip: 'Retirer la photo',
              visualDensity: VisualDensity.compact,
              icon: const Icon(
                Icons.close_rounded,
                color: Colors.white,
                size: 19,
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _SelectionField extends StatelessWidget {
  const _SelectionField({
    required this.label,
    required this.placeholder,
    required this.icon,
    required this.onTap,
    this.value,
    this.enabled = true,
  });

  final String label;
  final String placeholder;
  final IconData icon;
  final VoidCallback onTap;
  final String? value;
  final bool enabled;

  @override
  Widget build(BuildContext context) => Opacity(
    opacity: enabled ? 1 : .58,
    child: Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: NimbaColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: NimbaColors.softGreen,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: NimbaColors.green, size: 21),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        color: NimbaColors.muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      value ?? placeholder,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: value == null
                            ? NimbaColors.muted
                            : NimbaColors.navy,
                        fontSize: 15,
                        fontWeight: value == null
                            ? FontWeight.w400
                            : FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded),
            ],
          ),
        ),
      ),
    ),
  );
}

class _OptionSheet extends StatefulWidget {
  const _OptionSheet({
    required this.title,
    required this.subtitle,
    required this.options,
    this.selected,
  });

  final String title;
  final String subtitle;
  final List<String> options;
  final String? selected;

  @override
  State<_OptionSheet> createState() => _OptionSheetState();
}

class _OptionSheetState extends State<_OptionSheet> {
  String query = '';

  List<String> get visibleOptions {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) return widget.options;
    return widget.options
        .where((option) => option.toLowerCase().contains(normalized))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final options = visibleOptions;
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: keyboard),
      child: FractionallySizedBox(
        heightFactor: .82,
        child: Material(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 42,
                height: 5,
                decoration: BoxDecoration(
                  color: NimbaColors.border,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 12, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.title,
                            style: const TextStyle(
                              color: NimbaColors.navy,
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.subtitle,
                            style: const TextStyle(
                              color: NimbaColors.muted,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Fermer',
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 2, 20, 12),
                child: TextField(
                  onChanged: (value) => setState(() => query = value),
                  textInputAction: TextInputAction.search,
                  decoration: const InputDecoration(
                    hintText: 'Rechercher…',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Text(
                      '${options.length} choix',
                      style: const TextStyle(
                        color: NimbaColors.muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: options.isEmpty
                    ? const Center(
                        child: Text(
                          'Aucun résultat',
                          style: TextStyle(color: NimbaColors.muted),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.onDrag,
                        itemCount: options.length,
                        separatorBuilder: (_, _) => const Divider(
                          height: 1,
                          indent: 64,
                          color: NimbaColors.border,
                        ),
                        itemBuilder: (context, index) {
                          final option = options[index];
                          final selected = option == widget.selected;
                          return ListTile(
                            minTileHeight: 58,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            leading: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: selected
                                    ? NimbaColors.softGreen
                                    : NimbaColors.cream,
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: Icon(
                                selected
                                    ? Icons.check_rounded
                                    : Icons.business_outlined,
                                size: 19,
                                color: selected
                                    ? NimbaColors.green
                                    : NimbaColors.muted,
                              ),
                            ),
                            title: Text(
                              option,
                              style: TextStyle(
                                color: NimbaColors.navy,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                            trailing: selected
                                ? const Icon(
                                    Icons.check_circle_rounded,
                                    color: NimbaColors.green,
                                  )
                                : const Icon(
                                    Icons.chevron_right_rounded,
                                    color: NimbaColors.muted,
                                  ),
                            onTap: () => Navigator.pop(context, option),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
