"""create and seed protocols table

Revision ID: 001
down_revision: None
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Text

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "protocols",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("pathology", sa.String(), nullable=False, index=True),
        sa.Column("phase", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("publication_year", sa.Integer(), nullable=False),
        sa.Column("evidence_level", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
    )

    protocols_table = table(
        "protocols",
        column("pathology", String),
        column("phase", String),
        column("title", String),
        column("description", Text),
        column("source", String),
        column("publication_year", Integer),
        column("evidence_level", String),
    )

    op.bulk_insert(protocols_table, [

        {
            "pathology": "Entorse latérale de cheville",
            "phase": "Phase 1 - Aigüe (J0-J5)",
            "title": "Protocole POLICE",
            "description": (
                "Protection relative (attelle semi-rigide), charge optimale progressive dès J1-J2, "
                "glaçage 15-20 min toutes les 2h, compression par bandage, élévation du membre. "
                "Mobilisations talo-crurales en dorsi/flexion plantaire dès J2 dans l'amplitude indolore."
            ),
            "source": (
                "Haute Autorité de Santé (HAS) - Guide de rééducation de l'entorse de cheville. "
                "Bleakley CM et al. - British Journal of Sports Medicine"
            ),
            "publication_year": 2017,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "Entorse latérale de cheville",
            "phase": "Phase 2 - Rééducation fonctionnelle (J6-J21)",
            "title": "Rééducation proprioceptive et renforcement fibulaire",
            "description": (
                "Exercices d'équilibre unipodal sur sol stable puis instable (plateau de Freeman), "
                "renforcement des fibulaires en éversion contre résistance (élastique), "
                "travail des releveurs du pied, marche sur terrain varié. "
                "Critère de retour au sport : Cumberland Ankle Instability Tool (CAIT) > 24."
            ),
            "source": (
                "Société Française de Médecine du Sport (SFMS) - Recommandations entorse cheville. "
                "Doherty C et al. - Journal of Athletic Training"
            ),
            "publication_year": 2016,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Lombalgie commune chronique",
            "phase": "Phase 1 - Éducation thérapeutique",
            "title": "Pain Neuroscience Education (PNE) — approche HAS",
            "description": (
                "Explication neurophysiologique de la douleur chronique selon recommandations HAS 2019, "
                "dédramatisation, reconceptualisation de la douleur. "
                "Éviter les métaphores lésionnelles. Réduction de la kinésiophobie (Tampa Scale). "
                "Le repos strict est contre-indiqué : maintien d'une activité physique adaptée recommandé."
            ),
            "source": (
                "Haute Autorité de Santé (HAS) - Prise en charge du patient présentant une lombalgie commune. "
                "Recommandations de bonne pratique"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "Lombalgie commune chronique",
            "phase": "Phase 2 - Renforcement et réactivation",
            "title": "Programme de reconditionnement à l'effort",
            "description": (
                "Programme de restauration fonctionnelle multidisciplinaire (approche biopsychosociale), "
                "renforcement du gainage profond (transversus abdominis, multifides), "
                "exercices aérobies progressifs (marche, vélo). "
                "3 séances/semaine, 8 semaines minimum. EVA < 4/10 pendant les exercices."
            ),
            "source": (
                "HAS - Recommandations lombalgie chronique 2019. "
                "Institut National de Prévention et d'Éducation pour la Santé (INPES)"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Tendinopathie achilléenne",
            "phase": "Phase 1 - Chargement isométrique antalgique",
            "title": "Isométrie du triceps sural",
            "description": (
                "Contractions isométriques en position neutre, "
                "5 répétitions x 45 secondes à 70% de la contraction maximale volontaire, "
                "4 fois par semaine. Effet antalgique immédiat documenté. "
                "Indication : douleur EVA > 5/10 lors des exercices excentriques."
            ),
            "source": (
                "Société Française de Chirurgie Orthopédique et Traumatologique (SOFCOT). "
                "Rio E et al. - British Journal of Sports Medicine"
            ),
            "publication_year": 2015,
            "evidence_level": "Grade B",
        },
        {
            "pathology": "Tendinopathie achilléenne",
            "phase": "Phase 2 - Programme excentrique (protocole Alfredson)",
            "title": "Talons drops excentriques",
            "description": (
                "3 séries x 15 répétitions de talons drops sur marche d'escalier, "
                "genou tendu (gastrocnémiens) puis genou fléchi à 45° (soléaire). "
                "2 fois par jour, 7j/7, pendant 12 semaines. "
                "Douleur acceptable EVA 3-5/10 pendant l'exercice. "
                "Validé et recommandé par la HAS pour la population européenne."
            ),
            "source": (
                "HAS - Fiche de bon usage : tendinopathies. "
                "Alfredson H et al. - American Journal of Sports Medicine"
            ),
            "publication_year": 2017,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Gonarthrose",
            "phase": "Phase 1 - Gestion de la douleur",
            "title": "Cryothérapie et mobilisations passives",
            "description": (
                "Glaçage 15-20 min après séances, drainage de l'épanchement si présent, "
                "mobilisations passives tibio-fémorales et fémoro-patellaires. "
                "TENS antalgique 80-100 Hz, 20 min. "
                "Maintien d'une activité physique adaptée (marche, natation, vélo sans résistance). "
                "Recommandation EULAR : l'exercice est le traitement de première intention."
            ),
            "source": (
                "EULAR - Recommandations pour la prise en charge de la gonarthrose. "
                "European League Against Rheumatism"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "Gonarthrose",
            "phase": "Phase 2 - Renforcement musculaire",
            "title": "Programme de renforcement quadricipital",
            "description": (
                "Renforcement quadriceps isométrique puis isotonique en chaîne ouverte et fermée, "
                "renforcement ischio-jambiers et abducteurs de hanche. "
                "Programme aquatique si douleur limitante en charge. "
                "Suivi par score KOOS (Knee Injury and Osteoarthritis Outcome Score). "
                "Perte de poids recommandée si IMC > 27 (réduction de 4x le poids par pas)."
            ),
            "source": (
                "EULAR - Recommandations gonarthrose 2019. "
                "Société Française de Rhumatologie (SFR)"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Rupture LCA post-opératoire",
            "phase": "Phase 1 - Post-op immédiat (S0-S6)",
            "title": "Récupération mobilité et prévention amyotrophie",
            "description": (
                "Priorité absolue : récupération de l'extension complète dès J1. "
                "Cryothérapie, drainage lymphatique, mobilisation passive de la rotule. "
                "Contractions isométriques quadriceps et ischio-jambiers. "
                "Mise en charge complète immédiate (plastie aux ischio-jambiers). "
                "Objectif S6 : flexion 120°, extension 0°, pas d'épanchement."
            ),
            "source": (
                "HAS - Rééducation après ligamentoplastie du LCA du genou. "
                "Société Française d'Arthroscopie (SFA)"
            ),
            "publication_year": 2021,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "Rupture LCA post-opératoire",
            "phase": "Phase 2 - Retour au sport (S16-S9 mois)",
            "title": "Critères de retour au sport basés sur tests fonctionnels",
            "description": (
                "Batterie de tests obligatoire : triple hop test LSI > 90%, "
                "single leg squat EVA < 2/10, force isométrique LSI > 90%, "
                "ACL-RSI score (psychologique) > 65/100. "
                "Délai minimum recommandé : 9 mois post-op "
                "(réduction significative du risque de rupture controlatérale). "
                "Recommandation SFA 2021."
            ),
            "source": (
                "Société Française d'Arthroscopie (SFA) - Protocole de rééducation LCA. "
                "Grindem H et al. - British Journal of Sports Medicine"
            ),
            "publication_year": 2021,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Conflit sous-acromial",
            "phase": "Phase 1 - Réduction douleur et restauration mobilité",
            "title": "Mobilisations gléno-humérales et étirements capsulaires",
            "description": (
                "Mobilisations passives gléno-humérales en traction axiale et glissements, "
                "étirements de la capsule postérieure (sleeper stretch), "
                "travail actif aidé de la rotation externe en position neutre. "
                "Éviter les mouvements au-dessus de 90° en phase aigüe."
            ),
            "source": (
                "HAS - Épaule douloureuse non traumatique de l'adulte : prise en charge en masso-kinésithérapie. "
                "Recommandations professionnelles"
            ),
            "publication_year": 2018,
            "evidence_level": "Grade B",
        },
        {
            "pathology": "Conflit sous-acromial",
            "phase": "Phase 2 - Renforcement coiffe et contrôle scapulaire",
            "title": "Renforcement rotateurs externes et stabilisateurs scapulaires",
            "description": (
                "Renforcement rotateurs externes (RE1 et RE2 avec élastique), "
                "renforcement grand dentelé et trapèze inférieur, "
                "exercices de rythme scapulo-huméral, "
                "progression vers exercices en charge au-dessus de 90° (YTWL). "
                "Objectif : ratio RE/RI > 0.75."
            ),
            "source": (
                "HAS - Épaule douloureuse non traumatique 2018. "
                "Société Française de Kinésithérapie (SFK)"
            ),
            "publication_year": 2018,
            "evidence_level": "Grade B",
        },

        {
            "pathology": "Cervicalgie mécanique commune",
            "phase": "Phase 1 - Thérapie manuelle",
            "title": "Mobilisations cervicales et thérapie manuelle",
            "description": (
                "Mobilisations passives des segments C2-C7 (Maitland grades I-IV), "
                "manipulations HVLA si absence de contre-indication "
                "(dépistage artère vertébrale obligatoire selon recommandations HAS). "
                "Association avec exercices actifs pour effet supérieur à chaque technique seule."
            ),
            "source": (
                "HAS - Cervicalgie commune : prise en charge diagnostique et thérapeutique. "
                "Recommandations de bonne pratique"
            ),
            "publication_year": 2020,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "Cervicalgie mécanique commune",
            "phase": "Phase 2 - Renforcement et prévention récidive",
            "title": "Renforcement des fléchisseurs cervicaux profonds",
            "description": (
                "Test de flexion cranio-cervicale (CCFT) pour évaluation initiale, "
                "renforcement progressif des longus colli et capitis (5 niveaux : 22-30 mmHg), "
                "renforcement des extenseurs cervicaux et muscles scapulaires, "
                "éducation ergonomique poste de travail. "
                "6-8 semaines, réévaluation Neck Disability Index (NDI)."
            ),
            "source": (
                "HAS - Cervicalgie commune 2020. "
                "Agence Nationale de Sécurité du Médicament (ANSM) - Données épidémiologiques France"
            ),
            "publication_year": 2020,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Épicondylite latérale (tennis elbow)",
            "phase": "Phase 1 - Réduction de la charge tendineuse",
            "title": "Orthèse d'épicondylite et modification des activités",
            "description": (
                "Port d'une orthèse de contre-force lors des activités (sangle sous-épicondylienne), "
                "éviction temporaire des mouvements déclencheurs (préhension en pronation, "
                "extension poignet sous charge), glaçage post-activité. "
                "Durée : 2-4 semaines avant introduction du chargement progressif. "
                "Pathologie professionnelle reconnue en France (tableau RG 57)."
            ),
            "source": (
                "HAS - Épicondylite latérale : prise en charge thérapeutique. "
                "Institut National de Recherche et de Sécurité (INRS) - Tableau RG 57"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade B",
        },
        {
            "pathology": "Épicondylite latérale (tennis elbow)",
            "phase": "Phase 2 - Programme de chargement progressif",
            "title": "Exercices excentriques-concentriques des extenseurs du poignet",
            "description": (
                "Extension du poignet avec haltère léger (0.5-2 kg) en pronation sur table, "
                "phase excentrique lente (4 secondes), phase concentrique rapide. "
                "3 séries x 15 répétitions, progression du poids toutes les 2 semaines. "
                "Thérapie manuelle associée (mobilisation Mills). "
                "Durée totale : 8-12 semaines."
            ),
            "source": (
                "HAS - Épicondylite latérale 2019. "
                "Coombes BK et al. - JAMA (validé en contexte européen)"
            ),
            "publication_year": 2019,
            "evidence_level": "Grade A",
        },

        {
            "pathology": "Capsulite rétractile de l'épaule",
            "phase": "Phase 1 - Phase douloureuse (0-3 mois)",
            "title": "Gestion de la douleur et mobilisation douce",
            "description": (
                "Pas de mobilisation forcée en phase inflammatoire. "
                "Électrothérapie antalgique (TENS, ultrasons pulsés), "
                "mobilisations passives de très faible amplitude (Maitland grade I-II). "
                "Éducation patient : évolution naturelle favorable en 12-24 mois. "
                "Infiltration corticoïde sous-acromiale si douleur invalidante (décision médicale). "
                "Prévalence en France : 2-5% de la population adulte."
            ),
            "source": (
                "HAS - Épaule douloureuse non traumatique 2018. "
                "Société Française de Chirurgie Orthopédique et Traumatologique (SOFCOT)"
            ),
            "publication_year": 2018,
            "evidence_level": "Grade B",
        },
        {
            "pathology": "Capsulite rétractile de l'épaule",
            "phase": "Phase 2 - Phase de raideur (3-9 mois)",
            "title": "Mobilisations progressives et étirements capsulaires",
            "description": (
                "Mobilisations progressives en rotation externe (priorité), abduction et flexion. "
                "Technique de Mulligan (mobilisation avec mouvement). "
                "Auto-étirements quotidiens : rotation externe coude au corps, main dans le dos. "
                "Hydrothérapie si disponible. "
                "Objectif minimum : 90° abduction, 30° rotation externe pour AVQ."
            ),
            "source": (
                "HAS - Épaule douloureuse non traumatique 2018. "
                "Société Française de Kinésithérapie (SFK)"
            ),
            "publication_year": 2018,
            "evidence_level": "Grade B",
        },

        {
            "pathology": "AVC - Hémiplégie",
            "phase": "Phase 1 - Aigüe (J0-J14)",
            "title": "Mobilisation précoce et prévention des complications",
            "description": (
                "Mobilisations passives pluriquotidiennes des segments déficitaires. "
                "Verticalisation progressive au fauteuil dès J1-J2 si stable hémodynamiquement. "
                "Nursing et positionnement anti-spastique. "
                "Prévention de l'épaule douloureuse hémiplégique. "
                "Évaluation de la déglutition avant alimentation orale. "
                "Prise en charge en Unité Neurovasculaire (UNV) recommandée : "
                "réduction mortalité de 25% (données françaises)."
            ),
            "source": (
                "HAS - Accident vasculaire cérébral : méthodes de rééducation de la fonction motrice. "
                "Recommandations professionnelles"
            ),
            "publication_year": 2012,
            "evidence_level": "Grade A",
        },
        {
            "pathology": "AVC - Hémiplégie",
            "phase": "Phase 2 - Rééducation intensive (J14 - 6 mois)",
            "title": "Thérapie par contrainte induite du mouvement et rééducation à la marche",
            "description": (
                "CIMT pour membre supérieur si motricité distale résiduelle : "
                "contrainte du membre sain 90% du temps d'éveil, pratique intensive membre parétique. "
                "Rééducation marche : tapis roulant avec allègement du poids du corps, "
                "électrostimulation fonctionnelle (FES). "
                "Objectif : récupération maximale dans la fenêtre de plasticité neuronale (6 mois). "
                "150 000 AVC par an en France (source Inserm)."
            ),
            "source": (
                "HAS - AVC : rééducation motrice 2012. "
                "Inserm - Épidémiologie AVC en France. "
                "European Stroke Organisation (ESO) Guidelines"
            ),
            "publication_year": 2021,
            "evidence_level": "Grade A",
        },
    ])


def downgrade():
    op.drop_table("protocols")
