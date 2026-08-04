# Back — authentification et sécurité

| Page | Contenu |
|---|---|
| **Cette page** | API sans session, les deux middlewares, 401 vs 403, le rôle admin |
| [validation.md](validation.md) | Contrôles métier, validation des entrées, échappement HTML |
| [entetes-http.md](entetes-http.md) | CSP, CORS, messages d'erreur, `trust proxy` |

Voir aussi [../../JWT.md](../../JWT.md) pour le jeton lui-même, et
[../supabase/cles-et-rls.md](../supabase/cles-et-rls.md) pour les clés et la RLS.

---

## Le principe général

Le serveur **n'a pas de session**. Il ne stocke rien entre deux requêtes, pas de cookie de
connexion, pas de mémoire de qui est en ligne. Chaque requête protégée doit porter elle-même
sa preuve d'identité : un **JWT** émis par Supabase Auth, dans l'en-tête HTTP.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

C'est ce qu'on appelle une API *stateless*. Avantage : n'importe quelle instance du serveur
peut traiter n'importe quelle requête, et un redémarrage ne déconnecte personne.

## Les deux middlewares — `server/middleware/auth.js`

Le fichier fait une cinquantaine de lignes et contient toute l'autorisation du projet.

```text
getTokenFromHeader(req)   Extrait le token après "Bearer ". Retourne null si l'en-tête
                          est absent ou mal formé.

verifyToken(token)        Appelle supabase.auth.getUser(token).
                          Supabase vérifie la signature et l'expiration, puis renvoie
                          l'utilisateur. Retourne { user } ou { error }.

requireAuth               Token valide obligatoire. Sinon → 401.
                          Puis remplit req.user et passe la main.

requireAdmin              Idem, PLUS : user.app_metadata.role === 'admin'.
                          Sinon → 403.
```

### La distinction 401 / 403, question classique du jury

- **401 Unauthorized** = « je ne sais pas qui tu es » (token absent, invalide ou expiré)
- **403 Forbidden** = « je sais qui tu es, et tu n'as pas le droit » (connecté mais pas admin)

### Le point subtil : `app_metadata` et non `user_metadata`

Le rôle admin est lu dans `user.app_metadata.role`. Ce n'est pas un détail :

| Champ | Modifiable par l'utilisateur ? |
|---|---|
| `user_metadata` | **Oui** — via `supabase.auth.updateUser()` depuis le navigateur |
| `app_metadata` | **Non** — seul le back-office Supabase ou la clé `service_role` peut l'écrire |

Si le rôle était stocké dans `user_metadata`, n'importe quel utilisateur connecté pourrait
se promouvoir administrateur en une ligne de JavaScript dans sa console.

### Attention : deux notions de « admin » cohabitent

| Où | Source | À quoi ça sert |
|---|---|---|
| **Serveur** — `middleware/auth.js` | `user.app_metadata.role` (dans le JWT signé) | **La vraie autorisation.** Fait foi. |
| **Front** — `AuthContext` | `profiles.role` (une colonne de table) | Seulement afficher ou masquer des liens et des pages |

Le front peut se tromper ou être contourné — ce n'est que de l'affichage. Même si quelqu'un
forçait `profile.role = 'admin'` dans son navigateur pour faire apparaître le menu admin,
chaque appel à `/api/admin/*` serait rejeté en 403 par le serveur.

**Formule à retenir pour l'oral** : *le front décide ce qu'on voit, le serveur décide ce
qu'on peut faire.*
