window.STUDIO_DEMO_DATA_FR = {
  j1: {
    name: "Nouveau prospect → Premier cours",
    scenario: "<b>Sarah M.</b> · première visite, vient de découvrir Modo Yoga",
    clock: "07:02",
    scenes: [
      { step:"Bienvenue",
        pre:[
          {from:"system", text:"Sarah a créé un compte sur modoyoga.com"},
          {from:"ai", text:"Salut Sarah ! 👋 C'est Modo Yoga, ravis que tu nous aies trouvés. Qu'est-ce qui t'attire sur le tapis en ce moment, et y a-t-il quelque chose qui te retient ?"},
          {from:"member", text:"Salut ! Honnêtement, gérer le stress + la souplesse. Un peu nerveuse à l'idée de ne pas être assez souple 😅"},
          {from:"ai", text:"C'est la crainte la plus fréquente, et la moins fondée 🌿 La souplesse, c'est le cours qui te la donne, pas un prérequis. Tu es exactement au bon endroit."}
        ],
        behind:{ trigger:"Compte créé, Mariana Tek déclenche un webhook.",
          does:"Envoie un accueil chaleureux en quelques minutes et pose des questions sur les objectifs et les hésitations, pour tout personnaliser ensuite.",
          prod:"Les SMS transactionnels atteignent <b>97 %</b> des membres, contre seulement 7 % pour le marketing. L'accueil est classé transactionnel, il arrive donc vraiment à destination." } },

      { step:"Offre découverte personnalisée",
        pre:[
          {from:"ai", text:"Envie de commencer en douceur ? Notre offre découverte de 2 semaines, ce sont des cours illimités pour 40 $ CA, la meilleure façon de trouver ton rythme."},
          {from:"member", text:"Oui, avec plaisir !"},
          {from:"ai", text:"Génial 🙌 Voici ton paiement sécurisé, il s'ouvre directement dans Mariana Tek :", mtlink:"modoyoga.marianatek.com/intro"}
        ],
        mt:{ kind:"checkout", title:"Finaliser l'achat",
          plan:{ name:"Offre découverte illimitée – 2 semaines", price:"40 $ CA", per:" / 2 semaines", perks:["Cours illimités pendant 14 jours","Tous les cours à Modo Mondo","Sans engagement, annulable à tout moment"] },
          confirm:[ {from:"system", text:"💳 Paiement confirmé · illimité 2 semaines", style:"good"} ] },
        behind:{ trigger:"Sarah répond avec intérêt → Compass recommande le bon forfait.",
          does:"Envoie une offre découverte personnalisée avec un lien de paiement qui s'ouvre directement dans Mariana Tek, aucune appli à installer, aucune complication.",
          prod:"<b>280</b> forfaits actifs répartis sur 57 studios. Offres découvertes les plus courantes : 1 mois 44 %, 30 jours 25 %, 2 semaines 17 %." } },

      { step:"Achat détecté",
        pre:[
          {from:"ai", text:"Tout est prêt, Sarah ! 🎉 Tes deux semaines de cours illimités commencent aujourd'hui. Passons au plus amusant : mettons ton premier cours au calendrier."}
        ],
        behind:{ trigger:"Achat → Mariana Tek enregistre l'achat.",
          does:"Détecte l'achat instantanément et enchaîne directement sur la réservation, sans temps mort, sans attente.",
          prod:"<b>186</b> membres de l'échantillon ont acheté une offre découverte sans jamais réserver de cours. Combler cet écart, c'est tout l'enjeu." } },

      { step:"Réservation via Mariana Tek",
        pre:[ {from:"ai", text:"Voici l'horaire de demain à Modo Mondo 🗓 Réserve ta place pour ton premier cours :", mtlink:"modoyoga.marianatek.com/book"} ],
        mt:{ kind:"book", title:"Réserver un cours", date:"Demain · mer. · Modo Mondo",
          slots:[
            { time:"7 h 00", cls:"Flow chaud", who:"Martha", spots:"6 places",
              confirm:[{from:"ai", text:"Réservé ! ☀️ Flow chaud à 7 h 00 avec Martha, demain. Martha est tellement accueillante, tu te sentiras tout de suite chez toi. Je t'enverrai un rappel le matin même."}] },
            { time:"17 h 30", cls:"Étirement profond", who:"Liam", spots:"9 places",
              confirm:[{from:"ai", text:"Réservé ! 🌙 Étirement profond à 17 h 30 avec Liam, demain. Une façon parfaite et tout en douceur de commencer. Je t'enverrai un rappel avant."}] }
          ] },
        behind:{ trigger:"Compass envoie un lien de réservation → en appuyant, on ouvre l'horaire de Modo Mondo dans Mariana Tek.",
          does:"Envoie un lien direct vers l'horaire en temps réel. Sarah réserve dans Mariana Tek, l'appli qu'elle utilisera pour chaque cours par la suite.",
          prod:"Réservé selon les disponibilités en temps réel dans Mariana Tek, le même horaire que celui utilisé à l'accueil." } },

      { step:"Briefing du responsable de studio",
        pre:[ {from:"system", text:"Le lendemain matin, à l'accueil"} ],
        ops:`<div class="opscard">
          <div class="opscard-h">Fiche d'accueil · Modo Mondo · aujourd'hui</div>
          <div class="briefrow"><div class="av">S</div><div><div class="bn">Sarah M. <span class="tag">Première visite</span></div><div class="bd">7 h 00 · Flow chaud · offre découverte 2 sem.</div></div></div>
          <div class="brief-line"><b>Objectifs :</b> gérer le stress, la souplesse, un peu nerveuse</div>
          <div class="brief-script">« Bonjour Sarah ! Ravie de te voir, Martha va prendre grand soin de toi. Première fois ? Installe-toi près de la porte si tu préfères. »</div>
        </div>`,
        behind:{ trigger:"Fiche quotidienne, générée chaque matin avant les cours.",
          does:"Fournit à l'accueil un profil prêt à lire et un mot d'accueil personnalisé, pour que l'équipe accueille chaque nouveau par son prénom.",
          prod:"Les touches personnelles, les objectifs et le mot d'accueil, viennent de Compass. Mariana Tek stocke la réservation, pas le contexte humain." } },

      { step:"Rappel → absence → relance",
        pre:[
          {from:"ai", text:"Bonjour Sarah ! ☀️ Petit rappel : Flow chaud avec Martha à 7 h 00 aujourd'hui. Arrive 10 minutes en avance, de l'eau et un tapis suffisent."},
          {from:"system", text:"⚠️ 7 h 05 · Sarah ne s'est pas présentée (absence)", style:"alert"},
          {from:"ai", text:"Coucou Sarah, on dirait que la matinée t'a filé entre les doigts. Ça arrive, vraiment 💛 Aucuns frais, voici l'horaire dès que tu es prête à reprendre :", mtlink:"modoyoga.marianatek.com/book"}
        ],
        mt:{ kind:"book", title:"Reprogrammer", date:"Aujourd'hui et demain · Modo Mondo",
          slots:[
            { time:"17 h 30", cls:"Étirement profond", who:"Liam", spots:"Ce soir",
              confirm:[{from:"ai", text:"C'est fait ! 🌙 Étirement profond à 17 h 30 avec Liam ce soir. Doux et ancrant, parfait après une matinée mouvementée. Tu vas y arriver."}] },
            { time:"7 h 00", cls:"Flow chaud", who:"Martha", spots:"Demain",
              confirm:[{from:"ai", text:"Réservé ! ☀️ 7 h 00 avec Martha à nouveau demain. Je crois en toi, à bientôt sur le tapis."}] }
          ] },
        behind:{ trigger:"Absence détectée via un webhook Mariana Tek → relance en moins de 15 minutes.",
          does:"Recontacte dès qu'un nouveau décroche, avec chaleur et un lien pour reprogrammer, avant qu'il ne s'éloigne pour de bon.",
          prod:"6,7 % des réservations sont annulées ; <b>les annulations tardives et les absences sont les frais nº 1 et nº 2</b> en production. Cette seule action protège la présence au premier cours, le meilleur indicateur de fidélisation." } },

      { step:"Présence → prochaine réservation",
        pre:[
          {from:"system", text:"✓ Sarah s'est présentée · Étirement profond avec Liam", style:"good"},
          {from:"ai", text:"Tu es revenue ET tu étais là 👏 Comment tu t'es sentie ?"},
          {from:"member", text:"Honnêtement ? Incroyable. Tellement apaisée après."},
          {from:"ai", text:"C'est la magie Modo 🌿 Envie de réserver le prochain tant que la sensation est fraîche ? Je t'envoie l'horaire de jeudi par texto."},
          {from:"member", text:"Oui ! 😄"}
        ],
        behind:{ trigger:"Présence enregistrée → son nombre de cours augmente.",
          does:"Boucle la boucle d'une belle première visite et plante aussitôt la prochaine : c'est ainsi qu'une visite unique devient une habitude.",
          prod:"Seulement <b>13,5 %</b> des membres dépassent 5 cours. Chaque relance des deux premières semaines fait effet boule de neige et mène directement au parcours de conversion →" } }
    ]
  },

  j2: {
    name: "Conversion en abonnement",
    scenario: "<b>Sarah M.</b> · deux semaines plus tard, vient de terminer son 5e cours de l'offre découverte",
    clock: "18:48",
    scenes: [
      { step:"Cap des 5 cours",
        pre:[
          {from:"system", text:"🎉 Sarah vient de se présenter · c'est son 5e cours", style:"good"},
          {from:"ai", text:"Sarah ! Ça fait 5 cours en deux semaines 🔥 Tu es passée de « pas assez souple » à véritable habituée. Je suis tellement fière de toi."},
          {from:"member", text:"Je crois que je suis accro maintenant 😅"}
        ],
        behind:{ trigger:"Son nombre de cours atteint 5 → cap franchi.",
          does:"Célèbre le moment et lance la conversation de conversion au pic d'enthousiasme.",
          prod:"<b>42 %</b> des abonnements commencent par une offre découverte. Le cap des 5 cours est le moment idéal pour convertir." } },

      { step:"Recommandation personnalisée",
        pre:[
          {from:"ai", text:"Soyons honnêtes : au rythme où tu vas (~3×/sem. 📈), un abonnement devient logique. Tu économiserais vraiment et n'aurais plus jamais à penser aux passes."},
          {from:"member", text:"Justement, je me posais la question"}
        ],
        behind:{ trigger:"Fréquence de visite ≥ 8/mois → recommander Illimité (moins de 8 → limité).",
          does:"Recommande le bon forfait selon la façon dont Sarah s'entraîne réellement, pas une vente incitative générique.",
          prod:"Le forfait est choisi selon la fréquentation réelle : <b>&lt; 8 visites/mois → limité, ≥ 8 → illimité.</b>" } },

      { step:"Calcul selon le marché",
        pre:[
          {from:"ai", text:"Voici le calcul Modo Mondo 📊\n• À la séance : 24 $ CA/cours\n• Illimité : 160 $ CA/mois → environ 12 $ CA/cours à ton rythme\nEn gros, tu paierais moitié moins."},
          {from:"member", text:"ok là c'est une évidence 😂"}
        ],
        behind:{ trigger:"Marché du studio = Montréal → mettre en avant la valeur de l'abonnement.",
          does:"Adapte le discours au marché. Au Canada, les membres penchent pour l'abonnement, alors Compass en met la valeur en avant avec un calcul par cours. (À NYC, on compare plutôt au prix des carnets.)",
          prod:"<b>Nouvelle étape issue de la production :</b> le Canada penche pour les abonnements, NYC pour les carnets ; le même discours ne fonctionne pas sur les deux marchés." } },

      { step:"Paiement via Mariana Tek",
        pre:[ {from:"ai", text:"Je te fais passer à l'abonnement ? Appuie pour activer, ton offre découverte bascule directement en Illimité :", mtlink:"modoyoga.marianatek.com/membership"} ],
        mt:{ kind:"checkout", title:"Abonnement",
          plan:{ name:"Abonnement illimité", price:"160 $ CA", per:" / mois", perks:["Cours illimités à Modo Mondo","Tapis et serviette offerts","Événements et communauté réservés aux membres"] },
          confirm:[ {from:"system", text:"💳 Paiement confirmé · abonnement illimité", style:"good"} ] },
        behind:{ trigger:"Sarah appuie sur le lien → paiement Mariana Tek → un nouvel abonnement est créé.",
          does:"Envoie un lien de paiement ; Sarah confirme dans Mariana Tek (Stripe / MT Web). Aucune redirection, aucune carte à ressaisir.",
          prod:"Paiement direct dans Mariana Tek, le chemin le plus fluide de l'intention à l'adhésion." } },

      { step:"Activation et accueil",
        pre:[
          {from:"ai", text:"Bienvenue dans la famille Modo, Sarah 🎉 Tu es officiellement en Illimité, et rassure-toi, j'arrête les relances d'offre découverte 😉"},
          {from:"ai", text:"Pour bien démarrer : j'ai ajouté le Flow chaud du jeudi de Martha à tes favoris, et la communauté Modo Mondo est là quand tu veux 🌿", link:"Rejoindre la communauté Modo Mondo"},
          {from:"member", text:"C'est vraiment top. Merci 🙏"}
        ],
        behind:{ trigger:"Achat → pipeline réglé sur « Abonnement activé ».",
          does:"Fait passer Sarah au statut de membre, coupe instantanément tous les messages de la phase découverte et lance la séquence d'accueil des nouveaux membres.",
          prod:"L'activation fait proprement passer du mode « convertir » au mode « accueillir et fidéliser », sans fil croisé, sans texto d'offre découverte égaré." } },

      { step:"Conversion enregistrée",
        pre:[ {from:"system", text:"✓ Abonnement actif · bienvenue à bord, Sarah", style:"good"} ],
        ops:`<div class="opscard">
          <div class="opscard-h">Événement de conversion · enregistré</div>
          <table class="convtbl">
            <tr><td>Membre</td><td>Sarah M. · Modo Mondo</td></tr>
            <tr><td>Type d'offre</td><td>illimité 2 semaines</td></tr>
            <tr><td>Jours avant conversion</td><td>14</td></tr>
            <tr><td>Visites à la conversion</td><td>5</td></tr>
            <tr><td>État avant</td><td>haute fréquence (≈3×/sem.)</td></tr>
            <tr><td>Nouveau forfait</td><td>Illimité · 160 $ CA/mois</td></tr>
          </table>
        </div>`,
        behind:{ trigger:"Conversion enregistrée pour l'analytique.",
          does:"Consigne tout le parcours de conversion pour que le studio voie exactement ce qui motive les membres, et en fasse davantage.",
          prod:"Chaque conversion devient une donnée : quelle offre, combien de cours, combien de jours. La boucle qui rend le prochain discours plus intelligent." } }
    ]
  }
};
