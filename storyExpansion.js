/**
 * storyExpansion.js — Deep Narrative Expansion
 *
 * Adds three major systems:
 *   1. STREET_STORIES — ~30 rich, multi-choice random encounters with deep lore
 *   2. SIDE_QUESTS   — Optional multi-step quest chains between main chapters
 *   3. POST_DON_ARCS — Endgame story content after becoming Don
 *
 * All content is family-aware, tone-aware, and level-gated.
 */

// ================================================================
//  STREET STORIES – Deep Random Encounters
// ================================================================

export const STREET_STORIES = [

  // ──── EARLY GAME (Lv 1-10) ────

  {
    id: "ss_old_debts",
    title: "Old Debts",
    minLevel: 1, maxLevel: 99,
    scene: "A drizzle-slicked alley behind Sal's Diner. A man in a rumpled suit grabs your arm as you pass.",
    dialogue: [
      { speaker: "Stranger", text: "\"Please — you're with the family, right? I owe Frankie Bones twelve grand. He says if I don't pay by midnight, he'll take it from my daughter's college fund. I'm begging you.\"" },
      { speaker: "Narrator", text: "His hand trembles. The debt is legitimate. Frankie Bones is a loan shark who operates with family permission — but he's been getting crueler. This is a chance to show what kind of person you are." },
    ],
    choices: [
      {
        text: "Pay off his debt ($12,000)",
        requirements: { money: 12000 },
        successChance: 1.0,
        outcomes: {
          success: {
            money: -12000, respect: 20, reputation: 3, heat: 0,
            message: "You hand over the cash. The man weeps with gratitude. Word spreads: you're the kind who protects the little guy. Respect in the neighborhood shoots up.",
            followUp: "Three weeks later, the man — turns out he's an accountant — offers to cook your books for free. His gratitude may prove valuable."
          }
        }
      },
      {
        text: "Talk to Frankie — renegotiate the terms",
        requirements: { charisma: 3 },
        successChance: 0.7,
        outcomes: {
          success: {
            respect: 10, reputation: 2,
            message: "Frankie grumbles, but you remind him that dead clients don't pay. He agrees to a payment plan. You've earned the neighborhood's trust."
          },
          failure: {
            respect: -5,
            message: "Frankie laughs in your face. 'Mind your own business, kid.' The man's on his own. You walk away feeling the weight of powerlessness."
          }
        }
      },
      {
        text: "Tell him it's not your problem",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: -5,
            message: "You shrug and keep walking. His sobbing fades into the rain. This is the life — everyone's got problems. Yours is staying alive.",
            followUp: "You hear later that Frankie broke two of the man's fingers. The neighborhood remembers you could have helped."
          }
        }
      },
      {
        text: "Take over the debt — he works for you now",
        requirements: { gangMembers: 1 },
        successChance: 1.0,
        outcomes: {
          success: {
            money: -12000, respect: 5,
            message: "You pay Frankie and inform the man he now works for you. Errands, information, whatever you need. He agrees without hesitation — a life-debt is a life-debt.",
            followUp: "He becomes a useful informant. His day job at the courthouse gives you advance warning of police operations."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_confession",
    title: "The Confession",
    minLevel: 2, maxLevel: 99,
    scene: "Sunday morning. You're sitting in the back pew of St. Catherine's when Father Donovan slides into the seat beside you.",
    dialogue: [
      { speaker: "Father Donovan", text: "\"I know what you do for a living. I'm not here to judge — God handles that. But I heard something in confession that I can't ignore.\"" },
      { speaker: "Narrator", text: "His voice drops. A man confessed to planting a bomb in a rival family's restaurant — one that's packed with civilians every Friday night." },
      { speaker: "Father Donovan", text: "\"I can't break the seal of confession. But you... you operate outside my rules. Innocents will die if no one acts.\"" },
    ],
    choices: [
      {
        text: "Warn the restaurant anonymously",
        requirements: {},
        successChance: 0.85,
        outcomes: {
          success: {
            respect: 15, reputation: 5, heat: 5,
            message: "An anonymous tip gets the building evacuated. The bomb squad finds C4 packed under the kitchen floor. Dozens of lives saved. The bomber is now hunting whoever tipped off the cops."
          },
          failure: {
            heat: 15,
            message: "Your tip arrives too late. A partial explosion injures seven. You hear sirens as you stare at the TV in sick silence. At least nobody died."
          }
        }
      },
      {
        text: "Find the bomber yourself and handle it",
        requirements: { intelligence: 3 },
        successChance: 0.65,
        outcomes: {
          success: {
            respect: 25, reputation: 3, power: 10,
            message: "You track the bomber to a motel on the outskirts. He won't be planting anything ever again. Father Donovan never asks what you did — and you never tell him.",
            followUp: "Father Donovan becomes a quiet ally. He passes along confessional intel when lives are at stake."
          },
          failure: {
            health: -20, heat: 25,
            message: "The bomber was expecting company. You take a bullet to the shoulder but manage to escape. The bomb goes off that Friday — three dead, seventeen injured."
          }
        }
      },
      {
        text: "Stay out of it — not your business",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: -10, reputation: -2,
            message: "Friday comes. The explosion kills four people, including a little girl celebrating her birthday. Father Donovan doesn't look at you the next Sunday. Or any Sunday after.",
            followUp: "The bombing starts a gang war that makes the streets more dangerous for everyone — including you."
          }
        }
      },
      {
        text: "Use the information as leverage against the rival family",
        requirements: { intelligence: 5 },
        successChance: 0.8,
        outcomes: {
          success: {
            money: 20000, respect: -15, reputation: -5,
            message: "You sell the information to the targeted family for $20,000. They handle the threat. But Father Donovan finds out and cuts ties. You traded a man of God's trust for cash."
          },
          failure: {
            heat: 30, respect: -20,
            message: "The rival family thinks you're behind the plot. Now both sides want you dead. Maybe playing both sides wasn't the smart move."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_stray",
    title: "The Stray Dog",
    minLevel: 1, maxLevel: 15,
    scene: "Behind the warehouse, you find an emaciated pit bull chained to a pipe. It's shivering in the rain, ribs showing through matted fur.",
    dialogue: [
      { speaker: "Narrator", text: "The dog's eyes follow you. Not with fear — with something like recognition. Like it's been waiting for someone who gives a damn." },
      { speaker: "Narrator", text: "In this life, mercy is a luxury. But so is loyalty — and dogs understand loyalty better than most men." },
    ],
    choices: [
      {
        text: "Take the dog — you could use a loyal friend",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 5,
            message: "You break the chain and carry the mutt home. You name him Bones. Within a week, he's sleeping at the foot of your bed and growling at anyone who comes to the door uninvited. Everyone in the crew thinks you've gone soft — until Bones alerts you to an intruder who would have slit your throat in your sleep.",
            followUp: "Bones becomes a fixture of your operation. Somehow, having a dog makes the neighbors trust you more."
          }
        }
      },
      {
        text: "Call animal control — it's not your problem",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "You make the call and walk away. It's practical. Responsible, even. But something about those eyes stays with you for days."
          }
        }
      }
    ]
  },

  // ──── MID GAME (Lv 5-30) ────

  {
    id: "ss_the_journalist",
    title: "The Journalist",
    minLevel: 5, maxLevel: 99,
    scene: "A sharp-eyed woman with a press badge approaches you outside the Belmont Hotel. She knows your name.",
    dialogue: [
      { speaker: "Nina Castillo", text: "\"I'm Nina Castillo, investigative reporter. Before you reach for anything violent — I have insurance. A dead man's switch on a file that names every made man in this city. You kill me, it goes public.\"" },
      { speaker: "Narrator", text: "She's got nerve. She's also got a proposition." },
      { speaker: "Nina Castillo", text: "\"I don't want to burn you. I want the bigger fish. Give me access to your rivals' operations, and I'll make them front-page news. Your competition disappears, and my career takes off. Everybody wins.\"" },
    ],
    choices: [
      {
        text: "Feed her intel on your rivals",
        requirements: { intelligence: 5 },
        successChance: 0.8,
        outcomes: {
          success: {
            respect: 15, reputation: 5, money: 5000,
            message: "Over the next month, three of your biggest competitors make the front page. Indictments follow. Their territories are suddenly... available. Nina Castillo becomes a powerful — and dangerous — ally.",
            followUp: "Nina starts feeding you information too. Cops on the take, judges for sale, politicians with dirty secrets. Information is currency."
          },
          failure: {
            heat: 40, respect: -10,
            message: "Nina gets greedy and publishes a story that names you tangentially. The heat is real. You've created a monster you can't control."
          }
        }
      },
      {
        text: "Buy the file from her ($50,000)",
        requirements: { money: 50000 },
        successChance: 0.6,
        outcomes: {
          success: {
            money: -50000, heat: -15,
            message: "She takes the money and hands over a USB drive. Whether it's the only copy... you'll never know. But the immediate threat is neutralized."
          },
          failure: {
            money: -50000,
            message: "She takes your money and the story runs anyway. 'Criminal Buys Silence' is an even better headline, apparently."
          }
        }
      },
      {
        text: "Threaten her — journalists have accidents too",
        requirements: { violence: 8 },
        successChance: 0.5,
        outcomes: {
          success: {
            heat: 15, respect: 10, reputation: -5,
            message: "Your threat is delivered with enough conviction that she backs off. The file stays buried. But threatening the press is a line most families won't cross — you've made enemies in high places."
          },
          failure: {
            heat: 60, reputation: -15,
            message: "She publishes everything. The headline reads: 'I WAS THREATENED BY THE MOB.' You're now the most wanted face in the city."
          }
        }
      },
      {
        text: "Offer her a better story — the truth about city hall corruption",
        requirements: { intelligence: 8, charisma: 5 },
        successChance: 0.85,
        outcomes: {
          success: {
            respect: 20, reputation: 8,
            message: "You redirect her toward the mayor's office — a cesspool of corruption that makes your operations look quaint. She gets a Pulitzer. You get a grateful journalist who owes you everything. The mob file is quietly destroyed.",
            followUp: "Nina becomes your media contact. When you need a story buried or amplified, she's one phone call away."
          },
          failure: {
            heat: 20,
            message: "She doesn't bite. 'Politicians bore me,' she says. 'Mobsters are much more photogenic.' You've bought yourself time, nothing more."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_kid",
    title: "Corner Boy",
    minLevel: 5, maxLevel: 99,
    scene: "You spot a kid — can't be older than fifteen — running a corner for a crew that isn't yours. He's fast, sharp-eyed, and probably going to be dead by twenty at this rate.",
    dialogue: [
      { speaker: "The Kid", text: "\"I ain't scared of you. You want this corner, you gotta talk to my people.\"" },
      { speaker: "Narrator", text: "He's got spirit. Reminds you of yourself at that age — too brave for his own good, standing on a corner that could be his grave." },
    ],
    choices: [
      {
        text: "Offer him a real job — no more corner work",
        requirements: { money: 2000 },
        successChance: 0.75,
        outcomes: {
          success: {
            money: -2000, respect: 15,
            message: "You set him up in one of your legitimate fronts. He's skeptical at first, but the steady paycheck and the roof over his head start to change him. His crew comes looking for him — your crew sends them away.",
            followUp: "Two years later, he's managing one of your businesses and running it better than anyone expected. Loyalty earned, not demanded."
          },
          failure: {
            respect: -5,
            message: "He laughs in your face and goes back to the corner. Some people have to learn the hard way. You just hope he survives long enough to learn."
          }
        }
      },
      {
        text: "Recruit him — he's got potential",
        requirements: { gangMembers: 1 },
        successChance: 0.85,
        outcomes: {
          success: {
            respect: 5,
            message: "You take him under your wing. He's hungry, smart, and utterly fearless. In six months, he's one of your most reliable runners.",
            followUp: "He's loyal to you personally — not the family. That kind of bond is rare, and dangerous to both of you."
          },
          failure: {
            message: "He agrees, but his old crew doesn't let go easily. A turf dispute erupts that takes weeks to settle."
          }
        }
      },
      {
        text: "Walk away — not every kid is your responsibility",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "You keep moving. He watches you go with those old eyes in a young face. The corner swallows him up again. This city eats its children."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_funeral",
    title: "A Funeral in Brooklyn",
    minLevel: 8, maxLevel: 99,
    scene: "The church is packed. Tony 'Two-Touch' Martinelli is being laid to rest. Every made man in three boroughs is here — including some who wanted him dead.",
    dialogue: [
      { speaker: "Narrator", text: "Funerals in this world serve two purposes: mourning and politics. The real business happens in the parking lot." },
      { speaker: "Carmine Deluca", text: "\"A shame about Tony. Good earner. Better friend.\" He leans closer. \"His territory is up for grabs. I know three crews already circling.\"" },
      { speaker: "Narrator", text: "Carmine is offering you first shot at Tony's turf — a lucrative waterfront zone. But taking it means stepping on some very dangerous toes." },
    ],
    choices: [
      {
        text: "Claim the territory — Tony would have wanted it",
        requirements: { gangMembers: 3 },
        successChance: 0.6,
        outcomes: {
          success: {
            money: 15000, respect: 25, reputation: 5, power: 20,
            message: "You move fast. Your crew secures the waterfront before the competition can react. The other families grumble, but possession is nine-tenths of the law — even in the underworld.",
            followUp: "The waterfront becomes one of your most profitable zones. Smuggling, shipping, and import/export — all under your control."
          },
          failure: {
            health: -25, heat: 30, respect: -10,
            message: "The Kozlov Bratva had the same idea. A brutal firefight at the docks leaves three of your men in the hospital and your claim contested."
          }
        }
      },
      {
        text: "Propose a sit-down to divide the territory",
        requirements: { charisma: 8 },
        successChance: 0.8,
        outcomes: {
          success: {
            money: 8000, respect: 15, reputation: 8,
            message: "You broker a deal. Three families split Tony's territory, with you taking the most profitable slice. Everyone thinks they won. That's diplomacy.",
            followUp: "Your reputation as a negotiator grows. When disputes arise, people come to you for arbitration."
          },
          failure: {
            respect: -5,
            message: "The sit-down dissolves into shouting. No deal. The territory becomes a contested war zone that nobody profits from."
          }
        }
      },
      {
        text: "Pay your respects and leave — let them fight over scraps",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 5,
            message: "You attend the funeral with dignity and leave before the vultures descend. Tony's widow notices. She remembers respect when others showed only greed."
          }
        }
      }
    ]
  },

  {
    id: "ss_crooked_cop",
    title: "The Crooked Badge",
    minLevel: 6, maxLevel: 99,
    scene: "Detective Morrison corners you in a parking garage. He's sweating, eyes darting.",
    dialogue: [
      { speaker: "Detective Morrison", text: "\"I need fifteen thousand by Friday, or my bookie sends someone to break my legs. I know things — patrol routes, upcoming raids, which judges are on the take. I can be useful.\"" },
      { speaker: "Narrator", text: "A desperate cop is a useful tool. It's also a ticking time bomb. Internal Affairs loves nothing more than flipping dirty cops." },
    ],
    choices: [
      {
        text: "Put him on the payroll ($15,000/month)",
        requirements: { money: 15000 },
        successChance: 0.8,
        outcomes: {
          success: {
            money: -15000, heat: -25, respect: 10,
            message: "Morrison becomes your inside man. Raid schedules, evidence room access, witness lists — the intelligence is invaluable. Your operations run smoother than ever.",
            followUp: "Over the next year, Morrison's tips save you from three major busts. The investment pays for itself a hundred times over."
          },
          failure: {
            money: -15000, heat: 50,
            message: "Internal Affairs was already watching Morrison. They flip him, and now he's wearing a wire. You just bought yourself a federal investigation."
          }
        }
      },
      {
        text: "Help him once, but keep it transactional",
        requirements: { money: 15000 },
        successChance: 0.9,
        outcomes: {
          success: {
            money: -15000, heat: -10, respect: 5,
            message: "You pay his debt. One time. In return, he owes you a favor. A specific, limited favor. No ongoing relationship, no paper trail."
          },
          failure: {
            money: -15000,
            message: "He takes the money and you never hear from him again. Cops — can't trust them even when they're crooked."
          }
        }
      },
      {
        text: "Record the conversation and use it as leverage",
        requirements: { intelligence: 7 },
        successChance: 0.7,
        outcomes: {
          success: {
            heat: -20, respect: 15,
            message: "Your phone records everything. Morrison is now yours — not because of money, but because of fear. A cop in your pocket who can't ever leave.",
            followUp: "Morrison provides intel for years, terrified of the recording. It's not friendship. It's ownership."
          },
          failure: {
            heat: 30,
            message: "Morrison finds the recording device. He's furious — and scared. He goes straight to IA and confesses everything, naming you as a criminal contact."
          }
        }
      },
      {
        text: "Turn him away — dirty cops are too risky",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "You tell Morrison to find his money somewhere else. He stumbles away into the night. Three days later, they find him in the river. The bookie wasn't bluffing."
          }
        }
      }
    ]
  },

  {
    id: "ss_mothers_visit",
    title: "A Mother's Visit",
    minLevel: 3, maxLevel: 99,
    scene: "Your mother shows up unannounced at your apartment. She brings tupperware. She brings questions.",
    dialogue: [
      { speaker: "Your Mother", text: "\"I see you on the news, you know. 'Gang activity in the neighborhood.' That's my neighborhood. That's you, isn't it?\"" },
      { speaker: "Narrator", text: "She sets the food on the counter and looks around your apartment — the expensive furniture, the locked closet she knows better than to open." },
      { speaker: "Your Mother", text: "\"Your father, God rest him — he worked sixty years in the shipyard. Came home every night with clean hands. I just want to know: are your hands clean?\"" },
    ],
    choices: [
      {
        text: "Lie — \"I'm in consulting, Ma. Legitimate business.\"",
        requirements: { charisma: 3 },
        successChance: 0.6,
        outcomes: {
          success: {
            message: "She doesn't believe you. But she accepts the lie because the alternative is unbearable. She hugs you tightly and tells you to eat more. You hold on a second longer than usual."
          },
          failure: {
            message: "She sees right through you. 'Don't lie to your mother.' She leaves the food and walks out. You eat alone, and the manicotti tastes like guilt."
          }
        }
      },
      {
        text: "Tell the truth — she deserves that much",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 5,
            message: "You tell her everything. She cries. Then she slaps you. Then she cries again. 'I raised you better,' she says. But she stays for dinner, and she keeps coming back every Sunday. That's love.",
            followUp: "Having someone who knows the truth — and loves you anyway — is an anchor. On the worst nights, it's the only thing keeping you human."
          }
        }
      },
      {
        text: "Give her money and tell her not to worry",
        requirements: { money: 10000 },
        successChance: 1.0,
        outcomes: {
          success: {
            money: -10000,
            message: "She refuses the money three times before accepting. 'I don't want it,' she says, folding the bills into her purse. 'I want my son back.' She leaves, and the apartment has never felt so empty."
          }
        }
      }
    ]
  },

  // ──── LATE GAME (Lv 15+) ────

  {
    id: "ss_the_don_call",
    title: "The Don's Dilemma",
    minLevel: 15, maxLevel: 99,
    scene: "Three AM. Your phone rings. The number is blocked, but you recognize the voice immediately — it's the head of a rival family.",
    dialogue: [
      { speaker: "Rival Don", text: "\"I know we've had our differences. But I have a problem that requires... discretion. My underboss is planning a coup. I need him gone before sunrise.\"" },
      { speaker: "Narrator", text: "A rival Don asking for your help is unprecedented. The payment would be enormous. But so would the implications." },
      { speaker: "Rival Don", text: "\"Do this, and I'll owe you a favor. A real favor. You know what that means in our world.\"" },
    ],
    choices: [
      {
        text: "Accept — a Don's favor is worth everything",
        requirements: { gangMembers: 4, violence: 12 },
        successChance: 0.7,
        outcomes: {
          success: {
            money: 100000, respect: 40, reputation: 10, power: 30,
            message: "Your crew handles it clean. The underboss disappears. The rival Don is in your debt — the most valuable currency in organized crime. This changes the balance of power in the entire city.",
            followUp: "Months later, when the feds come for you, one phone call to your debtor makes the case vanish. A Don's favor is worth more than gold."
          },
          failure: {
            health: -35, heat: 50, respect: -20,
            message: "The underboss was expecting trouble. Two of your guys don't come home. The rival Don denies ever calling you. You've been played — or the situation was more complex than anyone let on."
          }
        }
      },
      {
        text: "Warn the underboss instead — shift the power",
        requirements: { intelligence: 10 },
        successChance: 0.65,
        outcomes: {
          success: {
            money: 75000, respect: 30, reputation: -5,
            message: "You tip off the underboss. The coup succeeds overnight — and the grateful new Don remembers who made it possible. You've just kingmade the new head of a rival family.",
            followUp: "The new Don is loyal to you personally. An unprecedented alliance forms between your families."
          },
          failure: {
            heat: 40, respect: -25,
            message: "The underboss bungles the coup. Both sides blame you. Your name is mud with every family in the city."
          }
        }
      },
      {
        text: "Decline — this isn't your war",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "You hang up. The next morning, you hear the underboss was found in a dumpster behind a Chinese restaurant. The Don handled it himself — messily. He won't forget that you turned him down."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_painting",
    title: "The Stolen Masterpiece",
    minLevel: 10, maxLevel: 99,
    scene: "Your fence, Louie the Greek, calls you to his back room. On the table sits a painting in an ornate gold frame.",
    dialogue: [
      { speaker: "Louie the Greek", text: "\"Vermeer. 'The Concert.' Stolen from the Isabella Stewart Gardner Museum in 1990. The FBI has a $10 million reward for its return. A private collector will pay $2 million, no questions.\"" },
      { speaker: "Narrator", text: "The painting is worth half a billion on the legitimate market. In the underworld, it's worth either a fortune or a federal sentence." },
      { speaker: "Louie the Greek", text: "\"I need an answer by tomorrow. There are other buyers.\"" },
    ],
    choices: [
      {
        text: "Buy it and sell to the private collector ($500K investment)",
        requirements: { money: 500000 },
        successChance: 0.7,
        outcomes: {
          success: {
            money: 1500000, respect: 20,
            message: "The deal goes through. $2 million from a billionaire who keeps it in a climate-controlled vault. Net profit: $1.5 million. Not bad for a day's work — as long as nobody talks."
          },
          failure: {
            money: -500000, heat: 60,
            message: "The buyer was an FBI sting. You lose the painting and the money. Louie vanishes. The investigation puts heat on every one of your operations."
          }
        }
      },
      {
        text: "Return it for the $10M FBI reward (anonymously)",
        requirements: { intelligence: 8 },
        successChance: 0.6,
        outcomes: {
          success: {
            money: 10000000, heat: -30, respect: -15, reputation: -10,
            message: "Through cutouts and intermediaries, the painting finds its way back. The reward is laundered through shell companies. You're $10 million richer. But word gets out that you cooperated with the feds — it doesn't matter that it was just a painting."
          },
          failure: {
            heat: 80,
            message: "The FBI traces the return to your network. They don't care about the painting anymore — they care about who had access to it. Congratulations, you're now a person of interest."
          }
        }
      },
      {
        text: "Keep it — hang it in your office",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 30, reputation: 5,
            message: "You hang a $500 million painting in your office. Every wiseguy who walks in and recognizes it goes pale. It's the most ostentatious power move in the history of organized crime. And somehow, it works.",
            followUp: "The painting becomes legendary. When other families hear about 'the boss with the Vermeer,' your reputation precedes you everywhere."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_wedding",
    title: "The Wedding",
    minLevel: 7, maxLevel: 99,
    scene: "Your cousin Maria is getting married at the Palazzo Grande. Half the guests are legitimate — teachers, nurses, plumbers. The other half... aren't.",
    dialogue: [
      { speaker: "Uncle Enzo", text: "\"Beautiful ceremony, eh? Listen — your cousin's new father-in-law, he's got a construction company. Very profitable. Very connected to city contracts. I think you two should talk.\"" },
      { speaker: "Narrator", text: "The father-in-law, Frank Pacella, runs concrete. If there's a building going up in the metro area, his trucks pour the foundation. He's not mob — but he's mob-adjacent." },
    ],
    choices: [
      {
        text: "Propose a partnership — mutual benefit",
        requirements: { charisma: 6 },
        successChance: 0.8,
        outcomes: {
          success: {
            money: 25000, respect: 15, reputation: 5,
            message: "Frank's a pragmatist. Your family provides 'labor peace' on his construction sites; his company launders cash through inflated invoices. A classic arrangement that benefits everyone."
          },
          failure: {
            respect: -5,
            message: "Frank isn't interested. 'I keep my nose clean,' he says. But his eyes say he's scared. Give it time."
          }
        }
      },
      {
        text: "Enjoy the wedding — no business today",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "You dance with your cousin. You eat too much cake. You watch your mother cry happy tears. For one evening, you're just a guy at a wedding. It's the first time you've felt normal in months."
          }
        }
      },
      {
        text: "Quietly scope out which guests might be useful contacts",
        requirements: { intelligence: 5 },
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 5,
            message: "You work the room like a pro. By the end of the night, you've identified a city inspector, a port authority official, and an assistant DA. Business cards exchanged. Seeds planted. The long game.",
            followUp: "Three of those wedding contacts become valuable assets within the year."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_hospital",
    title: "The Hospital Visit",
    minLevel: 10, maxLevel: 99,
    scene: "Your right-hand man is in the ICU after a drive-by. The doctors say fifty-fifty. The hallway is full of your crew, anger boiling just beneath the surface.",
    dialogue: [
      { speaker: "Narrator", text: "The shooter was from the Eastside Bloods — a street gang that's been encroaching on your territory. This wasn't random. It was a message." },
      { speaker: "Crew Member", text: "\"Say the word, boss. We hit them tonight. Every corner, every stash house. We burn them to the ground.\"" },
    ],
    choices: [
      {
        text: "Full retaliation — hit them everywhere at once",
        requirements: { gangMembers: 5, violence: 10 },
        successChance: 0.7,
        outcomes: {
          success: {
            respect: 35, reputation: 5, power: 25, heat: 40,
            message: "Your crew moves like a tsunami. Every operation the Eastside Bloods had is gone by sunrise. The message is clear: touch ours, and we erase yours. The streets remember.",
            followUp: "No one tests your territory for six months. Fear is an effective deterrent."
          },
          failure: {
            health: -30, heat: 50, respect: -10,
            message: "They were expecting retaliation. It turns into a war that grinds on for weeks. More of your people end up in hospital beds. Or in the ground."
          }
        }
      },
      {
        text: "Find the actual shooter — surgical, not wholesale",
        requirements: { intelligence: 8 },
        successChance: 0.75,
        outcomes: {
          success: {
            respect: 25, reputation: 8,
            message: "You find the shooter. You handle him personally. A single, precise response. The rest of the gang gets the message without a war. This is how a Don operates — with a scalpel, not a sledgehammer."
          },
          failure: {
            heat: 25,
            message: "The shooter is long gone — already fled to another state. You're left with nothing but frustration and a crew demanding blood."
          }
        }
      },
      {
        text: "Focus on your man — vengeance can wait",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: -5,
            message: "You stay at the hospital. All night, all day. When your man wakes up, your face is the first thing he sees. 'I'm still here, boss?' he whispers. 'You're still here,' you say. Vengeance isn't going anywhere.",
            followUp: "He recovers. And he'd take a bullet for you again without hesitation. Some loyalties are forged in hospital hallways."
          }
        }
      }
    ]
  },

  {
    id: "ss_fbi_approach",
    title: "The FBI Offer",
    minLevel: 12, maxLevel: 99,
    scene: "An unmarked sedan pulls up beside you at a stoplight. The window rolls down.",
    dialogue: [
      { speaker: "Agent Torres", text: "\"Don't reach for anything. I'm Agent Torres, FBI Organized Crime Task Force. I'm not here to arrest you — I'm here to make you an offer.\"" },
      { speaker: "Narrator", text: "He slides an envelope through the window. Inside: photographs of your operations, transcripts of your calls, and a single typed page." },
      { speaker: "Agent Torres", text: "\"Witness protection. New name, new city, new life. All you have to do is testify against the families. Think about it. My number's in the envelope.\"" },
    ],
    choices: [
      {
        text: "Burn the envelope. Walk away.",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            respect: 25, reputation: 5,
            message: "You light the envelope on fire right there at the stoplight. Torres watches it burn. 'Your funeral,' he says, and drives away. Maybe. But at least it'll be YOUR funeral, not a rat's.",
            followUp: "Word gets around that you burned the FBI's offer without reading it. In the underworld, that's the stuff of legends."
          }
        }
      },
      {
        text: "Keep the envelope. Just in case.",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            heat: -5,
            message: "You tuck it into your jacket. Having an escape route doesn't make you a rat — it makes you smart. Maybe you'll never use it. Probably. But it's there, burning a hole in your pocket and your conscience."
          }
        }
      },
      {
        text: "Feed Torres disinformation — use the FBI as a weapon",
        requirements: { intelligence: 12 },
        successChance: 0.5,
        outcomes: {
          success: {
            respect: 30, reputation: 10, heat: -30,
            message: "You become Torres's 'confidential informant' — feeding him just enough real intel to be credible, mixed with fabricated evidence against your rivals. The FBI becomes your personal weapon against the competition. It's the most dangerous game imaginable, but the rewards are staggering.",
            followUp: "For months, the FBI dismantles your competition based on your 'tips.' You're playing with fire — nuclear fire — but so far, you haven't been burned."
          },
          failure: {
            heat: 80, respect: -40,
            message: "Torres realizes you're playing him. The full weight of the federal government pivots onto you. Surveillance, wiretaps, grand jury subpoenas. You just made yourself the FBI's top priority."
          }
        }
      }
    ]
  },

  {
    id: "ss_the_barber",
    title: "The Barber's Secret",
    minLevel: 4, maxLevel: 99,
    scene: "Old Sal's barbershop — where every made man gets his cut. You're in the chair when Sal leans close with the razor.",
    dialogue: [
      { speaker: "Old Sal", text: "\"Thirty-seven years I've been cutting hair. Every boss, every soldier, every punk with ambitions. They all talk in the chair — they forget I'm listening.\"" },
      { speaker: "Narrator", text: "Sal's razor pauses near your jugular. Not a threat — a reminder of intimacy." },
      { speaker: "Old Sal", text: "\"I heard something last week. Something that could save your life or make your fortune. But information has a price. Two thousand, and I'll tell you everything.\"" },
    ],
    choices: [
      {
        text: "Pay the man ($2,000)",
        requirements: { money: 2000 },
        successChance: 0.85,
        outcomes: {
          success: {
            money: -2000, respect: 10,
            message: "Sal tells you about a shipment — $3 million in pharmaceuticals passing through the old rail yard Thursday night, guarded by only two men. The information is golden.",
            followUp: "The tip pays off enormously. Sal becomes your best intelligence source — he hears everything from every family."
          },
          failure: {
            money: -2000,
            message: "The tip is outdated. The shipment already moved. Two grand for nothing. Sal shrugs: 'Win some, lose some.' He does give you an excellent haircut, though."
          }
        }
      },
      {
        text: "\"I don't pay for rumors, Sal.\"",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "Sal nods and goes back to cutting your hair. He respects the principle, if not the decision. The information goes to whoever pays first."
          }
        }
      }
    ]
  },

  {
    id: "ss_dock_strike",
    title: "The Dock Strike",
    minLevel: 8, maxLevel: 99,
    scene: "The longshoremen are threatening a strike at Port Newark. Three of your containers are sitting on the docks — perishable cargo that won't survive a shutdown.",
    dialogue: [
      { speaker: "Jimmy Hooks", text: "\"The union wants a 15% raise. Management says 3%. Nobody's blinking. Your containers could be stuck for weeks.\"" },
      { speaker: "Narrator", text: "Those containers hold $200,000 worth of imported goods — some legitimate, some decidedly not." },
    ],
    choices: [
      {
        text: "Negotiate between the union and management",
        requirements: { charisma: 10 },
        successChance: 0.7,
        outcomes: {
          success: {
            money: 30000, respect: 25, reputation: 10,
            message: "You broker a deal: 8% raise, better benefits, and a 'labor peace' payment to certain union officials. Everyone saves face. Your containers move. And every company on the waterfront now owes you a favor."
          },
          failure: {
            money: -10000,
            message: "Both sides are too stubborn. The strike goes ahead. You manage to get your containers out through a side deal, but it costs you $10,000 in bribes."
          }
        }
      },
      {
        text: "Break the strike with scab labor",
        requirements: { gangMembers: 5, violence: 8 },
        successChance: 0.8,
        outcomes: {
          success: {
            money: 0, respect: -20, power: 15,
            message: "Your crew 'escorts' replacement workers through the picket line. The containers move. But every dockworker in the city now hates your guts. In a waterfront-dependent operation, that's a big risk."
          },
          failure: {
            health: -15,
            message: "The longshoremen fight back. The docks become a battlefield. Your reputation with working people craters."
          }
        }
      },
      {
        text: "Write off the loss and wait it out",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            money: -50000,
            message: "The strike lasts two weeks. By the time it ends, $50,000 of your cargo is spoiled. It's the cost of doing business. Sometimes the game plays you."
          }
        }
      }
    ]
  },

  {
    id: "ss_old_rival",
    title: "Ghost from the Past",
    minLevel: 10, maxLevel: 99,
    scene: "You're eating alone at a diner when someone sits across from you. You don't recognize them at first — but then you do. It's Marco. You grew up on the same block.",
    dialogue: [
      { speaker: "Marco", text: "\"Been a long time. Fifteen years? I heard you made it big. Me... I went the other way. Straight. Sort of.\"" },
      { speaker: "Narrator", text: "Marco looks tired. The kind of tired that comes from years of honest work and not much to show for it." },
      { speaker: "Marco", text: "\"My daughter needs surgery. The insurance won't cover it. I'm not here to beg — I'm here to ask if you need someone. Anything. I'll do anything.\"" },
    ],
    choices: [
      {
        text: "Help him — no strings attached ($25,000)",
        requirements: { money: 25000 },
        successChance: 1.0,
        outcomes: {
          success: {
            money: -25000, respect: 20,
            message: "You hand him the money. He tries to hug you. You let him. 'I'll pay you back,' he says, crying. 'No,' you say. 'You won't.' Some debts aren't meant to be repaid.",
            followUp: "Marco's daughter recovers. He names his next child after you. In a life full of transactions, it's the purest thing you've done."
          }
        }
      },
      {
        text: "Give him a job — legitimate, through your fronts",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            money: -5000, respect: 10,
            message: "You set him up managing one of your laundromat fronts. Good pay, health insurance. His daughter gets the surgery. He never asks what really goes through those back rooms."
          }
        }
      },
      {
        text: "Tell him you can't help — you've got your own problems",
        requirements: {},
        successChance: 1.0,
        outcomes: {
          success: {
            message: "He nods. Doesn't argue. Gets up and leaves his coffee untouched. You sit there for a long time after he's gone, remembering the two kids who used to play stickball on 34th Street. One chose the straight path. The other chose yours. Neither is easy."
          }
        }
      }
    ]
  },

  {
    id: "ss_casino_whale",
    title: "The High Roller",
    minLevel: 12, maxLevel: 99,
    scene: "A Saudi prince just dropped $2 million at your casino — and he's still losing. He's also getting increasingly erratic.",
    dialogue: [
      { speaker: "Floor Manager", text: "\"He's been at the tables for sixteen hours. Hasn't eaten. Won't listen to the waitresses. His bodyguards are getting nervous.\"" },
      { speaker: "Narrator", text: "A whale this size is every casino's dream — until they do something stupid. The prince's losses are your gains, but a dead prince on your floor is an international incident." },
    ],
    choices: [
      {
        text: "Let him keep playing — money is money",
        requirements: {},
        successChance: 0.7,
        outcomes: {
          success: {
            money: 500000, respect: 5,
            message: "He loses another $500K before his bodyguards physically drag him out. The house wins. Again. But the prince's family sends a lawyer the next week — they want the money back. Not your problem, legally. But these aren't legal people."
          },
          failure: {
            money: -200000, heat: 30, reputation: -10,
            message: "He has a heart attack at the blackjack table. The paramedics make a scene. The media runs the story. 'CASINO LETS MILLIONAIRE GAMBLE TO DEATH.' A PR nightmare."
          }
        }
      },
      {
        text: "Cut him off — comps for the night, fresh start tomorrow",
        requirements: { charisma: 8 },
        successChance: 0.85,
        outcomes: {
          success: {
            money: 50000, respect: 15, reputation: 10,
            message: "You approach the prince personally. 'My friend, a man of your stature deserves rest. The penthouse suite is yours tonight — on the house.' He resists, but you're persuasive. He comes back the next day, refreshed and grateful. He loses another $500K — happily.",
            followUp: "The prince becomes a regular. He brings friends. Your casino's reputation among the ultra-wealthy skyrockets."
          },
          failure: {
            respect: -5,
            message: "He takes offense at being told what to do. His bodyguards cause a scene. He leaves and never comes back. You trade goodwill for lost revenue."
          }
        }
      }
    ]
  }
];


