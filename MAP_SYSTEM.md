# 🗺️ Système de Map Interactive (Cyber-Dofus)

Ce projet utilise un système de navigation 2D basé sur une grille, inspiré de Dofus, avec un rendu optimisé en React et un backend sous AdonisJS 6.

## 🚀 Fonctionnalités
- **Déplacement A*** : Chemin automatique évitant les obstacles.
- **Multijoueur Temps Réel** : Synchronisation des mouvements via SSE (AdonisJS Transmit).
- **Import Tiled & LDtk** : Création de maps visuelles via vos éditeurs préférés.
- **Système de Portails** : Changement de zone automatique lors de la marche sur un déclencheur.

---

## 🎨 Création de Maps avec Tiled
- **Format** : JSON.
- **Calque `Base`** : Décor de sol.
- **Calque `Collisions`** : Tuiles bloquantes.
- **Calque d'Objets** : Entités de type `teleport`, `shop`, `dungeon`.

## 🎨 Création de Maps avec LDtk
- **Format** : JSON.
- **IntGrid `Collisions`** : Utilisez une couche de type IntGrid nommée "Collisions" pour les obstacles.
- **Entities** : Créez des entités nommées `Teleport`, `Shop` ou `Dungeon`.
    - Pour `Teleport`, ajoutez un champ `targetMapId` (Integer).
- **Tiles/AutoLayer** : Le premier tileset trouvé sera utilisé pour le rendu.

---

## 📥 Importation dans le jeu

### 1. Préparer les fichiers
1. Placez votre image de **Tileset** dans : `public/assets/maps/tilesets/`.
2. Exportez votre map en **JSON**.

### 2. Lancer l'importation
```bash
# Pour Tiled (par défaut)
node ace map:import "chemin/map.json" "Nom Zone" "slug"

# Pour LDtk
node ace map:import "chemin/map.json" "Level_Identifier" "slug" --format=ldtk
```

---

## 🛠️ Détails Techniques
- **`MapService.ts`** : Contient l'algorithme A* et les parsers Tiled/LDtk.
- **`MapsController.ts`** : Gère l'état initial et les requêtes.
- **`MapPage.tsx`** : Rendu React avec CSS Grid et animation de marche.
