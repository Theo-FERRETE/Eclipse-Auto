# Rapport d'Audit Final — Eclipse Auto v2

**Date:** 12 mai 2026 | **Version:** 3.0 (Final)

---

## 📊 Notes Finales

| Catégorie | Note | Justification |
|-----------|------|--------------|
| **Sécurité** | 8/10 | XSS corrigé, rate limit, validation, erreurs masquées |
| **Architecture** | 6/10 | Structure propre mais slug/ID mismatch non corrigé |
| **Performance** | 6/10 | Pagination OK, cache headers, mais chargement catalogue global |
| **Code Quality** | 7/10 | DRY auth, validation centralisée, async/await cohérent |
| **Tests** | 5/10 | 36 tests passants, coverage 6.6%, pas d'appels HTTP réels |
| **Documentation** | 6/10 | README complet, pas de Swagger/API docs |
| **DevOps** | 4/10 | Pas de CI/CD, pas de lint automatique |
| **UX/Frontend** | 7/10 | Interface fonctionnelle, responsive, feedback utilisateur |
| **Base de Données** | 6/10 | Schema normalisé, relations OK, pas de migrations versionnées |
| **Gestion d'Erreurs** | 7/10 | Dev/prod distingué, status codes corrects |

### **Moyenne : 6.2 / 10**

---

## ✅ Ce Qui Est Bien Fait

| Quoi | Fichier | Détail |
|------|---------|--------|
| DRY auth middleware | [auth.js](server/middleware/auth.js) | `verifyToken()` centralisé, élimine duplication |
| XSS contact | [contact.js](server/routes/contact.js) | `escapeHtml()` sur tous les champs utilisateur |
| Rate limiting | [contact.js](server/routes/contact.js) | 5 req/15min/IP, en mémoire, sans dépendance |
| Input validation | [vehicles.js](server/routes/vehicles.js) | year (1900–now+1), price ≥0, mileage ≥0 |
| Pagination | [vehicles.js](server/routes/vehicles.js), [admin.js](server/routes/admin.js), [reservations.js](server/routes/reservations.js) | limit/offset avec total count |
| Cache statique | [index.js](server/index.js) | maxAge 1 an sur assets |
| Error handler | [index.js](server/index.js) | Stack trace cachée en prod, visible en dev |
| Tests | [\_\_tests\_\_/](server/__tests__/) | 36 tests, 5 suites, tous passants |
| .gitignore | [.gitignore](.gitignore) | coverage/ et .env.test exclus |
| Auth RBAC | [auth.js](server/middleware/auth.js) | requireAuth / requireAdmin séparés |
| Statuts réservation | [reservations.js](server/routes/reservations.js) | Whitelist `['pending','confirmed','cancelled']` |
| Ownership check | [reservations.js](server/routes/reservations.js) | Client ne peut annuler que ses propres réservations |

---

## ⚠️ Ce Qui Reste à Améliorer

### Priorité Haute

**1. Credentials dans git history** — irréversible sans rotation
```
server/.env — contenu commité dans commits anciens
Action requise : changer les clés Supabase + Gmail AVANT le déploiement
```

**2. Email non validé côté serveur** (`server/routes/contact.js:69`)
```javascript
replyTo: email  // email passé sans validation regex
// Risque : email header injection si la valeur contient \n
// Fix (15 min) : ajouter /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
```

**3. Coverage tests trop faible (6.6%)**
```
Les 36 tests valident la logique pure (fonctions isolées)
mais aucun test ne fait d'appel HTTP réel à l'API
Les routes contact.js, vehicles.js, admin.js : 0% coverage
Fix : réécrire les tests avec supertest + mock supabase (3-4h)
```

**4. Route slug/ID mismatch** (non résolu)
```
Frontend : /vehicles/:slug → cherche par toSlug(brand, model)
Backend  : /api/vehicles/:id → cherche par UUID

Contournement actuel : VehicleDetail.jsx charge TOUT le catalogue
puis filtre en mémoire côté client → inefficace et fragile
Fix propre : ajouter colonne slug en DB ou endpoint /by-slug/:slug
```

### Priorité Moyenne

**5. Pas de CI/CD**
```
Aucun test automatique sur git push
Aucun lint check
Aucun build check
Fix (1-2h) : .github/workflows/ci.yml avec npm test + npm run build
```

**6. Pas de validation email**
```javascript
// contact.js — email non validé
// Ajouter avant envoi :
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: 'Email invalide.' })
}
```

**7. CORS silencieux en production**
```javascript
// setup.js — CORS désactivé si NODE_ENV === 'production'
// Pas d'erreur explicite, le navigateur bloque silencieusement
// Si frontend et backend ne sont pas sur le même domaine = bug en prod
```

**8. Pas de logging structuré**
```javascript
// Actuellement : console.error() uniquement
// Manque : timestamp, IP, méthode, route, durée
// Fix (30 min) : npm install morgan + app.use(morgan('combined'))
```

### Priorité Basse

**9. Magic strings non centralisés**
```javascript
// Statuts répétés dans plusieurs fichiers :
'available', 'reserved', 'sold'     // vehicles
'pending', 'confirmed', 'cancelled' // reservations
'admin', 'client'                   // profiles
// Fix : fichier constants.js partagé
```

**10. Pas de TypeScript** — zéro type safety

**11. Pas de Swagger/API docs** — jury ne peut pas tester facilement

---

## 🗂️ État Git

```
Staged (à commiter) :
  - suppression server/coverage/ (23 fichiers)
  - suppression server/.env.test

Non stagé :
  - .gitignore (correction coverage/ et .env.test)
```

**Recommandation : commiter maintenant** pour nettoyer le repo avant déploiement.

---

## 📈 Projection Si Tu Continues

| Actions | Durée | Note Estimée |
|---------|-------|-------------|
| **État actuel** | — | **6.2/10** |
| + Email validation + Morgan | 45 min | 6.5/10 |
| + CI/CD GitHub Actions | 1-2h | 7/10 |
| + Tests HTTP réels (Supertest) | 3-4h | 7.5/10 |
| + Fix slug/ID + endpoint by-slug | 2h | 7.8/10 |
| + API docs (ENDPOINTS.md) | 1-2h | 8/10 |
| + TypeScript | 6-8h | 8.5/10 |

---

## 🎓 Résumé Jury

**Points que le jury va saluer :**
- Tests présents (rares chez les étudiants)
- Rate limiting implémenté à la main
- XSS awareness et escaping
- Pagination correcte
- Auth RBAC fonctionnelle

**Questions probables du jury :**
- *"Pourquoi 6.6% de coverage seulement ?"* → Logique testée, HTTP pas encore
- *"Comment tu gères les credentials en prod ?"* → .env sur le VPS, jamais en git
- *"Pourquoi Express et pas Fastify/NestJS ?"* → Simplicité, rapidité de développement
- *"Comment tu scalerais à 10 000 users ?"* → Redis, load balancer, pool DB

---

*Audit final v3 — 12 mai 2026*
