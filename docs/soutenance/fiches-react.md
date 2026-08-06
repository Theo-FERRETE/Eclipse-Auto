# Fiches React : anatomie des fonctions principales

Version courte. Le but : que tu puisses regarder une fonction de ton code et dire "ça, je sais l'expliquer".

---

## Les hooks en une phrase chacun

| Hook | En une phrase |
|---|---|
| `useState` | Une variable qui redéclenche un rendu quand elle change. |
| `useEffect` | Du code qui s'exécute après le rendu (fetch, abonnement) : le tableau `[...]` dit quand le relancer. |
| `useMemo` | Recalcule une valeur seulement si ses dépendances changent (évite du recalcul inutile). |
| `useContext` | Partage une donnée (ex: `user`) à tout l'arbre sans la repasser en props à chaque niveau. |
| Props | Données/fonctions données par le parent à l'enfant, lecture seule. |

---

## Anatomie des fonctions principales

### `handleChange` : un seul handler pour tout un formulaire
[AdminVehicles.jsx:45](../../client/src/pages/admin/AdminVehicles/AdminVehicles.jsx#L45)
```js
function handleChange(e) {
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
}
```
- `form` = un seul `useState` objet pour les 11 champs du véhicule (pas 11 states séparés).
- `[e.target.name]` = la clé à mettre à jour est lue directement sur l'attribut `name` de l'input HTML.
- `prev => ({...})` = copie l'ancien objet, écrase juste le champ modifié.
- Un seul `onChange={handleChange}` branché sur tous les inputs du modal.

### `fetchVehicles` : le pattern loading / fetch / setState
[AdminVehicles.jsx:35](../../client/src/pages/admin/AdminVehicles/AdminVehicles.jsx#L35)
```js
async function fetchVehicles() {
  setLoading(true)
  const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
  setVehicles(data || [])
  setLoading(false)
}
```
Ce pattern (`setLoading(true)` → `await` → `setState(data)` → `setLoading(false)`) revient dans presque toutes les pages qui chargent des données (Catalogue, Dashboard, AdminReservations...).

### `handleSubmit` : un seul formulaire pour créer ET modifier
[AdminVehicles.jsx:74](../../client/src/pages/admin/AdminVehicles/AdminVehicles.jsx#L74)
```js
async function handleSubmit(e) {
  e.preventDefault()
  setError(null); setSubmitting(true)
  const payload = { brand: form.brand, /* ...tout le form transformé/typé */ }
  try {
    const token = await getToken()
    const res = await fetch(editing ? `/api/vehicles/${editing}` : '/api/vehicles', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')
    setSuccess(editing ? 'Modifié avec succès.' : 'Ajouté avec succès.')
    await fetchVehicles()
    setTimeout(() => closeForm(), 1500)
  } catch (err) {
    setError(err.message || 'Une erreur est survenue.')
  } finally {
    setSubmitting(false)
  }
}
```
- `editing` (un state qui contient soit `null` soit l'id du véhicule) décide : `PUT` (modifier) si on édite, `POST` (créer) sinon, même fonction, même formulaire, même modal pour les deux cas.
- `e.preventDefault()` : empêche le rechargement de page par défaut du `<form>`.
- `try/catch/finally` : `finally` garantit que `setSubmitting(false)` s'exécute que ça réussisse ou échoue (sinon le bouton resterait bloqué sur "Enregistrement...").
- Après succès : on recharge la liste (`fetchVehicles()`) puis on ferme le modal après un court délai (`setTimeout`) pour laisser voir le message de succès.

### `toggleEquipement` : ajouter/retirer un id d'une liste
[VehicleDetail.jsx:37](../../client/src/pages/VehicleDetail/VehicleDetail.jsx#L37)
```js
function toggleEquipement(id) {
  setSelectedEquipementIds(prev =>
    prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
  )
}
```
Déjà dedans → on le retire (`filter`). Pas encore dedans → on l'ajoute (`[...prev, id]`). Jamais de mutation directe du tableau.

### `handleCancel` : état de chargement par élément (pas global)
[Dashboard.jsx:32](../../client/src/pages/Dashboard/Dashboard.jsx#L32)
```js
async function handleCancel(id) {
  if (cancelling.has(id)) return
  setCancelling(prev => new Set(prev).add(id))

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/reservations/${id}/cancel`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${session?.access_token}` },
  })

  if (res.ok) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
  } else {
    setCancelError('Impossible d\'annuler cette réservation. Veuillez réessayer.')
  }
  setCancelling(prev => { const s = new Set(prev); s.delete(id); return s })
}
```
- `cancelling` est un `Set` d'ids en cours d'annulation → chaque bouton de réservation peut afficher "..." individuellement, pas toute la liste qui se bloque.
- `if (cancelling.has(id)) return` : empêche un double-clic de lancer deux annulations en parallèle.
- Le token JWT est repris de la session Supabase et envoyé en `Authorization` : le serveur revérifie que la réservation appartient bien à l'utilisateur avant d'annuler.

### `useEffect` de chargement : VehicleDetail
[VehicleDetail.jsx:16](../../client/src/pages/VehicleDetail/VehicleDetail.jsx#L16)
```js
useEffect(() => {
  async function fetchVehicle() {
    setLoading(true)
    const { data, error } = await getVehicleBySlug(slug)
    if (error || !data) { navigate('/catalogue'); return }
    setVehicle(data)
    setLoading(false)
    const res = await fetch('/api/equipements')
    if (res.ok) setEquipements(await res.json())
  }
  fetchVehicle()
}, [slug, navigate])
```
- Se relance si `slug` change (navigation vers une autre fiche véhicule).
- Fonction `async` définie *à l'intérieur* de l'effet puis appelée, `useEffect` ne peut pas prendre directement une fonction `async` en callback.
- Si le véhicule n'existe pas → redirection vers le catalogue plutôt qu'une page cassée.

### `useEffect` avec nettoyage (cleanup) : Catalogue
[Catalogue.jsx:22](../../client/src/pages/Catalogue/Catalogue.jsx#L22)
```js
useEffect(() => {
  fetchVehicles()
  window.addEventListener('focus', fetchVehicles)

  const channel = supabase
    .channel('catalogue-vehicles')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles' }, payload => {
      setVehicles(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v))
    })
    .subscribe()

  return () => {
    window.removeEventListener('focus', fetchVehicles)
    supabase.removeChannel(channel)
  }
}, [])
```
- Deux abonnements en direct : `focus` (recharge si on revient sur l'onglet) + canal **Supabase Realtime** (le catalogue se met à jour tout seul si un autre client réserve un véhicule).
- Le `return () => {...}` désabonne les deux quand le composant quitte l'écran, sinon fuite mémoire et mises à jour d'état sur un composant qui n'existe plus.

### `filtered` : useMemo pour éviter de refiltrer à chaque rendu
[Catalogue.jsx:73](../../client/src/pages/Catalogue/Catalogue.jsx#L73)
```js
const filtered = useMemo(() => {
  let result = [...vehicles]
  if (search) result = result.filter(v => v.brand.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
  if (filters.brand) result = result.filter(v => v.brand === filters.brand)
  if (sort === 'price_asc') result.sort((a, b) => a.price - b.price)
  return result
}, [vehicles, filters, sort, search])
```
Ne recalcule le filtrage/tri que si `vehicles`, `filters`, `sort` ou `search` changent, pas quand `page` change par exemple.

### `useAuth()` : le contexte en une ligne d'usage
[lib/AuthContext.jsx:61](../../client/src/lib/AuthContext.jsx#L61)
```js
export function useAuth() {
  return useContext(AuthContext)
}
```
N'importe quel composant fait `const { user, isAdmin } = useAuth()` sans repasser ces valeurs en props à travers chaque niveau parent → enfant.

---

## Props : le strict nécessaire

```js
// Parent
<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

// Enfant - reçoit tout, ne gère aucun état lui-même
function Pagination({ page, totalPages, onPageChange }) {
  return <button onClick={() => onPageChange(page - 1)}>←</button>
}
```
- `onPageChange` est une fonction : l'enfant l'appelle, le parent décide ce qu'il se passe (ici, `setPage`). C'est comme ça qu'un enfant "remonte" une info sans jamais modifier l'état du parent directement.
- Même logique pour `AdminVehicleModal` (`onChange`, `onSubmit`, `onClose`) et `DashboardReservations` (`onCancel`).

---

## Questions rapides

- **"Pourquoi `prev => ({...prev, x})` et pas juste modifier l'objet ?"** → React détecte le changement par référence. Muter l'objet garde la même référence, donc React ne re-render pas.
- **"Pourquoi `try/catch/finally` dans `handleSubmit` ?"** → `finally` garantit que `setSubmitting(false)` s'exécute même en cas d'erreur, sinon le bouton reste bloqué.
- **"Pourquoi le `return` dans le `useEffect` du catalogue ?"** → Désabonner le listener et le canal Realtime au démontage, sinon fuite mémoire.
- **"Comment un même formulaire gère création et modification ?"** → Un state `editing` (id ou `null`) choisit `POST`/`PUT` et le texte des boutons, le reste du code est identique.