// ================================================================
//  SIDE QUESTS – Multi-Step Optional Chains
// ================================================================

export const SIDE_QUESTS = [
  {
    id: "sq_informant_network",
    title: "The Informant Network",
    description: "Build a web of informants across the city — bartenders, taxi drivers, hotel clerks — people who see everything and tell only you.",
    icon: "🕸️",
    minLevel: 5,
    steps: [
      {
        id: "sq_informant_1",
        title: "The Bartender",
        narrative: "Big Mike at the Rusty Anchor hears everything. Drunks talk. You need him listening for you. He wants protection — someone's been shaking him down.",
        objective: { type: "money", target: 5000, text: "Pay $5,000 to secure Big Mike" },
        reward: { money: -5000, respect: 5 },
        completionText: "Big Mike's on your team now. Every Friday, he passes along what he's heard. It's surprising what people say when they think nobody's listening."
      },
      {
        id: "sq_informant_2",
        title: "The Cab Driver",
        narrative: "Rosa drives a cab through every borough. She sees who meets who, who goes where, who's lying about where they've been. Her mother needs medical care.",
        objective: { type: "money", target: 10000, text: "Pay $10,000 for Rosa's help" },
        reward: { money: -10000, respect: 5 },
        completionText: "Rosa starts feeding you movement data. You now know when rivals travel, where cops eat lunch, and which politicians visit which hotels. Knowledge is power."
      },
      {
        id: "sq_informant_3",
        title: "The Hotel Clerk",
        narrative: "Timothy works the front desk at the Grand Meridian — where every powerful person in the city stays. He has access to guest lists, phone records, and room service bills that reveal mistresses and vices.",
        objective: { type: "level", target: 10, text: "Reach level 10 to earn Timothy's trust" },
        reward: { respect: 15, reputation: 5 },
        completionText: "Your network is complete. Three sets of ears in three crucial locations. The information flows like a river — and you control the dam."
      }
    ],
    completionReward: { money: 25000, respect: 30, reputation: 10 },
    completionNarrative: "They call it 'The Wire' — your network of informants that hears every whisper in the city. Crimes are prevented, rivals are anticipated, and opportunities appear before they're public. This is how empires are built — not with bullets, but with information."
  },

  {
    id: "sq_safe_houses",
    title: "The Safe House Network",
    description: "Establish hidden safe houses across the city — places to disappear when the heat gets too intense.",
    icon: "🏠",
    minLevel: 8,
    steps: [
      {
        id: "sq_safe_1",
        title: "The Basement on Prospect Ave",
        narrative: "An abandoned building in Prospect Heights has a sub-basement that doesn't appear on any blueprints. A little renovation and it becomes invisible.",
        objective: { type: "money", target: 15000, text: "Invest $15,000 in the first safe house" },
        reward: { money: -15000, respect: 5 },
        completionText: "The basement is stocked with supplies, cash, fake IDs, and a shortwave radio. If everything goes wrong, this is Plan B."
      },
      {
        id: "sq_safe_2",
        title: "The Doctor's Clinic",
        narrative: "Dr. Vasquez runs a clinic in the Bronx. For the right price, she treats gunshots without calling the cops. She needs funding to keep the clinic open.",
        objective: { type: "money", target: 25000, text: "Fund Dr. Vasquez's clinic ($25,000)" },
        reward: { money: -25000, respect: 10 },
        completionText: "Dr. Vasquez is now on call 24/7 for your crew. Bullet wounds, knife cuts, broken bones — all treated discreetly. The clinic also serves as a safe house and medical facility."
      },
      {
        id: "sq_safe_3",
        title: "The Boat",
        narrative: "A 40-foot fishing boat docked at the marina. Registered to a dead man. If the city gets too hot, this is your ticket to international waters.",
        objective: { type: "money", target: 50000, text: "Purchase and outfit the boat ($50,000)" },
        reward: { money: -50000, respect: 10 },
        completionText: "The boat is fueled, provisioned, and ready. False compartments hide weapons and cash. If the feds kick in every door in the city, you've got a way out."
      }
    ],
    completionReward: { money: 0, respect: 25, reputation: 15 },
    completionNarrative: "Three safe houses. Three exits. Three chances to survive the unsurvivable. In this business, the ones who last aren't the toughest — they're the ones who plan for the worst. You've just made yourself extremely hard to kill."
  },

  {
    id: "sq_ghost_money",
    title: "Ghost Money",
    description: "Build an untraceable money laundering operation that turns dirty cash into clean investments.",
    icon: "💰",
    minLevel: 12,
    steps: [
      {
        id: "sq_ghost_1",
        title: "The Laundromat",
        narrative: "Every criminal empire starts with a front. A chain of laundromats is classic for a reason — high cash volume, minimal paper trail.",
        objective: { type: "money", target: 30000, text: "Open a laundromat chain ($30,000)" },
        reward: { money: -30000, respect: 5 },
        completionText: "Three locations, all cash businesses. Every week, dirty money goes in as 'revenue' and comes out squeaky clean. Pun intended."
      },
      {
        id: "sq_ghost_2",
        title: "The Accountant",
        narrative: "A forensic accountant named Gerald has been disbarred for 'creative bookkeeping.' His skills are exactly what you need to layer your money through a maze of shell companies.",
        objective: { type: "level", target: 15, text: "Reach level 15 to recruit Gerald" },
        reward: { respect: 10 },
        completionText: "Gerald builds you a financial labyrinth. Money flows through twelve shell companies in four countries before landing in your offshore accounts. The IRS would need a decade to untangle it."
      },
      {
        id: "sq_ghost_3",
        title: "The Real Estate Play",
        narrative: "The final piece: buying and flipping commercial real estate. Clean money buys property, property generates income, income buys more property. An infinite loop of legitimacy.",
        objective: { type: "money", target: 100000, text: "Invest $100,000 in real estate" },
        reward: { money: -100000, respect: 15 },
        completionText: "Your real estate portfolio is your crown jewel. On paper, you're a successful property developer. In reality, every building is a monument to the streets that built you."
      }
    ],
    completionReward: { money: 200000, respect: 40, reputation: 20 },
    completionNarrative: "Ghost Money. That's what they call your operation — because the cash appears from nowhere and vanishes into thin air. The IRS, the FBI, Interpol — they can smell the money but they can't see it. You've built the perfect financial machine."
  },

  {
    id: "sq_code_of_honor",
    title: "The Code",
    description: "Establish your personal code of conduct — the rules that define your criminal empire.",
    icon: "📜",
    minLevel: 3,
    steps: [
      {
        id: "sq_code_1",
        title: "No Women, No Children",
        narrative: "A dispute with a rival escalates. One of your lieutenants suggests targeting the rival's family. This is the moment that defines what kind of organization you run.",
        objective: { type: "jobs", target: 15, text: "Complete 15 jobs without harming civilians" },
        reward: { respect: 15, reputation: 5 },
        completionText: "You lay down the law: families are off-limits. Some of your crew grumble, but the ones who matter — the ones with brains — understand. Honor isn't just a word. It's a weapon."
      },
      {
        id: "sq_code_2",
        title: "Omertà",
        narrative: "One of your men gets pinched. The cops are offering him a deal. This is the test of your organization's loyalty.",
        objective: { type: "money", target: 20000, text: "Fund legal defense ($20,000)" },
        reward: { money: -20000, respect: 20 },
        completionText: "You hire the best lawyer in the city. Your man keeps his mouth shut. The case falls apart. The message is clear: loyalty is rewarded. Always."
      },
      {
        id: "sq_code_3",
        title: "The Tithe",
        narrative: "Every week, you set aside a percentage of earnings for the families of imprisoned members. It's expensive. It's also what separates a crew from a family.",
        objective: { type: "money", target: 50000, text: "Establish the weekly tithe fund ($50,000)" },
        reward: { money: -50000, respect: 25, reputation: 10 },
        completionText: "The tithe becomes sacred. Wives and children of imprisoned members receive weekly envelopes — enough to cover rent, food, and school. In return, you have absolute loyalty from every man who walks through your door."
      }
    ],
    completionReward: { money: 10000, respect: 50, reputation: 25 },
    completionNarrative: "They whisper about your Code on every corner. No women. No children. Omertà. The Tithe. In a world of animals, you've built something with honor. Not everyone agrees — some call it weakness. But the men who follow you? They'd walk through fire. And that's worth more than all the money in the world."
  },

  {
    id: "sq_nightlife_empire",
    title: "King of the Night",
    description: "Build a string of nightclubs, lounges, and speakeasies that become the social hub of the city's underworld.",
    icon: "🌙",
    minLevel: 10,
    steps: [
      {
        id: "sq_night_1",
        title: "The Velvet Room",
        narrative: "A burned-out warehouse in the Meatpacking District. With the right investment, it becomes the hottest lounge in the city — dim lights, leather booths, jazz quartet. The kind of place where deals are made over old fashioneds.",
        objective: { type: "money", target: 40000, text: "Open The Velvet Room ($40,000)" },
        reward: { money: -40000, respect: 10 },
        completionText: "Opening night is electric. Everyone who's anyone shows up. Politicians, athletes, movie stars — all mixing with your crew like it's the most natural thing in the world. The Velvet Room is officially the place to be."
      },
      {
        id: "sq_night_2",
        title: "The Underground",
        narrative: "Below The Velvet Room, behind a bookshelf that slides open with a password, lies something special: a prohibition-era speakeasy rebuilt for the modern age. Invite only.",
        objective: { type: "level", target: 13, text: "Reach level 13 to unlock the VIP network" },
        reward: { respect: 15, reputation: 10 },
        completionText: "The Underground becomes the most exclusive space in the city. A place where judges drink with criminals, where cops dance with con artists. What happens underground, stays underground. And you control the guest list."
      },
      {
        id: "sq_night_3",
        title: "The Circuit",
        narrative: "Three more venues: a rooftop bar in Midtown, a dive bar in Brooklyn that serves craft cocktails, and a members-only cigar lounge. All connected. All yours.",
        objective: { type: "money", target: 75000, text: "Expand the nightlife empire ($75,000)" },
        reward: { money: -75000, respect: 15 },
        completionText: "Five venues, seven nights a week. The money flows like champagne. But more importantly, every conversation, every handshake, every secret whispered in the dark — you control the spaces where power congregates."
      }
    ],
    completionReward: { money: 100000, respect: 35, reputation: 20 },
    completionNarrative: "They call you the King of the Night. Your venues are where the city does its real business — not in boardrooms or council chambers, but in dark booths over expensive drinks. You didn't just build nightclubs. You built the stage where the city's power plays out. And you own every seat in the house."
  }
];


