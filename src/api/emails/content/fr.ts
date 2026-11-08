import type { EmailContent } from "./en";

const fr: EmailContent = {
  passwordReset: {
    subject: (code: string) => `Ton code Kilist : ${code}`,
    preheader: (minutes: number) => `Détache ton ticket. Il est valable ${minutes} minutes.`,
    stub: "ENTRÉE UNIQUE",
    title: (name: string) => `Prends un ticket, ${name}`,
    note: (minutes: number) => `Valable ${minutes} minutes, une seule fois`,
    body: "Saisis ce code dans l'appli pour choisir un nouveau mot de passe.",
    notYou: "Ce n'est pas toi ? Ignore cet e-mail. Ton mot de passe ne change pas.",
    footer: (email: string) =>
      `Envoyé à ${email} parce que quelqu'un a demandé à réinitialiser le mot de passe de ce compte Kilist.`,
  },
  signupConfirm: {
    subject: (code: string) => `Bienvenue sur Kilist ! Ton code : ${code}`,
    preheader: "Un code et tu peux commencer à jouer.",
    stub: "BIENVENUE",
    title: (name: string) => `Bienvenue dans la salle, ${name}`,
    note: (minutes: number) => `Valable ${minutes} minutes, une seule fois`,
    body: "Saisis ce code dans l'appli pour confirmer ton e-mail et commencer à jouer.",
    notYou: "Ce n'est pas toi ? Ignore cet e-mail. Ton adresse ne sera pas confirmée.",
    footer: (email: string) =>
      `Envoyé à ${email} parce que cette adresse a servi à créer un compte Kilist.`,
  },
  memberJoined: {
    subject: (member: string) => `${member} a rejoint ton foyer sur Kilist`,
    preheader: "Un nouveau joueur entre dans la partie.",
    stub: "NOUVEAU JOUEUR",
    title: (member: string) => `${member} a rejoint ton foyer`,
    note: (household: string, players: number) =>
      `${household} · ${players} ${players <= 1 ? "joueur" : "joueurs"}`,
    body: "Vous partagez maintenant les mêmes aliments et la même liste de courses.",
    button: "Ouvrir Kilist",
    notYou: (member: string, support: string) => `Tu ne connais pas ${member} ? Écris à ${support}.`,
    footer: (email: string, household: string) =>
      `Envoyé à ${email} parce que tu fais partie du foyer ${household} sur Kilist.`,
  },
  accountDeleted: {
    subject: "Ton compte Kilist est supprimé",
    preheader: "Ton compte, tes tickets et tes styles ont disparu.",
    stub: "ANNULÉ",
    title: "Ton compte est supprimé",
    hero: "GAME OVER",
    note: (name: string) => `Merci d'avoir joué, ${name}`,
    body: "Ton compte, tes tickets et tes styles débloqués ont disparu. Impossible de revenir en arrière.",
    lastInHousehold: "Tu étais la dernière personne de ton foyer, donc ses aliments ont aussi été supprimés.",
    notYou: (support: string) => `Ce n'est pas toi ? Écris vite à ${support}.`,
    footer: (email: string) =>
      `Envoyé à ${email} parce que ce compte Kilist a été supprimé. C'est le dernier e-mail que tu recevras de notre part.`,
  },
  releaseUpdate: {
    preheader: "Découvre ce qui change dans la dernière version.",
    stub: "NOUVEAU",
    title: "Nouveau sur Kilist",
    button: "Mettre à jour Kilist",
    footer: (email: string) => `Envoyé à ${email} parce que tu as un compte Kilist.`,
    unsubscribe: "Se désabonner des nouveautés",
  },
  memberLeft: {
    subject: (member: string) => `${member} a quitté ton foyer sur Kilist`,
    preheader: "Tes aliments et ta liste de courses ne changent pas.",
    stub: "JOUEUR PARTI",
    title: (member: string) => `${member} a quitté ton foyer`,
    note: (household: string, players: number) =>
      `${household} · ${players} ${players <= 1 ? "joueur" : "joueurs"}`,
    body: "Tes aliments et ta liste de courses ne changent pas. Tu peux inviter quelqu'un d'autre depuis l'appli quand tu veux.",
    button: "Ouvrir Kilist",
    footer: (email: string, household: string) =>
      `Envoyé à ${email} parce que tu fais partie du foyer ${household} sur Kilist.`,
  },
  purchaseConfirm: {
    subject: (skin: string) => `Ton achat Kilist : ${skin}`,
    preheader: "Merci ! Ton nouveau style est prêt.",
    stub: "PAYÉ",
    title: (name: string) => `Merci pour ton achat, ${name}`,
    rows: {
      item: "Article",
      itemValue: (skin: string) => `Style ${skin}`,
      price: "Prix",
      date: "Date",
      order: "Commande",
    },
    body: "Ton nouveau style est prêt dans l'appli.",
    button: (skin: string) => `Porter ${skin}`,
    store: (store: string) =>
      `${store} gère le paiement et les remboursements, et t'envoie son propre reçu.`,
    footer: (email: string) =>
      `Envoyé à ${email} parce que cet achat a été fait sur ce compte Kilist.`,
  },
  skinUnlock: {
    versus: {
      subject: "Tu as débloqué Versus. Place à la course.",
      preheader: "Mêmes aliments. Le plus rapide gagne.",
      stub: "LOT GAGNÉ",
      title: "Tu as débloqué",
      hero: "VERSUS",
      note: (tickets: number, balance: number) => `${tickets} tickets échangés · il en reste ${balance}`,
      tagline: "Mêmes aliments. Le plus rapide gagne.",
      body: "Affronte ton foyer sur les aliments du jour, puis chasse le record au magasin.",
      button: "Porter Versus",
    },
    roast: {
      subject: "TU AS DÉBLOQUÉ ROAST. DÉSOLÉ.",
      preheader: (tickets: number) => `TU AS PAYÉ ${tickets} TICKETS POUR TE FAIRE INSULTER. RESPECT.`,
      stub: "LOT GAGNÉ",
      title: "TU AS VRAIMENT DÉBLOQUÉ",
      hero: "ROAST",
      note: (tickets: number, balance: number) => `${tickets} TICKETS ENVOLÉS. IL EN RESTE ${balance}.`,
      tagline: "L'APPLI DÉTESTE TES LISTES. MAINTENANT, ELLE T'A À L'ŒIL.",
      body: "",
      button: "PORTE-LE",
    },
    footer: (email: string) =>
      `Envoyé à ${email} parce que ce style a été débloqué sur ce compte Kilist.`,
  },
};

export default fr;
