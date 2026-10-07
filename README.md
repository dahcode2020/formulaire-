# Bordereau de transfert de pli — maquette

Prototype front-end en français pour préparer un bordereau de transfert de pli. Le parcours comporte six étapes :

1. Expéditeur — mission, service, référent et coordonnées professionnelles.
2. Destinataire — mission, contact autorisé et confirmation d’autorisation.
3. Contenu — catégorie générale, nombre de pièces et poids estimé.
4. Confidentialité — niveau de diffusion indicatif, étiquette de classification non secrète et masquage par rubrique dans l’export.
5. Transport — mode et créneau d’enlèvement général.
6. Récapitulatif — vérification, signature dessinée non certifiée ou signature manuscrite après impression, puis export A4 en PDF.

## Démarrer

```bash
npm install
npm run dev -- --host 0.0.0.0
```

La configuration Vite autorise les hôtes de prévisualisation Arena (`.e2b.app`) et Bolt/WebContainer (`.webcontainer-api.io`) pour le serveur de développement et le serveur de prévisualisation. Après une modification de cette configuration, redémarrer le serveur.

Vérifier la version de production :

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Données et limites de la maquette

Le formulaire n’a pas de backend : les valeurs restent en mémoire dans la page et ne sont pas enregistrées ni transmises. Le PDF A4 est généré côté navigateur par jsPDF. Les rubriques cochées comme masquées sont remplacées dans le PDF ; les valeurs originales ne sont pas ajoutées au PDF pour ces champs. L’aperçu à l’écran reste complet pour vérification.

Le code de classification est présenté comme une **étiquette non secrète**, jamais comme un mot de passe, PIN ou code d’accès. La signature dessinée est locale et non certifiée ; l’option de signature papier réserve une zone à signer après impression. Les niveaux d’accès sont des repères de démonstration, pas une classification officielle. La maquette ne doit pas recevoir d’information classifiée, de secret opérationnel, d’itinéraire détaillé ni de procédure de sécurité.

## Avant toute mise en production

Faire valider l’identité et le mandat de l’opérateur, les règles de classification/diffusion applicables, l’identité des personnes habilitées, les mentions de confidentialité, la durée de conservation, les contrôles d’accès, le canal sécurisé de transmission et la valeur juridique de la signature. La maquette ne représente aucune mission, administration ou entreprise de transport réelle.