// ================================================================
//  POST-DON STORY ARCS – Endgame Narrative
// ================================================================

export const POST_DON_ARCS = [
  {
    id: "pda_the_successor",
    title: "The Successor Crisis",
    description: "Every empire needs an heir. But choosing one means trusting someone with everything you've built.",
    icon: "👑",
    narrative: [
      { type: "scene", text: "Your penthouse office. The city sprawls beneath you — yours in every way that matters. But lately, you've been thinking about what comes after." },
      { type: "narration", text: "Three candidates have emerged. Each has strengths. Each has fatal flaws. The wrong choice could unravel everything within a year of your retirement — or death." },
      { type: "dialogue", speaker: "Your Consigliere", text: "\"Boss, you need to pick. The uncertainty is making people nervous. When the boss doesn't have a plan, people make their own plans. And those plans usually involve guns.\"" },
    ],
    candidates: [
      {
        name: "Vinnie Jr.",
        desc: "Your oldest lieutenant. Loyal to a fault. Not the sharpest, but everyone trusts him.",
        trait: "loyalty",
        risk: "He's predictable. Enemies will manipulate him."
      },
      {
        name: "Sofia",
        desc: "Your accountant's daughter. Brilliant, ruthless, and modern. She wants to take the operation legitimate.",
        trait: "intelligence",
        risk: "She has no street credibility. The old guard won't respect a woman in charge — their bigotry, your problem."
      },
      {
        name: "Ghost",
        desc: "Rose from the streets. Self-made, feared, respected. But his ambition has no ceiling.",
        trait: "ambition",
        risk: "He might not wait for you to step aside. History is littered with kings murdered by their heirs."
      }
    ],
    conditions: { minRespect: 100, minReputation: 50 },
  },

  {
    id: "pda_the_commission",
    title: "The Commission",
    description: "The five most powerful crime families sit down to divide the city. You're at the head of the table.",
    icon: "🤝",
    narrative: [
      { type: "scene", text: "A private dining room in a restaurant that doesn't officially exist. Five chairs. Five families. One city." },
      { type: "narration", text: "The Commission hasn't met in twelve years — not since the last mob war nearly burned the city down. You called this meeting. You set the agenda." },
      { type: "dialogue", speaker: "Don Castellano", text: "\"You think because you're the new boss, you can redraw the map? My family has held the waterfront for forty years.\"" },
      { type: "dialogue", speaker: "You", text: "\"Forty years ago, the waterfront was the center of the world. Today, it's cyber crime, crypto, and political influence. Times change. We change with them, or we die.\"" },
      { type: "narration", text: "The room goes silent. Every eye is on you. This is the moment that defines the next decade of organized crime." },
    ],
    conditions: { minRespect: 150, minReputation: 75, isDon: true },
  },

  {
    id: "pda_the_reckoning",
    title: "The Reckoning",
    description: "The FBI's RICO case is complete. Twenty years of evidence. Every family in the city is targeted. Including yours.",
    icon: "⚖️",
    narrative: [
      { type: "scene", text: "Dawn. Federal agents in body armor surround every one of your known locations simultaneously. Helicopters. Armored vehicles. It's the largest mob takedown since the Commission Trial of 1986." },
      { type: "narration", text: "Your phone buzzes with emergency calls from lieutenants, lawyers, and associates. Some are already in handcuffs. Some are running. Some are doing both." },
      { type: "dialogue", speaker: "Your Lawyer", text: "\"They have seventy-three indictments. Phone taps, surveillance, three cooperating witnesses. This is the big one.\"" },
      { type: "narration", text: "Everything you've built — every alliance, every safe house, every dollar — comes down to what you do in the next twenty-four hours." },
    ],
    conditions: { minRespect: 200, minReputation: 100, isDon: true },
  },

  {
    id: "pda_legacy",
    title: "The Legacy",
    description: "You've survived everything — rivals, the FBI, betrayal, and time itself. Now comes the hardest question: what was it all for?",
    icon: "📖",
    narrative: [
      { type: "scene", text: "An autumn evening. You're sitting on the porch of a house in the suburbs — a house you bought with clean money, in a neighborhood where nobody knows your real name." },
      { type: "narration", text: "Your grandchild runs across the lawn. Your hands — the same hands that have done terrible things — catch them as they leap. In their laughter, you hear something you lost a long time ago." },
      { type: "dialogue", speaker: "Your Grandchild", text: "\"Nonna says you used to be important. Were you a king?\"" },
      { type: "narration", text: "You think about the question longer than a child expects. Were you a king? You ruled a city. You made and broke fortunes. People feared you, loved you, hated you — sometimes all three." },
      { type: "dialogue", speaker: "You", text: "\"Something like that, kid. Something like that.\"" },
      { type: "narration", text: "The sun sets over the suburbs. The life you built — all of it — was to get here. To this porch. To this moment. Maybe that's enough." },
    ],
    conditions: { minRespect: 300, minReputation: 150, isDon: true },
  }
];


