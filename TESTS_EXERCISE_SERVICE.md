# Tests du Service d'Exercices (Exercise Service)

**Branche**: `feat/exercise-service`
**Date**: 2026-07-22
**Statut**: ✅ Tous les tests passés

## Résumé

Le service d'exercices permet aux praticiens de gérer un catalogue d'exercices et d'assigner des exercices aux patients. Tous les endpoints ont été testés avec succès.

## Services Testés

### 1. Gestion du Catalogue d'Exercices (`/api/v1/exercises/catalog`)

#### ✅ Test 1: Créer un exercice
```bash
POST /api/v1/exercises/catalog
```
**Payload:**
```json
{
  "name": "Flexion du genou",
  "description": "Exercice de flexion du genou pour renforcer les quadriceps",
  "category": "Rééducation genou",
  "instructions": "1. Position debout\n2. Fléchir le genou à 90 degrés\n3. Maintenir 5 secondes\n4. Répéter 10 fois",
  "videoUrl": "https://example.com/video1.mp4",
  "imageUrl": "https://example.com/image1.jpg"
}
```
**Résultat:** ✅ Exercice créé avec ID `exercise_560c5175ae54417b975e351f0ad2dae2`

#### ✅ Test 2: Créer un deuxième exercice
```bash
POST /api/v1/exercises/catalog
```
**Payload:**
```json
{
  "name": "Extension lombaire",
  "description": "Exercice pour renforcer les muscles lombaires",
  "category": "Rééducation dos",
  "instructions": "1. Allongé sur le ventre\n2. Soulever le buste\n3. Maintenir 10 secondes\n4. Répéter 8 fois"
}
```
**Résultat:** ✅ Exercice créé avec ID `exercise_58f89b0bdf4b4c6d93a49f1a384762df`

#### ✅ Test 3: Lister tous les exercices
```bash
GET /api/v1/exercises/catalog
```
**Résultat:** ✅ Retourne 2 exercices avec tous les champs correctement formatés en snake_case

#### ✅ Test 4: Récupérer un exercice par ID
```bash
GET /api/v1/exercises/catalog/exercise_560c5175ae54417b975e351f0ad2dae2
```
**Résultat:** ✅ Exercice récupéré avec succès

#### ✅ Test 5: Mettre à jour un exercice
```bash
PUT /api/v1/exercises/catalog/exercise_560c5175ae54417b975e351f0ad2dae2
```
**Payload:**
```json
{
  "name": "Flexion du genou (modifié)",
  "description": "Exercice de flexion du genou pour renforcer les quadriceps et améliorer la mobilité",
  "category": "Rééducation genou",
  "instructions": "1. Position debout\n2. Fléchir le genou à 90 degrés\n3. Maintenir 10 secondes (modifié)\n4. Répéter 15 fois (modifié)",
  "videoUrl": "https://example.com/video1_updated.mp4",
  "imageUrl": "https://example.com/image1_updated.jpg"
}
```
**Résultat:** ✅ Exercice mis à jour avec succès, `updated_at` changé

#### ✅ Test 6: Filtrer par catégorie
```bash
GET /api/v1/exercises/catalog?category=Rééducation%20genou
```
**Résultat:** ✅ Filtre fonctionne (recherche insensible à la casse)

#### ✅ Test 7: Rechercher des exercices
```bash
GET /api/v1/exercises/catalog?query=genou
```
**Résultat:** ✅ Retourne l'exercice contenant "genou" dans le nom ou la description

#### ✅ Test 14: Supprimer un exercice du catalogue
```bash
DELETE /api/v1/exercises/catalog/exercise_58f89b0bdf4b4c6d93a49f1a384762df
```
**Résultat:** ✅ HTTP 204 No Content, exercice supprimé

### 2. Gestion des Assignations d'Exercices aux Patients (`/api/v1/exercises/assignments`)

#### ✅ Test 8: Créer un patient
```bash
POST /api/v1/patients
```
**Payload:**
```json
{
  "mrn": "PAT001",
  "first_name": "Pierre",
  "last_name": "Durand",
  "birth_date": "1980-05-15",
  "sex": "M",
  "contact": {
    "email": "pierre.durand@example.com",
    "phone": "0612345678",
    "address": "123 Rue de la Santé, 75014 Paris"
  }
}
```
**Résultat:** ✅ Patient créé avec ID `patient_248520e8b93c455f8ce03f031260e6f5`

#### ✅ Test 9: Assigner un exercice à un patient
```bash
POST /api/v1/exercises/assignments
```
**Payload:**
```json
{
  "patientId": "patient_248520e8b93c455f8ce03f031260e6f5",
  "exerciseId": "exercise_560c5175ae54417b975e351f0ad2dae2",
  "notes": "Faire cet exercice 3 fois par semaine",
  "sets": 3,
  "reps": 15,
  "frequency": "3x/semaine"
}
```
**Résultat:** ✅ Assignation créée avec ID `patient_exercise_b05cf1c8b3d044e4baa9bd724301b574`

