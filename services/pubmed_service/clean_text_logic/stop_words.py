STOP_WORDS = {
    # articles
    "le", "la", "les", "l", "un", "une", "des", "du", "de", "d",
    "au", "aux",

    # pronoms personnels
    "je", "j", "tu", "il", "elle", "nous", "vous", "ils", "elles",
    "me", "m", "te", "t", "se", "s", "lui", "leur", "leurs",
    "moi", "toi", "eux", "soi", "y", "en",

    # pronoms démonstratifs / indéfinis
    "ce", "cet", "cette", "ces", "ceci", "cela", "ca",
    "on", "quelqu", "chacun", "chacune", "aucun", "aucune",
    "tout", "tous", "toute", "toutes", "autre", "autres",

    # pronoms relatifs / interrogatifs
    "qui", "que", "qu", "quoi", "dont", "ou", "quel", "quels",
    "quelle", "quelles", "lequel", "laquelle", "lesquels", "lesquelles",

    # prépositions
    "a", "dans", "par", "pour", "sur", "sous", "avec", "sans",
    "entre", "vers", "chez", "des", "dès", "depuis", "avant",
    "apres", "pendant", "contre", "selon", "parmi", "voici", "voila",

    # conjonctions
    "et", "ou", "ni", "mais", "donc", "car", "or", "soit",
    "que", "quand", "comme", "si", "lorsque", "puisque", "bien",

    # adverbes courants
    "ne", "n", "pas", "plus", "moins", "tres", "aussi", "si",
    "meme", "encore", "toujours", "jamais", "ici", "la", "oui",
    "non", "peut", "alors", "ainsi", "deja", "trop",

    # possessifs
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
    "notre", "nos", "votre", "vos",

    # conjugaisons de être
    "suis", "es", "est", "sommes", "etes", "sont",
    "etais", "etait", "etions", "etiez", "etaient",
    "serai", "seras", "sera", "serons", "serez", "seront",
    "serais", "serait", "serions", "seriez", "seraient",
    "fus", "fut", "fumes", "futes", "furent",
    "sois", "soit", "soyons", "soyez", "soient",
    "ete", "etre",

    # conjugaisons de avoir
    "ai", "as", "avons", "avez", "ont",
    "avais", "avait", "avions", "aviez", "avaient",
    "aurai", "auras", "aura", "aurons", "aurez", "auront",
    "aurais", "aurait", "aurions", "auriez", "auraient",
    "eut", "eumes", "eutes", "eurent", "eu",
    "aie", "aies", "ait", "ayons", "ayez", "aient",
    "avoir",
}
