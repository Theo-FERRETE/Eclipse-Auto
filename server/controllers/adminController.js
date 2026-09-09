// Stats du tableau de bord et gestion des comptes clients.

const adminModel = require('../models/adminModel')

// GET /api/admin/stats — statistiques du dashboard
async function stats(req, res) {
  const results = await adminModel.getStats()

  // Sans ce contrôle, une requête en échec donnerait un count undefined et la route
  // répondrait 200 avec des valeurs nulles : dashboard vide et aucune erreur visible.
  const failed = results.find(r => r.error)
  if (failed) return res.status(500).json({ error: failed.error.message })

  const [
    { count: totalVehicles },
    { count: available },
    { count: reserved },
    { count: sold },
    { count: totalReservations },
    { count: pending },
    { count: confirmed },
    { count: clients },
    { data: confirmedVentes },
    { count: totalVentes },
  ] = results

  const chiffreAffaires = confirmedVentes.reduce((sum, v) => sum + Number(v.prix_final), 0)
  const nombreVentes = confirmedVentes.length
  const panierMoyen = nombreVentes > 0 ? chiffreAffaires / nombreVentes : 0

  // Regroupe le CA confirmé par mois (clé "YYYY-MM"), pour le graphique ventes/mois du
  // dashboard. Basé sur created_at (date d'enregistrement de la vente), pas date_vente.
  const parMois = {}
  for (const v of confirmedVentes) {
    const key = v.created_at.slice(0, 7)
    parMois[key] = (parMois[key] || 0) + Number(v.prix_final)
  }

  res.json({
    vehicles: { total: totalVehicles, available, reserved, sold },
    reservations: { total: totalReservations, pending, confirmed },
    ventes: {
      total: totalVentes,
      confirmees: nombreVentes,
      chiffreAffaires,
      panierMoyen,
      parMois,
    },
    clients,
  })
}

// GET /api/admin/clients — liste des clients
async function listClients(req, res) {
  const { limit = 50, offset = 0 } = req.query

  const limitNum = Math.min(parseInt(limit) || 50, 100)
  const offsetNum = Math.max(parseInt(offset) || 0, 0)

  const { data, error, count } = await adminModel.findClients({ limit: limitNum, offset: offsetNum })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count, limit: limitNum, offset: offsetNum })
}

// DELETE /api/admin/clients/:id — supprimer un client (auth + profil)
async function deleteClient(req, res) {
  const { error } = await adminModel.deleteClient(req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}

module.exports = { stats, listClients, deleteClient }
