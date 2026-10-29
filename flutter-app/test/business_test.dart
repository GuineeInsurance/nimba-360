import 'package:app/src/models/business.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('maps missing runtime values as unknown instead of inventing them', () {
    final business = Business.fromMap('one', {
      'name': 'Nimba Services',
      'categoryLabel': 'Services professionnels',
      'status': 'approved',
    });

    expect(business.id, 'one');
    expect(business.name, 'Nimba Services');
    expect(business.rating, isNull);
    expect(business.latitude, isNull);
    expect(business.reviewCount, 0);
    expect(business.verified, isFalse);
  });
}
