/**
 * missions.js - Story-Driven Family Storylines
 *
 * Each crime family has an 8-chapter story arc. The player picks one family,
 * then plays through that family's unique narrative to rise from Associate
 * to Don. Completing the story unlocks turf wars as endgame content.
 *
 * Rank progression:  Ch1-2 Associate -> Ch3 Soldier -> Ch5 Capo -> Ch7 Underboss -> Ch8 Don
 */

// ================================================================
//  FAMILY STORIES
// ================================================================

export const familyStories = {

  // ╔══════════════════════════════════════════════════════════╗
  // ║  TORRINO FAMILY  -  "Blood & Honor"                     ║
  // ╚══════════════════════════════════════════════════════════╝
  torrino: {
    storyTitle: "Blood & Honor",
    icon: "🇮🇹",
    color: "#8b0000",
    tagline: "A tale of tradition, loyalty, and the weight of the crown.",
    chapters: [
      // --------- ACT I: THE STREETS ---------
      {
        id: "torrino_ch1",
        title: "The Sit-Down",
        act: 1,
        actTitle: "The Streets",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A dimly lit trattoria in Little Italy. Red-checkered tablecloths, the smell of garlic and fresh bread. Two men in dark suits flank the doorway." },
          { type: "dialogue", speaker: "Angelo", text: "\"You the kid everyone's been talking about? Don Salvatore don't meet with just anybody. Show some respect.\"" },
          { type: "narration", text: "You're led through the kitchen - past cooks who don't look up - to a private room. An old man sits at the head of the table. His eyes have seen fifty years of blood and money." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"Sit. Eat. A man's character shows at a dinner table - the way he holds his fork, the way he holds his tongue.\"" },
          { type: "narration", text: "This is your audition. The Torrino Family doesn't recruit from the gutter - they invest in potential. Prove you can earn, and earn quietly." },
        ],
        objectives: [
          { type: "jobs", target: 5, text: "Complete 5 jobs" },
          { type: "money", target: 1000, text: "Have $1,000 cash" },
        ],
        rewards: { money: 500, experience: 50, reputation: 2 },
        choice: null,
        completionNarrative: [
          { type: "dialogue", speaker: "Don Salvatore", text: "\"You listen. You work. You don't ask stupid questions. Maybe there's something to you after all.\"" },
          { type: "narration", text: "He slides his business card across the table. On the back, a single word: 'Associate.' The Torrino Family has opened its doors - a crack." },
        ],
        boss: null,
      },
      {
        id: "torrino_ch2",
        title: "Collection Day",
        act: 1,
        actTitle: "The Streets",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A gray morning on Mulberry Street. Shop owners pull up their shutters, casting nervous glances at the black sedan parked at the curb." },
          { type: "dialogue", speaker: "Angelo", text: "\"Collection day. The neighborhood pays for protection - and they pay on time. Your job is to make sure nobody forgets.\"" },
          { type: "narration", text: "Angelo hands you a ledger. Names, amounts, dates. Some shops are circled in red - they're behind. This isn't about violence; it's about presence. When you walk in, they need to feel the weight of the family behind you." },
          { type: "dialogue", speaker: "Angelo", text: "\"Smile. Be polite. But don't leave without the money. Capisce?\"" },
        ],
        objectives: [
          { type: "jobs", target: 12, text: "Complete 12 total jobs" },
          { type: "money", target: 3000, text: "Have $3,000 cash" },
          { type: "level", target: 3, text: "Reach Level 3" },
        ],
        rewards: { money: 1000, experience: 80, reputation: 3 },
        choice: {
          prompt: "A shopkeeper begs for more time. His daughter is sick and the medical bills are drowning him.",
          options: [
            { text: "Give him a week - compassion earns real loyalty", effect: "reputation", value: 3 },
            { text: "Business is business - collect every cent", effect: "money", value: 1500 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "Every dollar accounted for. Angelo nods with something that might be respect." },
          { type: "dialogue", speaker: "Angelo", text: "\"Don Salvatore heard about how you handled Mulberry Street. He wants to see you again. This time - not for dinner.\"" },
        ],
        boss: null,
      },
      // --------- ACT II: MADE MAN ---------
      {
        id: "torrino_ch3",
        title: "Earning Your Bones",
        act: 2,
        actTitle: "Made Man",
        rankOnComplete: "soldier",
        respectGain: 15,
        narrative: [
          { type: "scene", text: "The basement of San Gennaro church. Candles flicker against stone walls. The air smells of incense and old fear." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"There is a rat in our house. Enzo Caruso - he's been feeding information to the Kozlov Bratva for six months. I've confirmed it myself.\"" },
          { type: "narration", text: "The Don's voice is calm, almost gentle. But his eyes are ice. A photograph slides across the table. A man you've seen at family dinners, laughing, pouring wine." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"Every family needs soldiers who can do what must be done - without hesitation, without remorse. This is your test.\"" },
          { type: "narration", text: "The room goes quiet. Every man present knows what this means. In the old country, they called it 'earning your bones.' There is no going back from this moment." },
        ],
        objectives: [
          { type: "level", target: 6, text: "Reach Level 6" },
          { type: "money", target: 5000, text: "Have $5,000 cash" },
          { type: "jobs", target: 20, text: "Complete 20 total jobs" },
        ],
        rewards: { money: 3000, experience: 150, reputation: 5 },
        choice: {
          prompt: "You've cornered Enzo. He's begging, offering information about the Bratva in exchange for his life.",
          options: [
            { text: "Follow orders - the family's will is absolute", effect: "respect", value: 5 },
            { text: "Spare him and bring the intel - mercy can be strength", effect: "reputation", value: 5 },
          ]
        },
        completionNarrative: [
          { type: "scene", text: "The same basement. Now filled with men in dark suits. A saint's card burns in your hand as you recite the oath." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"This is your family now. Your blood. If you betray us, may you burn like this saint.\"" },
          { type: "narration", text: "The card crumbles to ash between your fingers. You are a soldier of the Torrino Family. Men who wouldn't look at you a month ago now nod with respect." },
        ],
        boss: null,
      },
      {
        id: "torrino_ch4",
        title: "Sunday Gravy",
        act: 2,
        actTitle: "Made Man",
        rankOnComplete: null,
        respectGain: 15,
        narrative: [
          { type: "scene", text: "The Torrino estate on Long Island. A sprawling villa with a garden, a fountain, and enough security to invade a small country. Sunday - the Don's sacred day." },
          { type: "dialogue", speaker: "Vinnie Torrino", text: "\"Well, well. The new soldier. Don't let the fancy invite go to your head, kid. Blood is blood, and you ain't blood.\"" },
          { type: "narration", text: "Vinnie 'The Hammer' Torrino - the Don's nephew, and a man who believes the throne is his birthright. He's been watching you with the same look a wolf gives a smaller predator entering its territory." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"Ignore my nephew. He forgets that this family was built by men who earned their place - not inherited it. Now. I have a task that requires... discretion.\"" },
          { type: "narration", text: "A judge needs convincing. A union boss needs reminding. And someone needs to handle it all without a single headline. The Don is testing more than your muscle - he's testing your mind." },
        ],
        objectives: [
          { type: "level", target: 10, text: "Reach Level 10" },
          { type: "money", target: 12000, text: "Have $12,000 cash" },
          { type: "gang", target: 3, text: "Have 3 gang members" },
        ],
        rewards: { money: 5000, experience: 200, reputation: 8 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The judge ruled in the family's favor. The union boss signed the contract. And no one connected any of it to the Torrino name." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"A surgeon with words. I like that. Vinnie breaks doors down - you? You find the key. I need more men like you.\"" },
          { type: "narration", text: "Vinnie's jaw tightens from across the room. The rivalry is no longer subtle." },
        ],
        boss: null,
      },
      // --------- ACT III: THE INNER CIRCLE ---------
      {
        id: "torrino_ch5",
        title: "The Consigliere",
        act: 3,
        actTitle: "The Inner Circle",
        rankOnComplete: "capo",
        respectGain: 20,
        narrative: [
          { type: "scene", text: "A private study lined with leather-bound books. Cigar smoke curls toward the ceiling. The Consigliere - Marco DeLuca - sits behind a mahogany desk." },
          { type: "dialogue", speaker: "Marco DeLuca", text: "\"The Don sees something in you. Frankly, so do I. But Capos aren't made from soldiers - they're forged from men who understand the business behind the business.\"" },
          { type: "narration", text: "Marco slides a portfolio across the desk. Shell companies, real estate holdings, political donations. The Torrino empire isn't built on violence - it's built on a web of legitimate businesses that make the illegitimate ones invisible." },
          { type: "dialogue", speaker: "Marco DeLuca", text: "\"Learn this. Master it. Then you'll command your own territory, your own crew. Fail, and you'll be collecting debts on Mulberry Street until you're gray.\"" },
        ],
        objectives: [
          { type: "level", target: 15, text: "Reach Level 15" },
          { type: "money", target: 30000, text: "Have $30,000 cash" },
          { type: "properties", target: 1, text: "Own a property" },
          { type: "gang", target: 5, text: "Have 5 gang members" },
        ],
        rewards: { money: 10000, experience: 350, reputation: 10 },
        choice: null,
        completionNarrative: [
          { type: "scene", text: "A ceremony at the family social club. The old Capos raise their glasses." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"You've earned a crew and a territory. From today, you answer only to me and Marco. Welcome to the inner circle.\"" },
          { type: "narration", text: "Vinnie storms out of the room. Everyone pretends not to notice. You are now a Capo of the Torrino Family." },
        ],
        boss: null,
      },
      {
        id: "torrino_ch6",
        title: "The War at the Gates",
        act: 3,
        actTitle: "The Inner Circle",
        rankOnComplete: null,
        respectGain: 20,
        narrative: [
          { type: "scene", text: "An emergency meeting at the social club. Every Capo, every soldier. The room buzzes with tension." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"The Kozlov Bratva has moved on our docks. Four of our men are in the hospital. This is an act of war.\"" },
          { type: "narration", text: "The room erupts. Vinnie slams the table - 'Hit them now! Hit them hard!' But the Don raises a hand and silence falls." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"War is what they want. War costs money, men, and attention from the law. I need a strategist, not a bull. Who has a plan?\"" },
          { type: "narration", text: "Every eye turns to you. This is the moment that separates Capos from Underbosses. The Bratva is probing for weakness - give them one, or make them regret trying." },
        ],
        objectives: [
          { type: "level", target: 20, text: "Reach Level 20" },
          { type: "money", target: 60000, text: "Have $60,000 cash" },
          { type: "gang", target: 8, text: "Have 8 gang members" },
          { type: "reputation", target: 40, text: "Reach 40 reputation" },
        ],
        rewards: { money: 20000, experience: 500, reputation: 15 },
        choice: {
          prompt: "How do you handle the Bratva incursion?",
          options: [
            { text: "Arrange a sit-down - negotiate territory boundaries like civilized men", effect: "reputation", value: 10 },
            { text: "Strike their weapons shipment - cut off their supply line without starting a full war", effect: "respect", value: 10 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The Bratva is dealt with - not destroyed, but reminded of their boundaries. The family's territory is secure, and the message is clear: the Torrino Family still runs this city." },
          { type: "dialogue", speaker: "Marco DeLuca", text: "\"The Don hasn't slept this well in months. Between you and me - he's started talking about the future. HIS future. Pay attention.\"" },
        ],
        boss: null,
      },
      // --------- ACT IV: THE SUCCESSION ---------
      {
        id: "torrino_ch7",
        title: "The Old Man's Burden",
        act: 4,
        actTitle: "The Succession",
        rankOnComplete: "underboss",
        respectGain: 25,
        narrative: [
          { type: "scene", text: "The Torrino estate. Late evening. Don Salvatore sits by the fireplace, an untouched glass of wine in his hand. He looks older than you've ever seen him." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"Close the door. What I'm about to tell you doesn't leave this room.\"" },
          { type: "narration", text: "He pauses. The fire crackles. When he speaks again, his voice is barely a whisper." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"The doctors say six months. Maybe a year. The cancer has spread. This empire - everything I built - needs someone to carry it forward, or it dies with me.\"" },
          { type: "narration", text: "Sicilian pride won't let him show weakness, but you can see it - the weight of mortality pressing down on shoulders that once carried the world. He grips your arm with surprising strength." },
          { type: "dialogue", speaker: "Don Salvatore", text: "\"Vinnie wants the throne. He'll bleed this family dry with vendettas and ego. I need someone who understands that a Don serves the family - not the other way around. I'm naming you Underboss. Earn the rest.\"" },
        ],
        objectives: [
          { type: "level", target: 28, text: "Reach Level 28" },
          { type: "money", target: 120000, text: "Have $120,000 cash" },
          { type: "gang", target: 12, text: "Have 12 gang members" },
          { type: "properties", target: 3, text: "Own 3 properties" },
        ],
        rewards: { money: 40000, experience: 800, reputation: 20 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The family gathers. Some nod approvingly. Others - Vinnie's loyalists - exchange dark glances. The title of Underboss settles on your shoulders like a crown made of iron." },
          { type: "dialogue", speaker: "Vinnie Torrino", text: "\"Enjoy the title. It won't last. This family has Torrino blood - and that ain't something you can earn.\"" },
          { type: "narration", text: "The battle lines are drawn. The final chapter is about to unfold." },
        ],
        boss: null,
      },
      {
        id: "torrino_ch8",
        title: "The Coronation",
        act: 4,
        actTitle: "The Succession",
        rankOnComplete: "don",
        respectGain: 35,
        narrative: [
          { type: "scene", text: "A cold morning. The church bells toll for Don Salvatore Torrino - dead at seventy-three. The entire underworld holds its breath." },
          { type: "narration", text: "The funeral fills San Gennaro church to the walls. Politicians, judges, cops, wiseguys - everyone who mattered to Salvatore or feared him stands shoulder to shoulder. Vinnie sits in the front pew, already wearing a Don's ring he bought himself." },
          { type: "dialogue", speaker: "Marco DeLuca", text: "\"Salvatore's will is clear. He named you. But Vinnie has half the Capos lined up behind him, promising them bigger cuts, fewer rules. This will be decided tonight - at the vote.\"" },
          { type: "narration", text: "The old ways demand a sit-down. The Capos will cast their votes. But Vinnie has never been one for democracy - if the vote doesn't go his way, he'll make his play with guns instead of ballots." },
          { type: "dialogue", speaker: "Marco DeLuca", text: "\"Win the vote, you're Don. But be ready for Vinnie's backup plan. The Hammer always has a hammer.\"" },
        ],
        objectives: [
          { type: "level", target: 35, text: "Reach Level 35" },
          { type: "money", target: 250000, text: "Have $250,000 cash" },
          { type: "gang", target: 15, text: "Have 15 gang members" },
          { type: "reputation", target: 80, text: "Reach 80 reputation" },
        ],
        rewards: { money: 100000, experience: 2000, reputation: 50 },
        choice: {
          prompt: "The vote is tied. One Capo remains undecided - old man Russo, who owes debts to both you and Vinnie.",
          options: [
            { text: "Appeal to his legacy - remind him what Salvatore would have wanted", effect: "respect", value: 15 },
            { text: "Pay his debts - $50,000 to secure his vote", effect: "money", value: -50000 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The vote is cast. Your name carries the room. For one breathless moment, it seems like Vinnie will accept it. Then he flips the table." },
        ],
        boss: {
          name: "Vinnie 'The Hammer' Torrino",
          power: 180,
          health: 300,
          gangSize: 8,
          reward: 25000,
          dialogue: {
            intro: "\"You think a piece of paper makes you Don?\" Vinnie snarls, pulling a gun from his waistband. His loyalists rise from their seats. \"I AM Torrino blood! This family is MINE!\"",
            victory: "Vinnie crashes through the table, surrounded by his broken loyalists. He looks up at you with hatred - and underneath it, the faintest glimmer of respect. \"You earned it,\" he whispers. \"The old man was right.\"",
            defeat: "Vinnie's men pin you down. \"Should've stayed a soldier,\" he laughs. But the family elders won't forget. This isn't over."
          }
        },
      },
    ],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  KOZLOV BRATVA  -  "Iron & Ice"                         ║
  // ╚══════════════════════════════════════════════════════════╝
  kozlov: {
    storyTitle: "Iron & Ice",
    icon: "❄️",
    color: "#4169e1",
    tagline: "A tale of strength, discipline, and the cold price of power.",
    chapters: [
      // --------- ACT I: THE PROVING GROUND ---------
      {
        id: "kozlov_ch1",
        title: "The Cage",
        act: 1,
        actTitle: "The Proving Ground",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "An abandoned warehouse in the harbor district. Floodlights. A chain-link cage stained with old blood. The crowd smells like vodka and violence." },
          { type: "dialogue", speaker: "Viktor", text: "\"In Russia, we have saying: 'The wolf that survives winter doesn't complain about cold.' You want to run with Bratva? Get in the cage.\"" },
          { type: "narration", text: "Viktor Kozlov - Dimitri's right hand - runs a fight ring as his personal recruitment tool. The Bratva doesn't interview candidates. It breaks them." },
          { type: "dialogue", speaker: "Viktor", text: "\"Three rounds. You don't have to win. You just have to stand up every time you fall. The ones who stay down - we leave them.\"" },
        ],
        objectives: [
          { type: "jobs", target: 5, text: "Complete 5 jobs" },
          { type: "money", target: 1000, text: "Have $1,000 cash" },
        ],
        rewards: { money: 500, experience: 50, reputation: 2 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "Three rounds. Blood in your mouth, ringing in your ears. But you're standing. The crowd has gone quiet." },
          { type: "dialogue", speaker: "Dimitri Kozlov", text: "\"This one has iron in the blood. Bring to me.\"" },
          { type: "narration", text: "A massive man rises from the shadows - Dimitri 'The Bear' Kozlov. Ex-Spetsnaz, arms dealer, and the most feared man on the eastern seaboard. He tosses you a towel." },
          { type: "dialogue", speaker: "Dimitri", text: "\"You work for me now. Don't make me regret it.\"" },
        ],
        boss: null,
      },
      {
        id: "kozlov_ch2",
        title: "Arms & the Man",
        act: 1,
        actTitle: "The Proving Ground",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A shipping container at Pier 7. Rain hammers the corrugated roof. Inside: crates labeled 'Machine Parts' that definitely don't contain machine parts." },
          { type: "dialogue", speaker: "Viktor", text: "\"Three hundred AK-47s. Thirty crates of ammunition. Six anti-tank weapons - don't touch those. All must be at safe house by dawn, or we all disappear.\"" },
          { type: "narration", text: "The Bratva's weapons pipeline is the backbone of their empire. Guns from Eastern Europe flow through these docks like a river of steel. Tonight, you're part of that river." },
          { type: "dialogue", speaker: "Viktor", text: "\"The Colombians will try to intercept. They always do. Be ready.\"" },
        ],
        objectives: [
          { type: "jobs", target: 12, text: "Complete 12 total jobs" },
          { type: "money", target: 3000, text: "Have $3,000 cash" },
          { type: "level", target: 3, text: "Reach Level 3" },
        ],
        rewards: { money: 1000, experience: 80, reputation: 3 },
        choice: {
          prompt: "During the transport, a crate falls and breaks open. Inside: experimental military-grade weapons worth a fortune on the black market.",
          options: [
            { text: "Deliver everything to the safe house - loyalty above greed", effect: "respect", value: 5 },
            { text: "Skim two weapons to sell yourself - Dimitri won't miss them", effect: "money", value: 3000 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "Dawn breaks. Every crate accounted for. The safe house is loaded. Viktor nods - the Bratva's version of a standing ovation." },
          { type: "dialogue", speaker: "Dimitri", text: "\"Reliable. In this business, reliable is worth more than smart. You continue.\"" },
        ],
        boss: null,
      },
      // --------- ACT II: BLOOD BROTHERS ---------
      {
        id: "kozlov_ch3",
        title: "Blood & Vodka",
        act: 2,
        actTitle: "Blood Brothers",
        rankOnComplete: "soldier",
        respectGain: 15,
        narrative: [
          { type: "scene", text: "A private room in a Russian bathhouse. Steam clouds the mirrors. Dimitri sits bare-chested, revealing a torso covered in prison tattoos - each one a chapter of his violent history." },
          { type: "dialogue", speaker: "Dimitri", text: "\"In the Bratva, we do not shake hands to seal a bond. We share blood. You are ready for this?\"" },
          { type: "narration", text: "The blood oath. An ancient tradition among the Russian criminal brotherhood. A blade, a vow, and the understanding that betrayal means death - not just for you, but for everyone you love." },
          { type: "dialogue", speaker: "Viktor", text: "\"After this, you are Bratva. Forever. There is no retirement. No resignation letter. Only loyalty - or a shallow grave.\"" },
        ],
        objectives: [
          { type: "level", target: 6, text: "Reach Level 6" },
          { type: "money", target: 5000, text: "Have $5,000 cash" },
          { type: "jobs", target: 20, text: "Complete 20 total jobs" },
        ],
        rewards: { money: 3000, experience: 150, reputation: 5 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The blade cuts. Blood mixes in a glass of vodka. You drink. Dimitri drinks. The room erupts in a chorus of Russian that you don't fully understand - but you feel it in your bones." },
          { type: "dialogue", speaker: "Dimitri", text: "\"Brother. Today you are reborn. The old you is dead. This - this is the man who will build empires.\"" },
          { type: "narration", text: "A soldier of the Kozlov Bratva. The tattoo on your ring finger will never wash off - and neither will the oath." },
        ],
        boss: null,
      },
      {
        id: "kozlov_ch4",
        title: "The Warehouse Job",
        act: 2,
        actTitle: "Blood Brothers",
        rankOnComplete: null,
        respectGain: 15,
        narrative: [
          { type: "scene", text: "A safehouse in the industrial district. Maps, blueprints, and photographs cover every wall. The air is tense with the smell of gun oil and strong coffee." },
          { type: "dialogue", speaker: "Viktor", text: "\"The Colombians keep main weapons cache in warehouse on Industrial Boulevard. Two guards, rotating patrol, camera system. We take everything.\"" },
          { type: "narration", text: "This is the Bratva's way - direct, overwhelming force. No subtlety, no negotiations. Hit hard, hit fast, strip the place clean, and vanish before the sirens." },
          { type: "dialogue", speaker: "Dimitri", text: "\"You plan. You lead the team. Viktor will be your second. Don't disappoint me.\"" },
          { type: "narration", text: "Your first command. A dozen armed men look to you for orders. The weight of their lives - and the operation's success - hangs on your decisions tonight." },
        ],
        objectives: [
          { type: "level", target: 10, text: "Reach Level 10" },
          { type: "money", target: 12000, text: "Have $12,000 cash" },
          { type: "gang", target: 3, text: "Have 3 gang members" },
        ],
        rewards: { money: 8000, experience: 200, reputation: 8 },
        choice: {
          prompt: "The raid succeeds, but you find a room full of kidnapped people - the Colombians' trafficking victims.",
          options: [
            { text: "Free them - even the Bratva has limits", effect: "reputation", value: 8 },
            { text: "Leave them - not your problem, stay focused", effect: "respect", value: 5 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The warehouse is stripped bare. Enough weapons to arm a small country, and a message written in bullet holes: the Bratva doesn't negotiate." },
          { type: "dialogue", speaker: "Dimitri", text: "\"Clean operation. Decisive leadership. You think like a commander, not a thug. I was right about you.\"" },
        ],
        boss: null,
      },
      // --------- ACT III: VIKTOR'S SHADOW ---------
      {
        id: "kozlov_ch5",
        title: "The Mole",
        act: 3,
        actTitle: "Viktor's Shadow",
        rankOnComplete: "capo",
        respectGain: 20,
        narrative: [
          { type: "scene", text: "Dimitri's war room. Maps with red X's marking busted safe houses. Three in two weeks." },
          { type: "dialogue", speaker: "Dimitri", text: "\"Someone is talking. Someone close. Three safe houses - each one known only to inner circle. I trust no one now. Except you.\"" },
          { type: "narration", text: "Dimitri's paranoia is justified. The Bratva is hemorrhaging - money, weapons, men. Whoever the mole is, they've been feeding information to federal agents with surgical precision." },
          { type: "dialogue", speaker: "Nadia Kozlova", text: "\"My father is losing his grip. The old guard whispers that the Bear has lost his teeth. Find this mole - quickly - before the whispers become a roar.\"" },
          { type: "narration", text: "Nadia - Dimitri's daughter. They say she's colder and smarter than her father. Her loyalty to the Bratva is absolute, but her loyalty to Dimitri himself... that's less certain." },
        ],
        objectives: [
          { type: "level", target: 15, text: "Reach Level 15" },
          { type: "money", target: 30000, text: "Have $30,000 cash" },
          { type: "gang", target: 5, text: "Have 5 gang members" },
          { type: "properties", target: 1, text: "Own a property" },
        ],
        rewards: { money: 12000, experience: 350, reputation: 10 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The mole is found - one of Dimitri's oldest lieutenants, turned by the FBI after they threatened his family. You bring the evidence to Dimitri. The lieutenant doesn't survive the night." },
          { type: "dialogue", speaker: "Dimitri", text: "\"You saved the Bratva. From today, you command your own men, your own territory. You are my right hand now.\"" },
          { type: "narration", text: "Viktor steps aside - willingly, surprisingly. He's getting old, and he sees in you the fire that's dying in himself. You are now a Capo of the Kozlov Bratva." },
        ],
        boss: null,
      },
      {
        id: "kozlov_ch6",
        title: "Red Winter",
        act: 3,
        actTitle: "Viktor's Shadow",
        rankOnComplete: null,
        respectGain: 20,
        narrative: [
          { type: "scene", text: "A frozen predawn. Viktor bursts into your safehouse, bleeding from a wound in his shoulder." },
          { type: "dialogue", speaker: "Viktor", text: "\"Moscow contact is dead. Bratva supply line - gone. Three crews ambushed on the highway tonight. This is coordinated attack.\"" },
          { type: "narration", text: "The Bratva's international weapons pipeline - their lifeblood - has been severed in a single night. Without that supply, the whole organization weakens. And someone timed this to happen while Dimitri is distracted by internal problems." },
          { type: "dialogue", speaker: "Nadia", text: "\"My father is making mistakes. Bad deals, broken alliances. The men are starting to talk - and what they're saying isn't good. We need to stabilize this, or there won't be a Bratva to save.\"" },
          { type: "narration", text: "The crisis demands action. The pipeline must be restored, the attackers identified, and Dimitri's leadership - or what's left of it - must be propped up. Or replaced." },
        ],
        objectives: [
          { type: "level", target: 20, text: "Reach Level 20" },
          { type: "money", target: 60000, text: "Have $60,000 cash" },
          { type: "gang", target: 8, text: "Have 8 gang members" },
          { type: "reputation", target: 40, text: "Reach 40 reputation" },
        ],
        rewards: { money: 20000, experience: 500, reputation: 15 },
        choice: {
          prompt: "Nadia approaches you privately late at night.",
          options: [
            { text: "Support Dimitri - rebuild the pipeline, restore his authority", effect: "respect", value: 8 },
            { text: "Listen to Nadia - start positioning yourself as an alternative leader", effect: "reputation", value: 8 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The pipeline is patched together - new contacts, new routes. But the damage to Dimitri's reputation is done. Half the Bratva now looks to you, not him, when decisions need to be made." },
          { type: "dialogue", speaker: "Viktor", text: "\"Old friend... I have served Dimitri for twenty years. But even I can see - the Bear is wounded. What comes next... you must be ready.\"" },
        ],
        boss: null,
      },
      // --------- ACT IV: THE COUP ---------
      {
        id: "kozlov_ch7",
        title: "The Last Winter",
        act: 4,
        actTitle: "The Coup",
        rankOnComplete: "underboss",
        respectGain: 25,
        narrative: [
          { type: "scene", text: "Nadia's apartment. Blinds drawn. Maps, financial records, and loyalty reports spread across the floor." },
          { type: "dialogue", speaker: "Nadia", text: "\"My father lost $2 million last month on a deal that any soldier could have seen was a trap. He's drinking again. The men of the old guard are preparing to move - if we don't act first, someone else will, and it won't be bloodless.\"" },
          { type: "narration", text: "She's right. Dimitri Kozlov - the man who built the Bratva from nothing, who survived Chechnya and two assassination attempts - is crumbling. Alcoholism, paranoia, and bad decisions. The empire he built is eating itself." },
          { type: "dialogue", speaker: "Nadia", text: "\"I need someone who the men respect. Someone strong enough to take the crown from a bear without destroying the forest. That man is you. I will be your Underboss. Together - we save the Bratva.\"" },
          { type: "narration", text: "A coup against Dimitri 'The Bear' Kozlov. The most dangerous gamble you've ever considered. If you succeed - you are Don. If you fail - Dimitri's revenge will be legendary." },
        ],
        objectives: [
          { type: "level", target: 28, text: "Reach Level 28" },
          { type: "money", target: 120000, text: "Have $120,000 cash" },
          { type: "gang", target: 12, text: "Have 12 gang members" },
          { type: "properties", target: 3, text: "Own 3 properties" },
        ],
        rewards: { money: 40000, experience: 800, reputation: 20 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "Loyalists are secured. Resources are positioned. Viktor - old, tired Viktor - gives you his blessing with tears in his eyes." },
          { type: "dialogue", speaker: "Viktor", text: "\"Dimitri was like a brother to me. But a leader who destroys his own people is no leader. You have my gun and my oath.\"" },
          { type: "narration", text: "Nadia names you Underboss. The coup is set. Tomorrow night - everything changes." },
        ],
        boss: null,
      },
      {
        id: "kozlov_ch8",
        title: "The Bear Falls",
        act: 4,
        actTitle: "The Coup",
        rankOnComplete: "don",
        respectGain: 35,
        narrative: [
          { type: "scene", text: "The Bratva's main compound. Midnight. Snow falls softly on armed men moving into position around the building." },
          { type: "narration", text: "Twenty of your most loyal soldiers surround the compound. Nadia cuts the communications. Viktor secures the armory. Every exit is covered. This ends tonight - one way or another." },
          { type: "dialogue", speaker: "Nadia", text: "\"My father is in the war room. His personal guard - six men. The rest of the compound's security is with us. It's time.\"" },
          { type: "narration", text: "You push through the heavy doors. Dimitri sits at his war table, a bottle of vodka half-empty beside him. He looks up - and in that moment, he understands everything." },
          { type: "dialogue", speaker: "Dimitri", text: "\"So. The wolf I raised bites the hand that fed it.\"" },
          { type: "narration", text: "He doesn't reach for a weapon. He stands. All six feet four inches of the Bear, drawing himself up to his full height. His guards tense, waiting for an order that doesn't come." },
          { type: "dialogue", speaker: "Dimitri", text: "\"You think you can hold this together? The Bratva will eat you alive, boy. These wolves only follow the strongest. Prove it.\"" },
        ],
        objectives: [
          { type: "level", target: 35, text: "Reach Level 35" },
          { type: "money", target: 250000, text: "Have $250,000 cash" },
          { type: "gang", target: 15, text: "Have 15 gang members" },
          { type: "reputation", target: 80, text: "Reach 80 reputation" },
        ],
        rewards: { money: 100000, experience: 2000, reputation: 50 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The Bear is defeated - but not killed. Dimitri looks at you from the floor, blood on his lip, and slowly... he laughs." },
        ],
        boss: {
          name: "Dimitri 'The Bear' Kozlov",
          power: 350,
          health: 550,
          gangSize: 6,
          reward: 55000,
          dialogue: {
            intro: "Dimitri sheds his coat, revealing the build of a man who never stopped training. \"You want the Bratva? Take it from me. The old way.\" He charges like a freight train.",
            victory: "Dimitri collapses into his chair, breathing heavily. He looks at you for a long moment, then pulls his ring - the Bear's signet - from his finger. \"Stronger wolves always come. Take it. Rule well, or the ice will take you too.\" He walks out into the snow and never looks back.",
            defeat: "The Bear's fist sends you through the table. \"Not strong enough,\" he growls. \"Come back when you've fed on more than scraps.\" The coup fails - but Dimitri knows the truth. His time is almost over."
          }
        },
      },
    ],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CHEN TRIAD  -  "Shadow & Silk"                         ║
  // ╚══════════════════════════════════════════════════════════╝
  chen: {
    storyTitle: "Shadow & Silk",
    icon: "🐲",
    color: "#2e8b57",
    tagline: "A tale of patience, intelligence, and the invisible hand that moves the world.",
    chapters: [
      // --------- ACT I: THE TEST ---------
      {
        id: "chen_ch1",
        title: "The Riddle",
        act: 1,
        actTitle: "The Test",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A tea house in Chinatown. Bamboo screens, jade ornaments, the soft sound of a guzheng playing somewhere unseen. Everything is deliberate." },
          { type: "narration", text: "You were summoned by a note - no name, no signature, just an address and a time. When you arrive, an elderly man pours tea with steady hands. He doesn't look up." },
          { type: "dialogue", speaker: "Master Chen Wei", text: "\"A man walks into a room with two doors. Behind one, a tiger. Behind the other, freedom. The guard at the left door always lies. The guard at the right door always tells the truth. You may ask one question. What do you ask?\"" },
          { type: "narration", text: "He finally looks up. His eyes are ancient and sharp - the eyes of a man who has played chess with empires and won." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The answer doesn't matter. What matters is how you think. The Triad has enough soldiers. I need minds.\"" },
        ],
        objectives: [
          { type: "jobs", target: 5, text: "Complete 5 jobs" },
          { type: "money", target: 1000, text: "Have $1,000 cash" },
        ],
        rewards: { money: 500, experience: 50, reputation: 2 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "You've proven you can navigate the streets with intelligence, not just brute force. Chen Wei nods slowly - the highest praise he offers." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"Adequate. The Triad will train you. But remember - in this family, the sharpest weapon is not the sword. It is the mind that wields it.\"" },
        ],
        boss: null,
      },
      {
        id: "chen_ch2",
        title: "Ghost Protocol",
        act: 1,
        actTitle: "The Test",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A windowless room filled with monitors, server racks, and the blue glow of a dozen screens. Liang 'Ghost' Zhao sits in the corner like a shadow given physical form." },
          { type: "dialogue", speaker: "Liang", text: "\"Master Chen says you have potential. Here - we turn potential into precision. The digital world is the new battlefield. Those who control information control everything.\"" },
          { type: "narration", text: "The Triad's cyber division - a fusion of ancient network intelligence and cutting-edge technology. They don't hack banks for money. They hack for leverage. Every politician's secret, every cop's sin, every rival's weakness - all archived, indexed, weaponized." },
          { type: "dialogue", speaker: "Liang", text: "\"Your first assignment. A corrupt detective has files on our operations. Make the files disappear. Make it look like they never existed.\"" },
        ],
        objectives: [
          { type: "jobs", target: 12, text: "Complete 12 total jobs" },
          { type: "money", target: 3000, text: "Have $3,000 cash" },
          { type: "level", target: 3, text: "Reach Level 3" },
        ],
        rewards: { money: 1000, experience: 80, reputation: 3 },
        choice: {
          prompt: "While erasing the detective's files, you find evidence of a human trafficking ring run by a rival gang.",
          options: [
            { text: "Copy the evidence - this is leverage against the rival gang", effect: "respect", value: 5 },
            { text: "Anonymously tip the police - some crimes are beyond the game", effect: "reputation", value: 5 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The files vanish. The detective finds his computer wiped clean - passwords changed, backups corrupted. He'll never even know who did it." },
          { type: "dialogue", speaker: "Liang", text: "\"Clean work. You understand the principle - the best operations are the ones nobody knows happened. Welcome to the shadow world.\"" },
        ],
        boss: null,
      },
      // --------- ACT II: THE DRAGON'S MARK ---------
      {
        id: "chen_ch3",
        title: "The Marking Ceremony",
        act: 2,
        actTitle: "The Dragon's Mark",
        rankOnComplete: "soldier",
        respectGain: 15,
        narrative: [
          { type: "scene", text: "A hidden temple beneath Chinatown. Incense so thick the air itself seems to glow. Ancient scrolls line the walls. Twelve men kneel in a circle." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"For six hundred years, the Triad has marked its true members with the Dragon. Not a tattoo - an understanding. You carry the Dragon, and the Dragon carries you.\"" },
          { type: "narration", text: "The ceremony is ancient - predating the Triad itself, rooted in traditions brought from Fujian Province centuries ago. Incense burns as oaths are spoken in Mandarin. Even if you don't understand every word, the weight of centuries presses down on the room." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The Dragon sees all, forgives nothing, and protects its own. From this moment - you are one of us. Your enemies are our enemies. Your debts are our debts.\"" },
        ],
        objectives: [
          { type: "level", target: 6, text: "Reach Level 6" },
          { type: "money", target: 5000, text: "Have $5,000 cash" },
          { type: "jobs", target: 20, text: "Complete 20 total jobs" },
        ],
        rewards: { money: 3000, experience: 150, reputation: 5 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The mark is given - a jade pendant in the shape of a coiled dragon, warm to the touch. Men who wouldn't acknowledge your existence last week now bow their heads as you pass." },
          { type: "dialogue", speaker: "Liang", text: "\"Soldier of the Dragon. It suits you. Now - the real work begins.\"" },
        ],
        boss: null,
      },
      {
        id: "chen_ch4",
        title: "The Silk Road",
        act: 2,
        actTitle: "The Dragon's Mark",
        rankOnComplete: null,
        respectGain: 15,
        narrative: [
          { type: "scene", text: "A penthouse overlooking the harbor. Floor-to-ceiling windows. Chen Wei stands before a holographic display showing trade routes spanning three continents." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The old silk road moved goods across empires. Our road moves data, money, and influence across the digital world. I want you to build the next generation.\"" },
          { type: "narration", text: "The Triad is evolving. While other families count cash in backrooms, Chen Wei is building an invisible empire - cryptocurrency laundering, dark web marketplaces, digital extortion. The future of organized crime isn't in the streets. It's in the cloud." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"Build me a network that no government can trace and no rival can penetrate. You have the resources of the Triad behind you.\"" },
        ],
        objectives: [
          { type: "level", target: 10, text: "Reach Level 10" },
          { type: "money", target: 12000, text: "Have $12,000 cash" },
          { type: "gang", target: 3, text: "Have 3 gang members" },
        ],
        rewards: { money: 6000, experience: 200, reputation: 8 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The network is operational. Untraceable. Self-healing. A digital fortress that makes the Triad's operations essentially invisible to law enforcement." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"Impressive. You've given us a weapon more powerful than any gun. The other families don't even know what century they're fighting in.\"" },
        ],
        boss: null,
      },
      // --------- ACT III: THE INNER SANCTUM ---------
      {
        id: "chen_ch5",
        title: "The Inner Sanctum",
        act: 3,
        actTitle: "The Inner Sanctum",
        rankOnComplete: "capo",
        respectGain: 20,
        narrative: [
          { type: "scene", text: "A private dinner aboard a yacht in the harbor. Crystal glasses, white orchids, and the soft lap of water against the hull. Only five people are present." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"You've seen the surface of the Triad. Now I show you the depths. We have assets in fourteen countries. Legislators, CEOs, military officers - all on our ledger. This is true power. Invisible. Absolute.\"" },
          { type: "narration", text: "The Inner Sanctum - the Triad's ruling council. Five seats, five votes, five minds that collectively control a criminal empire worth billions. And Chen Wei is offering you the sixth seat." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The others will resist. They see you as an outsider. Prove them wrong, and the seat is yours.\"" },
        ],
        objectives: [
          { type: "level", target: 15, text: "Reach Level 15" },
          { type: "money", target: 30000, text: "Have $30,000 cash" },
          { type: "gang", target: 5, text: "Have 5 gang members" },
          { type: "properties", target: 1, text: "Own a property" },
        ],
        rewards: { money: 12000, experience: 350, reputation: 10 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The council votes. Three in favor, two against. The dissenters bow their heads - the decision is made." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"Welcome to the Sanctum. You speak with the voice of the Dragon now. Use it wisely.\"" },
          { type: "narration", text: "You are now a Capo - a Sanctum member of the Chen Triad. The invisible hand that shapes this city just added another finger." },
        ],
        boss: null,
      },
      {
        id: "chen_ch6",
        title: "The Dragon's Eye",
        act: 3,
        actTitle: "The Inner Sanctum",
        rankOnComplete: null,
        respectGain: 20,
        narrative: [
          { type: "scene", text: "Chen Wei's private study. For the first time, the mask of calm cracks. His hands tremble as he places an ancient painting on the desk - a jade artifact, glowing green." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The Dragon's Eye. A jade pendant carved during the Ming Dynasty. It was stolen from my family in 1949 - the night they fled China. It sits now in Room 47 of the Metropolitan Museum, labeled 'Anonymous Donation.'\"" },
          { type: "narration", text: "Six centuries of heritage, stolen in a single night. For Chen Wei, this isn't about money - it's about honor, identity, the very soul of the Triad." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"I have tried legitimate channels for decades. The museum won't acknowledge the theft. The courts won't hear it. So we do it the other way. Bring me the Eye, and you will have my eternal gratitude.\"" },
        ],
        objectives: [
          { type: "level", target: 20, text: "Reach Level 20" },
          { type: "money", target: 60000, text: "Have $60,000 cash" },
          { type: "gang", target: 8, text: "Have 8 gang members" },
          { type: "reputation", target: 40, text: "Reach 40 reputation" },
        ],
        rewards: { money: 25000, experience: 500, reputation: 15 },
        choice: {
          prompt: "The heist plan has two approaches.",
          options: [
            { text: "Night infiltration - patience, precision, invisible", effect: "respect", value: 10 },
            { text: "Gala distraction - attend the charity gala and create a diversion", effect: "reputation", value: 10 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The security chief at the museum is a former soldier guarding the exhibit personally." },
        ],
        boss: {
          name: "Captain Harris - Museum Security Chief",
          power: 150,
          health: 250,
          gangSize: 4,
          reward: 15000,
          dialogue: {
            intro: "\"Freeze! I don't know who you people are, but that artifact is under federal protection! You're not walking out of here!\"",
            victory: "Harris goes down hard. The Dragon's Eye glows in your palm - warm, ancient, alive. Six hundred years of exile, ended tonight. You can almost hear the ancestors singing.",
            defeat: "Alarms shriek. Harris calls for backup. You barely escape - but the Eye remains behind its glass. Chen Wei's disappointment is worse than any bullet."
          }
        },
      },
      // --------- ACT IV: CHECKMATE ---------
      {
        id: "chen_ch7",
        title: "The Long Game",
        act: 4,
        actTitle: "Checkmate",
        rankOnComplete: "underboss",
        respectGain: 25,
        narrative: [
          { type: "scene", text: "Chen Wei's private garden. Cherry blossoms fall like pink snow. He sits at a stone table, playing Go against himself." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"I have a confession. For three years, I have been playing a game - not against our enemies, but against the very concept of the Triad itself.\"" },
          { type: "narration", text: "He moves a white stone. Then a black stone. Then stops." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"I have been consolidating all of our assets - every account, every contact, every weapon - under a single encrypted key. My key. If I wished, I could destroy the Triad in one keystroke. Or sell it. Or vanish with everything.\"" },
          { type: "narration", text: "The revelation hits like cold water. Chen Wei - the man you trusted, respected, admired - has been building a trap around his own organization." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The question is: are you clever enough to stop me? Because whoever can - deserves this empire more than I do.\"" },
        ],
        objectives: [
          { type: "level", target: 28, text: "Reach Level 28" },
          { type: "money", target: 120000, text: "Have $120,000 cash" },
          { type: "gang", target: 12, text: "Have 12 gang members" },
          { type: "properties", target: 3, text: "Own 3 properties" },
        ],
        rewards: { money: 40000, experience: 800, reputation: 20 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "You've been preparing. Moving assets, building redundant systems, turning Chen Wei's own network into a mirror that watches the watcher. The game within the game." },
          { type: "dialogue", speaker: "Liang", text: "\"You're not fighting Chen Wei with brute force. You're fighting him with his own philosophy. I've never seen anyone play the master's game better than the master. I'm with you.\"" },
          { type: "narration", text: "The council names you Underboss. Chen Wei watches with an expression that's equal parts admiration and calculation. The final move approaches." },
        ],
        boss: null,
      },
      {
        id: "chen_ch8",
        title: "Checkmate",
        act: 4,
        actTitle: "Checkmate",
        rankOnComplete: "don",
        respectGain: 35,
        narrative: [
          { type: "scene", text: "The same garden. The same stone table. Two Go boards now - one physical, one digital on a tablet between you. Cherry blossoms still falling." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"So. You have your countermove. Show me.\"" },
          { type: "narration", text: "For three months, you've been building a parallel network - a ghost system that mirrors every transaction, every contact, every piece of leverage that Chen Wei consolidated. His master key has a twin. And the twin is in your hands." },
          { type: "dialogue", speaker: "You", text: "\"I didn't try to break your encryption. I made it irrelevant. Every asset you consolidated has a backup that routes to the council - not to you. Your key opens an empty vault.\"" },
          { type: "narration", text: "Silence. Chen Wei studies the Go board. For the first time in his life, every possible move has been anticipated. He begins to laugh - a genuine, warm sound you've never heard from him." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"Magnificent. I've been waiting thirty years for someone to beat me at my own game. It appears my greatest student has surpassed the master.\"" },
        ],
        objectives: [
          { type: "level", target: 35, text: "Reach Level 35" },
          { type: "money", target: 250000, text: "Have $250,000 cash" },
          { type: "gang", target: 15, text: "Have 15 gang members" },
          { type: "reputation", target: 80, text: "Reach 80 reputation" },
        ],
        rewards: { money: 100000, experience: 2000, reputation: 50 },
        choice: {
          prompt: "Chen Wei offers you a final choice.",
          options: [
            { text: "Honor the old ways - let Chen Wei retire with dignity and a pension", effect: "respect", value: 20 },
            { text: "Embrace the new - cut all ties to the old guard, rebuild from scratch", effect: "reputation", value: 15 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "Chen Wei removes the Dragon's Eye pendant from his neck - the same artifact you recovered for him - and places it in your palm." },
          { type: "dialogue", speaker: "Chen Wei", text: "\"The Dragon has chosen its new master. I yield the board willingly. Lead wisely - for the shadow protects only those who understand its nature.\"" },
          { type: "narration", text: "No violence. No betrayal. Not a single drop of blood. The most powerful criminal organization in the city changes hands through pure intellect - a checkmate in a game that took three years to play." },
          { type: "narration", text: "You are the Master of the Chen Triad. The shadow itself now answers to you." },
        ],
        boss: null,
      },
    ],
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  MORALES CARTEL  -  "Fire & Blood"                      ║
  // ╚══════════════════════════════════════════════════════════╝
  morales: {
    storyTitle: "Fire & Blood",
    icon: "💀",
    color: "#ff8c00",
    tagline: "A tale of loyalty, sacrifice, and the fire that burns in those who have nothing to lose.",
    chapters: [
      // --------- ACT I: LA PRUEBA ---------
      {
        id: "morales_ch1",
        title: "La Prueba",
        act: 1,
        actTitle: "La Prueba",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "A bar in the Redlight District. Neon signs flicker. Reggaeton pulses through the walls. The air smells like tequila and gunpowder." },
          { type: "dialogue", speaker: "Diego", text: "\"Eh, gringo - or whatever you are. El Jefe wants to see what you're made of. Not your muscles, not your guns - your huevos. You got the stomach for this life?\"" },
          { type: "narration", text: "Diego 'El Cuchillo' Vargas - El Jefe's enforcer. Scarred face, gold teeth, and eyes that have watched men die without blinking. He's your gateway into the Morales Cartel." },
          { type: "dialogue", speaker: "Diego", text: "\"Simple job. Pick up the package at the border crossing. Drive it here. Don't open it. Don't get pulled over. Don't be late. You do this - El Jefe sees you. You fail - we never had this conversation.\"" },
        ],
        objectives: [
          { type: "jobs", target: 5, text: "Complete 5 jobs" },
          { type: "money", target: 1000, text: "Have $1,000 cash" },
        ],
        rewards: { money: 500, experience: 50, reputation: 2 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The package delivered. The border crossed. Not a scratch, not a second late." },
          { type: "dialogue", speaker: "El Jefe Morales", text: "\"Diego tells me you didn't ask what was in the package. Smart. The ones who ask questions don't last long in this business. The ones who follow orders? They become family.\"" },
          { type: "narration", text: "Ricardo 'El Jefe' Morales. Built his empire from coca fields to city streets. When he says 'family,' he means it - the Cartel IS his family, and he protects it with a ferocity that borders on madness." },
        ],
        boss: null,
      },
      {
        id: "morales_ch2",
        title: "The Tunnel",
        act: 1,
        actTitle: "La Prueba",
        rankOnComplete: null,
        respectGain: 10,
        narrative: [
          { type: "scene", text: "The basement of an abandoned warehouse. A hole in the concrete floor leads to a half-finished tunnel stretching into darkness." },
          { type: "dialogue", speaker: "Diego", text: "\"Three hundred meters. Reinforced, ventilated, with rail tracks. This tunnel connects our territory to the harbor supply chain without touching a single street. You're going to supervise construction.\"" },
          { type: "narration", text: "The tunnel project - the Cartel's lifeline. Through this passage, product moves invisibly from the docks to distribution. No checkpoints, no police, no witnesses." },
          { type: "dialogue", speaker: "Diego", text: "\"But be warned - the Torrino family knows something is happening underground. They've been sending men to sniff around. Keep them away from this project, whatever it takes.\"" },
        ],
        objectives: [
          { type: "jobs", target: 12, text: "Complete 12 total jobs" },
          { type: "money", target: 3000, text: "Have $3,000 cash" },
          { type: "level", target: 3, text: "Reach Level 3" },
        ],
        rewards: { money: 1500, experience: 80, reputation: 3 },
        choice: {
          prompt: "One of the tunnel workers is secretly reporting to the Torrino family.",
          options: [
            { text: "Make an example - cartel justice, loud and public", effect: "respect", value: 5 },
            { text: "Feed him false information - let the Torrinos chase ghosts", effect: "reputation", value: 5 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The tunnel is complete. Three hundred meters of invisible highway. El Jefe walks through it personally, running his hand along the walls." },
          { type: "dialogue", speaker: "El Jefe", text: "\"This tunnel will move more product in a month than the docks do in a year. You built this. I don't forget loyalty - or competence.\"" },
        ],
        boss: null,
      },
      // --------- ACT II: SOLDADO ---------
      {
        id: "morales_ch3",
        title: "Soldado",
        act: 2,
        actTitle: "Soldado",
        rankOnComplete: "soldier",
        respectGain: 15,
        narrative: [
          { type: "scene", text: "A fortified compound in the Sprawl. Sandbags, barbed wire, and enough firepower to hold off a small army. Inside, a drug lab operates at full capacity." },
          { type: "dialogue", speaker: "El Jefe", text: "\"The Colombians want to prove they still run the supply chain. They're sending a crew to hit our main lab tonight. I need someone I trust to hold the line.\"" },
          { type: "narration", text: "This is the test. Not running errands or building tunnels - standing your ground when bullets are flying and lives depend on your decisions. El Jefe's eyes are measuring you." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Hold the lab. Don't lose a single ounce of product. You do this - you're not a worker anymore. You're Soldado. My soldier.\"" },
        ],
        objectives: [
          { type: "level", target: 6, text: "Reach Level 6" },
          { type: "money", target: 5000, text: "Have $5,000 cash" },
          { type: "jobs", target: 20, text: "Complete 20 total jobs" },
        ],
        rewards: { money: 4000, experience: 150, reputation: 5 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The Colombians came at midnight. They left at dawn - or rather, they were carried. The lab stands. Every ounce of product accounted for." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Hermano. Mi soldado.\"" },
          { type: "narration", text: "He embraces you. In the Cartel, this is worth more than any ceremony - the personal acknowledgment of El Jefe Morales. His wife Sofia nods from the doorway. Even Diego tips his hat." },
          { type: "narration", text: "You are a soldier of the Morales Cartel. Familia." },
        ],
        boss: null,
      },
      {
        id: "morales_ch4",
        title: "Festival of the Dead",
        act: 2,
        actTitle: "Soldado",
        rankOnComplete: null,
        respectGain: 15,
        narrative: [
          { type: "scene", text: "The streets are alive with color. Marigolds, sugar skulls, painted faces. Dia de los Muertos - the Day of the Dead. Music, dancing, love, and mourning, all woven together." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Beautiful, no? The whole city celebrates. The police relax. The DEA agents take the night off. And tonight - tonight we move the biggest shipment of the year.\"" },
          { type: "narration", text: "Hidden in the festival parade, disguised as a float, the shipment rolls through the streets worth more than some countries' GDP. It's brilliant, audacious, and insane." },
          { type: "dialogue", speaker: "Sofia Morales", text: "\"My husband is a poet with product. But poetry doesn't stop bullets. Watch his back tonight - both of your backs.\"" },
        ],
        objectives: [
          { type: "level", target: 10, text: "Reach Level 10" },
          { type: "money", target: 12000, text: "Have $12,000 cash" },
          { type: "gang", target: 3, text: "Have 3 gang members" },
        ],
        rewards: { money: 8000, experience: 200, reputation: 8 },
        choice: {
          prompt: "Mid-festival, a DEA agent recognizes the shipment. He's alone, off-duty, reaching for his phone.",
          options: [
            { text: "Bribe him - everyone has a price, especially on a holiday", effect: "money", value: -5000 },
            { text: "Create a distraction - the crowd swallows everything", effect: "respect", value: 8 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The shipment arrives. The festival rages on. No one suspected a thing. The Morales Cartel just moved enough product to fund operations for six months - in a single night." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Every year, I think the festival can't get any better. Every year, you prove me wrong. Drink, hermano. Tonight, we celebrate the dead - and toast the living.\"" },
        ],
        boss: null,
      },
      // --------- ACT III: EL TENIENTE ---------
      {
        id: "morales_ch5",
        title: "El Teniente",
        act: 3,
        actTitle: "El Teniente",
        rankOnComplete: "capo",
        respectGain: 20,
        narrative: [
          { type: "scene", text: "El Jefe's private study. Walls covered with family photos, crucifixes, and a large map of the city with territories color-coded." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Sit. I want to show you something.\"" },
          { type: "narration", text: "He points to the map. Half the city glows in the Cartel's orange. But the other half - Torrino red, Kozlov blue, Chen green - represents territory they don't control." },
          { type: "dialogue", speaker: "El Jefe", text: "\"I'm getting old, hermano. I can't run every corner myself anymore. I need a lieutenant - someone who thinks like me, fights like me, and loves this family like me. I'm looking at that person right now.\"" },
          { type: "narration", text: "He slides a golden ring across the desk - the Cartel's lieutenant ring, worn by only two people in history." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Take the ring. Take the territory. Build me something that lasts.\"" },
        ],
        objectives: [
          { type: "level", target: 15, text: "Reach Level 15" },
          { type: "money", target: 30000, text: "Have $30,000 cash" },
          { type: "gang", target: 5, text: "Have 5 gang members" },
          { type: "properties", target: 1, text: "Own a property" },
        ],
        rewards: { money: 12000, experience: 350, reputation: 10 },
        choice: null,
        completionNarrative: [
          { type: "narration", text: "The ring fits like it was always meant for your finger. Diego kneels - actually kneels - and kisses it. Sofia smiles from the doorway." },
          { type: "dialogue", speaker: "El Jefe", text: "\"The Cartel has a new Teniente. Let the streets know - there's a new fire burning, and it doesn't go out.\"" },
          { type: "narration", text: "You are now a Capo - El Teniente - of the Morales Cartel. Your word is second only to El Jefe himself." },
        ],
        boss: null,
      },
      {
        id: "morales_ch6",
        title: "Sangre y Fuego",
        act: 3,
        actTitle: "El Teniente",
        rankOnComplete: null,
        respectGain: 20,
        narrative: [
          { type: "scene", text: "A burned-out safehouse. Blood on the walls. Three of your men dead. A message pinned to the wall with a knife: 'Leave or burn.'" },
          { type: "dialogue", speaker: "Diego", text: "\"The Colombians. They hit three of our spots last night. They're trying to take the supply chain back by force.\"" },
          { type: "narration", text: "The Colombian cartel - the Morales family's former suppliers - have decided that partnership isn't profitable enough. They want it all. And they're willing to start a war to get it." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Blood and fire. That's all they understand. So that's what we give them. You lead the counterattack. Show them why we control these streets.\"" },
          { type: "narration", text: "Full-scale cartel war. The streets themselves become battlegrounds. This isn't about money anymore - it's about survival." },
        ],
        objectives: [
          { type: "level", target: 20, text: "Reach Level 20" },
          { type: "money", target: 60000, text: "Have $60,000 cash" },
          { type: "gang", target: 8, text: "Have 8 gang members" },
          { type: "reputation", target: 40, text: "Reach 40 reputation" },
        ],
        rewards: { money: 25000, experience: 500, reputation: 15 },
        choice: {
          prompt: "The Colombian cartel leader offers a ceasefire - split the supply chain 50/50.",
          options: [
            { text: "Accept the deal - peace means profit for everyone", effect: "reputation", value: 10 },
            { text: "Burn their offer - the Morales Cartel doesn't share", effect: "respect", value: 10 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The war is won - costly, bloody, but decisive. The Colombian operation in the city is in ruins. The Morales Cartel stands alone at the top of the supply chain." },
          { type: "dialogue", speaker: "El Jefe", text: "\"War is terrible, hermano. But sometimes, fire is the only way to clear the brush. You carried this family through the flames. I won't forget.\"" },
        ],
        boss: null,
      },
      // --------- ACT IV: LA CORONA ---------
      {
        id: "morales_ch7",
        title: "Isabella",
        act: 4,
        actTitle: "La Corona",
        rankOnComplete: "underboss",
        respectGain: 25,
        narrative: [
          { type: "scene", text: "El Jefe's study. The strongest man you know is weeping. Sofia clutches a phone, her hand shaking." },
          { type: "dialogue", speaker: "El Jefe", text: "\"They took Isabella. My daughter. My baby girl.\"" },
          { type: "narration", text: "His voice cracks like a gun. Isabella Morales - twenty-two, studying medicine, the one beautiful thing El Jefe kept away from this life. Kidnapped by remnants of the Colombian cartel, demanding $10 million and the entire supply chain." },
          { type: "dialogue", speaker: "Sofia", text: "\"I don't care about the money. I don't care about the business. Bring my daughter home. Please.\"" },
          { type: "narration", text: "El Jefe looks at you. For the first time, he's not giving orders - he's asking. The most powerful man you know, reduced to a father begging for his child's life." },
          { type: "dialogue", speaker: "El Jefe", text: "\"You are the only person I trust with this. Bring Isabella home. Whatever it costs. Whatever it takes.\"" },
        ],
        objectives: [
          { type: "level", target: 28, text: "Reach Level 28" },
          { type: "money", target: 120000, text: "Have $120,000 cash" },
          { type: "gang", target: 12, text: "Have 12 gang members" },
          { type: "properties", target: 3, text: "Own 3 properties" },
        ],
        rewards: { money: 40000, experience: 800, reputation: 20 },
        choice: {
          prompt: "You've located Isabella. She's being held in a fortified compound outside the city.",
          options: [
            { text: "Pay the ransom and set up an ambush at the exchange", effect: "money", value: -30000 },
            { text: "Storm the compound - no negotiation with kidnappers", effect: "respect", value: 15 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "You've cleared the way. The compound's defenders are dealt with. But the cartel leader - 'El Diablo' - holds Isabella at gunpoint." },
        ],
        boss: {
          name: "El Diablo - Colombian Cartel Leader",
          power: 250,
          health: 400,
          gangSize: 10,
          reward: 30000,
          dialogue: {
            intro: "\"One more step and the girl dies!\" El Diablo snarls, dragging Isabella backward. His eyes are wild - a man who knows he's lost everything except this one final card.",
            victory: "El Diablo crumples. Isabella runs to you, sobbing. She's alive. She's safe. As you carry her to the waiting car, you hear El Jefe's voice break over the radio: \"Gracias... gracias a Dios... mi heroe.\"",
            defeat: "El Diablo escapes with Isabella. The failure burns worse than any wound. El Jefe's silence on the radio is deafening. But you'll try again. You have to."
          }
        },
      },
      {
        id: "morales_ch8",
        title: "La Corona",
        act: 4,
        actTitle: "La Corona",
        rankOnComplete: "don",
        respectGain: 35,
        narrative: [
          { type: "scene", text: "A private garden behind the Morales compound. Orange trees, a stone fountain, and the sound of a guitar playing softly. El Jefe sits on a bench next to Isabella, who rests her head on his shoulder." },
          { type: "narration", text: "Three weeks since the rescue. Isabella is safe. The Colombian cartel is destroyed. The Morales empire stands stronger than ever. But something has changed in El Jefe's eyes." },
          { type: "dialogue", speaker: "El Jefe", text: "\"When they took Isabella... I realized something. All of this - the money, the power, the empire - none of it matters if you lose what you love. I almost lost my daughter because of this life.\"" },
          { type: "narration", text: "He stands, walking to the fountain. His reflection stares back - a man who has carried an empire on his shoulders for thirty years." },
          { type: "dialogue", speaker: "El Jefe", text: "\"Sofia and I are leaving. Taking Isabella somewhere safe, somewhere warm, where Morales is just a last name. And the Cartel... the Cartel needs someone who loves it enough to carry it forward. Someone who has bled for it. Sacrificed for it.\"" },
          { type: "narration", text: "He turns to face you. In his hand: the golden Don's ring, warm from thirty years on his finger." },
          { type: "dialogue", speaker: "El Jefe", text: "\"This isn't a gift. It's a burden. The heaviest crown in the world. But you've earned it - not with money, not with blood, but with love. You love this family. I see it. Everyone sees it.\"" },
        ],
        objectives: [
          { type: "level", target: 35, text: "Reach Level 35" },
          { type: "money", target: 250000, text: "Have $250,000 cash" },
          { type: "gang", target: 15, text: "Have 15 gang members" },
          { type: "reputation", target: 80, text: "Reach 80 reputation" },
        ],
        rewards: { money: 100000, experience: 2000, reputation: 50 },
        choice: {
          prompt: "El Jefe offers you the crown. But Diego steps forward - the old enforcer who's been with El Jefe since the beginning.",
          options: [
            { text: "Make Diego your Underboss - honor his years of service", effect: "respect", value: 20 },
            { text: "Choose your own team - new era, new leadership", effect: "reputation", value: 15 },
          ]
        },
        completionNarrative: [
          { type: "narration", text: "The Cartel gathers. Every soldier, every lieutenant, every corner boy. El Jefe stands before them one final time." },
          { type: "dialogue", speaker: "El Jefe", text: "\"For thirty years, I gave you my blood, my fire, my life. Now I give you something better - a leader who has proven their loyalty in the flames. Respect them as you respected me. Follow them as you followed me.\"" },
          { type: "narration", text: "The Cartel kneels. Sofia wipes tears from her eyes. Isabella hugs you. Diego bows his head. El Jefe places the ring on your finger and whispers:" },
          { type: "dialogue", speaker: "El Jefe", text: "\"Fire and blood, mi familia. Fire and blood forever.\"" },
          { type: "narration", text: "You are El Nuevo Jefe - the new leader of the Morales Cartel. The fire burns brighter than ever." },
        ],
        boss: null,
      },
    ],
  },
};


// ================================================================
//  LEGACY EXPORTS (kept for backwards compatibility)
// ================================================================

export const storyCampaigns = {};
export const factionMissions = { torrino: [], kozlov: [], chen: [], morales: [] };
export const turfMissions = [];
export const bossBattles = [];
export const missionProgress = {
  activeCampaign: null,
  completedCampaigns: [],
  completedMissions: [],
  availableFactionMissions: {},
  unlockedTurfMissions: [],
  unlockedBossBattles: [],
  factionReputation: { torrino: 0, kozlov: 0, chen: 0, morales: 0 }
};
