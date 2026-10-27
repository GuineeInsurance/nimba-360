export function authError(error: unknown): string | null {
  const code = (error as { code?: string })?.code ?? '';
  if (['ERR_REQUEST_CANCELED', 'SIGN_IN_CANCELLED', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(code)) return null;
  const messages: Record<string, string> = {
    'auth/invalid-phone-number': 'Saisissez un numéro avec son indicatif, par exemple +224…',
    'auth/invalid-verification-code': 'Le code est incorrect. Vérifiez le SMS reçu.',
    'auth/code-expired': 'Le code a expiré. Demandez un nouveau SMS.',
    'auth/session-expired': 'Le code a expiré. Demandez un nouveau SMS.',
    'auth/too-many-requests': 'Trop de tentatives. Patientez avant de réessayer.',
    'auth/network-request-failed': 'Vérifiez votre connexion Internet puis réessayez.',
    'auth/operation-not-allowed': 'Ce mode de connexion n’est pas encore disponible.',
    'auth/quota-exceeded': 'L’envoi de SMS est temporairement indisponible.',
    'auth/account-exists-with-different-credential': 'Ce compte utilise déjà un autre mode de connexion. Utilisez votre méthode habituelle.',
  };
  return messages[code] ?? 'La connexion a échoué. Réessayez dans quelques instants.';
}