// ================================================================
//  EXPANDED NARRATION – Job & Activity Story Text
// ================================================================

export const DEEP_NARRATIONS = {
  // Rich narrations triggered at level milestones
  levelMilestones: {
    5: {
      title: "Making a Name",
      text: "The streets are starting to know your face. When you walk into a bar, conversations pause. When you pass a corner, dealers nod. You're not a nobody anymore — you're becoming somebody. And in this city, being somebody is the most dangerous thing you can be."
    },
    10: {
      title: "The Point of No Return",
      text: "You look in the mirror and barely recognize yourself. The person who started this journey — scared, hungry, desperate — is gone. In their place stands someone hardened by choices that can't be unmade. There's no going back. The only direction is up."
    },
    15: {
      title: "Empire Builder",
      text: "Your operation runs like a machine now. Cash flows in from a dozen sources. Your crew handles problems before they reach your desk. Somewhere between the first heist and today, you stopped being a criminal and became an institution."
    },
    20: {
      title: "King of a Concrete Jungle",
      text: "They write about you in the papers now — without using your name, of course. 'An unnamed crime figure.' They know. Everyone knows. The question isn't whether you're running things; it's how long you can keep running them."
    },
    25: {
      title: "Living Legend",
      text: "Young kids on the corner tell stories about you the way they used to tell stories about Gotti and Capone. You've become a myth. And myths, for better or worse, have a way of outliving the men who inspired them."
    },
    30: {
      title: "Beyond the Crown",
      text: "You've surpassed every marker of success this life has to offer. More money than you can spend. More power than you need. The only challenge left is the one you've been avoiding: what happens when you stop?"
    }
  },

  // Deep narrations for first time events
  firstTimeEvents: {
    firstKill: "You'll remember this night forever. Not because of what you did — but because of how easy it was. The weight you expected to feel... it never came. That absence is more terrifying than the act itself.",
    firstArrest: "The cell door closes with a sound you'll hear in your nightmares. Eight feet by ten feet. A cot, a toilet, and time. So much time. You understand now why some men break in here.",
    firstBigScore: "You count the money three times because the number doesn't seem real. More cash than your parents earned in five years, spread across a kitchen table in a safehouse that smells like cigarettes and ambition.",
    firstBetrayal: "The hardest part isn't the betrayal itself — it's realizing you should have seen it coming. Trust is a currency in this world, and you just went bankrupt.",
    firstGangRecruit: "Your first recruit looks at you with a mixture of fear and hope. You recognize that look — you wore it yourself, not so long ago. You're responsible for this person now. Their future is your burden.",
    firstPropertyPurchase: "You sign the deed with a name that's mostly yours. The building isn't much — but it's yours. A foothold in the legitimate world. A brick in the wall between who you are and who you pretend to be.",
    firstTurfClaim: "Yours. This corner, this block, this neighborhood — it answers to you now. Stand here long enough and you'll feel the pulse of the city beneath your feet. It beats in time with your ambition."
  },

  // Atmospheric world-building narrations (shown during regular gameplay)
  worldTexts: [
    "The neon sign of Sal's Pizzeria flickers in the rain. Inside, two men in expensive suits eat calzones and discuss the price of loyalty.",
    "A black sedan rolls slowly down Arthur Avenue. The driver doesn't stop, doesn't look. But everyone on the street knows they've just been counted.",
    "The old men play bocce in the park like they have for fifty years. They pretend not to see the drug deal happening on the other side of the fence. In this neighborhood, blindness is a survival skill.",
    "Graffiti on the overpass: 'SNITCHES END UP IN DITCHES.' Someone has crossed it out and written below: 'GRAMMAR MATTERS — IT'S DITCHES.'",
    "The produce stand on Mulberry Street has the best tomatoes in the city. It also has a back room where men settle disputes with their fists. The tomatoes cost extra if you need an alibi.",
    "Church bells ring at St. Anthony's. Inside, a priest hears confessions that would make a prosecutor weep. The seal of confession has protected more criminals than any lawyer.",
    "Rain falls on the East River, turning the water the color of dirty money. Somewhere beneath the surface, there are things that will never be found. The river keeps its secrets.",
    "A stray cat watches from a fire escape as men load unmarked boxes into a van at 3 AM. The cat has seen this before. It will see it again. The city's real witnesses have four legs and no subpoena power.",
    "The barbershop closes at 6 PM. The real business starts at 7. By midnight, more money has changed hands over haircuts and hot towels than the stock exchange processes in a day.",
    "Dawn breaks over the Brooklyn Bridge. Commuters stream toward Manhattan, oblivious to the empire being run from the apartments above them. Empires hide in plain sight.",
    "An ice cream truck plays its melody down a residential street. Children run with quarters in their fists. The truck also takes twenties, from adults who aren't buying ice cream.",
    "The subway rumbles beneath the city like a heartbeat. In the tunnels, there are places that don't appear on any map — meeting points, dead drops, and last resorts.",
    "A grandmother hangs laundry on a fire escape in Little Italy. She's done this for sixty years. She's also the best lookout on the block. Nothing happens on her street without her knowing.",
    "Thunder rolls across the skyline. In penthouse offices high above the city, men make decisions that trickle down to corner boys who will never know their names.",
    "The bodega on the corner sells cigarettes, lottery tickets, and alibis. The owner has never seen anything, heard anything, or been anywhere. He's the most knowledgeable blind man in the borough.",
    "Pigeons scatter from a rooftop as two figures meet in silhouette. Whatever they're discussing, the pigeons won't tell. They're the only reliable partners in this city."
  ]
};
