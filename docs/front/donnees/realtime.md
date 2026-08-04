← [Les données](README.md)

# Le Realtime — `pages/Catalogue/Catalogue.jsx`

C'est la seule utilisation du Realtime Supabase du projet.

```js
const channel = supabase
  .channel('catalogue-vehicles')
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vehicles' },
      payload => {
        patchCachedVehicle(payload.new)
        setVehicles(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v))
      })
  .subscribe()
```

**Ce que ça fait** : Supabase ouvre un **WebSocket** et pousse au navigateur chaque `UPDATE`
sur la table `vehicles`. Concrètement, quand l'admin confirme une réservation, le véhicule
passe `available` → `reserved` (via le trigger PostgreSQL) et le badge change **en direct**
sur l'écran de tous les visiteurs, sans rechargement.

**Pourquoi seulement `UPDATE`** : ce qui intéresse le catalogue, ce sont les changements de
statut. Un ajout ou une suppression de véhicule est une action de back-office, plus rare, et
qui sera reprise au prochain chargement.

## Le nettoyage est obligatoire

Le `return` du `useEffect` fait `removeEventListener` + `supabase.removeChannel(channel)`.
Sans ce nettoyage, chaque visite du catalogue ouvrirait un WebSocket de plus, jamais fermé —
une fuite classique.

## Le lien avec la CSP

Le Realtime passe par `wss://` et non par du HTTP. C'est pour ça que la CSP du serveur doit
autoriser explicitement ce protocole, sinon le navigateur bloque la connexion en production.
Voir [../../back/securite/entetes-http.md](../../back/securite/entetes-http.md).
