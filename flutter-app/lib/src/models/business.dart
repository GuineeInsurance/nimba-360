class Business {
  const Business({
    required this.id,
    required this.name,
    required this.category,
    required this.city,
    required this.neighborhood,
    required this.address,
    required this.phone,
    required this.whatsApp,
    required this.description,
    required this.services,
    required this.imageUrl,
    required this.imageUrls,
    required this.rating,
    required this.reviewCount,
    required this.verified,
    required this.latitude,
    required this.longitude,
  });

  final String id, name, category, city, neighborhood, address, phone;
  final String whatsApp, description, imageUrl;
  final List<String> services, imageUrls;
  final double? rating, latitude, longitude;
  final int reviewCount;
  final bool verified;

  factory Business.fromMap(String id, Map<String, dynamic> data) {
    String text(String key, [String fallback = '']) =>
        data[key] is String ? data[key] as String : fallback;
    double? number(String key) => (data[key] as num?)?.toDouble();
    final imageUrl = text('imageUrl');
    final imageUrls =
        (data['imageUrls'] as List?)?.whereType<String>().toList() ?? const [];
    return Business(
      id: id,
      name: text('name'),
      category: text('categoryLabel', text('category')),
      city: text('city'),
      neighborhood: text('neighborhood', text('commune')),
      address: text('address'),
      phone: text('phone'),
      whatsApp: text('whatsapp'),
      description: text('description'),
      services:
          (data['services'] as List?)?.whereType<String>().toList() ?? const [],
      imageUrl: imageUrl,
      imageUrls: imageUrls.isEmpty && imageUrl.isNotEmpty
          ? [imageUrl]
          : imageUrls,
      rating: number('rating'),
      reviewCount: (data['reviewCount'] as num?)?.toInt() ?? 0,
      verified: data['verified'] == true,
      latitude: number('latitude'),
      longitude: number('longitude'),
    );
  }

  String get location =>
      [neighborhood, city].where((e) => e.isNotEmpty).join(', ');
}
