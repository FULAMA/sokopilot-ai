# SOKOPILOT AI — Registre des 32 connecteurs

> Version: 1.0 — 24 novembre 2026  
> Périmètre: contribution directe au produit ou indirecte à sa conception, son développement, sa sécurité, son acquisition ou son exploitation.  
> Règle: disponibilité dans ChatGPT ≠ compte connecté ≠ intégration dans SOKOPILOT. Aucun connecteur n'est déclaré opérationnel sans preuve de test.

## Légende des états

- **À évaluer** : rôle défini, intégration non commencée.
- **Disponible** : outil accessible dans l'environnement de travail, mais connexion métier non vérifiée.
- **Partiellement utilisé** : utilisé pour construire ou documenter le projet, sans intégration runtime dans l'application.
- **Connecté** : connexion de compte vérifiée, mais cela ne prouve pas encore une intégration dans l'application.
- **Intégré / testé** : action réelle, sécurisée et testée de bout en bout. Aucun connecteur n'atteint encore cet état.

## Registre

| # | Connecteur | Participation prévue | Mode | État vérifié au 24-11-2026 |
|---:|---|---|---|---|
| 1 | Activepieces | Orchestration des workflows inter-applications, reprises sur erreur et déclencheurs métier | Indirect + runtime via backend | Partiellement utilisé : projet disponible, connexion Supabase présente; aucun flow SOKOPILOT publié |
| 2 | Adobe | Création des supports commerciaux, visuels de campagne et documents de marque | Indirect | Disponible, intégration non commencée |
| 3 | AgentMail | Boîte de test dédiée aux emails transactionnels et scénarios QA | Indirect | À évaluer, connexion non vérifiée |
| 4 | AnyQR | QR codes pour formulaires d'inscription, pages de campagne et suivi de provenance | Direct, optionnel | Disponible, intégration non commencée |
| 5 | Automations | Rappels planifiés, surveillance des indicateurs et alertes opérationnelles | Indirect | Disponible, aucune automatisation SOKOPILOT créée |
| 6 | BCD Bridge Control Delegate | Accès contrôlé à un poste de développement autorisé pour tests et opérations locales | Indirect | Disponible sous réserve d'un appareil appairé et d'autorisations |
| 7 | Base44 | Prototype alternatif / comparaison rapide de parcours UX | Indirect | Projet vide créé; pas de connexion backend utilisable vérifiée |
| 8 | CodeWords | Génération et hébergement d'outils auxiliaires ou microservices si le besoin est confirmé | Indirect | Disponible, non utilisé |
| 9 | Firecrawl | Collecte contrôlée de données publiques de centres de formation pour la prospection et la veille | Direct via pipeline d'import | Disponible, aucune collecte SOKOPILOT exécutée |
| 10 | GitHub | Source de vérité du code, issues, revues, CI et traçabilité des versions | Indirect + intégration développeur | Partiellement utilisé et connecté : branches/PR/CI inspectées; workflow qualité + npm audit + Gitleaks CLI actifs sur la branche d'audit |
| 11 | Gmail | Réception des demandes de démonstration, suivi commercial et support interne | Direct via backend / indirect pour l'équipe | Connecteur disponible; intégration produit non testée |
| 12 | HAPI MCP Registry | Découverte de serveurs MCP spécialisés utiles aux connecteurs futurs | Indirect | Partiellement utilisé : recherche de scanners de secrets effectuée; Gitleaks Cloud trouvé via Apify mais non activé (jeton Apify et facturation requis) |
| 13 | Lovable | Prototypage UX et comparaison de génération d'interfaces | Indirect | Projet SokoPilot Revenue Hub existant, génération limitée par crédits |
| 14 | Make Agent Fast | Agent conversationnel de support ou qualification, seulement si plan actif et coût viable | Direct, conditionnel | Non opérationnel : plan expiré signalé |
| 15 | Manus | Recherche approfondie, tâches multi-étapes et assistance à l'exploitation | Indirect | Disponible, non utilisé dans le runtime |
| 16 | Metricool | Planification et analyse des publications sociales des campagnes clientes | Direct via intégration autorisée | Disponible, compte/connexion client non vérifié |
| 17 | Microsoft Outlook Email | Canal email alternatif pour organisations utilisant Microsoft 365 | Direct via backend | Connecteur disponible, connexion produit non testée |
| 18 | MongoDB Atlas | Stockage documentaire spécialisé si un besoin réel justifie MongoDB | Indirect / optionnel | Disponible, aucun cluster SOKOPILOT créé |
| 19 | Notion | Documentation produit, décisions d'architecture, procédures et base de connaissances interne | Indirect | Partiellement utilisé : blueprint et validation commerciale créés |
| 20 | OpenSEO | Recherche de mots-clés et suivi SEO des pages publiques / campagnes | Direct via connecteur autorisé | Disponible, projet SEO client non configuré |
| 21 | Plugin Creator | Création future d'une intégration privée SOKOPILOT si une API métier le justifie | Indirect | Disponible, aucun plugin créé |
| 22 | Plugin Management | Inventaire, installation et gouvernance des connecteurs de l'environnement de travail | Indirect | Partiellement utilisé : recherche de scanners de sécurité (Snyk et alternatives); aucun scanner gratuit approprié retenu; ne constitue pas un connecteur runtime client |
| 23 | Render | Hébergement de services backend, workers et tâches planifiées si le plan gratuit suffit | Indirect + infrastructure | Workspace accessible, aucun service SOKOPILOT déployé |
| 24 | Replit | Environnement alternatif de prototypage et validation technique | Indirect | Disponible, non utilisé pour le dépôt principal |
| 25 | Resend | Emails transactionnels, notifications et suivi de livraison | Direct via backend | Disponible, domaine et clé de production non configurés |
| 26 | Resume Maker | Recrutement interne : fiches de poste et processus de sélection des premiers collaborateurs | Indirect, ponctuel | Disponible, non utilisé |
| 27 | Supabase | PostgreSQL, Auth, Storage et politiques RLS pour le backend multi-tenant | Direct + infrastructure | Connecteur disponible; projets existants à préserver; aucun projet dédié SOKOPILOT créé |
| 28 | Supermetrics Marketing Agent | Consolidation des performances marketing et attribution des campagnes | Direct, phase analytique | Disponible, sources marketing client non connectées |
| 29 | TinyFish | Recherche web et navigation assistée pour veille, prospection et QA des parcours web | Indirect | Connexion GitHub signalée; solde négatif bloque les nouvelles opérations navigateur |
| 30 | tldraw | Schémas d'architecture, parcours utilisateurs et ateliers de conception | Indirect | Partiellement utilisé : tableau d'architecture SOKOPILOT créé |
| 31 | WordPress | Site vitrine, contenu SEO et pages d'acquisition si le canal est retenu | Direct, optionnel | Site Digital Book Factory existant à préserver; aucun site SOKOPILOT créé |
| 32 | Zoho CRM | Import/export ou synchronisation avec des clients déjà équipés de Zoho | Direct, optionnel | Disponible, connexion client non vérifiée |

