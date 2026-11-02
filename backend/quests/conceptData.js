// Auto-generated from the Open Design quest-engine.js (2026-10-31), with four
// post-generation patches (do not edit by hand; re-apply on regeneration):
//   1. five-good ocrePrefixes restored to live-verified canonical slugs
//      (ric.2.tr/.hdn., ric.3.ant., ric.3.m_aur. — AI memory 2026-10-12).
//   2. Faustina aliases completed: labels spell Senior/Junior while the
//      roster uses Elder/Younger (2026-10-31).
//   3. Twelve Powers: Ceres swapped for Concordia (2026-10-31).
//   4. Imperial Women: the 2026-10-31 re-curation had dropped Lucilla,
//      Crispina, Julia Soaemias, and Severina — reinstated (Mark: "Add
//      the ones dropped"). 16 slots; the "twelve wives" copy updated.
module.exports.QUEST_CATALOG = [
  {
    "id": "five-good",
    "title": "The Five Good Emperors",
    "dates": "AD 96–180",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Nerva to Marcus Aurelius — the adopted succession that steadied Rome for almost a century.",
    "intro": "Nerva, Trajan, Hadrian, Antoninus Pius, and Marcus Aurelius. The adopted succession that gave Rome almost a century of stability, and one of the most collected runs of imperial coinage.",
    "badge": {
      "name": "Five Good Emperors",
      "art": "temple"
    },
    "requirements": [
      {
        "id": "nerva",
        "ruler": "Nerva",
        "reign": "AD 96–98",
        "qualifies": "Any coin issued in Nerva’s name. Denarii are the traditional choice, but every denomination qualifies.",
        "issuers": [
          "Nerva"
        ],
        "aliases": [
          "Marcus Cocceius Nerva"
        ],
        "ocrePrefixes": [
          "ric.2.ner.",
          "ric.2.nerva."
        ]
      },
      {
        "id": "trajan",
        "ruler": "Trajan",
        "reign": "AD 98–117",
        "qualifies": "Any coin issued in Trajan’s name, including coins struck before he became sole emperor.",
        "issuers": [
          "Trajan"
        ],
        "aliases": [
          "Traianus",
          "Marcus Ulpius Traianus"
        ],
        "ocrePrefixes": [
          "ric.2.tr.",
          "ric.2.trajan.",
          "ric.2_2(2).tr."
        ]
      },
      {
        "id": "hadrian",
        "ruler": "Hadrian",
        "reign": "AD 117–138",
        "qualifies": "Any coin issued in Hadrian’s name.",
        "issuers": [
          "Hadrian"
        ],
        "aliases": [
          "Hadrianus",
          "Publius Aelius Hadrianus"
        ],
        "ocrePrefixes": [
          "ric.2_3(2).hdn.",
          "ric.2.hdn.",
          "ric.2.hadrian."
        ]
      },
      {
        "id": "antoninus-pius",
        "ruler": "Antoninus Pius",
        "reign": "AD 138–161",
        "qualifies": "Any coin issued in his name, including coins struck as Caesar under Hadrian.",
        "issuers": [
          "Antoninus Pius"
        ],
        "aliases": [
          "Titus Aelius Antoninus",
          "Titus Aelius Hadrianus Antoninus"
        ],
        "ocrePrefixes": [
          "ric.3.ant.",
          "ric.3.antoninus_pius."
        ],
        "note": "Coins as Caesar under Hadrian count."
      },
      {
        "id": "marcus-aurelius",
        "ruler": "Marcus Aurelius",
        "reign": "AD 161–180",
        "qualifies": "Any coin issued in his name, including coins from the joint reign with Lucius Verus.",
        "issuers": [
          "Marcus Aurelius"
        ],
        "aliases": [
          "Marcus Annius Verus"
        ],
        "ocrePrefixes": [
          "ric.3.m_aur.",
          "ric.3.marcus_aurelius."
        ],
        "note": "Coins from the joint reign with Lucius Verus count."
      }
    ]
  },
  {
    "id": "twelve-caesars",
    "title": "Suetonius’ Twelve Caesars",
    "dates": "44 BC–AD 96",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "One coin for each ruler in Suetonius’ Lives of the Caesars. Julius Caesar makes this a historical set, not a strictly Imperial one.",
    "intro": "One coin for each ruler in Suetonius’ Twelve Caesars, from Julius Caesar through Domitian. This is a historical set, not a strictly Imperial one: Caesar held power as dictator, not as emperor.",
    "historicalNote": "Why Caesar is here: Suetonius begins his Lives with Julius Caesar. He was dictator of Rome from 49 to 44 BC, not emperor, so this quest is deliberately a historical set.",
    "badge": {
      "name": "Twelve Caesars",
      "art": "bust"
    },
    "requirements": [
      {
        "id": "julius-caesar",
        "ruler": "Julius Caesar",
        "reign": "49–44 BC",
        "qualifies": "Any coin issued in Caesar’s name or under his authority. A denarius is the classic choice.",
        "issuers": [
          "Julius Caesar"
        ],
        "aliases": [
          "Gaius Julius Caesar",
          "Divus Julius"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "augustus",
        "ruler": "Augustus",
        "reign": "27 BC–AD 14",
        "qualifies": "Any coin issued in his name, including coins struck as Octavian before 27 BC.",
        "issuers": [
          "Augustus"
        ],
        "aliases": [
          "Octavian",
          "Gaius Octavius",
          "Augustus Caesar"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "tiberius",
        "ruler": "Tiberius",
        "reign": "AD 14–37",
        "qualifies": "Any coin issued in Tiberius’ name.",
        "issuers": [
          "Tiberius"
        ],
        "aliases": [
          "Tiberius Caesar",
          "Tiberius Claudius Nero"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "caligula",
        "ruler": "Caligula",
        "reign": "AD 37–41",
        "qualifies": "Any coin issued in Caligula’s name.",
        "issuers": [
          "Caligula"
        ],
        "aliases": [
          "Gaius Caligula",
          "Gaius (Caligula)"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "claudius",
        "ruler": "Claudius",
        "reign": "AD 41–54",
        "qualifies": "Any coin issued in Claudius’ name.",
        "issuers": [
          "Claudius"
        ],
        "aliases": [
          "Claudius Caesar",
          "Tiberius Claudius Caesar"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "nero",
        "ruler": "Nero",
        "reign": "AD 54–68",
        "qualifies": "Any coin issued in Nero’s name.",
        "issuers": [
          "Nero"
        ],
        "aliases": [
          "Nero Claudius Caesar",
          "Nero Claudius"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "galba",
        "ruler": "Galba",
        "reign": "AD 68–69",
        "qualifies": "Any coin issued while Galba held power, or in his name.",
        "issuers": [
          "Galba"
        ],
        "aliases": [
          "Servius Sulpicius Galba"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "otho",
        "ruler": "Otho",
        "reign": "AD 69",
        "qualifies": "Any coin issued in Otho’s name during his brief reign.",
        "issuers": [
          "Otho"
        ],
        "aliases": [
          "Marcus Salvius Otho"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "vitellius",
        "ruler": "Vitellius",
        "reign": "AD 69",
        "qualifies": "Any coin issued in Vitellius’ name during his brief reign.",
        "issuers": [
          "Vitellius"
        ],
        "aliases": [
          "Aulus Vitellius"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "vespasian",
        "ruler": "Vespasian",
        "reign": "AD 69–79",
        "qualifies": "Any coin issued in Vespasian’s name.",
        "issuers": [
          "Vespasian"
        ],
        "aliases": [
          "Vespasianus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "titus",
        "ruler": "Titus",
        "reign": "AD 79–81",
        "qualifies": "Any coin issued in Titus’ name.",
        "issuers": [
          "Titus"
        ],
        "aliases": [
          "Titus Caesar Vespasianus"
        ],
        "ocrePrefixes": [],
        "note": "Coins struck while Titus was Caesar under Vespasian count."
      },
      {
        "id": "domitian",
        "ruler": "Domitian",
        "reign": "AD 81–96",
        "qualifies": "Any coin issued in Domitian’s name.",
        "issuers": [
          "Domitian"
        ],
        "aliases": [
          "Domitianus",
          "Titus Flavius Domitianus"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "year-of-four",
    "title": "The Year of Four Emperors",
    "dates": "AD 68–69",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Four emperors in a single year. Galba, Otho, and Vitellius fell in quick succession; Vespasian ended AD 69 in control.",
    "intro": "AD 69 produced four emperors in a single year. Galba, Otho, and Vitellius fell in quick succession, and Vespasian ended the year in control. One coin from each reign completes the set.",
    "badge": {
      "name": "Year of Four Emperors",
      "art": "swords"
    },
    "requirements": [
      {
        "id": "galba",
        "ruler": "Galba",
        "reign": "Jun 68–Jan 69",
        "qualifies": "Any coin issued while Galba was emperor.",
        "issuers": [
          "Galba"
        ],
        "aliases": [
          "Servius Sulpicius Galba"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "otho",
        "ruler": "Otho",
        "reign": "Jan–Apr 69",
        "qualifies": "Any coin issued while Otho was emperor.",
        "issuers": [
          "Otho"
        ],
        "aliases": [
          "Marcus Salvius Otho"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "vitellius",
        "ruler": "Vitellius",
        "reign": "Apr–Dec 69",
        "qualifies": "Any coin issued while Vitellius was emperor.",
        "issuers": [
          "Vitellius"
        ],
        "aliases": [
          "Aulus Vitellius"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "vespasian",
        "ruler": "Vespasian",
        "reign": "Dec 69–79",
        "qualifies": "Any coin issued while Vespasian was emperor.",
        "issuers": [
          "Vespasian"
        ],
        "aliases": [
          "Vespasianus"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "julio-claudians",
    "title": "The Julio-Claudians",
    "dates": "44 BC–AD 68",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Caesar, Augustus, and the four Julio-Claudians who followed: the family line that turned a republic into an empire.",
    "intro": "Six rulers bound by blood, adoption, and civil war. Julius Caesar gives the line its name; Augustus, Tiberius, Caligula, Claudius, and Nero carry it to the edge of collapse.",
    "badge": {
      "name": "The Julio-Claudians",
      "art": "laurelKnot"
    },
    "requirements": [
      {
        "id": "julius-caesar",
        "ruler": "Julius Caesar",
        "reign": "49–44 BC",
        "qualifies": "Any coin issued in Caesar’s name or under his authority.",
        "issuers": [
          "Julius Caesar"
        ],
        "aliases": [
          "Gaius Julius Caesar",
          "Divus Julius"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "augustus",
        "ruler": "Augustus",
        "reign": "27 BC–AD 14",
        "qualifies": "Any coin issued in his name, including coins struck as Octavian.",
        "issuers": [
          "Augustus"
        ],
        "aliases": [
          "Octavian",
          "Gaius Octavius",
          "Augustus Caesar"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "tiberius",
        "ruler": "Tiberius",
        "reign": "AD 14–37",
        "qualifies": "Any coin issued in Tiberius’ name.",
        "issuers": [
          "Tiberius"
        ],
        "aliases": [
          "Tiberius Caesar",
          "Tiberius Claudius Nero"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "caligula",
        "ruler": "Caligula",
        "reign": "AD 37–41",
        "qualifies": "Any coin issued in Caligula’s name.",
        "issuers": [
          "Caligula"
        ],
        "aliases": [
          "Gaius Caligula",
          "Gaius (Caligula)"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "claudius",
        "ruler": "Claudius",
        "reign": "AD 41–54",
        "qualifies": "Any coin issued in Claudius’ name.",
        "issuers": [
          "Claudius"
        ],
        "aliases": [
          "Claudius Caesar",
          "Tiberius Claudius Caesar"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "nero",
        "ruler": "Nero",
        "reign": "AD 54–68",
        "qualifies": "Any coin issued in Nero’s name.",
        "issuers": [
          "Nero"
        ],
        "aliases": [
          "Nero Claudius Caesar",
          "Nero Claudius"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "flavians",
    "title": "The Flavians",
    "dates": "AD 69–96",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Vespasian, Titus, and Domitian: the three Flavians who rebuilt Rome after AD 69 and left it the Colosseum.",
    "intro": "The Flavian house lasted only three reigns, but it rebuilt the city after civil war and gave Rome the Colosseum. One coin from each reign completes the set.",
    "badge": {
      "name": "The Flavians",
      "art": "colosseum"
    },
    "requirements": [
      {
        "id": "vespasian",
        "ruler": "Vespasian",
        "reign": "AD 69–79",
        "qualifies": "Any coin issued in Vespasian’s name.",
        "issuers": [
          "Vespasian"
        ],
        "aliases": [
          "Vespasianus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "titus",
        "ruler": "Titus",
        "reign": "AD 79–81",
        "qualifies": "Any coin issued in Titus’ name.",
        "issuers": [
          "Titus"
        ],
        "aliases": [
          "Titus Caesar Vespasianus"
        ],
        "ocrePrefixes": [],
        "note": "Coins struck while Titus was Caesar under Vespasian count."
      },
      {
        "id": "domitian",
        "ruler": "Domitian",
        "reign": "AD 81–96",
        "qualifies": "Any coin issued in Domitian’s name.",
        "issuers": [
          "Domitian"
        ],
        "aliases": [
          "Domitianus",
          "Titus Flavius Domitianus"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "severans",
    "title": "The Severans",
    "dates": "AD 193–235",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Five Severan rulers from Septimius Severus to Severus Alexander — a dynasty of soldier-backed emperors and recut portraits.",
    "intro": "The Severans came to power after the year 193 and held it for four decades. Their coins are marked by military imagery, dynastic pairings, and portraits recut as power changed hands.",
    "badge": {
      "name": "The Severans",
      "art": "severan"
    },
    "requirements": [
      {
        "id": "septimius-severus",
        "ruler": "Septimius Severus",
        "reign": "AD 193–211",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Septimius Severus"
        ],
        "aliases": [
          "Lucius Septimius Severus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "caracalla",
        "ruler": "Caracalla",
        "reign": "AD 198–217",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Caracalla"
        ],
        "aliases": [
          "Marcus Aurelius Antoninus",
          "Antoninus Caracalla"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "geta",
        "ruler": "Geta",
        "reign": "AD 209–211",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Geta"
        ],
        "aliases": [
          "Publius Septimius Geta"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "elagabalus",
        "ruler": "Elagabalus",
        "reign": "AD 218–222",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Elagabalus"
        ],
        "aliases": [
          "Marcus Aurelius Antoninus",
          "Heliogabalus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "severus-alexander",
        "ruler": "Severus Alexander",
        "reign": "AD 222–235",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Severus Alexander"
        ],
        "aliases": [
          "Marcus Aurelius Severus Alexander"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "soldier-emperors",
    "title": "The Soldier Emperors",
    "dates": "AD 238–268",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Five emperors who ruled through the third-century crisis, when the army made and unmade emperors in quick succession.",
    "intro": "Between 238 and 268 the empire was shaped by the field army. Maximinus Thrax, Gordian III, Philip I, Trajan Decius, and Valerian each reached the throne through military power — and most died by it.",
    "badge": {
      "name": "The Soldier Emperors",
      "art": "helmet"
    },
    "requirements": [
      {
        "id": "maximinus-thrax",
        "ruler": "Maximinus Thrax",
        "reign": "AD 235–238",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Maximinus Thrax"
        ],
        "aliases": [
          "Maximinus I",
          "Gaius Julius Verus Maximinus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "gordian-iii",
        "ruler": "Gordian III",
        "reign": "AD 238–244",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Gordian III"
        ],
        "aliases": [
          "Marcus Antonius Gordianus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "philip-i",
        "ruler": "Philip I",
        "reign": "AD 244–249",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Philip I"
        ],
        "aliases": [
          "Philip the Arab",
          "Marcus Julius Philippus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "trajan-decius",
        "ruler": "Trajan Decius",
        "reign": "AD 249–251",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Trajan Decius"
        ],
        "aliases": [
          "Decius",
          "Gaius Messius Quintus Traianus Decius"
        ],
        "ocrePrefixes": [],
        "note": "A different emperor; must not match Trajan."
      },
      {
        "id": "valerian",
        "ruler": "Valerian",
        "reign": "AD 253–260",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valerian"
        ],
        "aliases": [
          "Valerian I",
          "Publius Licinius Valerianus"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "constantinians",
    "title": "The Constantinians",
    "dates": "AD 306–361",
    "family": "Imperial runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Constantine and his sons: the dynasty that legalised Christianity and remade the empire around a new capital.",
    "intro": "Constantine the Great, Constantine II, Constans, and Constantius II. The Constantinian house transformed imperial religion, coinage, and the idea of the capital itself.",
    "badge": {
      "name": "The Constantinians",
      "art": "chiRho"
    },
    "requirements": [
      {
        "id": "constantine-i",
        "ruler": "Constantine I",
        "reign": "AD 306–337",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantine I"
        ],
        "aliases": [
          "Constantine the Great",
          "Flavius Valerius Constantinus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "constantine-ii",
        "ruler": "Constantine II",
        "reign": "AD 337–340",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantine II"
        ],
        "aliases": [
          "Flavius Claudius Constantinus"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "constans",
        "ruler": "Constans",
        "reign": "AD 337–350",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constans"
        ],
        "aliases": [
          "Flavius Julius Constans"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "constantius-ii",
        "ruler": "Constantius II",
        "reign": "AD 337–361",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantius II"
        ],
        "aliases": [
          "Flavius Julius Constantius"
        ],
        "ocrePrefixes": []
      }
    ]
  },
  {
    "id": "every-emperor",
    "title": "Every Emperor",
    "dates": "27 BC–AD 491",
    "family": "Long runs",
    "unit": "rulers",
    "unitSingular": "ruler",
    "summary": "Seventy-nine rulers from Augustus to Zeno: the long march through the imperial succession, dynasty by dynasty.",
    "intro": "A complete run from Augustus to Zeno, grouped by dynasty and crisis. Seventy-nine slots make this a lifetime quest rather than a weekend one; the cabinet recalculates it as the collection grows.",
    "badge": {
      "name": "The Long March",
      "art": "scroll"
    },
    "sections": [
      {
        "id": "julio-claudian",
        "title": "Julio-Claudians & civil war",
        "range": "27 BC–AD 69"
      },
      {
        "id": "adoptive",
        "title": "Flavians & the adoptive century",
        "range": "AD 69–192"
      },
      {
        "id": "severan",
        "title": "Year of the five & the Severans",
        "range": "AD 193–235"
      },
      {
        "id": "crisis",
        "title": "The third-century crisis",
        "range": "AD 235–285"
      },
      {
        "id": "tetrarchy",
        "title": "Tetrarchy & the Constantinian turn",
        "range": "AD 284–337"
      },
      {
        "id": "constantinian",
        "title": "The Constantinian house & Julian",
        "range": "AD 337–364"
      },
      {
        "id": "valentinian",
        "title": "Valentinian & Theodosian",
        "range": "AD 364–395"
      },
      {
        "id": "two-empires",
        "title": "The two empires",
        "range": "AD 395–491"
      }
    ],
    "requirements": [
      {
        "id": "augustus",
        "ruler": "Augustus",
        "reign": "27 BC–AD 14",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Augustus"
        ],
        "aliases": [
          "Octavian",
          "Gaius Octavius",
          "Augustus Caesar"
        ],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "tiberius",
        "ruler": "Tiberius",
        "reign": "AD 14–37",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Tiberius"
        ],
        "aliases": [
          "Tiberius Caesar",
          "Tiberius Claudius Nero"
        ],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "caligula",
        "ruler": "Caligula",
        "reign": "AD 37–41",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Caligula"
        ],
        "aliases": [
          "Gaius",
          "Gaius Caligula"
        ],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "claudius",
        "ruler": "Claudius",
        "reign": "AD 41–54",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Claudius"
        ],
        "aliases": [
          "Claudius I"
        ],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "nero",
        "ruler": "Nero",
        "reign": "AD 54–68",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Nero"
        ],
        "aliases": [
          "Nero Claudius Caesar",
          "Nero Claudius"
        ],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "galba",
        "ruler": "Galba",
        "reign": "AD 68–69",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Galba"
        ],
        "aliases": [],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "otho",
        "ruler": "Otho",
        "reign": "AD 69",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Otho"
        ],
        "aliases": [],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "vitellius",
        "ruler": "Vitellius",
        "reign": "AD 69",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Vitellius"
        ],
        "aliases": [],
        "ocrePrefixes": [],
        "section": "julio-claudian"
      },
      {
        "id": "vespasian",
        "ruler": "Vespasian",
        "reign": "AD 69–79",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Vespasian"
        ],
        "aliases": [
          "Vespasianus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "titus",
        "ruler": "Titus",
        "reign": "AD 79–81",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Titus"
        ],
        "aliases": [
          "Titus Caesar Vespasianus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "domitian",
        "ruler": "Domitian",
        "reign": "AD 81–96",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Domitian"
        ],
        "aliases": [
          "Domitianus",
          "Titus Flavius Domitianus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "nerva",
        "ruler": "Nerva",
        "reign": "AD 96–98",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Nerva"
        ],
        "aliases": [
          "Marcus Cocceius Nerva"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "trajan",
        "ruler": "Trajan",
        "reign": "AD 98–117",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Trajan"
        ],
        "aliases": [
          "Traianus",
          "Marcus Ulpius Traianus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "hadrian",
        "ruler": "Hadrian",
        "reign": "AD 117–138",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Hadrian"
        ],
        "aliases": [
          "Hadrianus",
          "Publius Aelius Hadrianus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "antoninus-pius",
        "ruler": "Antoninus Pius",
        "reign": "AD 138–161",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Antoninus Pius"
        ],
        "aliases": [
          "Titus Aelius Antoninus",
          "Titus Aelius Hadrianus Antoninus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "marcus-aurelius",
        "ruler": "Marcus Aurelius",
        "reign": "AD 161–180",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Marcus Aurelius"
        ],
        "aliases": [
          "Marcus Annius Verus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "lucius-verus",
        "ruler": "Lucius Verus",
        "reign": "AD 161–169",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Lucius Verus"
        ],
        "aliases": [
          "Lucius Aurelius Verus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "commodus",
        "ruler": "Commodus",
        "reign": "AD 177–192",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Commodus"
        ],
        "aliases": [
          "Commodus Antoninus"
        ],
        "ocrePrefixes": [],
        "section": "adoptive"
      },
      {
        "id": "pertinax",
        "ruler": "Pertinax",
        "reign": "AD 193",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Pertinax"
        ],
        "aliases": [
          "Publius Helvius Pertinax"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "didius-julianus",
        "ruler": "Didius Julianus",
        "reign": "AD 193",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Didius Julianus"
        ],
        "aliases": [
          "Marcus Didius Julianus"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "septimius-severus",
        "ruler": "Septimius Severus",
        "reign": "AD 193–211",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Septimius Severus"
        ],
        "aliases": [
          "Lucius Septimius Severus"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "caracalla",
        "ruler": "Caracalla",
        "reign": "AD 198–217",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Caracalla"
        ],
        "aliases": [
          "Marcus Aurelius Antoninus",
          "Antoninus Caracalla"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "geta",
        "ruler": "Geta",
        "reign": "AD 209–211",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Geta"
        ],
        "aliases": [
          "Publius Septimius Geta"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "macrinus",
        "ruler": "Macrinus",
        "reign": "AD 217–218",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Macrinus"
        ],
        "aliases": [
          "Marcus Opellius Macrinus"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "elagabalus",
        "ruler": "Elagabalus",
        "reign": "AD 218–222",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Elagabalus"
        ],
        "aliases": [
          "Marcus Aurelius Antoninus",
          "Heliogabalus"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "severus-alexander",
        "ruler": "Severus Alexander",
        "reign": "AD 222–235",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Severus Alexander"
        ],
        "aliases": [
          "Marcus Aurelius Severus Alexander"
        ],
        "ocrePrefixes": [],
        "section": "severan"
      },
      {
        "id": "maximinus-thrax",
        "ruler": "Maximinus Thrax",
        "reign": "AD 235–238",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Maximinus Thrax"
        ],
        "aliases": [
          "Maximinus I",
          "Gaius Julius Verus Maximinus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "pupienus",
        "ruler": "Pupienus",
        "reign": "AD 238",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Pupienus"
        ],
        "aliases": [
          "Marcus Clodius Pupienus Maximus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "balbinus",
        "ruler": "Balbinus",
        "reign": "AD 238",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Balbinus"
        ],
        "aliases": [
          "Decimus Caelius Calvinus Balbinus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "gordian-iii",
        "ruler": "Gordian III",
        "reign": "AD 238–244",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Gordian III"
        ],
        "aliases": [
          "Marcus Antonius Gordianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "philip-i",
        "ruler": "Philip I",
        "reign": "AD 244–249",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Philip I"
        ],
        "aliases": [
          "Philip the Arab",
          "Marcus Julius Philippus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "trajan-decius",
        "ruler": "Trajan Decius",
        "reign": "AD 249–251",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Trajan Decius"
        ],
        "aliases": [
          "Decius",
          "Gaius Messius Quintus Traianus Decius"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "hostilian",
        "ruler": "Hostilian",
        "reign": "AD 251",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Hostilian"
        ],
        "aliases": [
          "Gaius Valens Hostilianus Messius Quintus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "trebonianus-gallus",
        "ruler": "Trebonianus Gallus",
        "reign": "AD 251–253",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Trebonianus Gallus"
        ],
        "aliases": [
          "Gallus",
          "Gaius Vibius Trebonianus Gallus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "aemilian",
        "ruler": "Aemilian",
        "reign": "AD 253",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Aemilian"
        ],
        "aliases": [
          "Aemilianus",
          "Marcus Aemilius Aemilianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "valerian",
        "ruler": "Valerian",
        "reign": "AD 253–260",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valerian"
        ],
        "aliases": [
          "Valerian I",
          "Publius Licinius Valerianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "gallienus",
        "ruler": "Gallienus",
        "reign": "AD 253–268",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Gallienus"
        ],
        "aliases": [
          "Publius Licinius Egnatius Gallienus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "claudius-gothicus",
        "ruler": "Claudius Gothicus",
        "reign": "AD 268–270",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Claudius Gothicus"
        ],
        "aliases": [
          "Claudius II",
          "Marcus Aurelius Claudius"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "quintillus",
        "ruler": "Quintillus",
        "reign": "AD 270",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Quintillus"
        ],
        "aliases": [
          "Marcus Aurelius Claudius Quintillus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "aurelian",
        "ruler": "Aurelian",
        "reign": "AD 270–275",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Aurelian"
        ],
        "aliases": [
          "Lucius Domitius Aurelianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "tacitus",
        "ruler": "Tacitus",
        "reign": "AD 275–276",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Tacitus"
        ],
        "aliases": [
          "Marcus Claudius Tacitus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "florian",
        "ruler": "Florian",
        "reign": "AD 276",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Florian"
        ],
        "aliases": [
          "Florianus",
          "Marcus Annius Florianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "probus",
        "ruler": "Probus",
        "reign": "AD 276–282",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Probus"
        ],
        "aliases": [
          "Marcus Aurelius Probus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "carus",
        "ruler": "Carus",
        "reign": "AD 282–283",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Carus"
        ],
        "aliases": [
          "Marcus Aurelius Carus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "carinus",
        "ruler": "Carinus",
        "reign": "AD 283–285",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Carinus"
        ],
        "aliases": [
          "Marcus Aurelius Carinus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "numerian",
        "ruler": "Numerian",
        "reign": "AD 283–284",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Numerian"
        ],
        "aliases": [
          "Marcus Aurelius Numerianus"
        ],
        "ocrePrefixes": [],
        "section": "crisis"
      },
      {
        "id": "diocletian",
        "ruler": "Diocletian",
        "reign": "AD 284–305",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Diocletian"
        ],
        "aliases": [
          "Gaius Aurelius Valerius Diocletianus"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "maximian",
        "ruler": "Maximian",
        "reign": "AD 286–305",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Maximian"
        ],
        "aliases": [
          "Maximianus",
          "Marcus Aurelius Valerius Maximianus"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "constantius-i",
        "ruler": "Constantius I",
        "reign": "AD 305–306",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantius I"
        ],
        "aliases": [
          "Constantius Chlorus",
          "Flavius Valerius Constantius"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "galerius",
        "ruler": "Galerius",
        "reign": "AD 305–311",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Galerius"
        ],
        "aliases": [
          "Gaius Galerius Valerius Maximianus"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "severus-ii",
        "ruler": "Severus II",
        "reign": "AD 306–307",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Severus II"
        ],
        "aliases": [
          "Flavius Valerius Severus"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "maxentius",
        "ruler": "Maxentius",
        "reign": "AD 306–312",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Maxentius"
        ],
        "aliases": [
          "Marcus Aurelius Valerius Maxentius"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "licinius",
        "ruler": "Licinius",
        "reign": "AD 308–324",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Licinius"
        ],
        "aliases": [
          "Licinius I",
          "Gaius Valerius Licinianus Licinius"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "constantine-i",
        "ruler": "Constantine I",
        "reign": "AD 306–337",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantine I"
        ],
        "aliases": [
          "Constantine the Great",
          "Flavius Valerius Constantinus"
        ],
        "ocrePrefixes": [],
        "section": "tetrarchy"
      },
      {
        "id": "constantine-ii",
        "ruler": "Constantine II",
        "reign": "AD 337–340",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantine II"
        ],
        "aliases": [
          "Flavius Claudius Constantinus"
        ],
        "ocrePrefixes": [],
        "section": "constantinian"
      },
      {
        "id": "constans",
        "ruler": "Constans",
        "reign": "AD 337–350",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constans"
        ],
        "aliases": [
          "Flavius Julius Constans"
        ],
        "ocrePrefixes": [],
        "section": "constantinian"
      },
      {
        "id": "constantius-ii",
        "ruler": "Constantius II",
        "reign": "AD 337–361",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantius II"
        ],
        "aliases": [
          "Flavius Julius Constantius"
        ],
        "ocrePrefixes": [],
        "section": "constantinian"
      },
      {
        "id": "julian",
        "ruler": "Julian",
        "reign": "AD 361–363",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Julian"
        ],
        "aliases": [
          "Julian the Apostate",
          "Flavius Claudius Julianus"
        ],
        "ocrePrefixes": [],
        "section": "constantinian"
      },
      {
        "id": "jovian",
        "ruler": "Jovian",
        "reign": "AD 363–364",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Jovian"
        ],
        "aliases": [
          "Flavius Jovianus"
        ],
        "ocrePrefixes": [],
        "section": "constantinian"
      },
      {
        "id": "valentinian-i",
        "ruler": "Valentinian I",
        "reign": "AD 364–375",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valentinian I"
        ],
        "aliases": [
          "Valentinian the Great",
          "Flavius Valentinianus"
        ],
        "ocrePrefixes": [],
        "section": "valentinian"
      },
      {
        "id": "valens",
        "ruler": "Valens",
        "reign": "AD 364–378",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valens"
        ],
        "aliases": [
          "Flavius Valens"
        ],
        "ocrePrefixes": [],
        "section": "valentinian"
      },
      {
        "id": "gratian",
        "ruler": "Gratian",
        "reign": "AD 367–383",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Gratian"
        ],
        "aliases": [
          "Flavius Gratianus"
        ],
        "ocrePrefixes": [],
        "section": "valentinian"
      },
      {
        "id": "valentinian-ii",
        "ruler": "Valentinian II",
        "reign": "AD 375–392",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valentinian II"
        ],
        "aliases": [
          "Flavius Valentinianus"
        ],
        "ocrePrefixes": [],
        "section": "valentinian"
      },
      {
        "id": "theodosius-i",
        "ruler": "Theodosius I",
        "reign": "AD 379–395",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Theodosius I"
        ],
        "aliases": [
          "Theodosius the Great",
          "Flavius Theodosius"
        ],
        "ocrePrefixes": [],
        "section": "valentinian"
      },
      {
        "id": "arcadius",
        "ruler": "Arcadius",
        "reign": "AD 395–408",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Arcadius"
        ],
        "aliases": [
          "Flavius Arcadius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "honorius",
        "ruler": "Honorius",
        "reign": "AD 395–423",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Honorius"
        ],
        "aliases": [
          "Flavius Honorius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "constantius-iii",
        "ruler": "Constantius III",
        "reign": "AD 421",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Constantius III"
        ],
        "aliases": [
          "Flavius Constantius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "valentinian-iii",
        "ruler": "Valentinian III",
        "reign": "AD 425–455",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Valentinian III"
        ],
        "aliases": [
          "Flavius Placidius Valentinianus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "marcian",
        "ruler": "Marcian",
        "reign": "AD 450–457",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Marcian"
        ],
        "aliases": [
          "Flavius Marcianus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "petronius-maximus",
        "ruler": "Petronius Maximus",
        "reign": "AD 455",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Petronius Maximus"
        ],
        "aliases": [
          "Flavius Petronius Maximus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "avitus",
        "ruler": "Avitus",
        "reign": "AD 455–456",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Avitus"
        ],
        "aliases": [
          "Eparchius Avitus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "majorian",
        "ruler": "Majorian",
        "reign": "AD 457–461",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Majorian"
        ],
        "aliases": [
          "Julius Valerius Majorianus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "libius-severus",
        "ruler": "Libius Severus",
        "reign": "AD 461–465",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Libius Severus"
        ],
        "aliases": [
          "Severus III"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "anthemius",
        "ruler": "Anthemius",
        "reign": "AD 467–472",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Anthemius"
        ],
        "aliases": [
          "Procopius Anthemius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "olybrius",
        "ruler": "Olybrius",
        "reign": "AD 472",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Olybrius"
        ],
        "aliases": [
          "Anicius Olybrius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "glycerius",
        "ruler": "Glycerius",
        "reign": "AD 473–474",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Glycerius"
        ],
        "aliases": [
          "Flavius Glycerius"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "julius-nepos",
        "ruler": "Julius Nepos",
        "reign": "AD 474–480",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Julius Nepos"
        ],
        "aliases": [
          "Flavius Julius Nepos"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "romulus-augustulus",
        "ruler": "Romulus Augustulus",
        "reign": "AD 475–476",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Romulus Augustulus"
        ],
        "aliases": [
          "Romulus Augustus"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      },
      {
        "id": "zeno",
        "ruler": "Zeno",
        "reign": "AD 474–491",
        "qualifies": "Any coin issued in this ruler’s name.",
        "issuers": [
          "Zeno"
        ],
        "aliases": [
          "Flavius Zeno"
        ],
        "ocrePrefixes": [],
        "section": "two-empires"
      }
    ]
  },
  {
    "id": "four-metals",
    "title": "Four Metals",
    "dates": "Any era",
    "family": "Collecting themes",
    "unit": "metals",
    "unitSingular": "metal",
    "summary": "Gold, silver, and bronze: one coin in each of the three great monetary metals of the Roman world.",
    "intro": "Roman money was a system of metals as much as denominations. This quest asks for one gold, one silver, and one bronze coin, whatever their rulers or dates.",
    "badge": {
      "name": "Gold, Silver, Bronze",
      "art": "metals"
    },
    "requirements": [
      {
        "id": "gold",
        "ruler": "Gold (AV)",
        "reign": "Metal · any era",
        "qualifies": "A gold coin, regardless of ruler or denomination.",
        "kind": "metal",
        "values": [
          "gold"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AV Aureus"
      },
      {
        "id": "silver",
        "ruler": "Silver (AR)",
        "reign": "Metal · any era",
        "qualifies": "A silver or billon coin, regardless of ruler or denomination.",
        "kind": "metal",
        "values": [
          "silver"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Denarius"
      },
      {
        "id": "bronze",
        "ruler": "Bronze (Æ)",
        "reign": "Metal · any era",
        "qualifies": "A bronze, orichalcum, or copper coin, regardless of ruler or denomination.",
        "kind": "metal",
        "values": [
          "bronze"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Sestertius"
      }
    ]
  },
  {
    "id": "big-denominations",
    "title": "The Big Denominations",
    "dates": "Any era",
    "family": "Collecting themes",
    "unit": "denominations",
    "unitSingular": "denomination",
    "summary": "A vocabulary of Roman money: fourteen denominations from the aureus and denarius to the follis, siliqua, and solidus.",
    "intro": "Roman coinage changed its denominations as the economy changed. This quest is a working vocabulary of fourteen major types, from the Augustan aureus to the late-antique solidus.",
    "badge": {
      "name": "Vocabulary of Money",
      "art": "stack"
    },
    "requirements": [
      {
        "id": "aureus",
        "ruler": "Aureus (AV)",
        "reign": "Denomination · any era",
        "qualifies": "A gold aureus.",
        "kind": "denomination",
        "values": [
          "aureus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AV Aureus"
      },
      {
        "id": "denarius",
        "ruler": "Denarius (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A silver denarius.",
        "kind": "denomination",
        "values": [
          "denarius"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Denarius"
      },
      {
        "id": "antoninianus",
        "ruler": "Antoninianus (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A silver or billon antoninianus.",
        "kind": "denomination",
        "values": [
          "antoninianus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Antoninianus"
      },
      {
        "id": "quinarius",
        "ruler": "Quinarius (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A silver quinarius.",
        "kind": "denomination",
        "values": [
          "quinarius"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Quinarius"
      },
      {
        "id": "sestertius",
        "ruler": "Sestertius (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A bronze or orichalcum sestertius.",
        "kind": "denomination",
        "values": [
          "sestertius"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Sestertius"
      },
      {
        "id": "dupondius",
        "ruler": "Dupondius (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A bronze or orichalcum dupondius.",
        "kind": "denomination",
        "values": [
          "dupondius"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Dupondius"
      },
      {
        "id": "as",
        "ruler": "As (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A bronze as.",
        "kind": "denomination",
        "values": [
          "as"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ As"
      },
      {
        "id": "quadrans",
        "ruler": "Quadrans (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A bronze quadrans.",
        "kind": "denomination",
        "values": [
          "quadrans"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Quadrans"
      },
      {
        "id": "follis",
        "ruler": "Follis (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique follis.",
        "kind": "denomination",
        "values": [
          "follis"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Follis"
      },
      {
        "id": "solidus",
        "ruler": "Solidus (AV)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique gold solidus.",
        "kind": "denomination",
        "values": [
          "solidus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AV Solidus"
      },
      {
        "id": "siliqua",
        "ruler": "Siliqua (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique silver siliqua.",
        "kind": "denomination",
        "values": [
          "siliqua"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Siliqua"
      },
      {
        "id": "miliarensis",
        "ruler": "Miliarensis (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique silver miliarensis.",
        "kind": "denomination",
        "values": [
          "miliarensis"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Miliarensis"
      },
      {
        "id": "nummus",
        "ruler": "Nummus (Æ)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique bronze nummus.",
        "kind": "denomination",
        "values": [
          "nummus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "Æ Nummus"
      },
      {
        "id": "argenteus",
        "ruler": "Argenteus (AR)",
        "reign": "Denomination · any era",
        "qualifies": "A late-antique silver argenteus.",
        "kind": "denomination",
        "values": [
          "argenteus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addDenomination": "AR Argenteus"
      }
    ]
  },
  {
    "id": "moneyers-republic",
    "title": "Moneyers of the Republic",
    "dates": "80s–20s BC",
    "family": "Collecting themes",
    "unit": "moneyers",
    "unitSingular": "moneyer",
    "summary": "Four Republican moneyers whose names and family images turn a coin into a piece of political history.",
    "intro": "Before the emperors monopolised the coinage, Republican moneyers signed their dies. This quest follows four of the best-known names of the late Republic.",
    "badge": {
      "name": "Moneyers of the Republic",
      "art": "amphora"
    },
    "requirements": [
      {
        "id": "brutus",
        "ruler": "M. Junius Brutus",
        "reign": "Moneyer · 80s–20s BC",
        "qualifies": "A coin issued by Marcus Junius Brutus.",
        "kind": "moneyer",
        "values": [
          "m junius brutus",
          "m brutus",
          "brutus"
        ],
        "issuers": [],
        "aliases": [
          "Marcus Junius Brutus",
          "Q. Caepio Brutus"
        ],
        "ocrePrefixes": [],
        "issuerHint": "M. Junius Brutus"
      },
      {
        "id": "cassius",
        "ruler": "C. Cassius Longinus",
        "reign": "Moneyer · 80s–20s BC",
        "qualifies": "A coin issued by Gaius Cassius Longinus.",
        "kind": "moneyer",
        "values": [
          "c cassius longinus",
          "cassius",
          "longinus"
        ],
        "issuers": [],
        "aliases": [
          "Gaius Cassius Longinus"
        ],
        "ocrePrefixes": [],
        "issuerHint": "C. Cassius Longinus"
      },
      {
        "id": "plancus",
        "ruler": "L. Plautius Plancus",
        "reign": "Moneyer · 80s–20s BC",
        "qualifies": "A coin issued by Lucius Plautius Plancus.",
        "kind": "moneyer",
        "values": [
          "l plautius plancus",
          "plautius",
          "plancus"
        ],
        "issuers": [],
        "aliases": [
          "Lucius Plautius Plancus"
        ],
        "ocrePrefixes": [],
        "issuerHint": "L. Plautius Plancus"
      },
      {
        "id": "lentulus",
        "ruler": "P. Cornelius Lentulus Marcellinus",
        "reign": "Moneyer · 80s–20s BC",
        "qualifies": "A coin issued by Publius Cornelius Lentulus Marcellinus.",
        "kind": "moneyer",
        "values": [
          "p cornelius lentulus marcellinus",
          "lentulus",
          "marcellinus"
        ],
        "issuers": [],
        "aliases": [
          "Publius Cornelius Lentulus Marcellinus"
        ],
        "ocrePrefixes": [],
        "issuerHint": "P. Cornelius Lentulus Marcellinus"
      }
    ]
  },
  {
    "id": "twelve-powers",
    "title": "The Twelve Powers",
    "dates": "Any era",
    "family": "Collecting themes",
    "unit": "powers",
    "unitSingular": "power",
    "summary": "Twelve divine reverse types: the pantheon of gods and personifications that Rome put on its money.",
    "intro": "Roman reverses are a pantheon in miniature. This quest asks for twelve divine or personified reverse types, from Jupiter and Juno to Victoria and Roma.",
    "badge": {
      "name": "The Twelve Powers",
      "art": "pantheon"
    },
    "requirements": [
      {
        "id": "jupiter",
        "ruler": "Jupiter",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Jupiter.",
        "kind": "reverseType",
        "values": [
          "jupiter",
          "iovi",
          "jovis"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Jupiter"
      },
      {
        "id": "juno",
        "ruler": "Juno",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Juno.",
        "kind": "reverseType",
        "values": [
          "juno",
          "juno regina"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Juno"
      },
      {
        "id": "minerva",
        "ruler": "Minerva",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Minerva.",
        "kind": "reverseType",
        "values": [
          "minerva"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Minerva"
      },
      {
        "id": "mars",
        "ruler": "Mars",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Mars.",
        "kind": "reverseType",
        "values": [
          "mars",
          "mars victor"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Mars"
      },
      {
        "id": "venus",
        "ruler": "Venus",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Venus.",
        "kind": "reverseType",
        "values": [
          "venus",
          "venus victrix"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Venus"
      },
      {
        "id": "apollo",
        "ruler": "Apollo",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Apollo.",
        "kind": "reverseType",
        "values": [
          "apollo"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Apollo"
      },
      {
        "id": "diana",
        "ruler": "Diana",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Diana.",
        "kind": "reverseType",
        "values": [
          "diana"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Diana"
      },
      {
        "id": "mercury",
        "ruler": "Mercury",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Mercury.",
        "kind": "reverseType",
        "values": [
          "mercury",
          "mercurius"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Mercury"
      },
      {
        "id": "concordia",
        "ruler": "Concordia",
        "reign": "",
        "qualifies": "Any coin whose reverse is headed by Concordia — the 12th power the mints leaned on most in the civil wars. Matched from the recorded reverse type.",
        "kind": "reverseType",
        "values": [
          "concordia"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": []
      },
      {
        "id": "neptune",
        "ruler": "Neptune",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Neptune.",
        "kind": "reverseType",
        "values": [
          "neptune",
          "neptunus"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Neptune"
      },
      {
        "id": "victoria",
        "ruler": "Victoria",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Victoria.",
        "kind": "reverseType",
        "values": [
          "victoria",
          "victory"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Victoria"
      },
      {
        "id": "roma",
        "ruler": "Roma",
        "reign": "Reverse type · any era",
        "qualifies": "A reverse naming or depicting Roma.",
        "kind": "reverseType",
        "values": [
          "roma",
          "roma aeterna"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addReverseType": "Roma"
      }
    ]
  },
  {
    "id": "mints-empire",
    "title": "Mints of the Empire",
    "dates": "Any era",
    "family": "Collecting themes",
    "unit": "mints",
    "unitSingular": "mint",
    "summary": "Nine striking places, from Rome and Lugdunum to Trier, Antioch, and Constantinople — the workshops behind the coinage.",
    "intro": "Mint marks reveal where a coin was struck and how the empire organised production. This quest follows nine major mints across the imperial period.",
    "badge": {
      "name": "Mints of the Empire",
      "art": "mint"
    },
    "requirements": [
      {
        "id": "rome",
        "ruler": "Rome",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Rome.",
        "kind": "mint",
        "values": [
          "rome",
          "roma"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Rome"
      },
      {
        "id": "lugdunum",
        "ruler": "Lugdunum",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Lugdunum.",
        "kind": "mint",
        "values": [
          "lugdunum",
          "lyon"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Lugdunum"
      },
      {
        "id": "antioch",
        "ruler": "Antioch",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Antioch.",
        "kind": "mint",
        "values": [
          "antioch",
          "antiocheia"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Antioch"
      },
      {
        "id": "alexandria",
        "ruler": "Alexandria",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Alexandria.",
        "kind": "mint",
        "values": [
          "alexandria"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Alexandria"
      },
      {
        "id": "thessalonica",
        "ruler": "Thessalonica",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Thessalonica.",
        "kind": "mint",
        "values": [
          "thessalonica",
          "thessaloniki"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Thessalonica"
      },
      {
        "id": "nicomedia",
        "ruler": "Nicomedia",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Nicomedia.",
        "kind": "mint",
        "values": [
          "nicomedia"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Nicomedia"
      },
      {
        "id": "trier",
        "ruler": "Trier",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Trier.",
        "kind": "mint",
        "values": [
          "trier",
          "treveri"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Trier"
      },
      {
        "id": "constantinople",
        "ruler": "Constantinople",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Constantinople.",
        "kind": "mint",
        "values": [
          "constantinople",
          "constantinopolis"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Constantinople"
      },
      {
        "id": "siscia",
        "ruler": "Siscia",
        "reign": "Mint · any era",
        "qualifies": "A coin struck at Siscia.",
        "kind": "mint",
        "values": [
          "siscia"
        ],
        "issuers": [],
        "aliases": [],
        "ocrePrefixes": [],
        "addMint": "Siscia"
      }
    ]
  },
  {
    "id": "imperial-women",
    "title": "The Imperial Women",
    "dates": "AD 98–491",
    "family": "Collecting themes",
    "unit": "women",
    "unitSingular": "woman",
    "summary": "Sixteen empresses whose portraits and titles made the imperial family visible on the coinage.",
    "intro": "Empresses were not passive figures on Roman coins. Their portraits, diadems, and honorific titles carried dynastic messages across the empire. This quest follows sixteen imperial women from Plotina to Aelia Verina.",
    "badge": {
      "name": "The Imperial Women",
      "art": "empress"
    },
    "requirements": [
      {
        "id": "plotina",
        "ruler": "Plotina",
        "reign": "AD 98–117",
        "qualifies": "Any coin issued in Plotina’s name.",
        "issuers": [
          "Plotina"
        ],
        "aliases": [
          "Pompeia Plotina"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "sabina",
        "ruler": "Sabina",
        "reign": "AD 117–138",
        "qualifies": "Any coin issued in Sabina’s name.",
        "issuers": [
          "Sabina"
        ],
        "aliases": [
          "Vibia Sabina"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "faustina-elder",
        "ruler": "Faustina the Elder",
        "reign": "AD 138–141",
        "qualifies": "Any coin issued in Faustina the Elder’s name.",
        "issuers": [
          "Faustina the Elder"
        ],
        "aliases": [
          "Annia Galeria Faustina",
          "Faustina I",
          "Faustina Senior",
          "Faustina Major"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "faustina-younger",
        "ruler": "Faustina the Younger",
        "reign": "AD 161–175",
        "qualifies": "Any coin issued in Faustina the Younger’s name.",
        "issuers": [
          "Faustina the Younger"
        ],
        "aliases": [
          "Annia Galeria Faustina Minor",
          "Faustina II",
          "Faustina Junior",
          "Faustina Minor"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "lucilla",
        "ruler": "Lucilla",
        "reign": "AD 164–182 (as wife from c. 164)",
        "qualifies": "Any coin issued in Lucilla's name — Lucius Verus's wife; issues inside Marcus Aurelius's and her own RIC III series.",
        "issuers": [
          "Lucilla"
        ],
        "aliases": [
          "Lucilla Augusta"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "crispina",
        "ruler": "Crispina",
        "reign": "AD 178–192",
        "qualifies": "Any coin issued in Crispina's name — Commodus's wife; her issues sit inside his RIC III series.",
        "issuers": [
          "Crispina"
        ],
        "aliases": [
          "Bruttia Crispina"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "julia-domna",
        "ruler": "Julia Domna",
        "reign": "AD 193–217",
        "qualifies": "Any coin issued in Julia Domna’s name.",
        "issuers": [
          "Julia Domna"
        ],
        "aliases": [
          "Julia Domna Augusta"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "julia-maesa",
        "ruler": "Julia Maesa",
        "reign": "AD 218–222",
        "qualifies": "Any coin issued in Julia Maesa’s name.",
        "issuers": [
          "Julia Maesa"
        ],
        "aliases": [
          "Julia Maesa Augusta"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "julia-soemias",
        "ruler": "Julia Soaemias",
        "reign": "AD 218–222",
        "qualifies": "Any coin issued in Julia Soaemias's name — Elagabalus's mother and the de facto power of his reign; her denarii live inside Elagabalus's RIC IV series.",
        "issuers": [
          "Julia Soaemias"
        ],
        "aliases": [
          "Julia Soaemias Bassiana"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "julia-mamaea",
        "ruler": "Julia Mamaea",
        "reign": "AD 222–235",
        "qualifies": "Any coin issued in Julia Mamaea’s name.",
        "issuers": [
          "Julia Mamaea"
        ],
        "aliases": [
          "Julia Avita Mamaea"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "otacilia-severa",
        "ruler": "Otacilia Severa",
        "reign": "AD 244–249",
        "qualifies": "Any coin issued in Otacilia Severa’s name.",
        "issuers": [
          "Otacilia Severa"
        ],
        "aliases": [
          "Marcia Otacilia Severa"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "salonina",
        "ruler": "Salonina",
        "reign": "AD 253–268",
        "qualifies": "Any coin issued in Salonina’s name.",
        "issuers": [
          "Salonina"
        ],
        "aliases": [
          "Cornelia Salonina",
          "Julia Cornelia Salonina"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "severina",
        "ruler": "Severina",
        "reign": "AD 270–275",
        "qualifies": "Any coin issued in Severina's name — Aurelian's wife; her issues under the Sol/mint series of RIC V.",
        "issuers": [
          "Severina"
        ],
        "aliases": [
          "Ulpia Severina"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "helena",
        "ruler": "Helena",
        "reign": "AD 306–337",
        "qualifies": "Any coin issued in Helena’s name.",
        "issuers": [
          "Helena"
        ],
        "aliases": [
          "Flavia Julia Helena",
          "Saint Helena"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "galla-placidia",
        "ruler": "Galla Placidia",
        "reign": "AD 421–450",
        "qualifies": "Any coin issued in Galla Placidia’s name.",
        "issuers": [
          "Galla Placidia"
        ],
        "aliases": [
          "Aelia Galla Placidia"
        ],
        "ocrePrefixes": []
      },
      {
        "id": "aelia-verina",
        "ruler": "Aelia Verina",
        "reign": "AD 457–484",
        "qualifies": "Any coin issued in Aelia Verina’s name.",
        "issuers": [
          "Aelia Verina"
        ],
        "aliases": [
          "Verina",
          "Aelia Verina Augusta"
        ],
        "ocrePrefixes": []
      }
    ]
  }
];
