# SOKOPILOT AI — Architecture cible du backend multi-tenant

> Statut : conception uniquement. Aucun projet Supabase n'a été créé ou modifié.
> Date : 24 novembre 2026.

## 1. Décision d'architecture

- Frontend : React + TypeScript (application actuelle).
- Identité : Supabase Auth.
- Données transactionnelles : PostgreSQL via Supabase.
- Autorisation : membership organisationnel vérifié en base + Row Level Security (RLS).
- Fichiers : Supabase Storage avec politiques tenant-scoped.
- Traitements asynchrones et intégrations : Activepieces et/ou Edge Functions, selon le besoin.
- Secrets tiers : uniquement côté serveur / coffre de secrets, jamais dans le navigateur ni dans Git.
- L'application de démonstration localStorage reste un mode démo isolé; elle ne devient pas la source de vérité du produit réel.

## 2. Modèle métier initial

| Table | Rôle | Tenant key |
|---|---|---|
| organizations | Entreprises clientes / espaces de travail | id |
| organization_members | Utilisateurs, organisations et rôles | organization_id |
| leads | Prospects et pipeline commercial | organization_id |
| offers | Catalogue d'offres | organization_id |
| follow_up_tasks | Relances et échéances | organization_id |
| campaigns | Campagnes commerciales | organization_id |
| activity_events | Historique métier | organization_id |
| integration_connections | Connexions OAuth et métadonnées non secrètes | organization_id |
| automation_rules | Règles activées par organisation | organization_id |
| automation_runs | Exécutions, résultats et erreurs expurgées | organization_id |
| audit_events | Journal d'accès et d'actions sensibles | organization_id |

Toutes les tables métier doivent inclure organization_id NOT NULL. Les clés étrangères composées doivent empêcher de relier un prospect, une relance ou une campagne appartenant à un autre tenant. Utiliser des identifiants UUID, des timestamps UTC et des contraintes CHECK pour les montants, devises et statuts.

## 3. Modèle d'autorisation

- Un utilisateur peut appartenir à plusieurs organisations.
- Rôles initiaux : owner, admin, manager, sales, viewer. Les permissions seront définies par action, pas seulement par le nom du rôle.
- L'organisation active n'est jamais acceptée comme preuve d'autorisation lorsqu'elle provient uniquement du client.
- Chaque requête vérifie l'appartenance réelle de auth.uid() à organization_members.
- Les politiques RLS sont activées sur chaque table du schéma exposé.
- Les politiques UPDATE doivent comporter USING et WITH CHECK; les opérations UPDATE nécessitent également une politique SELECT.
- Ne jamais utiliser user_metadata modifiable par l'utilisateur pour autoriser une action.
- Les fonctions privilégiées éventuelles doivent être rares, isolées dans un schéma non exposé, avec search_path fixé, vérification explicite de auth.uid(), droits EXECUTE minimaux et tests dédiés.

## 4. Isolation tenant et intégrité

- organization_id obligatoire sur chaque ligne métier.
- Clés uniques tenant-scoped : par exemple UNIQUE (organization_id, external_reference).
- Clés étrangères composites (organization_id, id) pour prévenir les références inter-tenant.
- Tests négatifs obligatoires : un membre de A ne lit, ne modifie ni ne supprime aucune donnée de B, même en connaissant son UUID.
- Aucun endpoint ne doit faire confiance à un organization_id reçu sans contrôle d'appartenance.
- Les exports, recherches, fichiers, notifications et jobs asynchrones doivent appliquer le même périmètre tenant.

## 5. Connecteurs et sécurité

Une connexion tierce est enregistrée par tenant avec fournisseur, scopes consentis, état, dates de création/expiration et identifiant de référence externe. Les tokens d'accès et refresh ne sont jamais exposés au client ni stockés en clair dans une table accessible par l'API publique.

Chaque exécution d'intégration doit :
1. vérifier le tenant et l'utilisateur déclencheur;
2. vérifier le consentement, les scopes et l'état de connexion;
3. appliquer une clé d'idempotence;
4. limiter le débit et respecter les quotas fournisseur;
5. journaliser le résultat sans token, contenu sensible ou secret;
6. gérer timeout, retries bornés, dead-letter et révocation.

Les envois de messages, campagnes, paiements et publications restent en mode brouillon/validation humaine jusqu'à activation explicite par le propriétaire du tenant.

## 6. Observabilité et conformité

- Journal d'audit append-only pour les opérations sensibles.
- Secrets masqués dans les logs et traces.
- Durées de conservation configurables et minimisation des données.
- Export et suppression des données tenant avec procédure contrôlée.
- Sauvegardes et procédure de restauration testée.
- Limites d'usage et quotas par organisation.
- Prévoir l'analyse des obligations applicables en RDC et dans les pays des clients avant commercialisation.

## 7. Data API Supabase — précaution actuelle

Le changelog Supabase annonce qu'à compter du 30 octobre 2026, les nouvelles tables ne sont plus exposées automatiquement à la Data API. Il faudra explicitement sélectionner les schémas/tables à exposer et accorder les privilèges requis, tout en activant RLS. L'exposition API et l'autorisation ligne par ligne sont deux contrôles distincts.

## 8. Environnements

- local : données synthétiques, clés locales.
- preview/staging : projet Supabase dédié, jeux de tests synthétiques.
- production : projet et secrets séparés, accès administratifs limités, backups et monitoring.
- Ne jamais réutiliser les projets Supabase personnels existants de l'utilisateur pour SOKOPILOT AI.

## 9. Conditions avant première migration

- Projet Supabase dédié explicitement créé.
- Région et résidence des données décidées.
- Schéma SQL revu et versionné.
- Tests RLS automatisés avec au moins deux utilisateurs et deux organisations.
- Advisors sécurité et performance exécutés.
- Plan de sauvegarde, restauration et révocation testé.
- Aucune donnée réelle importée avant validation de ces contrôles.
