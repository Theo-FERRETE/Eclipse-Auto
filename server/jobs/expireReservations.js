// Remet automatiquement un véhicule "available" une fois la période d'essai
// terminée. Rien dans ce projet ne surveillait le temps avant ça (tout était
// déclenché par une requête HTTP) : c'est le seul mécanisme périodique.
// setInterval suffit ici (un seul process serveur, pas de cron distribué à
// coordonner) — pas besoin d'une dépendance supplémentaire comme node-cron.

const reservationModel = require('../models/reservationModel')

async function expireReservations() {
  const { data, error } = await reservationModel.expireCompleted()

  if (error) {
    console.error('[Essais] Erreur lors de la remise en disponible automatique :', error.message)
    return
  }

  if (data?.length) {
    console.log(`[Essais] ${data.length} essai(s) terminé(s) automatiquement, véhicule(s) remis disponible(s).`)
  }
}

// Vérifie tout de suite au démarrage (les essais expirés pendant que le
// serveur était éteint ne doivent pas attendre le premier intervalle), puis
// toutes les intervalMs.
function startExpirationJob(intervalMs = 15 * 60 * 1000) {
  expireReservations()
  return setInterval(expireReservations, intervalMs)
}

module.exports = { expireReservations, startExpirationJob }
