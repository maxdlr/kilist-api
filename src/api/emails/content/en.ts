const en = {
  passwordReset: {
    subject: (code: string) => `Your Kilist reset code: ${code}`,
    preheader: (minutes: number) => `Tear off your ticket. It is good for ${minutes} minutes.`,
    stub: "ADMIT ONE",
    title: (name: string) => `Take a ticket, ${name}`,
    note: (minutes: number) => `Valid for ${minutes} minutes, one use only`,
    body: "Enter this code in the app to choose a new password.",
    notYou: "Didn't ask for this? Ignore this email. Your password stays the same.",
    footer: (email: string) =>
      `Sent to ${email} because someone asked to reset the password on this Kilist account.`,
  },
  signupConfirm: {
    subject: (code: string) => `Welcome to Kilist! Your code: ${code}`,
    preheader: "One code and you can start playing.",
    stub: "WELCOME",
    title: (name: string) => `Welcome to the arcade, ${name}`,
    note: (minutes: number) => `Valid for ${minutes} minutes, one use only`,
    body: "Enter this code in the app to confirm your email and start playing.",
    notYou: "Didn't sign up? Ignore this email. Your address won't be confirmed.",
    footer: (email: string) =>
      `Sent to ${email} because this address was used to create a Kilist account.`,
  },
  memberJoined: {
    subject: (member: string) => `${member} joined your household on Kilist`,
    preheader: "Player 2 has entered the game.",
    stub: "NEW PLAYER",
    title: (member: string) => `${member} joined your household`,
    note: (household: string, players: number) =>
      `${household} · ${players} ${players === 1 ? "player" : "players"}`,
    body: "You now share the same foods and shopping list.",
    button: "Open Kilist",
    notYou: (member: string, support: string) => `Don't know ${member}? Write to ${support}.`,
    footer: (email: string, household: string) =>
      `Sent to ${email} because you are a member of ${household} on Kilist.`,
  },
  accountDeleted: {
    subject: "Your Kilist account is deleted",
    preheader: "Your account, tickets and skins are gone.",
    stub: "VOID",
    title: "Your account is deleted",
    hero: "GAME OVER",
    note: (name: string) => `Thanks for playing, ${name}`,
    body: "Your account, tickets and unlocked skins are gone. This can't be undone.",
    lastInHousehold: "You were the last one in your household, so its foods were deleted too.",
    notYou: (support: string) => `Didn't do this? Write to ${support} right away.`,
    footer: (email: string) =>
      `Sent to ${email} because this Kilist account was deleted. This is the last email you will get from us.`,
  },
  releaseUpdate: {
    preheader: "See what changed in the latest version.",
    stub: "NEW",
    title: "New in Kilist",
    button: "Update Kilist",
    footer: (email: string) => `Sent to ${email} because you have a Kilist account.`,
    unsubscribe: "Unsubscribe from updates",
  },
  memberLeft: {
    subject: (member: string) => `${member} left your household on Kilist`,
    preheader: "Your foods and shopping list stay as they are.",
    stub: "PLAYER LEFT",
    title: (member: string) => `${member} left your household`,
    note: (household: string, players: number) =>
      `${household} · ${players} ${players === 1 ? "player" : "players"}`,
    body: "Your foods and shopping list stay as they are. You can invite someone else from the app anytime.",
    button: "Open Kilist",
    footer: (email: string, household: string) =>
      `Sent to ${email} because you are a member of ${household} on Kilist.`,
  },
  purchaseConfirm: {
    subject: (skin: string) => `Your Kilist purchase: ${skin}`,
    preheader: "Thanks! Your new skin is ready to wear.",
    stub: "PAID",
    title: (name: string) => `Thanks for your purchase, ${name}`,
    rows: {
      item: "Item",
      itemValue: (skin: string) => `${skin} skin`,
      price: "Price",
      date: "Date",
      order: "Order",
    },
    body: "Your new skin is ready in the app.",
    button: (skin: string) => `Wear ${skin}`,
    store: (store: string) =>
      `${store} handles the payment and refunds, and sends its own receipt.`,
    footer: (email: string) =>
      `Sent to ${email} because this purchase was made on this Kilist account.`,
  },
  skinUnlock: {
    versus: {
      subject: "You unlocked Versus. Time to race.",
      preheader: "Same foods. Fastest wins.",
      stub: "PRIZE WON",
      title: "You unlocked",
      hero: "VERSUS",
      note: (tickets: number, balance: number) => `${tickets} tickets redeemed · ${balance} left`,
      tagline: "Same foods. Fastest wins.",
      body: "Race your household through the daily foods, then chase the record at the store.",
      button: "Wear Versus",
    },
    roast: {
      subject: "YOU UNLOCKED ROAST. SORRY.",
      preheader: (tickets: number) => `YOU PAID ${tickets} TICKETS TO BE INSULTED. RESPECT.`,
      stub: "PRIZE WON",
      title: "YOU ACTUALLY UNLOCKED",
      hero: "ROAST",
      note: (tickets: number, balance: number) => `${tickets} TICKETS GONE. ${balance} LEFT.`,
      tagline: "THE APP HATES YOUR LISTS. NOW IT HAS YOUR ATTENTION.",
      body: "",
      button: "PUT IT ON",
    },
    footer: (email: string) =>
      `Sent to ${email} because this skin was unlocked on this Kilist account.`,
  },
};

export type EmailContent = typeof en;

export default en;
