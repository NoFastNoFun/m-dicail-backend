from ..clean_text_logic.text_utils import clean_text_for_query


def test_clinical_note_basic():
    result = clean_text_for_query(
        "Le patient souffre d'une entorse de la cheville droite avec oedème."
    )
    assert result == ["patient", "souffre", "entorse", "cheville", "droite", "oedeme"]


def test_full_uppercase():
    result = clean_text_for_query("LE PATIENT présente UNE Fracture DU genou GAUCHE")
    assert result == ["patient", "presente", "fracture", "genou", "gauche"]


def test_heavy_punctuation():
    result = clean_text_for_query("douleur, inflammation, rougeur, chaleur, oedème!!!")
    assert result == ["douleur", "inflammation", "rougeur", "chaleur", "oedeme"]



def test_ligature_oe():
    result = clean_text_for_query("douleur au niveau du cœur")
    assert result == ["douleur", "niveau", "coeur"]


def test_only_stop_words():
    result = clean_text_for_query("la le la")
    assert result == []


def test_keeps_numbers():
    result = clean_text_for_query("fracture L4 L5")
    assert result == ["fracture", "l4", "l5"]