#### ✅ Test 10: Lister toutes les assignations de l'utilisateur
```bash
GET /api/v1/exercises/assignments
```
**Résultat:** ✅ Retourne 1 assignation avec tous les champs

#### ✅ Test 11: Lister les assignations pour un patient spécifique
```bash
GET /api/v1/exercises/assignments?patientId=patient_248520e8b93c455f8ce03f031260e6f5
```
**Résultat:** ✅ Retourne les assignations filtrées par patient

#### ✅ Test 12: Récupérer une assignation par ID
```bash
GET /api/v1/exercises/assignments/patient_exercise_b05cf1c8b3d044e4baa9bd724301b574
```
**Résultat:** ✅ Assignation récupérée avec succès

#### ✅ Test 13: Mettre à jour une assignation
```bash
PUT /api/v1/exercises/assignments/patient_exercise_b05cf1c8b3d044e4baa9bd724301b574
```
**Payload:**
```json
{
  "status": "in_progress",
  "notes": "Exercice en cours, le patient progresse bien",
  "sets": 4,
  "reps": 20
}
```
**Résultat:** ✅ Assignation mise à jour avec succès
- Status changé de "assigned" à "in_progress"
- Sets passé de 3 à 4
- Reps passé de 15 à 20
- Notes mises à jour
- `updated_at` changé

#### ✅ Test 15: Supprimer une assignation
```bash
DELETE /api/v1/exercises/assignments/patient_exercise_b05cf1c8b3d044e4baa9bd724301b574
```
**Résultat:** ✅ HTTP 204 No Content, assignation supprimée

## Corrections Apportées

### Fix 1: Type de user_id
**Problème:** La colonne `user_id` était définie comme UUID dans la migration mais les utilisateurs ont des IDs de type INTEGER.

**Solution:**
- Modification de l'entité `PatientExercise` pour utiliser `type: 'integer'` au lieu de `type: 'uuid'`
- Modification de la migration pour utiliser `INTEGER` au lieu de `UUID`
- Commit: `fix(exercises): change user_id type from UUID to INTEGER`

## Validation

### Authentification
- ✅ Tous les endpoints nécessitent un token JWT valide
- ✅ Seuls les utilisateurs avec le rôle PRATICIEN peuvent accéder aux endpoints

### Validation des données
- ✅ Les DTOs valident correctement les champs requis
- ✅ Les URLs sont validées avec @IsUrl
- ✅ Les nombres sont validés avec @IsInt, @Min
- ✅ Les enums sont validés avec @IsEnum

### Isolation des données
- ✅ Les assignations sont filtrées par userId
- ✅ Un praticien ne peut voir que ses propres assignations

### Contraintes de la base de données
- ✅ Foreign key de `patient_exercises.exercise_id` vers `exercises.id` avec CASCADE DELETE
- ✅ Index créés sur `patient_id` et `user_id` pour les performances

## Schéma de base de données

### Table `exercises`
```sql
CREATE TABLE "exercises" (
  "id"           VARCHAR PRIMARY KEY,
  "name"         VARCHAR NOT NULL,
  "description"  TEXT NOT NULL,
  "category"     VARCHAR NOT NULL,
  "instructions" TEXT NOT NULL,
  "video_url"    VARCHAR,
  "image_url"    VARCHAR,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table `patient_exercises`
```sql
CREATE TABLE "patient_exercises" (
  "id"          VARCHAR PRIMARY KEY,
  "patient_id"  VARCHAR NOT NULL,
  "exercise_id" VARCHAR NOT NULL,
  "user_id"     INTEGER NOT NULL,
  "status"      VARCHAR NOT NULL DEFAULT 'assigned',
  "notes"       TEXT,
  "sets"        INTEGER,
  "reps"        INTEGER,
  "frequency"   VARCHAR,
  "assigned_at" TIMESTAMPTZ NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_patient_exercise_exercise" FOREIGN KEY ("exercise_id")
    REFERENCES "exercises" ("id") ON DELETE CASCADE
);

CREATE INDEX "idx_patient_exercises_patient_id" ON "patient_exercises" ("patient_id");
CREATE INDEX "idx_patient_exercises_user_id" ON "patient_exercises" ("user_id");
```

## Conclusion

✅ **Tous les tests sont passés avec succès**

Le service d'exercices est entièrement fonctionnel et prêt à être intégré dans l'application. Tous les endpoints CRUD fonctionnent correctement pour le catalogue d'exercices et les assignations aux patients.