## Principes d'architecture

1. Le navigateur SOKOPILOT ne stocke jamais de secrets d'intégration.
2. Les appels aux fournisseurs passent par le backend ou un orchestrateur sécurisé.
3. Chaque connecteur possède une interface/adaptateur isolé, des permissions minimales, des délais d'expiration, une gestion des erreurs et des journaux expurgés.
4. Les actions sensibles (envoi, publication, paiement, suppression, changement de statut critique) exigent une validation humaine ou une politique métier explicite.
5. Les connecteurs optionnels ne doivent pas rendre le cœur CRM indisponible.
6. Les intégrations doivent être activables par tenant, avec consentement et révocation.
7. Les données de démonstration ne doivent jamais être mélangées aux données réelles.
8. Les coûts, limites gratuites, conditions d'utilisation et traitements de données doivent être revérifiés avant chaque mise en production.

## Ordre d'implémentation recommandé

- **Phase 0 — Fondations** : GitHub, Notion, tldraw, Activepieces (orchestration de développement et documentation).
- **Phase 1 — Backend sûr** : Supabase dédié, Auth, RLS, audit logs, secrets serveur.
- **Phase 2 — Acquisition** : formulaires web, QR (AnyQR), import de données publiques (Firecrawl), Meta/WhatsApp uniquement après validation légale et technique.
- **Phase 3 — Conversion** : email (Gmail/Outlook/Resend), calendrier, relances avec approbation humaine.
- **Phase 4 — Marketing** : Metricool, OpenSEO, Supermetrics, Adobe.
- **Phase 5 — Écosystème** : Zoho, WordPress, AgentMail, outils auxiliaires et MCP spécialisés.
- **Phase 6 — Optimisation** : automatisations, monitoring, reporting et agents supervisés.

## Preuve d'intégration obligatoire

Pour passer à **Intégré / testé**, ajouter dans le dossier de documentation du connecteur :
- cas d'usage et propriétaire métier;
- schéma des données entrantes/sortantes;
- scopes OAuth ou permissions exactes;
- mode de stockage/rotation/révocation des secrets;
- gestion des erreurs, retries, idempotence et limites de débit;
- test positif, test d'échec et test d'isolation entre tenants;
- preuve de fonctionnement non sensible (logs expurgés ou capture);
- estimation du coût récurrent et vérification des limites du plan gratuit.

**Aucune promesse de connexion réelle n'est faite par la seule présence de ce registre.**


## Preuve d'utilisation — audit sécurité du 24 novembre 2026

- GitHub : inspection du dépôt et de son historique, vérification des PR et exécutions CI.
- Gitleaks CLI v8.30.1 (MIT) : 32 commits analysés, environ 396 993 octets inspectés, aucun secret détecté.
- npm audit : zéro vulnérabilité signalée au niveau high ou supérieur.
- HAPI MCP Registry : découverte d'un scanner Gitleaks Cloud, écarté car son exécution passe par Apify et nécessite un jeton facturable.
- Plugin Management : recherche d'intégrations Snyk et d'alternatives de sécurité; aucune installation supplémentaire n'a été déclenchée.
- Rapport détaillé : [SECURITY-AUDIT.md](./SECURITY-AUDIT.md).

Cette preuve concerne l'usage des connecteurs pour construire et sécuriser le projet; elle ne signifie pas que ces connecteurs sont intégrés au runtime client de SOKOPILOT AI.
