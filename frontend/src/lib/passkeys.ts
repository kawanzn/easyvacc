/** Mensagens de erro amigáveis sem mascarar falhas de configuração do Supabase. */
export function passkeysDisponiveis(): boolean {
  return typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined';
}

export function mensagemErroPasskey(error: unknown, fallback: string): string {
  const e = error as { code?: string; error_code?: string; name?: string; message?: string } | null;
  const codigo = e?.code || e?.error_code || '';
  if (codigo === 'passkey_disabled') {
    return 'As Passkeys ainda não foram ativadas no Supabase (Authentication → Passkeys).';
  }
  if (codigo === 'webauthn_credential_exists') {
    return 'Este dispositivo já possui uma biometria cadastrada nesta conta.';
  }
  if (codigo === 'too_many_passkeys') {
    return 'Você atingiu o limite de dispositivos cadastrados.';
  }
  if (codigo === 'webauthn_challenge_expired') {
    return 'A solicitação expirou. Tente novamente.';
  }
  if (codigo === 'webauthn_verification_failed') {
    return 'Não foi possível validar a biometria. Tente novamente.';
  }
  if (codigo === 'email_not_confirmed' || codigo === 'phone_not_confirmed') {
    return 'Confirme seu e-mail ou telefone antes de usar a biometria.';
  }
  if (e?.name === 'NotAllowedError' || e?.name === 'AbortError' || codigo === 'ERROR_CEREMONY_ABORTED') {
    return 'Autenticação cancelada ou não autorizada no dispositivo.';
  }
  if (e?.name === 'SecurityError') {
    return 'A origem deste site não está autorizada para Passkeys. Verifique o domínio no Supabase.';
  }
  // Erros genéricos da plataforma WebAuthn não devem ser mostrados com detalhes internos.
  return fallback;
}
