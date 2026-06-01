function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
}

function buildConfirmationEmail(firstName, vehicle, rdvDate) {
  const rdvLine = rdvDate
    ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;">Rendez-vous</td><td style="padding:8px 0;color:#fff;font-size:14px;font-family:monospace;">${new Date(rdvDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>`
    : ''
  const price = vehicle.price
    ? `€ ${Number(vehicle.price).toLocaleString('fr-FR')}`
    : 'Prix sur demande'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 32px 0;">
            <div style="font-size:22px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#fff;font-family:monospace;">
              ECLIPSE <span style="color:#e8000d;">AUTO</span>
            </div>
          </td>
        </tr>

        <!-- Accent line -->
        <tr>
          <td style="height:2px;background:linear-gradient(90deg,#e8000d,#00d4ff);margin-bottom:32px;display:block;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#111;padding:40px;border:1px solid #1f1f1f;">

            <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#e8000d;font-family:monospace;">Confirmation</p>
            <h1 style="margin:0 0 24px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:#fff;font-family:monospace;">
              Réservation confirmée
            </h1>

            <p style="margin:0 0 32px;font-size:14px;color:#aaa;line-height:1.7;font-family:monospace;">
              Bonjour <strong style="color:#fff;">${escapeHtml(firstName)}</strong>,<br>
              votre demande de réservation a été <strong style="color:#e8000d;">confirmée</strong> par notre équipe. Nous vous contacterons prochainement pour finaliser les détails.
            </p>

            <!-- Vehicle card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1f1f1f;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #1f1f1f;">
                  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#00d4ff;font-family:monospace;">Véhicule</div>
                  <div style="font-size:22px;font-weight:900;text-transform:uppercase;color:#fff;margin-top:4px;font-family:monospace;">
                    ${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}
                  </div>
                  <div style="font-size:12px;color:#555;font-family:monospace;">${escapeHtml(String(vehicle.year))}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;">Prix</td>
                      <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:900;font-family:monospace;">${price}</td>
                    </tr>
                    <tr><td colspan="2" style="height:1px;background:#1f1f1f;"></td></tr>
                    ${rdvLine}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#555;line-height:1.7;font-family:monospace;">
              L'équipe Eclipse Auto<br>
              <span style="color:#e8000d;">—</span> Projet éducatif, aucune transaction réelle.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

module.exports = { buildConfirmationEmail, escapeHtml }
