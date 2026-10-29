import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../models/business.dart';

class DirectoryRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<List<Business>> loadApproved() async {
    final result = await _db
        .collection('businesses')
        .where('status', isEqualTo: 'approved')
        .get();
    return result.docs
        .map((doc) => Business.fromMap(doc.id, doc.data()))
        .toList();
  }

  Stream<Set<String>> watchFavorites(String uid) => _db
      .collection('users/$uid/favorites')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.id).toSet());

  Future<void> saveFavorite(String uid, String businessId, bool saved) async {
    final ref = _db.doc('users/$uid/favorites/$businessId');
    if (saved) {
      await ref.set({
        'businessId': businessId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      await ref.delete();
    }
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchSubmissions(String uid) =>
      _db
          .collection('submissions')
          .where('submitterId', isEqualTo: uid)
          .snapshots();

  Future<bool> hasActiveSubmission(String uid) async {
    final result = await _db
        .collection('submissions')
        .where('submitterId', isEqualTo: uid)
        .get();
    const activeStatuses = {'pending', 'in_progress', 'in_review'};
    return result.docs.any(
      (document) => activeStatuses.contains(document.data()['status']),
    );
  }

  Future<void> submit(String id, Map<String, dynamic> fields) =>
      _db.doc('submissions/$id').set({
        ...fields,
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

  Future<void> resubmit(
    String id,
    String requestId,
    Map<String, dynamic> fields,
  ) => _db.runTransaction((transaction) async {
    final ref = _db.doc('submissions/$id');
    final snapshot = await transaction.get(ref);
    final status = snapshot.data()?['status'];
    if (!['approved', 'correction_required', 'rejected'].contains(status)) {
      throw StateError('Cette fiche est déjà en cours de vérification.');
    }
    transaction.update(ref, {
      ...fields,
      'status': 'pending',
      'editRequestId': requestId,
      'verificationChecks': {
        'identity': false,
        'contact': false,
        'location': false,
        'duplicate': false,
      },
      'updatedAt': FieldValue.serverTimestamp(),
    });
  });
}

class AccountRepository {
  final FirebaseAuth auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<User?> get changes => auth.authStateChanges();

  Future<void> signInGoogle() async {
    final account = await GoogleSignIn().signIn();
    if (account == null) return;
    final tokens = await account.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
    );
    await auth.signInWithCredential(credential);
  }

  Future<String?> sendPhoneCode(String phone) {
    final result = Completer<String?>();
    auth.verifyPhoneNumber(
      phoneNumber: phone,
      verificationCompleted: (credential) async {
        await auth.signInWithCredential(credential);
        if (!result.isCompleted) result.complete(null);
      },
      verificationFailed: (error) {
        if (!result.isCompleted) result.completeError(error);
      },
      codeSent: (verificationId, _) {
        if (!result.isCompleted) result.complete(verificationId);
      },
      codeAutoRetrievalTimeout: (verificationId) {
        if (!result.isCompleted) result.complete(verificationId);
      },
    );
    return result.future;
  }

  Future<void> confirmPhoneCode(String verificationId, String code) =>
      auth.signInWithCredential(
        PhoneAuthProvider.credential(
          verificationId: verificationId,
          smsCode: code,
        ),
      );

  Future<void> ensureProfile(User user) async {
    final ref = _db.doc('users/${user.uid}');
    await _db.runTransaction((transaction) async {
      final existing = await transaction.get(ref);
      if (!existing.exists) {
        transaction.set(ref, {
          'displayName': user.displayName ?? '',
          'email': user.email ?? '',
          'photoUrl': user.photoURL ?? '',
          'preferredCityId': 'conakry',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    });
  }

  Future<void> signOut() async {
    await GoogleSignIn().signOut();
    await auth.signOut();
  }
}
