/**
 * missions.js - Story-Driven Family Storylines
 *
 * Each crime family has a 25-chapter story arc. The player picks one family,
 * then plays through that family's unique narrative to rise from Associate
 * to Don. Completing the story unlocks turf wars as endgame content.
 *
 * Rank progression:
 *   Ch 1-6  Associate
 *   Ch 7    -> Soldier
 *   Ch 8-12 Soldier
 *   Ch 13   -> Capo
 *   Ch 14-18 Capo
 *   Ch 19   -> Underboss
 *   Ch 20-24 Underboss
 *   Ch 25   -> Don
 */

// ================================================================
//  FAMILY STORIES
// ================================================================

export const familyStories = {

  // ======================================================================
  //  TORRINO FAMILY  -  "Blood & Honor"
  // ======================================================================
  torrino: {
    storyTitle: 'Blood & Honor',
    icon: 'Torrino Family',
    color: '#8b0000',
    tagline: 'A tale of tradition, loyalty, and the weight of the crown.',
    chapters: [{
  id: 'torrino_ch1',
  title: 'The Social Club',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 5,
  narrative: [
    { type: 'scene', text: 'The brass bell above the door chimes as you step into the Torrino Social Club on Mulberry Street. Cigarette smoke hangs in lazy blue ribbons beneath bare Edison bulbs. A dozen hard-eyed men look up from their espresso cups.' },
    { type: 'narration', text: 'This is the nerve center of the Torrino Family -- a crumbling storefront that controls half the rackets south of Canal Street. You have been summoned, and in this world, a summons is not a request.' },
    { type: 'dialogue', text: "So this is the kid everyone's been talking about. Come closer -- let me get a look at you.", speaker: 'Don Salvatore' },
    { type: 'dialogue', text: "Don Salvatore sees something in you, so I'll give you one chance. Run the envelope to Carmine's bakery on Hester. Don't open it, don't stop, don't talk to anyone.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: 'A simple errand -- but nothing about the Torrino Family is simple. Every task is a test, every favor a chain link binding you tighter to la cosa nostra.' }
  ],
  objectives: [
    { type: 'jobs', target: 5, text: 'Complete 5 jobs (any type)' },
    { type: 'money', target: 1000, text: 'Earn $1,000 running errands for the Family' }
  ],
  rewards: { money: 500, experience: 50, reputation: 2 },
  choice: {
    prompt: "A stranger on the street offers you $200 to reveal where you're headed. What do you do?",
    options: [
      { text: 'Refuse and warn Marco about the stranger', effect: 'respect', value: 5 },
      { text: 'Take the money and give a false address', effect: 'money', value: -200 },
      { text: 'Ignore him and keep walking -- say nothing to anyone', effect: 'reputation', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'dialogue', text: 'The kid came through. Not bad. Not bad at all.', speaker: 'Don Salvatore' },
    { type: 'narration', text: "You've taken your first step into a world where loyalty is currency and betrayal is a death sentence. The Social Club's door is open to you now -- for better or worse." },
    { type: 'scene', text: 'Marco slides a thick envelope across the card table. Your first real payment. The bills smell like espresso and gun oil.' }
  ],
  boss: null
},
{
  id: 'torrino_ch2',
  title: 'Protection Money',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 6,
  narrative: [
    { type: 'narration', text: "The protection racket is the oldest game in the neighborhood. Every shop owner on Mulberry, Hester, and Grand pays a weekly envelope to the Torrino Family in exchange for 'peace of mind.' Your job now: collect." },
    { type: 'dialogue', text: "You hit every shop on the list. No exceptions, no extensions. If someone gives you trouble, you don't touch them -- you call me. Capisce?", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'The morning sun cuts through the fire escapes as you walk the route. Butcher, tailor, florist, bodega -- each door brings a different face, a different shade of fear or resignation.' },
    { type: 'dialogue', text: "Tell the Don I'll have it by Friday. Business has been slow, you understand...", speaker: 'Old Man Russo' }
  ],
  objectives: [
    { type: 'jobs', target: 8, text: 'Complete 8 jobs (any type)' },
    { type: 'money', target: 1500, text: 'Accumulate $1,500 in collections' },
    { type: 'reputation', target: 10, text: 'Reach 10 Respect' }
  ],
  rewards: { money: 875, experience: 68, reputation: 2 },
  choice: null,
  completionNarrative: [
    { type: 'narration', text: "Every envelope came in on time. The shopkeepers are learning your face, your name, your reputation. In this neighborhood, that's how legends begin -- one doorstep at a time." },
    { type: 'dialogue', text: "Full count, every week. You've got discipline, kid. That's rare these days.", speaker: 'Marco DeLuca' }
  ],
  boss: null
},
{
  id: 'torrino_ch3',
  title: 'Whispers in the Dark',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 7,
  narrative: [
    { type: 'scene', text: 'It is past midnight at the Social Club. Most of the crew has gone home, but a light burns in the back office. Through the cracked door, you catch a voice you recognize -- Enzo Ferrante, whispering urgently into a phone.' },
    { type: 'narration', text: "Enzo has been with the Torrino Family for fifteen years. A trusted earner, a loyal soldier -- or so everyone believes. But the fragments you overhear don't add up. Names that shouldn't be spoken. Numbers that don't belong." },
    { type: 'dialogue', text: "You're up late. Something keeping you awake, or are you just looking for trouble?", speaker: 'Enzo Ferrante' },
    { type: 'narration', text: "His smile doesn't reach his eyes. There is a coldness there you haven't noticed before -- the look of a man with something to hide." }
  ],
  objectives: [
    { type: 'jobs', target: 12, text: 'Complete 12 jobs (any type)' },
    { type: 'money', target: 2500, text: "Earn $2,500 to prove you're focused on business" },
    { type: 'reputation', target: 20, text: 'Reach 20 Respect' }
  ],
  rewards: { money: 1250, experience: 85, reputation: 3 },
  choice: {
    prompt: 'You overheard Enzo on a suspicious phone call. How do you handle it?',
    options: [
      { text: 'Report everything to Marco DeLuca immediately', effect: 'respect', value: 5 },
      { text: 'Confront Enzo directly and demand an explanation', effect: 'reputation', value: 4 },
      { text: 'Stay quiet and gather more evidence on your own', effect: 'respect', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'The seed of doubt has been planted. Whether Enzo is a traitor or simply careless, the truth will surface eventually. In this family, it always does.' },
    { type: 'dialogue', text: "You've got good instincts. Keep them sharp -- you're going to need them.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "As you leave the club, you notice Enzo watching you from the second-floor window. His silhouette doesn't move until you turn the corner." }
  ],
  boss: null
},
{
  id: 'torrino_ch4',
  title: 'Sunday Gravy',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 8,
  narrative: [
    { type: 'scene', text: "The Don's estate in Bensonhurst is a fortress wrapped in ivy and old money. Every Sunday, the family gathers for dinner -- and today, for the first time, you have been invited to the table." },
    { type: 'narration', text: 'The dining room could seat thirty. Crystal chandeliers throw prismatic light across white linen and silver cutlery. The scent of slow-cooked tomato sauce -- Sunday gravy -- fills every corner of the house.' },
    { type: 'dialogue', text: "In this family, we eat together. A man who shares bread with you won't put a knife in your back. Usually.", speaker: 'Don Salvatore' },
    { type: 'dialogue', text: "Another stray the old man dragged in from the gutter. Don't get too comfortable at that table -- some of us earned our seats.", speaker: 'Vinnie Torrino' },
    { type: 'narration', text: "Vinnie 'The Hammer' Torrino stares at you from across the antipasto. The Don's nephew carries himself like a man who believes the crown is already his. His hostility is barely concealed beneath a thin veneer of civility." }
  ],
  objectives: [
    { type: 'jobs', target: 15, text: 'Complete 15 jobs (any type)' },
    { type: 'money', target: 3500, text: 'Earn $3,500 for the Family coffers' },
    { type: 'reputation', target: 35, text: 'Reach 35 Respect' }
  ],
  rewards: { money: 1625, experience: 103, reputation: 3 },
  choice: null,
  completionNarrative: [
    { type: 'dialogue', text: "You handled Vinnie's provocations with class. That takes strength -- a different kind than what my nephew understands.", speaker: 'Don Salvatore' },
    { type: 'narration', text: "As the evening ends, Marco catches your eye and gives an almost imperceptible nod. You've passed another test. The Don's table is no small honor, and Vinnie's jealousy only proves your rising star." },
    { type: 'scene', text: "Driving home through the Brooklyn night, the city lights shimmering off the East River, you feel the weight of what you're becoming. There is no turning back now." }
  ],
  boss: null
},
{
  id: 'torrino_ch5',
  title: 'The Front',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 9,
  narrative: [
    { type: 'narration', text: 'Every crime family needs legitimate businesses -- restaurants, laundromats, construction companies. They wash the dirty money clean and give the IRS something to look at. The Don is putting you in charge of three fronts on the Lower East Side.' },
    { type: 'dialogue', text: 'These businesses are our face to the world. The numbers have to be perfect -- clean enough for the feds, dirty enough for us. Think you can handle that?', speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'The Bella Notte Restaurant. The Grand Wash Laundromat. DeLuca & Sons Construction. Three storefronts, three sets of books, three chances to prove your worth beyond muscle work.' },
    { type: 'dialogue', text: "My nephew thinks business is beneath him. That's why he'll never understand what keeps this family alive.", speaker: 'Don Salvatore' }
  ],
  objectives: [
    { type: 'jobs', target: 18, text: 'Complete 18 jobs (any type)' },
    { type: 'money', target: 5000, text: 'Generate $5,000 through legitimate and illegitimate channels' },
    { type: 'reputation', target: 50, text: 'Reach 50 Respect' }
  ],
  rewards: { money: 2000, experience: 120, reputation: 4 },
  choice: {
    prompt: "The restaurant's books are wide open for skimming. Nobody would notice a few thousand missing.",
    options: [
      { text: 'Run the books clean -- loyalty over greed', effect: 'respect', value: 6 },
      { text: 'Skim a small amount -- everyone does it', effect: 'money', value: -5000 },
      { text: 'Report the vulnerability to Marco and suggest better controls', effect: 'reputation', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: "The fronts are running smooth as silk. Money flows in through the front door and out through the back, scrubbed clean and ready for the Family's real operations." },
    { type: 'dialogue', text: "The accountant says the numbers are the cleanest he's seen in years. You've got a head for this.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "You lock up the restaurant after closing. Through the kitchen window, the city hums with a thousand hidden transactions -- and now you're part of the machinery." }
  ],
  boss: null
},
{
  id: 'torrino_ch6',
  title: 'The Sit-Down',
  act: 1,
  actTitle: 'The Streets',
  rankOnComplete: null,
  respectGain: 10,
  narrative: [
    { type: 'scene', text: "A private room at Gianni's Steakhouse in Midtown. Two of the Family's capos -- Fat Tony Bianco and Sal 'The Blade' Marino -- sit on opposite sides of a mahogany table, ready to tear each other apart over a disputed numbers operation on the West Side." },
    { type: 'narration', text: "The Don has sent you to mediate. It's unheard of -- an associate settling a dispute between made men. But Don Salvatore sees it as the ultimate test of your judgment." },
    { type: 'dialogue', text: 'This kid? The Don sends a kid to settle business between men? This is an insult.', speaker: 'Fat Tony Bianco' },
    { type: 'dialogue', text: "The Don sends who the Don sends. You got a problem with that, take it up with him. I'm here to listen.", speaker: 'Sal Marino' }
  ],
  objectives: [
    { type: 'jobs', target: 22, text: 'Complete 22 jobs (any type)' },
    { type: 'money', target: 7000, text: 'Accumulate $7,000 to demonstrate business acumen' },
    { type: 'reputation', target: 75, text: 'Reach 75 Respect' }
  ],
  rewards: { money: 2800, experience: 140, reputation: 5 },
  choice: {
    prompt: 'Both capos demand the West Side numbers operation. How do you rule?',
    options: [
      { text: 'Split the territory evenly -- fairness above all', effect: 'respect', value: 7 },
      { text: 'Award it to Sal, who has seniority and a better crew', effect: 'reputation', value: 6 },
      { text: 'Propose a joint operation with shared profits', effect: 'respect', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'dialogue', text: "I heard how you handled Tony and Sal. Solomon himself couldn't have done better. You're ready.", speaker: 'Don Salvatore' },
    { type: 'narration', text: 'Word spreads through the Family like wildfire. The associate who brokered peace between two capos. Your name carries new weight now -- the weight of a man who is about to be made.' },
    { type: 'scene', text: "Marco meets you outside the steakhouse, a rare smile crossing his weathered face. 'Pack a dark suit,' he says. 'You'll need it for what comes next.'" }
  ],
  boss: null
},
{
  id: 'torrino_ch7',
  title: 'Blood Oath',
  act: 2,
  actTitle: 'Made Man',
  rankOnComplete: 'soldier',
  respectGain: 12,
  narrative: [
    { type: 'scene', text: "The basement of the Social Club has been transformed. A long table draped in black cloth. A single candle beside a Catholic saint's card and a ceremonial dagger. The air smells of incense and old wood." },
    { type: 'narration', text: 'This is the making ceremony -- the ancient ritual that transforms an outsider into a member of La Cosa Nostra. Once the words are spoken and the blood is drawn, there is only one way out: death.' },
    { type: 'dialogue', text: 'Do you swear, on your blood and on the souls of your ancestors, to live and die by the code of this Family? To hold omertï¿½ sacred above all? To obey the Don in all things, even unto death?', speaker: 'Don Salvatore' },
    { type: 'dialogue', text: 'Welcome to the Family. From this moment, you are a man of honor. May God forgive what we do in His name.', speaker: 'Marco DeLuca' },
    { type: 'scene', text: "The saint's card burns in your cupped hands as your blood drips onto the ashes. The fire doesn't hurt. Nothing will hurt the same way again." }
  ],
  objectives: [
    { type: 'jobs', target: 25, text: 'Complete 25 jobs (any type)' },
    { type: 'money', target: 9000, text: "Earn $9,000 to establish your soldier's fund" },
    { type: 'reputation', target: 100, text: 'Reach 100 Respect' }
  ],
  rewards: { money: 3600, experience: 160, reputation: 5 },
  choice: {
    prompt: 'After the ceremony, Vinnie corners you in the hallway. He offers an alliance -- or a warning.',
    options: [
      { text: 'Accept his handshake cautiously -- keep enemies closer', effect: 'respect', value: 4 },
      { text: 'Decline firmly -- you answer only to the Don', effect: 'reputation', value: 7 },
      { text: "Tell him you'll think about it -- buy time", effect: 'respect', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'You are a soldier of the Torrino Family. The streets that once felt dangerous now feel like home. Every shop owner nods, every wiseguy tips his hat. You belong.' },
    { type: 'dialogue', text: "A new soldier. Another one loyal to the old man instead of blood. We'll see how long that lasts.", speaker: 'Vinnie Torrino' },
    { type: 'scene', text: 'The dawn breaks over Little Italy as you walk home, the bandage on your palm still fresh. You are reborn -- a man of honor, bound by blood to the Torrino name.' }
  ],
  boss: null
},
{
  id: 'torrino_ch8',
  title: 'The Hijack',
  act: 2,
  actTitle: 'Made Man',
  rankOnComplete: null,
  respectGain: 13,
  narrative: [
    { type: 'narration', text: "Your first real operation as a made man: intercepting a shipment of electronics bound for the Colombo crew's warehouse in Red Hook. The cargo is worth half a million on the street -- and the Torrinos want every last box." },
    { type: 'dialogue', text: "The truck leaves the port at two AM, takes the BQE to Atlantic. You hit it at the Hamilton Avenue exit. Quick, clean, no bodies. We don't need a war -- not yet.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'Under the amber glow of the expressway lights, you and your crew wait in two black sedans. The radio crackles -- the truck just passed the Gowanus ramp. Sixty seconds.' },
    { type: 'dialogue', text: 'I ride with you on this one. The Don wants to know his new soldier can lead under pressure.', speaker: 'Fat Tony Bianco' }
  ],
  objectives: [
    { type: 'jobs', target: 28, text: 'Complete 28 jobs (any type)' },
    { type: 'money', target: 12000, text: 'Earn $12,000 from the hijack and follow-up sales' },
    { type: 'reputation', target: 130, text: 'Reach 130 Respect' },
    { type: 'gang', target: 2, text: 'Recruit 2 crew members for your operations' }
  ],
  rewards: { money: 4400, experience: 180, reputation: 6 },
  choice: {
    prompt: 'During the hijack, the truck driver recognizes you and begs for his life. He has a family.',
    options: [
      { text: 'Let him go with a warning -- mercy has its own power', effect: 'respect', value: 5 },
      { text: 'Tie him up and leave him safely -- professional, not cruel', effect: 'reputation', value: 6 },
      { text: "Take his wallet so he can't call the cops quickly", effect: 'money', value: -5000 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The warehouse doors close on half a million dollars of stolen electronics. Your crew moves like ghosts through the Brooklyn night, not a siren in earshot.' },
    { type: 'dialogue', text: 'Clean operation. No mess, no witnesses, no heat. The Don will be pleased.', speaker: 'Fat Tony Bianco' },
    { type: 'narration', text: "Your first command, and it went off without a hitch. The Torrino Family's coffers grow fatter, and your name climbs another rung on the ladder." }
  ],
  boss: null
},
{
  id: 'torrino_ch9',
  title: 'Building the Crew',
  act: 2,
  actTitle: 'Made Man',
  rankOnComplete: null,
  respectGain: 14,
  narrative: [
    { type: 'narration', text: 'A soldier is only as strong as the men behind him. The Don has given you permission to recruit -- to build a crew of associates loyal to you, and through you, to the Family.' },
    { type: 'dialogue', text: 'Choose carefully. Every man you bring in is your responsibility. If he steals, you answer. If he talks, you answer. If he runs, you answer. Understand?', speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'The pool hall on Mott Street, the boxing gym on Broome, the docks at dawn -- you scour the neighborhood for men with the right combination of hunger and discipline.' },
    { type: 'dialogue', text: "I hear you're building a crew. Just remember who owns the streets you walk on, new guy.", speaker: 'Vinnie Torrino' }
  ],
  objectives: [
    { type: 'jobs', target: 32, text: 'Complete 32 jobs (any type)' },
    { type: 'money', target: 15000, text: 'Accumulate $15,000 to fund your crew' },
    { type: 'reputation', target: 175, text: 'Reach 175 Respect' },
    { type: 'gang', target: 3, text: 'Recruit 3 crew members' }
  ],
  rewards: { money: 5200, experience: 200, reputation: 7 },
  choice: {
    prompt: 'Two candidates for your crew: a loyal but inexperienced neighborhood kid, or a skilled enforcer with a questionable past.',
    options: [
      { text: 'Take the loyal kid -- trust is worth more than talent', effect: 'respect', value: 6 },
      { text: 'Hire the enforcer -- you need strength now', effect: 'reputation', value: 5 },
      { text: 'Recruit both and keep them competing', effect: 'respect', value: 4 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'Your crew takes shape -- rough around the edges, but fiercely loyal. They wear your name like armor and walk the streets with new confidence.' },
    { type: 'dialogue', text: "Not bad. You picked good men. Now let's see if you can keep them alive when things get ugly.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'You stand on the rooftop of the Social Club, looking out over the neighborhood that is slowly becoming yours. But dark clouds are gathering -- whispers of betrayal that will soon become a storm.' }
  ],
  boss: null
},
{
  id: 'torrino_ch10',
  title: 'The Rat',
  act: 2,
  actTitle: 'Made Man',
  rankOnComplete: null,
  respectGain: 15,
  narrative: [
    { type: 'scene', text: "Marco's face is carved from granite as he spreads the surveillance photos across the card table. Enzo Ferrante -- meeting with FBI agents in a parking garage in Hoboken. The timestamps span six months." },
    { type: 'dialogue', text: "Six months. He's been feeding them names, dates, operations. Half our crew could go down if we don't shut this pipeline tonight.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: "The worst crime in La Cosa Nostra. Worse than murder, worse than theft. Enzo broke omertï¿½ -- the sacred code of silence. And now the Family's survival depends on making him answer for it." },
    { type: 'dialogue', text: 'I trusted that man with my life. Thirty years of friendship, and he sells us to the government like cattle. Bring him to me. Alive, if possible. But bring him.', speaker: 'Don Salvatore' },
    { type: 'scene', text: "You gather your crew in the basement of the laundromat. Maps of Enzo's safe house are pinned to the wall. He'll have armed men -- loyalists who chose the rat over the Family. This will be your first real war." }
  ],
  objectives: [
    { type: 'jobs', target: 35, text: 'Complete 35 jobs (any type)' },
    { type: 'money', target: 18000, text: 'Accumulate $18,000 for weapons and operational costs' },
    { type: 'reputation', target: 200, text: 'Reach 200 Respect' },
    { type: 'gang', target: 3, text: 'Maintain a crew of 3 for the assault' }
  ],
  rewards: { money: 6000, experience: 220, reputation: 8 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The safe house is silent now. Shell casings litter the floor like brass confetti. Enzo kneels in the center of the room, hands bound, face bloodied. His empire of lies has crumbled in a single night.' },
    { type: 'dialogue', text: "I did what I had to do. The Don is old, the Family is dying. I was trying to save myself -- wouldn't you?", speaker: 'Enzo Ferrante' },
    { type: 'dialogue', text: 'You broke the oath. There is nothing left to say.', speaker: 'Don Salvatore' },
    { type: 'narration', text: 'The traitor is dealt with. The Family bleeds, but it survives. And in the aftermath, your reputation is forged in iron -- the soldier who caught the rat and brought him to justice.' }
  ],
  boss: {
    name: "Enzo 'The Rat' Ferrante",
    power: 120,
    health: 200,
    gangSize: 4,
    reward: 8000,
    dialogue: {
      intro: "You think you're a hero? I've been in this family since before you were born. You're just the Don's latest pet project.",
      victory: "Enzo crumbles to his knees, his betrayal laid bare. The rat has been caught, and the Family's honor is restored.",
      defeat: "Enzo's men overwhelm your crew. He slips into the night, his federal handlers waiting in the shadows. The rat escapes -- for now."
    }
  }
},
{
  id: 'torrino_ch11',
  title: 'Picking Up the Pieces',
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: null,
  respectGain: 16,
  narrative: [
    { type: 'narration', text: "Enzo's betrayal left scars that run deeper than anyone expected. Three Family operations were compromised. Two soldiers are facing indictments. The FBI knows more about the Torrino organization than anyone is comfortable with." },
    { type: 'dialogue', text: 'We need to rebuild from the ground up. New routes, new contacts, new safe houses. Everything Enzo touched is contaminated.', speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'The Social Club feels emptier now. Chairs that were always occupied sit vacant. Trust -- the currency that held this Family together -- has been devalued overnight.' },
    { type: 'dialogue', text: 'This is what happens when the old man lets outsiders in. Blood should lead, not strays off the street.', speaker: 'Vinnie Torrino' }
  ],
  objectives: [
    { type: 'jobs', target: 38, text: 'Complete 38 jobs (any type)' },
    { type: 'money', target: 22000, text: 'Generate $22,000 to replace lost revenue streams' },
    { type: 'reputation', target: 250, text: 'Reach 250 Respect' },
    { type: 'gang', target: 4, text: 'Expand your crew to 4 members' }
  ],
  rewards: { money: 7200, experience: 256, reputation: 9 },
  choice: {
    prompt: "Several of Enzo's former associates claim they knew nothing about his betrayal. What do you do with them?",
    options: [
      { text: 'Show mercy -- they were deceived like everyone else', effect: 'respect', value: 8 },
      { text: 'Put them on probation with close surveillance', effect: 'reputation', value: 7 },
      { text: 'Cut them loose from the Family entirely -- no chances', effect: 'reputation', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: "Piece by piece, the Torrino machine grinds back to life. New routes have been established, new safe houses secured. The FBI's advantage is eroding with every passing week." },
    { type: 'dialogue', text: "You did what most soldiers couldn't -- you rebuilt what was broken without breaking anything else. The Don notices these things.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'The Social Club fills again, slowly. New faces mix with old. The Family endures, as it always has -- scarred but unbroken.' }
  ],
  boss: null
},
{
  id: 'torrino_ch12',
  title: "The Advisor's Game",
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: null,
  respectGain: 17,
  narrative: [
    { type: 'scene', text: "Marco DeLuca's private office above the restaurant is lined with leather-bound ledgers and law books. A chessboard sits between two leather armchairs. He's been waiting for you." },
    { type: 'dialogue', text: "Sit. A soldier fights with his fists. A leader fights with his mind. Today, I teach you the Consigliere's game -- the game behind the game.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: 'For weeks, Marco schools you in the dark arts of Family politics: reading balance sheets, structuring shell companies, understanding RICO statutes, identifying federal surveillance patterns.' },
    { type: 'dialogue', text: "The strongest Don is not the one with the most guns. It's the one whose businesses can survive a federal audit.", speaker: 'Marco DeLuca' }
  ],
  objectives: [
    { type: 'jobs', target: 40, text: 'Complete 40 jobs (any type)' },
    { type: 'money', target: 26000, text: 'Earn $26,000 through diversified operations' },
    { type: 'reputation', target: 300, text: 'Reach 300 Respect' },
    { type: 'gang', target: 5, text: 'Grow your crew to 5 members' }
  ],
  rewards: { money: 8400, experience: 292, reputation: 10 },
  choice: null,
  completionNarrative: [
    { type: 'dialogue', text: "You're a fast learner. Faster than anyone I've trained -- and I've trained two Dons. Remember: the books are the backbone. Everything else is theater.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: "The Consigliere's lessons transform you. Where once you saw streets, now you see supply chains. Where once you saw enemies, now you see leverage. The bigger picture crystallizes." },
    { type: 'scene', text: "Marco moves his king across the chessboard and smiles. 'Checkmate in three,' he says. 'But you saw it in five. That's progress.'" }
  ],
  boss: null
},
{
  id: 'torrino_ch13',
  title: "A Captain's Crown",
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: 'capo',
  respectGain: 18,
  narrative: [
    { type: 'scene', text: 'The back room of the Social Club is standing room only. Every captain, every soldier of note, has been summoned. Don Salvatore sits at the head of the table, his weathered hands folded, his dark eyes sweeping the room.' },
    { type: 'dialogue', text: 'Today, I elevate a soldier who has shown me more loyalty, more intelligence, and more courage than men twice his age. Step forward.', speaker: 'Don Salvatore' },
    { type: 'narration', text: "The room falls silent. You feel every eye on you as you walk to the Don's side. Vinnie's glare could cut glass. But the Don's hand on your shoulder is steady and warm." },
    { type: 'dialogue', text: 'You are now Capo of the Lower East Side. These streets, these businesses, these men -- they are your responsibility. Lead them well.', speaker: 'Don Salvatore' },
    { type: 'dialogue', text: "Congratulations. Try not to let the crown go to your head -- it's heavier than it looks.", speaker: 'Marco DeLuca' }
  ],
  objectives: [
    { type: 'jobs', target: 43, text: 'Complete 43 jobs (any type)' },
    { type: 'money', target: 30000, text: 'Generate $30,000 in your new territory' },
    { type: 'reputation', target: 350, text: 'Reach 350 Respect' },
    { type: 'gang', target: 5, text: 'Command a crew of 5' },
    { type: 'properties', target: 1, text: 'Acquire 1 property as your base of operations' }
  ],
  rewards: { money: 9600, experience: 328, reputation: 10 },
  choice: {
    prompt: 'As the new Capo, you must choose how to establish your authority in the territory.',
    options: [
      { text: 'Call a meeting of all local earners -- lead through respect', effect: 'respect', value: 8 },
      { text: 'Make an example of a delinquent debtor -- lead through fear', effect: 'reputation', value: 8 },
      { text: 'Invest in the neighborhood -- create goodwill with civilians', effect: 'respect', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'The Lower East Side bends to your will. Shop owners, hustlers, and honest citizens alike know the name of their new Capo. Your territory runs like a well-oiled machine.' },
    { type: 'dialogue', text: "Blood should be running things, not some outsider. This isn't over.", speaker: 'Vinnie Torrino' },
    { type: 'scene', text: 'You stand in the window of your new office above Bella Notte, watching the streets below -- your streets now. The crown is heavy, just as Marco warned. But it fits.' }
  ],
  boss: null
},
{
  id: 'torrino_ch14',
  title: 'New Frontiers',
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: null,
  respectGain: 19,
  narrative: [
    { type: 'narration', text: 'With the Lower East Side locked down, the Don has approved your plan to expand into the meatpacking district and Chelsea. New neighborhoods mean new opportunities -- and new enemies.' },
    { type: 'dialogue', text: "The Irish crew in Chelsea won't roll over easy. They've had those blocks for twenty years. Move smart, move slow, and move with numbers.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'Your crew fans out across the new territory like an advancing tide. Every bar, every warehouse, every construction site gets a visit and a proposition: work with the Torrinos, or work against them.' },
    { type: 'dialogue', text: "You're growing fast, Capo. Almost too fast. Don't forget -- every empire has borders for a reason.", speaker: 'Old Man Russo' }
  ],
  objectives: [
    { type: 'jobs', target: 46, text: 'Complete 46 jobs (any type)' },
    { type: 'money', target: 35000, text: 'Earn $35,000 from expanded operations' },
    { type: 'reputation', target: 400, text: 'Reach 400 Respect' },
    { type: 'gang', target: 6, text: 'Grow your crew to 6 members' },
    { type: 'properties', target: 1, text: 'Maintain at least 1 property' }
  ],
  rewards: { money: 10800, experience: 364, reputation: 11 },
  choice: null,
  completionNarrative: [
    { type: 'narration', text: 'Chelsea and the Meatpacking District fall into line. The Irish crew, after a tense negotiation at a neutral pub, agree to a revenue-sharing arrangement. Your territory has doubled.' },
    { type: 'dialogue', text: 'Two neighborhoods in a month. Even the old-timers are impressed. But keep your eyes east -- the Russians have been watching.', speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'A cold wind blows off the Hudson as you survey your new domain from the High Line. The city stretches endlessly -- and so does your ambition.' }
  ],
  boss: null
},
{
  id: 'torrino_ch15',
  title: 'Storm on the Waterfront',
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: null,
  respectGain: 20,
  narrative: [
    { type: 'scene', text: "The Red Hook docks have been Torrino territory since Don Salvatore's father ran the longshoremen's union. But now, the Kozlov Bratva -- a ruthless Russian syndicate -- is muscling in, bribing dock workers and hijacking containers." },
    { type: 'narration', text: 'The Bratva operates differently than the Italian families. No codes of honor, no sit-downs, no respect for territory. They take what they want and leave bodies as receipts.' },
    { type: 'dialogue', text: 'The Russians killed two of our dock workers last night. This is not a negotiation anymore -- this is war. Prepare your men.', speaker: 'Don Salvatore' },
    { type: 'dialogue', text: 'The Bratva lieutenant -- a man named Aleksei Volkov -- runs their dockside operations. Cut the head off the snake and the body dies.', speaker: 'Marco DeLuca' }
  ],
  objectives: [
    { type: 'jobs', target: 50, text: 'Complete 50 jobs (any type)' },
    { type: 'money', target: 40000, text: 'Accumulate $40,000 for a war chest' },
    { type: 'reputation', target: 450, text: 'Reach 450 Respect' },
    { type: 'gang', target: 7, text: 'Expand your crew to 7 for the coming battle' },
    { type: 'properties', target: 2, text: 'Secure 2 properties as staging areas' }
  ],
  rewards: { money: 12000, experience: 400, reputation: 12 },
  choice: {
    prompt: 'Intelligence suggests the Bratva is open to a meeting. Do you trust it?',
    options: [
      { text: 'Take the meeting but bring heavy backup -- talk from strength', effect: 'reputation', value: 10 },
      { text: "Reject the meeting -- it's a trap, strike first", effect: 'respect', value: 8 },
      { text: 'Send a lieutenant to the meeting while you flank their warehouse', effect: 'reputation', value: 12 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'The stage is set for a war that will reshape the waterfront. Your crew is armed, your alliances are firm, and the Bratva has nowhere left to retreat.' },
    { type: 'dialogue', text: "Tomorrow, we take back what's ours. Every dock, every container, every inch. The Russians will learn what it means to cross the Torrino Family.", speaker: 'Don Salvatore' },
    { type: 'scene', text: 'The fog rolls in off the harbor as your men take their positions. The cranes stand like iron sentinels against the night sky. By dawn, the docks will belong to one family. Just one.' }
  ],
  boss: null
},
{
  id: 'torrino_ch16',
  title: 'War at the Docks',
  act: 3,
  actTitle: 'The Inner Circle',
  rankOnComplete: null,
  respectGain: 21,
  narrative: [
    { type: 'scene', text: "Gunfire erupts across the Red Hook waterfront like a thunderstorm. Muzzle flashes strobe between shipping containers as the Torrino crew clashes with the Kozlov Bratva's enforcers in a brutal, block-by-block battle." },
    { type: 'narration', text: 'Aleksei Volkov has fortified his position inside Warehouse 7, surrounded by his most loyal soldiers. The dock cranes groan in the salt wind as bullets spark off steel. This is the decisive moment.' },
    { type: 'dialogue', text: "Volkov is holed up in the main warehouse! We've got him pinned, but he's got enough firepower to hold us off for hours. What's the play, boss?", speaker: 'Fat Tony Bianco' },
    { type: 'dialogue', text: 'End this tonight. The longer this war drags on, the more attention we draw. Take Volkov down and the rest of the Bratva will scatter.', speaker: 'Marco DeLuca' }
  ],
  objectives: [
    { type: 'jobs', target: 53, text: 'Complete 53 jobs (any type)' },
    { type: 'money', target: 50000, text: 'Spend and earn $50,000 through wartime operations' },
    { type: 'reputation', target: 475, text: 'Reach 475 Respect' },
    { type: 'gang', target: 7, text: 'Command 7 crew members in battle' },
    { type: 'properties', target: 2, text: 'Hold 2 properties' },
    { type: 'reputation', target: 500, text: 'Reach 500 Respect' }
  ],
  rewards: { money: 15600, experience: 460, reputation: 13 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'Warehouse 7 falls silent. Volkov lies disarmed on the concrete floor, his Bratva soldiers surrendering one by one. The docks belong to the Torrino Family once more.' },
    { type: 'dialogue', text: "You just won us a war, Capo. The other families will hear about this. The Commission will hear about this. You've made your mark.", speaker: 'Don Salvatore' },
    { type: 'narration', text: 'The Bratva retreats from Red Hook, their ambitions crushed. In the weeks that follow, shipping revenue doubles. Your name echoes through every family in the city -- the Capo who held the waterfront.' },
    { type: 'dialogue', text: "Even I have to admit -- that was impressive. Don't let it go to your head.", speaker: 'Vinnie Torrino' }
  ],
  boss: {
    name: 'Aleksei Volkov, Bratva Lieutenant',
    power: 180,
    health: 280,
    gangSize: 6,
    reward: 15000,
    dialogue: {
      intro: 'You Italians and your codes, your honor. In Russia, we have no such illusions. There is only power and those too weak to take it.',
      victory: "Volkov spits blood on the warehouse floor. 'This is not over,' he rasps, but the fear in his eyes says otherwise. The Bratva's hold on the docks is broken.",
      defeat: "Volkov's firepower overwhelms your crew. As you pull back through the container yard, his laughter echoes off the steel walls. The docks remain contested."
    }
  }
},
{
  id: 'torrino_ch17',
  title: 'City Hall',
  act: 4,
  actTitle: 'Blood Ties',
  rankOnComplete: null,
  respectGain: 22,
  narrative: [
    { type: 'narration', text: "The Torrino Family has always understood that true power isn't held in the streets -- it's held in marble corridors and wood-paneled offices. Councilman Robert Hargrove controls the zoning board, and the Family needs him in their pocket." },
    { type: 'dialogue', text: "Hargrove is ambitious but weak. He needs campaign money and he needs a construction contract for his brother-in-law. We can provide both. You're going to make the introduction.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'A private dining room at Le Cirque. Crystal glasses, white tablecloths, and a city councilman sweating through his expensive suit. Politics and crime have always dined at the same table.' },
    { type: 'dialogue', text: "I want to be clear -- I can't be seen with anyone connected to... organized... look, just tell me what you need and what it'll cost.", speaker: 'Councilman Hargrove' }
  ],
  objectives: [
    { type: 'jobs', target: 56, text: 'Complete 56 jobs (any type)' },
    { type: 'money', target: 60000, text: 'Accumulate $60,000 for bribes and political influence' },
    { type: 'reputation', target: 525, text: 'Reach 525 Respect' },
    { type: 'gang', target: 8, text: 'Maintain a crew of 8' },
    { type: 'properties', target: 2, text: 'Hold 2 properties' },
    { type: 'reputation', target: 550, text: 'Reach 550 Respect' }
  ],
  rewards: { money: 19200, experience: 520, reputation: 14 },
  choice: {
    prompt: 'Councilman Hargrove wants more money than agreed. How do you handle it?',
    options: [
      { text: 'Pay the extra -- a politician in your pocket is worth any price', effect: 'money', value: -15000 },
      { text: 'Show him the photos your men took of his mistress -- leverage', effect: 'reputation', value: 10 },
      { text: "Renegotiate firmly but fairly -- set boundaries he'll respect", effect: 'respect', value: 9 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: "Councilman Hargrove falls in line. Zoning permits flow like water, construction contracts materialize overnight. The Torrino Family's legitimate empire expands under the shield of city government." },
    { type: 'dialogue', text: 'Well done. A politician is a tool -- expensive, unreliable, but absolutely necessary. You wielded him perfectly.', speaker: 'Marco DeLuca' },
    { type: 'scene', text: 'You watch the evening news: Councilman Hargrove announcing a major development project on the Lower East Side. Your project. The world sees progress; you see power.' }
  ],
  boss: null
},
{
  id: 'torrino_ch18',
  title: 'The Informant',
  act: 4,
  actTitle: 'Blood Ties',
  rankOnComplete: null,
  respectGain: 23,
  narrative: [
    { type: 'scene', text: "The evidence is undeniable. Photographs, wire transfers, phone records -- all pointing to one devastating truth: Marco DeLuca, the Family's Consigliere, has been in contact with the FBI." },
    { type: 'narration', text: 'Not as an informant -- not exactly. Marco has been feeding the feds carefully curated information, sacrificing rival families to keep the Torrinos safe. A dangerous game of chess with the federal government.' },
    { type: 'dialogue', text: "Before you judge me, understand what I've done. Every piece of information I gave them pointed away from us and toward our enemies. I've kept this Family alive for thirty years with these contacts.", speaker: 'Marco DeLuca' },
    { type: 'dialogue', text: "You played God with our lives, Marco. The question isn't whether you helped us -- it's whether we can trust a man who talks to the feds at all.", speaker: 'Don Salvatore' },
    { type: 'narration', text: "The revelation shakes the Family to its foundations. Marco DeLuca -- the brilliant Consigliere, the man who taught you everything -- has been walking a razor's edge between loyalty and treason." }
  ],
  objectives: [
    { type: 'jobs', target: 60, text: 'Complete 60 jobs (any type)' },
    { type: 'money', target: 70000, text: 'Maintain $70,000 as operations are disrupted' },
    { type: 'reputation', target: 575, text: 'Reach 575 Respect' },
    { type: 'gang', target: 9, text: 'Keep your crew at 9 despite the turmoil' },
    { type: 'properties', target: 2, text: 'Protect your 2 properties' },
    { type: 'reputation', target: 600, text: 'Reach 600 Respect' }
  ],
  rewards: { money: 22800, experience: 580, reputation: 16 },
  choice: null,
  completionNarrative: [
    { type: 'dialogue', text: "I've known about Marco's contacts for ten years. Why do you think I'm telling you now? Because soon, you'll need to decide what kind of leader you are.", speaker: 'Don Salvatore' },
    { type: 'narration', text: 'The crisis stabilizes, but the scars remain. Marco continues as Consigliere -- for now. His methods were effective, but the breach of trust hangs over the Family like a storm cloud that refuses to break.' },
    { type: 'scene', text: 'You sit alone in the darkened Social Club, turning over everything you thought you knew. In this world, even your teachers have secrets. Especially your teachers.' }
  ],
  boss: null
},
{
  id: 'torrino_ch19',
  title: 'Right Hand of God',
  act: 4,
  actTitle: 'Blood Ties',
  rankOnComplete: 'underboss',
  respectGain: 25,
  narrative: [
    { type: 'scene', text: "The Don's private study. Oil paintings of Sicilian landscapes line the walls. Don Salvatore pours two glasses of thirty-year Barolo and hands you one. His hand trembles slightly -- something you've never noticed before." },
    { type: 'dialogue', text: "I'm not a young man anymore. The Family needs strength at the top -- real strength, not the kind my nephew peddles with his fists and his fury. I'm naming you Underboss.", speaker: 'Don Salvatore' },
    { type: 'narration', text: 'Underboss. Second in command of the entire Torrino Family. It is the highest honor a Don can bestow -- and the most dangerous position in the organization. Between the Don above and the ambitious men below, the Underboss walks a tightrope over an abyss.' },
    { type: 'dialogue', text: "Vinnie won't take this well. He's always believed the seat was his by blood. Watch your back -- my nephew is many things, but he is not a man who accepts defeat quietly.", speaker: 'Don Salvatore' }
  ],
  objectives: [
    { type: 'jobs', target: 63, text: 'Complete 63 jobs (any type)' },
    { type: 'money', target: 80000, text: 'Manage $80,000 in Family operations' },
    { type: 'gang', target: 10, text: 'Command 10 crew members' },
    { type: 'properties', target: 3, text: 'Oversee 3 Family properties' },
    { type: 'reputation', target: 625, text: 'Reach 625 Respect' }
  ],
  rewards: { money: 26400, experience: 640, reputation: 17 },
  choice: {
    prompt: "In your first act as Underboss, you must address Marco's federal contacts. What do you do?",
    options: [
      { text: 'Allow Marco to continue his dangerous game -- the intel is too valuable', effect: 'reputation', value: 12 },
      { text: 'Order Marco to cut all federal ties immediately -- no more risks', effect: 'respect', value: 14 },
      { text: 'Take over the federal contacts yourself -- control the information flow', effect: 'reputation', value: 15 }
    ]
  },
  completionNarrative: [
    { type: 'dialogue', text: "The old man chose YOU? Over his own blood? This isn't how families work. This isn't how tradition works. This is a mistake that will cost everyone.", speaker: 'Vinnie Torrino' },
    { type: 'narration', text: "Your elevation sends shockwaves through the organization. Some capos celebrate; others exchange worried glances. Vinnie's fury is volcanic -- and you know, with absolute certainty, that this is not the end of his ambitions. It's the beginning." },
    { type: 'scene', text: "You stand at the Don's right hand during the Sunday meeting, looking out over the assembled captains. The view from the top is breathtaking -- and terrifying." }
  ],
  boss: null
},
{
  id: 'torrino_ch20',
  title: "Vinnie's Shadow",
  act: 4,
  actTitle: 'Blood Ties',
  rankOnComplete: null,
  respectGain: 27,
  narrative: [
    { type: 'narration', text: "In the weeks following your promotion, the temperature inside the Torrino Family drops to arctic levels. Vinnie 'The Hammer' has been holding private meetings -- dinners, card games, fishing trips -- with key capos and soldiers. He's building something." },
    { type: 'dialogue', text: "Three of our capos haven't returned my calls in a week. Vinnie took Fat Tony to dinner at Peter Luger's last night -- since when does Vinnie buy anyone dinner?", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "You tail one of Vinnie's men to a warehouse in the Bronx. Through the grimy window, you count a dozen faces -- soldiers from different crews, all listening to Vinnie gesticulate wildly under a bare bulb." },
    { type: 'dialogue', text: 'My nephew is a hammer, and he thinks every problem is a nail. But a hammer can still bring down a house if you let it swing long enough.', speaker: 'Don Salvatore' }
  ],
  objectives: [
    { type: 'jobs', target: 66, text: 'Complete 66 jobs (any type)' },
    { type: 'money', target: 100000, text: 'Control $100,000 in Family funds' },
    { type: 'gang', target: 10, text: 'Maintain 10 loyal crew members' },
    { type: 'properties', target: 3, text: 'Secure 3 properties' },
    { type: 'reputation', target: 675, text: 'Reach 675 Respect' }
  ],
  rewards: { money: 30000, experience: 700, reputation: 18 },
  choice: null,
  completionNarrative: [
    { type: 'narration', text: "The conspiracy takes shape in the shadows. Vinnie has assembled a faction -- perhaps a third of the Family's soldiers -- loyal to him personally. The stage is set for a confrontation that cannot be avoided, only survived." },
    { type: 'dialogue', text: "We know who's with him and who's with us. The middle ground is shrinking fast. Something is coming -- I can feel it in my bones.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "A cold rain lashes the city. You stand at the window of the Don's study, watching the street below. Somewhere out there, Vinnie is sharpening his hammer. The Family has never been closer to civil war." }
  ],
  boss: null
},
{
  id: 'torrino_ch21',
  title: 'The Long Night',
  act: 4,
  actTitle: 'Blood Ties',
  rankOnComplete: null,
  respectGain: 28,
  narrative: [
    { type: 'scene', text: "Three AM. Your phone screams you awake. Marco's voice is ragged: 'They hit the Don's residence. Shooter on the roof across the street. Salvatore's alive, but he took glass in his shoulder. Get here now.'" },
    { type: 'narration', text: "An assassination attempt on Don Salvatore Torrino -- the most brazen act of violence the Family has seen in decades. The shooter was a professional: a single high-caliber round through the bedroom window, missing the Don's head by three inches." },
    { type: 'dialogue', text: "This wasn't the Bratva. This wasn't the feds. This was someone who knew exactly which room Salvatore sleeps in, which window faces the street, and what time he goes to bed. This was family.", speaker: 'Marco DeLuca' },
    { type: 'dialogue', text: 'Find the man who pulled the trigger. Find who paid him. And then you bring them both to me -- breathing. I want to look into their eyes before the end.', speaker: 'Don Salvatore' },
    { type: 'narration', text: 'The trail leads through a labyrinth of burner phones, offshore payments, and dead drops. Someone hired a contract killer -- a ghost from the old country -- and that someone has deep pockets and insider knowledge.' }
  ],
  objectives: [
    { type: 'jobs', target: 70, text: 'Complete 70 jobs (any type)' },
    { type: 'money', target: 120000, text: 'Spend and earn $120,000 in the investigation' },
    { type: 'gang', target: 11, text: 'Mobilize 11 crew members' },
    { type: 'properties', target: 3, text: 'Lock down 3 properties as safe houses' },
    { type: 'reputation', target: 725, text: 'Reach 725 Respect' }
  ],
  rewards: { money: 44000, experience: 960, reputation: 24 },
  choice: {
    prompt: "Evidence points to Vinnie funding the assassin, but it's not conclusive. How do you proceed?",
    options: [
      { text: 'Confront Vinnie directly with what you have -- force his hand', effect: 'reputation', value: 14 },
      { text: 'Present the evidence to the Don and let him decide', effect: 'respect', value: 16 },
      { text: 'Set a trap -- leak false information and see who bites', effect: 'reputation', value: 12 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'You corner the assassin -- a Sicilian contractor named Luca Ferraro -- in a condemned building in Astoria. The fight is savage, brutal, and personal.' },
    { type: 'dialogue', text: 'I was paid in cryptocurrency. Untraceable. But the man who hired me had a scar on his left hand and smelled like expensive cologne. Draw your own conclusions.', speaker: 'Luca Ferraro' },
    { type: 'narration', text: "The assassin is dealt with, but the puppet master remains in the shadows. The scar on the left hand, the expensive cologne -- the description fits Vinnie's right-hand man. The conspiracy goes deeper than anyone imagined." },
    { type: 'dialogue', text: 'The wolf is inside the walls. And he wears our name. God help us all.', speaker: 'Marco DeLuca' }
  ],
  boss: {
    name: 'Luca Ferraro, The Sicilian Assassin',
    power: 200,
    health: 320,
    gangSize: 5,
    reward: 20000,
    dialogue: {
      intro: 'I have no quarrel with you, Underboss. I am simply a professional fulfilling a contract. But if you insist on standing between me and my exit, then professionalism demands I remove you.',
      victory: "Ferraro collapses against the crumbling wall, his weapons scattered. For the first time, the professional killer looks afraid. 'The man who hired me will come for you himself,' he whispers. 'He's closer than you think.'",
      defeat: "The assassin's training proves superior. As your vision blurs, Ferraro steps over your fallen crew and vanishes into the night. The ghost escapes -- and the Don remains in danger."
    }
  }
},
{
  id: 'torrino_ch22',
  title: 'The Diagnosis',
  act: 5,
  actTitle: 'The Succession',
  rankOnComplete: null,
  respectGain: 30,
  narrative: [
    { type: 'scene', text: "Mount Sinai Hospital, private wing. The Don sits on the edge of a sterile bed in a paper gown, looking smaller than you've ever seen him. The fluorescent lights make his olive skin look gray." },
    { type: 'dialogue', text: "Pancreatic cancer. Stage three. The doctors give me six months, maybe eight if I'm lucky. I haven't been lucky in a long time.", speaker: 'Don Salvatore' },
    { type: 'narration', text: 'The words hit like a freight train. Don Salvatore Torrino -- the man who built an empire with his bare hands, who survived three wars and two federal indictments -- is dying. And with his death, the most dangerous succession crisis in decades will begin.' },
    { type: 'dialogue', text: 'Nobody knows yet. Not Vinnie, not the capos, not even Marco. You and I -- we need to plan. Because when I go, Vinnie will tear this family apart trying to take what he thinks is his.', speaker: 'Don Salvatore' }
  ],
  objectives: [
    { type: 'jobs', target: 75, text: 'Complete 75 jobs (any type)' },
    { type: 'money', target: 140000, text: 'Build a war chest of $140,000' },
    { type: 'gang', target: 12, text: 'Secure loyalty of 12 crew members' },
    { type: 'properties', target: 4, text: 'Control 4 strategic properties' },
    { type: 'reputation', target: 800, text: 'Reach 800 Respect' }
  ],
  rewards: { money: 58000, experience: 1220, reputation: 31 },
  choice: {
    prompt: 'The Don asks for your counsel on how to handle the succession.',
    options: [
      { text: 'Tell the capos now -- transparency breeds loyalty', effect: 'respect', value: 15 },
      { text: 'Keep it secret -- reveal nothing until the time is right', effect: 'reputation', value: 12 },
      { text: "Tell only Marco -- you'll need the Consigliere's mind for this", effect: 'respect', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: 'The clock is ticking. Behind the scenes, you and Don Salvatore lay the groundwork for a transition of power that must be seamless, or the Torrino Family will devour itself.' },
    { type: 'dialogue', text: "I've lived a full life. Longer than most men in our business. The only thing that matters now is that the Family survives. Promise me that.", speaker: 'Don Salvatore' },
    { type: 'scene', text: 'You help the Don into his car outside the hospital. He looks up at the Manhattan skyline one more time, as if memorizing it. The king is dying. Long live the king.' }
  ],
  boss: null
},
{
  id: 'torrino_ch23',
  title: "The Capos' Pledge",
  act: 5,
  actTitle: 'The Succession',
  rankOnComplete: null,
  respectGain: 31,
  narrative: [
    { type: 'narration', text: "With the Don's blessing, you begin the most delicate operation of your career: securing the loyalty of every capo in the Torrino Family before Vinnie can turn them. It's a chess game played in steakhouses, social clubs, and private cars." },
    { type: 'dialogue', text: "Most of the capos will follow strength. Show them you have it, and they'll fall in line. But a few -- Tony, Sal, the Brooklyn crew -- they're on the fence. They need to be convinced, not threatened.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "Night after night, you make the rounds. A handshake here, a promise there, a reminder of what you've accomplished -- the Bratva war, the expansion, the political connections. Your resume speaks louder than Vinnie's bloodline." },
    { type: 'dialogue', text: "I've known Vinnie since he was a boy. He's got the Torrino blood, no doubt about it. But blood isn't everything. Capability is. Show me you can keep this family earning and I'll back you when the time comes.", speaker: 'Fat Tony Bianco' }
  ],
  objectives: [
    { type: 'jobs', target: 80, text: 'Complete 80 jobs (any type)' },
    { type: 'money', target: 170000, text: 'Demonstrate $170,000 in earning power' },
    { type: 'gang', target: 13, text: 'Unite 13 men under your banner' },
    { type: 'properties', target: 4, text: 'Control 4 properties' },
    { type: 'reputation', target: 875, text: 'Reach 875 Respect' }
  ],
  rewards: { money: 72000, experience: 1480, reputation: 37 },
  choice: null,
  completionNarrative: [
    { type: 'narration', text: "One by one, the capos declare their allegiance. Fat Tony, Sal the Blade, the Brooklyn crew -- they've seen what you've built and they believe in the future you represent. Vinnie's faction grows smaller with each passing day." },
    { type: 'dialogue', text: "You've got the numbers. When the time comes, the vote will go your way. But numbers don't stop bullets -- and Vinnie has never been a man who accepts the verdict of a vote.", speaker: 'Marco DeLuca' },
    { type: 'scene', text: "A quiet moment at Old Man Russo's barbershop. The old man trims your hair and tells stories of Dons past -- men who rose and fell, who built empires and watched them crumble. 'The ones who lasted,' he says, 'were the ones who listened.'" }
  ],
  boss: null
},
{
  id: 'torrino_ch24',
  title: 'Requiem',
  act: 5,
  actTitle: 'The Succession',
  rankOnComplete: null,
  respectGain: 33,
  narrative: [
    { type: 'scene', text: 'The Church of the Most Precious Blood on Mulberry Street is standing room only. Five hundred mourners -- wiseguys, politicians, judges, and civilians -- pack the pews to pay their respects to Don Salvatore Torrino, dead at seventy-three.' },
    { type: 'narration', text: "The Don passed quietly in his sleep, surrounded by family. His last words, spoken to you alone at his bedside: 'The family is yours now. Don't let the hammer break what I built.' The weight of those words will stay with you forever." },
    { type: 'dialogue', text: "He was the last of the old Dons. A man of honor in a world that's forgotten what the word means. God rest his soul.", speaker: 'Old Man Russo' },
    { type: 'dialogue', text: 'My uncle is dead. And now the vultures circle. Enjoy your little coalition while it lasts -- blood will have its due.', speaker: 'Vinnie Torrino' },
    { type: 'narration', text: 'After the funeral mass and the burial at Calvary Cemetery, the capos gather in the basement of the Social Club. The vote for the new Don will happen tonight. Tradition demands it. And tradition is all that stands between the Torrino Family and civil war.' }
  ],
  objectives: [
    { type: 'jobs', target: 85, text: 'Complete 85 jobs (any type)' },
    { type: 'money', target: 200000, text: 'Control $200,000 in Family assets' },
    { type: 'gang', target: 14, text: 'Rally 14 loyal men for the vote and its aftermath' },
    { type: 'properties', target: 4, text: 'Hold 4 key properties' },
    { type: 'reputation', target: 950, text: 'Reach 950 Respect' }
  ],
  rewards: { money: 86000, experience: 1740, reputation: 44 },
  choice: {
    prompt: "Hours before the vote, Vinnie sends a message: he'll accept the result if you give him the Underboss seat. A lie, or a genuine offer?",
    options: [
      { text: 'Accept the deal -- even a false peace is better than open war', effect: 'respect', value: 12 },
      { text: "Reject it -- Vinnie can't be trusted and you won't legitimize his claim", effect: 'reputation', value: 18 },
      { text: 'Counter-offer: Vinnie gets a capo seat and a generous territory', effect: 'respect', value: 15 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The votes are cast. By a margin of seven to three, the capos of the Torrino Family choose you as their new Don. For a single, perfect moment, the room is united in purpose.' },
    { type: 'dialogue', text: "Congratulations, Don. May your reign be long and prosperous. Now -- prepare yourself. Because Vinnie just walked out, and he didn't look like a man who accepts defeat.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: "The vote is done. But as the capos file out into the cold night air, you notice something chilling: Vinnie's men are gone. Every single one. The streets around the Social Club are empty. Too empty." }
  ],
  boss: null
},
{
  id: 'torrino_ch25',
  title: 'The Throne of Iron',
  act: 5,
  actTitle: 'The Succession',
  rankOnComplete: 'don',
  respectGain: 35,
  narrative: [
    { type: 'scene', text: "Midnight. The Social Club's windows explode inward as Vinnie's loyalists storm the building from three directions. Gunfire erupts in the narrow streets of Little Italy. The coup has begun." },
    { type: 'narration', text: "Vinnie 'The Hammer' Torrino has made his move. Backed by a third of the Family's soldiers and a crew of hired mercenaries, he intends to seize the crown by force -- the old way, the bloody way." },
    { type: 'dialogue', text: "I told you, blood has its due! This Family was built by Torrino hands, and it'll be ruled by Torrino blood! Step aside or be buried alongside the old man!", speaker: 'Vinnie Torrino' },
    { type: 'dialogue', text: "He's got men on Mulberry, Hester, and Grand. This is an all-out assault. We hold the club or we lose everything.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: "The final battle for the soul of the Torrino Family erupts across the neighborhood that raised you. Everything you've built, everyone you've sworn to protect -- it all comes down to this night." }
  ],
  objectives: [
    { type: 'jobs', target: 90, text: 'Complete 90 jobs (any type)' },
    { type: 'money', target: 250000, text: 'Command $250,000 in total assets' },
    { type: 'gang', target: 15, text: 'Lead 15 loyal soldiers into the final battle' },
    { type: 'properties', target: 5, text: 'Control 5 properties across the city' },
    { type: 'reputation', target: 1050, text: 'Reach 1050 Respect' }
  ],
  rewards: { money: 100000, experience: 2000, reputation: 50 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The Social Club falls silent at last. Shell casings cover the floor like fallen leaves. Vinnie 'The Hammer' Torrino kneels before you, disarmed, bleeding, defeated. His coup lies in ruins around him." },
    { type: 'dialogue', text: "Go ahead. Finish it. That's what the old man would have done.", speaker: 'Vinnie Torrino' },
    { type: 'dialogue', text: "The old man would have given you a second chance. He believed in family above everything -- even when family didn't deserve it. Get up, Vinnie. We have work to do.", speaker: 'Marco DeLuca' },
    { type: 'narration', text: "Dawn breaks over Little Italy. The fires are out, the wounded are tended, and the streets slowly return to their ancient rhythms. The war for the Torrino Family is over. You sit in Don Salvatore's chair -- your chair now -- and light the old man's cigar. The smoke curls toward the ceiling as the new day begins. You are the Don. You are the Family. Blood and honor -- now and forever." }
  ],
  boss: {
    name: "Vinnie 'The Hammer' Torrino",
    power: 250,
    health: 400,
    gangSize: 8,
    reward: 50000,
    dialogue: {
      intro: "You think a vote makes you Don? A vote is just words. THIS is how Torrinos settle things -- with blood and iron! I'm going to tear down everything you've built and salt the earth!",
      victory: "Vinnie drops to his knees, the hammer finally broken. 'You win,' he gasps through bloodied teeth. 'But know this -- you'll never be a real Torrino. You'll always be the outsider who stole the crown.' The battle is over. The Torrino Family endures under your rule.",
      defeat: "Vinnie's fury is overwhelming. As your vision fades, you hear him declare himself Don to the cheers of his loyalists. The Torrino Family descends into darkness under the Hammer's brutal reign."
    }
  }
}
    ],
  },

  // ======================================================================
  //  KOZLOV BRATVA  -  "Iron & Ice"
  // ======================================================================
  kozlov: {
    storyTitle: 'Iron & Ice',
    icon: 'Kozlov Bratva',
    color: '#4169e1',
    tagline: 'A tale of strength, discipline, and the cold price of power.',
    chapters: [{
  id: 'kozlov_ch1',
  title: 'The Cage',
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 5,
  narrative: [
    { type: 'scene', text: 'The basement reeks of sweat and iron. A bare bulb swings above a crude fighting ring chalked onto raw concrete. Men with prison tattoos line the walls, passing bottles of cheap vodka and sizing you up like meat.' },
    { type: 'narration', text: "This is how the Kozlov Bratva tests new blood -- not with words or promises, but with fists and pain. Dimitri 'The Bear' Kozlov watches from a steel chair in the corner, his massive frame barely contained by it, a half-empty bottle of Stolichnaya dangling from one hand." },
    { type: 'dialogue', text: 'You want to run with wolves? Then bleed like one. Get in the cage.', speaker: 'Dimitri Kozlov' },
    { type: 'scene', text: 'Your opponent is a scarred dockworker twice your size, knuckles wrapped in electrical tape. The crowd begins to chant in Russian. There are no rules here -- only survival.' }
  ],
  objectives: [
    { type: 'jobs', target: 5, text: 'Survive 5 rounds in the fighting pit' },
    { type: 'money', target: 1000, text: 'Earn $1,000 from underground fights' }
  ],
  rewards: { money: 500, experience: 50, reputation: 2 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'You spit blood onto the concrete, standing over your fallen opponent. The crowd falls silent, then erupts. Dimitri rises slowly from his chair.' },
    { type: 'dialogue', text: 'He still stands. Good. Get him vodka -- the real stuff, not that piss we sell to Americans.', speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: "Viktor, Dimitri's grizzled right hand, drapes a rough towel over your shoulders. His eyes are cold but there's a flicker of approval. You've passed the first test of the Bratva." }
  ],
  boss: null
},
{
  id: 'kozlov_ch2',
  title: 'Arms & the Man',
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 6,
  narrative: [
    { type: 'narration', text: "The Bratva's bread and butter isn't drugs or gambling -- it's iron. AK-pattern rifles, surplus military hardware, crates of ammunition smuggled from Eastern European depots. Your first real job: ride shotgun on a weapons run across the border." },
    { type: 'dialogue', text: "The cargo crosses at midnight. You drive, you don't stop, you don't ask questions. If the border patrol shows, you handle it. Understood?", speaker: 'Viktor' },
    { type: 'scene', text: 'The truck is a rusting panel van packed with long wooden crates stenciled in Cyrillic. Viktor hands you a Makarov pistol -- your first Bratva weapon. The weight of it changes something inside you.' },
    { type: 'narration', text: 'Snow begins to fall as you pull onto the highway. In the rearview mirror, the city lights fade to nothing. Ahead, only darkness and the road.' }
  ],
  objectives: [
    { type: 'jobs', target: 8, text: 'Complete 8 jobs (any type)' },
    { type: 'money', target: 1500, text: 'Earn $1,500 from weapons trade' },
    { type: 'reputation', target: 10, text: 'Reach 10 Respect' }
  ],
  rewards: { money: 875, experience: 68, reputation: 3 },
  choice: {
    prompt: 'A lone border guard spots your van and approaches. Viktor reaches for his knife. You could handle this without blood.',
    options: [
      { text: 'Bribe the guard -- slide him a wad of cash and keep things quiet', effect: 'money', value: -300 },
      { text: 'Let Viktor handle it -- the Bratva way leaves no witnesses', effect: 'reputation', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The crates are offloaded into a warehouse on the far side of the river. Men in dark coats count rifles with practiced efficiency, checking serial numbers against a handwritten ledger.' },
    { type: 'dialogue', text: "Not bad for a first run. You didn't panic. That's more than most.", speaker: 'Viktor' },
    { type: 'narration', text: "Word travels fast in the Bratva. By morning, the soldiers know your name. You've proven you can carry iron without flinching." }
  ],
  boss: null
},
{
  id: 'kozlov_ch3',
  title: 'The Vodka Test',
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 7,
  narrative: [
    { type: 'scene', text: "Dimitri's private office sits above a butcher shop in Brighton Beach. The walls are covered in old photographs -- men in military uniforms, Soviet-era medals, a young Dimitri in Spetsnaz fatigues with a rifle across his knees." },
    { type: 'dialogue', text: "In the Bratva, we do not hide behind contracts or lawyers. A man's word is sealed in vodka and blood. Sit. Drink with me.", speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: "He produces a bottle of Beluga Noble and pours two glasses to the brim. This isn't social drinking -- it's an interrogation. Every question between shots, every pause measured. Dimitri watches how you handle the burn, whether your tongue loosens, whether your eyes stay sharp." },
    { type: 'dialogue', text: 'Tell me -- what is the difference between a soldier and a dog? A dog obeys from fear. A soldier obeys from understanding. Which are you?', speaker: 'Dimitri Kozlov' }
  ],
  objectives: [
    { type: 'jobs', target: 12, text: 'Complete 12 jobs (any type)' },
    { type: 'money', target: 2500, text: 'Accumulate $2,500 in earnings' },
    { type: 'reputation', target: 20, text: 'Reach 20 Respect' }
  ],
  rewards: { money: 1250, experience: 85, reputation: 3 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'Six shots deep, the room swims but you hold steady. Dimitri leans back, studying you with those bloodshot bear-eyes.' },
    { type: 'dialogue', text: "You drink like a Russian. Maybe there's hope for you yet. Viktor -- put this one on real work.", speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: "You leave the butcher shop on unsteady legs but with Dimitri's tentative approval. In the Bratva, that's worth more than gold." }
  ],
  boss: null
},
{
  id: 'kozlov_ch4',
  title: 'Cold Harbor',
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 8,
  narrative: [
    { type: 'narration', text: "The Bratva needs control of Pier 17 -- a decrepit stretch of waterfront where cargo ships from the Baltic dock under cover of darkness. Currently, a corrupt harbormaster named Janssen controls access and he's been raising his price." },
    { type: 'dialogue', text: 'Janssen thinks he can squeeze us. He forgets who keeps the coast guard blind. Go down to the pier tonight. Remind him of the arrangement.', speaker: 'Viktor' },
    { type: 'scene', text: 'Midnight at the docks. Fog rolls off the black water, thick enough to muffle footsteps. Shipping containers loom like steel tombs. You find Janssen in his office, a cramped shack reeking of diesel and fear.' },
    { type: 'dialogue', text: "I-I just need more money! Do you know what they're paying me to look the other way? It's not enough for the risk!", speaker: 'Janssen' }
  ],
  objectives: [
    { type: 'jobs', target: 15, text: 'Complete 15 jobs (any type)' },
    { type: 'money', target: 3500, text: 'Earn $3,500 from dock smuggling' },
    { type: 'reputation', target: 35, text: 'Reach 35 Respect' }
  ],
  rewards: { money: 1625, experience: 100, reputation: 3 },
  choice: {
    prompt: "Janssen is sweating, begging. He controls dock access -- he's useful alive but dangerous if disloyal.",
    options: [
      { text: 'Increase his cut -- a well-paid dog stays loyal', effect: 'money', value: -500 },
      { text: 'Break his fingers -- fear is cheaper than money', effect: 'respect', value: 4 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'By dawn, Pier 17 is firmly under Bratva control. The next cargo ship from Riga docks without incident, its hull packed with unmarked crates.' },
    { type: 'narration', text: "Janssen won't be a problem again. Word of your visit spreads along the waterfront -- the Kozlov operation has a new enforcer, and he doesn't bluff." },
    { type: 'dialogue', text: "The docks are ours. Dimitri is pleased. You're moving up, kid.", speaker: 'Viktor' }
  ],
  boss: null
},
{
  id: 'kozlov_ch5',
  title: "The Smuggler's Route",
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 10,
  narrative: [
    { type: 'narration', text: 'With the docks secured, the Bratva needs a reliable inland pipeline -- a network of safe houses, stash points, and corrupt trucking companies to move weapons from the port to buyers across three states.' },
    { type: 'scene', text: "Viktor spreads a map across the hood of a parked sedan. Red circles mark relay points; blue lines trace back roads that avoid highway checkpoints. It's a military operation, planned with Spetsnaz precision." },
    { type: 'dialogue', text: "Dimitri built the first route twenty years ago with three men and a stolen truck. Now we need something bigger. You'll scout the northern corridor -- find us safe ground.", speaker: 'Viktor' },
    { type: 'scene', text: 'Three days on frozen back roads, sleeping in truck stops, bribing gas station owners and checking sight lines. You learn the rhythm of rural police patrols and find a decommissioned cold storage facility perfect for a relay point.' }
  ],
  objectives: [
    { type: 'jobs', target: 18, text: 'Complete 18 jobs (any type)' },
    { type: 'money', target: 5000, text: 'Accumulate $5,000 in pipeline profits' },
    { type: 'reputation', target: 50, text: 'Reach 50 Respect' }
  ],
  rewards: { money: 2000, experience: 120, reputation: 4 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The first full shipment moves through the new northern corridor without a hitch. Three tons of hardware, dispersed to buyers in four cities within forty-eight hours.' },
    { type: 'dialogue', text: 'Clean run, no stops, no eyes. This is professional work. You think like Spetsnaz -- Dimitri will want to hear about this.', speaker: 'Viktor' },
    { type: 'narration', text: 'The pipeline is operational. Money flows north, weapons flow south, and your reputation in the Bratva grows with every clean delivery.' }
  ],
  boss: null
},
{
  id: 'kozlov_ch6',
  title: "Nadia's Warning",
  act: 1,
  actTitle: 'The Proving Ground',
  rankOnComplete: null,
  respectGain: 11,
  narrative: [
    { type: 'scene', text: "A black town car pulls up beside you in a parking garage. The rear window lowers to reveal Nadia Kozlova -- Dimitri's daughter. Sharp cheekbones, sharper eyes, wearing a coat that costs more than most men earn in a month." },
    { type: 'dialogue', text: "Get in. We need to talk, and not where Viktor's men can see us.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "Nadia is everything Dimitri isn't -- educated at Moscow State, fluent in four languages, and surgically precise where her father is a blunt instrument. She runs the Bratva's legitimate businesses, but everyone knows she sees more than she lets on." },
    { type: 'dialogue', text: "My father is not well. Not just the drinking -- there are people inside the Bratva who smell weakness. You're new enough to be outside the rot. That makes you either useful or expendable. I'd prefer useful.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: 'She slides a manila envelope across the leather seat. Inside: photographs of Bratva soldiers meeting with unknown men in expensive suits. The implications are clear -- someone is talking to outsiders.' }
  ],
  objectives: [
    { type: 'jobs', target: 22, text: 'Complete 22 jobs (any type)' },
    { type: 'money', target: 7000, text: 'Accumulate $7,000 in Bratva earnings' },
    { type: 'reputation', target: 75, text: 'Reach 75 Respect' }
  ],
  rewards: { money: 2800, experience: 140, reputation: 5 },
  choice: {
    prompt: "Nadia has shown you evidence of a potential traitor in the Bratva. She wants you as an ally -- but trusting the boss's daughter is a dangerous game.",
    options: [
      { text: 'Trust Nadia -- her intelligence is too valuable to ignore', effect: 'reputation', value: 5 },
      { text: 'Stay neutral -- report her concerns to Viktor and let the chain of command handle it', effect: 'respect', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'narration', text: "Nadia's warning plants a seed of unease. The Bratva you've bled for may not be as solid as it appears -- cracks run beneath the surface, hidden by vodka and brotherhood." },
    { type: 'dialogue', text: "Remember -- in this family, the ones who survive are the ones who see the knife before it's drawn.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: "You step out of the town car into the cold night air, the envelope hidden inside your jacket. The game has changed. You're no longer just muscle -- you're a piece on someone's chessboard." }
  ],
  boss: null
},
{
  id: 'kozlov_ch7',
  title: 'Blood & Vodka',
  act: 2,
  actTitle: 'Blood Brothers',
  rankOnComplete: 'soldier',
  respectGain: 12,
  narrative: [
    { type: 'narration', text: "The blood oath of the Kozlov Bratva hasn't changed in forty years. It takes place in the back room of a bathhouse in Brighton Beach, the walls lined with icons of Orthodox saints who've long since stopped watching." },
    { type: 'scene', text: 'Steam drifts through the doorway. Dimitri sits shirtless at the head of a wooden table, his massive torso covered in elaborate prison tattoos -- stars on his shoulders marking his authority, a cathedral across his chest counting his years behind bars. Viktor stands behind him, holding a ceremonial knife.' },
    { type: 'dialogue', text: "Kneel. You came to us as a stranger. Tonight you leave as a brother, or you don't leave at all. This is the vow -- your blood is our blood. Your enemies are our enemies. Betray the brotherhood and the brotherhood will bury you. Do you understand?", speaker: 'Dimitri Kozlov' },
    { type: 'scene', text: 'Viktor draws the blade across your palm. Blood drips onto a faded photograph of a saint taped to the table. Dimitri presses his own scarred palm against yours, and the men in the room begin to chant in Russian -- a low, rumbling prayer that sounds more like a war hymn.' }
  ],
  objectives: [
    { type: 'jobs', target: 25, text: 'Complete 25 jobs (any type)' },
    { type: 'money', target: 9000, text: 'Contribute $9,000 to the Bratva treasury' },
    { type: 'reputation', target: 100, text: 'Reach 100 Respect' }
  ],
  rewards: { money: 3600, experience: 160, reputation: 6 },
  choice: {
    prompt: 'As the oath concludes, Dimitri asks if you swear absolute loyalty -- to the brotherhood above all, including your own life.',
    options: [
      { text: 'Swear without hesitation -- the Bratva is your life now', effect: 'respect', value: 6 },
      { text: 'Swear, but privately resolve to always put survival first', effect: 'reputation', value: 4 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Vodka is poured and the men embrace you one by one -- rough, bone-crushing hugs from scarred soldiers who smell like tobacco and gun oil. You're one of them now." },
    { type: 'dialogue', text: "Brother. From this day, I answer for you and you answer for me. Don't make me regret it.", speaker: 'Viktor' },
    { type: 'narration', text: 'The rank of soldier carries weight in the Bratva. Men who ignored you yesterday now nod with respect. You have a seat at the table, a voice in the council, and a target on your back. This is the life you chose.' }
  ],
  boss: null
},
{
  id: 'kozlov_ch8',
  title: 'The Warehouse Job',
  act: 2,
  actTitle: 'Blood Brothers',
  rankOnComplete: null,
  respectGain: 13,
  narrative: [
    { type: 'narration', text: 'Intelligence reaches Viktor that a Colombian cartel has been stockpiling weapons in a warehouse on the outskirts of the industrial district -- weapons originally stolen from a Bratva shipment three months ago. Dimitri wants them back.' },
    { type: 'dialogue', text: "The Colombians took what's ours. Twelve crates of Kalashnikovs, military optics, body armor. They're sitting in a warehouse on Tenth Avenue, guarded by maybe six men. Take your crew. Bring back our iron.", speaker: 'Viktor' },
    { type: 'scene', text: "2 AM. Rain hammers the corrugated roof of the target warehouse. Your crew moves through the loading dock shadows -- two men you handpicked from the Bratva's ranks, hungry and loyal. Through a grimy window, you count the guards. Viktor was right: six men, armed but sloppy." },
    { type: 'dialogue', text: 'On your signal, boss. We hit fast and loud, or slow and quiet?', speaker: 'Luka' },
    { type: 'narration', text: 'This is your first command operation. Luka, a young lieutenant with ambition burning behind his eyes, watches you for the call. The weight of leadership settles on your shoulders like a loaded vest.' }
  ],
  objectives: [
    { type: 'jobs', target: 28, text: 'Complete 28 jobs (any type)' },
    { type: 'money', target: 12000, text: 'Recover $12,000 worth of stolen arms' },
    { type: 'reputation', target: 130, text: 'Reach 130 Respect' },
    { type: 'gang', target: 2, text: 'Recruit 2 crew members' }
  ],
  rewards: { money: 4400, experience: 180, reputation: 6 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The warehouse is cleared in under four minutes. Colombian guards zip-tied, crates loaded onto a waiting truck. Not a single shot that wasn't necessary." },
    { type: 'dialogue', text: "Twelve crates, all accounted for. Plus some Colombian product they won't be missing. Clean work.", speaker: 'Luka' },
    { type: 'narration', text: 'Viktor inspects the recovered cargo at dawn. Every rifle, every scope, every round -- all present. He claps you on the shoulder without a word, which from Viktor is practically a standing ovation.' }
  ],
  boss: null
},
{
  id: 'kozlov_ch9',
  title: 'Iron Discipline',
  act: 2,
  actTitle: 'Blood Brothers',
  rankOnComplete: null,
  respectGain: 14,
  narrative: [
    { type: 'scene', text: 'The basement of a former boxing gym in Red Hook. Heavy bags hang from chains, and a rack of training weapons lines one wall -- wooden bats, rubber knives, weighted gloves. Your growing crew assembles, breath fogging in the unheated space.' },
    { type: 'dialogue', text: 'Dimitri ran his unit in Chechnya like a machine. Every man knew his role, every movement was drilled until it was instinct. You want to lead in this Bratva? Your crew needs to be the same.', speaker: 'Viktor' },
    { type: 'narration', text: 'Viktor teaches the old ways -- hand-to-hand combat drills adapted from Spetsnaz training, surveillance techniques, counter-interrogation. Your men are raw but willing. Luka absorbs it all with a fierce hunger that borders on obsession.' },
    { type: 'dialogue', text: 'Again. Faster. In the field, hesitation is a bullet hole. You think the Colombians or the feds will wait for you to be ready?', speaker: 'Viktor' }
  ],
  objectives: [
    { type: 'jobs', target: 32, text: 'Complete 32 jobs (any type)' },
    { type: 'money', target: 15000, text: 'Invest $15,000 in crew equipment and training' },
    { type: 'reputation', target: 175, text: 'Reach 175 Respect' },
    { type: 'gang', target: 3, text: 'Expand crew to 3 members' }
  ],
  rewards: { money: 5200, experience: 200, reputation: 7 },
  choice: {
    prompt: 'One of your crew members botches a training exercise badly -- a mistake that would get people killed in the field. The others are watching to see how you respond.',
    options: [
      { text: 'Punish him publicly -- the Bratva respects strength and discipline above all', effect: 'respect', value: 5 },
      { text: 'Pull him aside privately -- build loyalty through mentorship, not fear', effect: 'reputation', value: 4 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'After weeks of grinding drills, your crew moves like a single organism. Entries are clean, communications tight, retreat protocols memorized. Even Viktor nods approvingly during the final exercise.' },
    { type: 'dialogue', text: 'Your men are ready. Maybe not Spetsnaz, but ready enough. Dimitri has a job coming -- a big one. Your crew is on the list.', speaker: 'Viktor' },
    { type: 'narration', text: "The crew bonds through shared pain and purpose. In the Bratva, this is how loyalty is forged -- not with money, but with sweat and blood and the knowledge that the man beside you won't run." }
  ],
  boss: null
},
{
  id: 'kozlov_ch10',
  title: 'The Interceptor',
  act: 2,
  actTitle: 'Blood Brothers',
  rankOnComplete: null,
  respectGain: 16,
  narrative: [
    { type: 'narration', text: "The biggest arms deal of the year. A container ship from Odessa carrying enough military hardware to equip a small army. The buyer: a militia group in the Midwest willing to pay top dollar. But the Colombians haven't forgotten the warehouse raid -- and they want revenge." },
    { type: 'scene', text: 'The handoff is set for a desolate stretch of coastline, two miles from the nearest road. Your crew arrives at midnight with two vans and a boat. The container ship flashes its signal -- three blinks, pause, two blinks.' },
    { type: 'dialogue', text: "Something feels wrong. Too quiet. The Colombians have eyes everywhere on this coast -- no way they don't know about this shipment.", speaker: 'Luka' },
    { type: 'scene', text: "He's right. As the first crate is lowered from the ship, headlights blaze from the tree line. Three vehicles, armed men pouring out. Leading them: a man called 'El Interceptor' -- the Colombian cartel's most feared enforcer, sent specifically to destroy the Bratva's pipeline." }
  ],
  objectives: [
    { type: 'jobs', target: 35, text: 'Complete 35 jobs (any type)' },
    { type: 'money', target: 18000, text: 'Protect $18,000 worth of arms inventory' },
    { type: 'reputation', target: 200, text: 'Reach 200 Respect' },
    { type: 'gang', target: 3, text: 'Maintain a crew of 3 for the ambush' }
  ],
  rewards: { money: 6000, experience: 220, reputation: 8 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The beach is littered with shell casings and blood-soaked sand. El Interceptor lies face down in the surf, his ambush shattered by the discipline your crew drilled for weeks.' },
    { type: 'dialogue', text: 'The Colombians sent their best and we broke them. This is what happens when they reach for what belongs to the Bratva.', speaker: 'Viktor' },
    { type: 'narration', text: "The shipment is secured. The Colombian threat on the East Coast is effectively neutralized. Dimitri raises a glass to your name at the next council meeting -- and in the Bratva, that's as close to a medal as it gets." }
  ],
  boss: {
    name: 'El Interceptor',
    power: 130,
    health: 220,
    gangSize: 5,
    reward: 8000,
    dialogue: {
      intro: 'You Russians think you own this coast? Tonight the ocean runs red with Bratva blood.',
      victory: "The Colombians will remember this defeat. The Bratva's iron pipeline holds.",
      defeat: 'El Interceptor laughs as your crew falls back. The shipment is lost to the waves.'
    }
  }
},
{
  id: 'kozlov_ch11',
  title: 'The Mole',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: null,
  respectGain: 17,
  narrative: [
    { type: 'narration', text: 'Someone inside the Bratva is feeding information to the outside. Three safe houses raided in two weeks. A weapons cache seized by ATF agents who knew exactly which wall panel to pry open. The leak is precise, detailed -- someone with access to the inner circle.' },
    { type: 'dialogue', text: 'Dimitri is furious. He wants blood. Find the rat before he tears the whole organization apart looking for one.', speaker: 'Viktor' },
    { type: 'scene', text: 'You begin the hunt systematically -- tracking who had access to the compromised locations, monitoring phone records through a corrupt telecom employee, watching for changes in lifestyle or behavior among Bratva soldiers.' },
    { type: 'dialogue', text: 'The photographs I showed you months ago -- this is what I warned about. The rot has taken hold. Be careful who you trust.', speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "The trail leads to Gregor, a mid-level soldier who manages three Bratva stash houses. He's been skimming payments and meeting with men in unmarked sedans. When you toss his apartment, you find a burner phone with encrypted messages and a DEA handler's number." }
  ],
  objectives: [
    { type: 'jobs', target: 38, text: 'Complete 38 jobs (any type)' },
    { type: 'money', target: 22000, text: 'Recover $22,000 lost to compromised operations' },
    { type: 'reputation', target: 250, text: 'Reach 250 Respect' },
    { type: 'gang', target: 4, text: 'Expand crew to 4 trusted operatives' }
  ],
  rewards: { money: 7200, experience: 256, reputation: 9 },
  choice: {
    prompt: "You've cornered Gregor in a basement. He's terrified, confessing everything -- he was turned by the DEA after they caught him with product. He begs for mercy and offers to feed disinformation back to the feds.",
    options: [
      { text: 'Execute him -- the Bratva code demands death for traitors, no exceptions', effect: 'respect', value: 6 },
      { text: 'Turn him into a double agent -- feed false intel to the DEA through Gregor', effect: 'reputation', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The mole problem is resolved, one way or another. Dimitri is informed, and the compromised safe houses are abandoned, new ones established within days.' },
    { type: 'dialogue', text: 'You handled that well. Discrete, efficient. Dimitri noticed. More importantly, I noticed.', speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "The hunt for the mole has changed you. You see the Bratva differently now -- not just a brotherhood of soldiers, but a web of loyalties and betrayals. Trust is a currency, and it's always in short supply." }
  ],
  boss: null
},
{
  id: 'kozlov_ch12',
  title: 'Red Ledger',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: null,
  respectGain: 18,
  narrative: [
    { type: 'narration', text: "The Bratva's finances are a disaster. Years of Dimitri's increasingly erratic management, combined with the mole's damage, have left the books in shambles. Money is leaking from a dozen sources -- skimming soldiers, phantom expenses, accounts that lead nowhere." },
    { type: 'dialogue', text: 'My father built an empire with his fists and forgot it needs a brain to run. The ledgers are a war zone. I need someone I trust to help me fix this before the whole machine collapses.', speaker: 'Nadia Kozlova' },
    { type: 'scene', text: "Nadia's office is a stark contrast to Dimitri's -- clean lines, dual monitors, spreadsheets instead of vodka bottles. She walks you through the bleeding points: a laundromat that hasn't turned real profit in years, a construction company used for laundering that's being audited, shell accounts with suspicious withdrawals." },
    { type: 'dialogue', text: "We clean the money through real businesses or we drown in dirty cash that'll bring the IRS down on us worse than any rival could.", speaker: 'Nadia Kozlova' }
  ],
  objectives: [
    { type: 'jobs', target: 40, text: 'Complete 40 jobs (any type)' },
    { type: 'money', target: 26000, text: 'Recover and consolidate $26,000 in Bratva assets' },
    { type: 'reputation', target: 300, text: 'Reach 300 Respect' },
    { type: 'gang', target: 5, text: 'Recruit a crew of 5 for enforcement and collection' }
  ],
  rewards: { money: 8400, experience: 292, reputation: 10 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'Over several weeks, the red ledger turns black. Leaking accounts are sealed, skimming soldiers disciplined, and Nadia routes clean money through new legitimate fronts -- a car dealership and an import/export firm.' },
    { type: 'dialogue', text: "For the first time in years, the numbers make sense. My father won't understand half of what we did, but he'll understand the profit line.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "The financial cleanup earns you something more valuable than money -- Nadia's genuine trust. In the Kozlov family, that's a rare and powerful thing." }
  ],
  boss: null
},
{
  id: 'kozlov_ch13',
  title: 'Promoted to Capo',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: 'capo',
  respectGain: 19,
  narrative: [
    { type: 'scene', text: "The council meets in the back room of a Russian restaurant on Coney Island. Cigarette smoke hangs in blue layers. Every senior member of the Bratva is present -- Viktor, Nadia, the old captains, and at the head, Dimitri, looking more tired than you've ever seen him." },
    { type: 'dialogue', text: 'This one has bled for us, killed for us, and saved us from ruin when the mole nearly brought us down. I am giving him territory. The Northside -- docks, warehouses, and the pipeline -- it is his to command.', speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: 'The room shifts. Some of the old captains exchange glances -- jealousy, resentment, calculation. Others raise their glasses. Viktor nods slowly, his weathered face unreadable. Luka grins from the back of the room.' },
    { type: 'dialogue', text: "Brother, you've earned this. But territory means enemies. The Northside borders Colombian and Irish territory. You'll need to be ready.", speaker: 'Viktor' }
  ],
  objectives: [
    { type: 'jobs', target: 43, text: 'Complete 43 jobs (any type)' },
    { type: 'money', target: 30000, text: 'Generate $30,000 in Northside revenue' },
    { type: 'reputation', target: 350, text: 'Reach 350 Respect' },
    { type: 'gang', target: 5, text: 'Command a crew of 5 soldiers' },
    { type: 'properties', target: 1, text: 'Establish 1 Bratva property on the Northside' }
  ],
  rewards: { money: 9600, experience: 328, reputation: 10 },
  choice: {
    prompt: "With your new territory, you need to set the tone for how you'll rule the Northside.",
    options: [
      { text: 'Expand aggressively -- push into disputed zones and claim everything you can hold', effect: 'reputation', value: 6 },
      { text: "Consolidate carefully -- fortify what's yours, build steady income, then expand", effect: 'respect', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'Within weeks, the Northside recognizes new management. Your crew patrols the docks, your collections run on schedule, and the pipeline hums with activity.' },
    { type: 'dialogue', text: "A Capo. You've come far from the fighting cage. But remember -- every captain who sits in that chair eventually faces a test that breaks him or makes him. Yours is coming.", speaker: 'Viktor' },
    { type: 'narration', text: "The rank of Capo places you in the Bratva's inner circle. You attend council meetings, have a vote on major decisions, and command men who kill on your word. The cage fighter is gone -- a leader has taken his place." }
  ],
  boss: null
},
{
  id: 'kozlov_ch14',
  title: 'The Pipeline',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: null,
  respectGain: 20,
  narrative: [
    { type: 'narration', text: "The old supply routes from Moscow have gone cold. Dimitri's contacts in the Russian military -- men he served with in Chechnya -- are aging out, retiring, dying. The pipeline that once flowed with surplus Kalashnikovs and grenades has reduced to a trickle." },
    { type: 'dialogue', text: "My father's generation built this on old war bonds and military brotherhood. That's dying. We need new connections -- younger officers, different channels. I have contacts in Moscow who can help, but they need assurances.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: "Nadia arranges a video call with a man identified only as 'The Colonel' -- a serving Russian military officer who controls a depot in Kaliningrad. His face is hidden, but his voice is young and greedy." },
    { type: 'dialogue', text: 'I can move hardware through the Baltic -- small arms, optics, communications equipment. But I need three things: volume guarantees, upfront payment, and absolute discretion. One leak and I disappear -- and so does your pipeline.', speaker: 'The Colonel' }
  ],
  objectives: [
    { type: 'jobs', target: 46, text: 'Complete 46 jobs (any type)' },
    { type: 'money', target: 35000, text: 'Invest $35,000 to reestablish Moscow connections' },
    { type: 'reputation', target: 400, text: 'Reach 400 Respect' },
    { type: 'gang', target: 6, text: 'Expand operations crew to 6 members' },
    { type: 'properties', target: 1, text: 'Maintain at least 1 secure warehouse property' }
  ],
  rewards: { money: 10800, experience: 364, reputation: 11 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The first shipment from Kaliningrad arrives via a commercial freighter -- disassembled rifles hidden in agricultural equipment. Quality military grade, far superior to what the old suppliers provided.' },
    { type: 'dialogue', text: "The Colonel delivered. This changes everything -- we're not just resupplied, we're upgraded. The Americans will pay double for this quality.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "The Moscow pipeline is reborn, modernized. Nadia's strategic vision combined with your operational skill has secured the Bratva's future supply chain. Even Dimitri, through the haze of his drinking, recognizes the achievement." }
  ],
  boss: null
},
{
  id: 'kozlov_ch15',
  title: 'Frozen Assets',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: null,
  respectGain: 22,
  narrative: [
    { type: 'scene', text: "January. The coldest winter in a decade. The streets are sheets of ice and the city feels like it's under siege from the weather itself. But in the Bratva, cold is familiar -- cold is where Russians thrive." },
    { type: 'narration', text: "A rival Armenian crew has been running a protection racket in Bratva-adjacent territory -- shaking down Russian-owned businesses, intimidating shop owners, testing the borders. Dimitri has tolerated it out of apathy. You won't." },
    { type: 'dialogue', text: 'The Armenians control four blocks between our territory and the waterfront. Mostly small-time -- extortion, numbers running. But if we absorb them, the Northside becomes a fortress.', speaker: 'Luka' },
    { type: 'scene', text: "You survey the Armenian territory in the predawn cold, breath crystallizing, mapping their operations. A dry cleaner's that's a front, a social club where the crew meets, two apartment buildings they use as stash houses. Taking them won't be clean." }
  ],
  objectives: [
    { type: 'jobs', target: 50, text: 'Complete 50 jobs (any type)' },
    { type: 'money', target: 40000, text: 'Seize $40,000 in rival territory assets' },
    { type: 'reputation', target: 450, text: 'Reach 450 Respect' },
    { type: 'gang', target: 7, text: 'Command a crew of 7 for the takeover' },
    { type: 'properties', target: 2, text: 'Control 2 Bratva properties' }
  ],
  rewards: { money: 12000, experience: 400, reputation: 12 },
  choice: {
    prompt: "The Armenian crew's leader requests a sit-down. He's willing to negotiate -- either absorption into the Bratva or a bloody stand. Your approach will define your reputation.",
    options: [
      { text: 'Negotiate a takeover -- absorb their crew, honor their existing arrangements', effect: 'reputation', value: 7 },
      { text: "Seize everything by force -- the Bratva doesn't negotiate with inferiors", effect: 'respect', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'By the end of the month, the Armenian territory is Bratva territory. Their businesses pay tribute to you, their stash houses hold your product, their former soldiers take orders from your crew.' },
    { type: 'dialogue', text: 'The Northside is bulletproof now. Nobody gets in or out without us knowing. This is what Dimitri should have done years ago.', speaker: 'Luka' },
    { type: 'narration', text: "The frozen city thaws, but your grip on the territory only tightens. The Bratva's footprint has expanded significantly under your command -- a fact that hasn't gone unnoticed by friends or enemies." }
  ],
  boss: null
},
{
  id: 'kozlov_ch16',
  title: 'The Handler',
  act: 3,
  actTitle: "Viktor's Shadow",
  rankOnComplete: null,
  respectGain: 23,
  narrative: [
    { type: 'narration', text: "The FBI has assembled a task force specifically targeting the Kozlov Bratva. Leading it is Special Agent Marcus Cole -- a career fed with a personal grudge. He lost a partner to Russian organized crime a decade ago and he's been sharpening his knife ever since." },
    { type: 'dialogue', text: "Federal surveillance vans on Brighton Beach. Wiretap warrants. They're subpoenaing our business records. This isn't routine -- someone high up wants us buried.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: "Nadia's intelligence network identifies Cole's playbook: he's turning low-level Bratva associates, building a RICO case brick by brick. Three soldiers have already been pulled in for questioning. The noose is tightening." },
    { type: 'dialogue', text: "We can't kill a federal agent -- that brings down hellfire. But we can make his case fall apart. Discredit his witnesses, contaminate his evidence chain, make him look like a man on a vendetta instead of an investigation.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: 'But before the legal strategy can unfold, Cole makes his move -- a coordinated raid on three Bratva locations. Your crew barely escapes the Northside warehouse as federal agents breach the front door. Cole himself leads the charge, a man possessed.' }
  ],
  objectives: [
    { type: 'jobs', target: 53, text: 'Complete 53 jobs (any type)' },
    { type: 'money', target: 50000, text: 'Protect $50,000 in Bratva assets from federal seizure' },
    { type: 'reputation', target: 475, text: 'Reach 475 Respect' },
    { type: 'gang', target: 7, text: 'Maintain a crew of 7 through the federal pressure' },
    { type: 'properties', target: 2, text: 'Secure 2 properties against seizure' },
    { type: 'reputation', target: 500, text: 'Reach 500 Respect' }
  ],
  rewards: { money: 15600, experience: 460, reputation: 13 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The confrontation comes at a Bratva-owned construction site. Cole arrives with a small team, acting on a tip -- but you're waiting. Not with guns, but with lawyers, cameras, and Nadia's carefully prepared evidence of Cole's procedural violations." },
    { type: 'dialogue', text: 'This investigation is over, Agent Cole. Your warrants are tainted, your informants are compromised, and my attorneys will have your badge if you set foot on Kozlov property again.', speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "Cole retreats, but the look in his eyes promises he'll be back. The immediate threat is neutralized, but the FBI doesn't forget. The Bratva has won this battle -- the war continues." }
  ],
  boss: {
    name: 'Special Agent Marcus Cole',
    power: 170,
    health: 270,
    gangSize: 4,
    reward: 15000,
    dialogue: {
      intro: "Kozlov Bratva -- you're all going down. Every last one of you. I've got warrants, wire taps, and twenty years of patience.",
      victory: "Cole's task force is dismantled, his evidence inadmissible. The federal wolf slinks away -- for now.",
      defeat: "Cole's raid succeeds. Federal agents haul away crates of evidence as the Bratva scrambles to regroup."
    }
  }
},
{
  id: 'kozlov_ch17',
  title: "Dimitri's Decline",
  act: 4,
  actTitle: 'The Fracture',
  rankOnComplete: null,
  respectGain: 24,
  narrative: [
    { type: 'scene', text: 'You find Dimitri at 2 PM in his office above the butcher shop, already deep into his third bottle. The room stinks of stale alcohol and unwashed clothes. Maps and ledgers lie scattered, coffee rings on classified documents. The Bear is drowning.' },
    { type: 'dialogue', text: "You think I don't see it? The way they look at me now. Like I'm already dead. Let them. I built this empire with these hands -- I'll burn it down with them too if I want.", speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: "Dimitri's decline has accelerated. The proud Spetsnaz warrior who once terrified rival bosses now misses meetings, makes erratic decisions, and lashes out at anyone who questions him. Viktor covers for him as best he can, but the cracks are showing." },
    { type: 'dialogue', text: "He's getting worse. Last week he pulled a gun on one of our own men over a spilled drink. The soldiers are losing faith. Something has to change.", speaker: 'Viktor' },
    { type: 'scene', text: 'At a council meeting, Dimitri rambles for twenty minutes about a war in Chechnya that ended decades ago, then passes out at the table. The captains exchange looks. The power vacuum you were warned about is forming in real time.' }
  ],
  objectives: [
    { type: 'jobs', target: 56, text: 'Complete 56 jobs (any type)' },
    { type: 'money', target: 60000, text: 'Maintain $60,000 in revenue despite leadership chaos' },
    { type: 'reputation', target: 525, text: 'Reach 525 Respect' },
    { type: 'gang', target: 8, text: 'Expand crew to 8 to fill the leadership gap' },
    { type: 'properties', target: 2, text: 'Hold 2 properties amid internal instability' },
    { type: 'reputation', target: 550, text: 'Reach 550 Respect' }
  ],
  rewards: { money: 19200, experience: 520, reputation: 14 },
  choice: {
    prompt: 'Viktor asks you to speak with Dimitri privately about his drinking -- a conversation that could end in gratitude or violence.',
    options: [
      { text: 'Confront Dimitri -- tell him the brotherhood needs its Bear sober and strong', effect: 'respect', value: 7 },
      { text: "Stay silent -- some battles can't be won with words, and Dimitri's pride is lethal", effect: 'reputation', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Dimitri continues to deteriorate, but the Bratva holds together -- largely through your efforts and Nadia's. The soldiers look to you and Viktor for direction now, not the Bear." },
    { type: 'dialogue', text: "My father is going to lose everything he built. I won't let that happen. We need a plan -- a real one. Will you listen?", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "The fracture is widening. The Bratva that once seemed unbreakable is splitting along fault lines of loyalty -- those who cling to Dimitri's fading authority, and those who see the future requires new blood." }
  ],
  boss: null
},
{
  id: 'kozlov_ch18',
  title: "Nadia's Gambit",
  act: 4,
  actTitle: 'The Fracture',
  rankOnComplete: null,
  respectGain: 26,
  narrative: [
    { type: 'scene', text: "Nadia's penthouse apartment overlooking the river. Floor-to-ceiling windows frame the city skyline. She pours two glasses of Georgian wine -- not vodka, never vodka -- and sits across from you at a glass table covered in documents." },
    { type: 'dialogue', text: "I've been preparing for this moment for five years. My father built the Bratva with brute force, but brute force is a depreciating asset. The future is legitimate business backed by strategic violence -- not the other way around.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: 'Nadia lays out her vision: transform the Bratva from a street-level criminal operation into a sophisticated enterprise. Launder the arms money through real estate and tech investments. Keep the military supply lines but professionalize them. Remove Dimitri -- gently -- and install new leadership.' },
    { type: 'dialogue', text: "I can't do this alone. The old guard won't follow a woman, not yet. But they'll follow you -- the cage fighter who became a captain. Together, we can save the Bratva by changing it. What do you say?", speaker: 'Nadia Kozlova' }
  ],
  objectives: [
    { type: 'jobs', target: 60, text: 'Complete 60 jobs (any type)' },
    { type: 'money', target: 70000, text: 'Build a $70,000 war chest for the transition' },
    { type: 'reputation', target: 575, text: 'Reach 575 Respect' },
    { type: 'gang', target: 9, text: 'Secure loyalty of 9 crew members' },
    { type: 'properties', target: 2, text: 'Maintain 2 legitimate front properties' },
    { type: 'reputation', target: 600, text: 'Reach 600 Respect's future" }
  ],
  rewards: { money: 22800, experience: 580, reputation: 16 },
  choice: {
    prompt: "Nadia offers a formal alliance -- her brains, your muscle, a shared vision for the Bratva's future. But aligning with her means choosing a side.",
    options: [
      { text: "Accept Nadia's alliance -- her vision is the only way the Bratva survives", effect: 'reputation', value: 8 },
      { text: "Go it alone -- you've earned your position through blood, not politics", effect: 'respect', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The alliance -- formal or not -- changes the dynamic within the Bratva. Nadia begins moving money into new ventures while you consolidate military and street operations. Together, you're a formidable force." },
    { type: 'dialogue', text: "You've chosen well. Or foolishly. Time will tell. But for now, we move forward together.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: 'The chess board is set. Nadia maneuvers in the boardroom while you command the streets. But the old guard is watching, and not everyone is pleased with the direction of change.' }
  ],
  boss: null
},
{
  id: 'kozlov_ch19',
  title: 'Named Underboss',
  act: 4,
  actTitle: 'The Fracture',
  rankOnComplete: 'underboss',
  respectGain: 27,
  narrative: [
    { type: 'scene', text: "A rare lucid day for Dimitri. He's shaved, wearing a clean suit, sitting upright in his chair with something approaching the old authority. Viktor stands beside him, face carved from stone." },
    { type: 'dialogue', text: "I'm not a fool. I know what's happening to me, and I know what's happening to the Bratva. I need someone to hold things together while I... figure things out. Viktor says it should be you. Nadia agrees. For once, everyone agrees on something.", speaker: 'Dimitri Kozlov' },
    { type: 'narration', text: "Dimitri formally names you Underboss -- second-in-command of the entire Kozlov Bratva. It's an acknowledgment of reality more than a promotion. You've been running things for months. Now it's official." },
    { type: 'dialogue', text: "Don't mistake this for surrender, pup. I'm still the Bear. I'm still Bratva. You hold my chair -- you don't sit in it.", speaker: 'Dimitri Kozlov' }
  ],
  objectives: [
    { type: 'jobs', target: 63, text: 'Complete 63 jobs (any type)' },
    { type: 'money', target: 80000, text: 'Manage $80,000 in Bratva revenue streams' },
    { type: 'gang', target: 10, text: 'Command 10 loyalists across all territories' },
    { type: 'properties', target: 3, text: 'Oversee 3 Bratva properties' },
    { type: 'reputation', target: 625, text: 'Reach 625 Respect's acting leader" }
  ],
  rewards: { money: 26400, experience: 640, reputation: 17 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The announcement sends shockwaves through the Bratva hierarchy. Some soldiers salute the decision -- you've earned it. Others seethe in silence, chief among them Sergei 'The Viper,' an old-guard enforcer who expected the position for himself." },
    { type: 'dialogue', text: "You've been named the Bear's shadow. Every eye in the Bratva is on you now. Lead well, brother. The alternative is a shallow grave.", speaker: 'Viktor' },
    { type: 'narration', text: 'Underboss. The title carries immense power and immense weight. Every decision flows through you -- territory disputes, financial allocations, discipline. The brotherhood looks to you now, and the old guard sharpens its knives.' }
  ],
  boss: null
},
{
  id: 'kozlov_ch20',
  title: 'The Old Guard',
  act: 4,
  actTitle: 'The Fracture',
  rankOnComplete: null,
  respectGain: 29,
  narrative: [
    { type: 'narration', text: "Sergei 'The Viper' has served the Bratva for thirty years -- longer than most soldiers have been alive. A veteran of the Afghan war, covered in faded tattoos and ancient grudges. He believes the Bratva should be ruled by ethnic Russians, by blood, by the old code. Your rise offends him to his core." },
    { type: 'dialogue', text: 'This outsider, this cage rat -- Dimitri makes him Underboss? Over men who bled for this brotherhood before he was born? The Bratva has lost its way.', speaker: "Sergei 'The Viper'" },
    { type: 'scene', text: "Sergei begins gathering the old guard -- veteran soldiers who share his traditionalist views. Secret meetings in a bathhouse on the east side. Weapons moved to private caches outside the Bratva's ledger. He's building a faction within the family." },
    { type: 'dialogue', text: "Sergei is not a man who talks without acting. He's been with the Bratva since Dimitri was still a young captain. If he moves against you, half the brotherhood might follow him. Handle this carefully.", speaker: 'Viktor' }
  ],
  objectives: [
    { type: 'jobs', target: 66, text: 'Complete 66 jobs (any type)' },
    { type: 'money', target: 100000, text: 'Control $100,000 in Bratva finances' },
    { type: 'gang', target: 10, text: 'Maintain 10 loyal crew members' },
    { type: 'properties', target: 3, text: 'Secure 3 properties against internal threats' },
    { type: 'reputation', target: 675, text: 'Reach 675 Respect' }
  ],
  rewards: { money: 30000, experience: 700, reputation: 18 },
  choice: {
    prompt: 'Sergei requests a formal audience -- Bratva tradition allows any soldier to challenge leadership publicly. You can handle this through honor or force.',
    options: [
      { text: 'Hear him out with respect -- honor the old ways, show strength through patience', effect: 'respect', value: 8 },
      { text: 'Deny the audience -- crush any perception of shared authority immediately', effect: 'reputation', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Tension coils through the Bratva like a spring. Sergei's faction grows bolder while your loyalists fortify their positions. The brotherhood is splitting in two, and everyone knows it can't hold." },
    { type: 'dialogue', text: "This ends only one way. You know this. Sergei won't stop until he's in charge or in the ground.", speaker: 'Luka' },
    { type: 'narration', text: "The old guard and the new are on a collision course. Sergei 'The Viper' is too proud to back down, and you've come too far to kneel. Blood will answer what words cannot." }
  ],
  boss: null
},
{
  id: 'kozlov_ch21',
  title: 'Blood Price',
  act: 4,
  actTitle: 'The Fracture',
  rankOnComplete: null,
  respectGain: 30,
  narrative: [
    { type: 'narration', text: "Sergei makes his move on a frozen Tuesday night. His faction seizes control of two Bratva warehouses and the east side bathhouse, declaring independence from your leadership. It's an open revolt -- the worst crisis the Kozlov Bratva has faced in a generation." },
    { type: 'dialogue', text: 'This is a civil war now. Every hour we wait, more soldiers have to pick a side. We hit Sergei tonight, before his faction solidifies.', speaker: 'Luka' },
    { type: 'scene', text: 'You assemble your loyalists in the basement of the Red Hook gym. Battle plans spread across the table. Viktor is there -- old, tired, but still the most dangerous man in the room. He checks the action on his Makarov without expression.' },
    { type: 'dialogue', text: "I've known Sergei for twenty-five years. He's wrong about you, but he's not wrong that the Bratva is changing. End this quickly. Mercy where you can, brutality where you must.", speaker: 'Viktor' },
    { type: 'scene', text: "The assault on Sergei's stronghold begins at 3 AM. Snow falls on a silent street as your crew approaches the bathhouse from three directions. Inside, candlelight flickers behind frosted windows. The Viper is waiting." }
  ],
  objectives: [
    { type: 'jobs', target: 70, text: 'Complete 70 jobs (any type)' },
    { type: 'money', target: 120000, text: 'Protect $120,000 in Bratva assets from the uprising' },
    { type: 'gang', target: 11, text: 'Rally 11 fighters for the final confrontation' },
    { type: 'properties', target: 3, text: "Reclaim 3 Bratva properties from Sergei's faction" },
    { type: 'reputation', target: 725, text: 'Reach 725 Respect' }
  ],
  rewards: { money: 44000, experience: 960, reputation: 24 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The bathhouse smells of gun smoke and steam. Sergei's loyalists are down -- some dead, some surrendered. The Viper himself kneels on the wet tile floor, blood running from a wound on his temple, but his eyes still burn with defiance." },
    { type: 'dialogue', text: "Finish it then. I won't beg. I'm Bratva -- I die on my feet or on my knees, but I die Bratva.", speaker: "Sergei 'The Viper'" },
    { type: 'narration', text: "The civil war ends where it began -- in the old ways, with blood and iron. Sergei's faction is broken, and the Bratva reunifies under your command. But the scars of this night will take a long time to heal." },
    { type: 'dialogue', text: "It's done. The Bratva is whole again -- but at what cost? Dimitri hasn't even noticed the war. That tells you everything.", speaker: 'Viktor' }
  ],
  boss: {
    name: "Sergei 'The Viper'",
    power: 220,
    health: 350,
    gangSize: 7,
    reward: 22000,
    dialogue: {
      intro: "You think you can lead the Bratva? You don't have the blood, the history, the scars. I'll show you what thirty years of service looks like when it fights back.",
      victory: "The Viper is defanged. Sergei's rebellion crumbles, and the old guard bends the knee to new leadership.",
      defeat: "Sergei's old-guard fighters overwhelm your crew. The Viper's rebellion succeeds, and your claim to power evaporates."
    }
  }
},
{
  id: 'kozlov_ch22',
  title: 'The Last Winter',
  act: 5,
  actTitle: 'The Coup',
  rankOnComplete: null,
  respectGain: 31,
  narrative: [
    { type: 'scene', text: "February. The city is locked in the grip of the worst winter in decades. Pipes freeze, streets empty, and the cold seeps into everything -- including the Bratva. Dimitri hasn't left his apartment in two weeks. Viktor brings him food that goes uneaten." },
    { type: 'dialogue', text: "It's time. My father is destroying the Bratva by inches. Every day he sits in that chair is a day the brotherhood weakens. We plan the transition now -- cleanly, firmly, with as little blood as possible.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "Nadia presents the plan over three nights of careful discussion. She's been laying groundwork for months -- moving liquid assets to accounts only she controls, securing loyalty from key captains, ensuring the Moscow pipeline answers to you, not Dimitri." },
    { type: 'scene', text: "Maps of Bratva territory on the wall, personnel files on the table, a timeline written in Nadia's precise hand. This is a military operation -- a coup against their own patriarch. The weight of what you're planning sits heavy in the room." },
    { type: 'dialogue', text: 'We need Viktor. Without him, half the brotherhood will fight to the death for Dimitri out of loyalty alone. Viktor is the key.', speaker: 'Nadia Kozlova' }
  ],
  objectives: [
    { type: 'jobs', target: 75, text: 'Complete 75 jobs (any type)' },
    { type: 'money', target: 140000, text: 'Secure $140,000 in transition funds' },
    { type: 'gang', target: 12, text: 'Assemble 12 absolutely loyal operatives' },
    { type: 'properties', target: 4, text: 'Control 4 strategic properties' },
    { type: 'reputation', target: 800, text: 'Reach 800 Respect' }
  ],
  rewards: { money: 58000, experience: 1220, reputation: 31 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The plan is complete. Every contingency accounted for, every loyalist in position. Nadia locks the final document in a safe and looks at you with eyes that carry the weight of a daughter about to dethrone her own father.' },
    { type: 'dialogue', text: "There's no going back after this. Once we start, we finish -- or Dimitri finishes us. Are you ready?", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "Outside, snow falls on a silent city. Inside, the machinery of change grinds into motion. The last winter of Dimitri Kozlov's reign has begun." }
  ],
  boss: null
},
{
  id: 'kozlov_ch23',
  title: 'Securing the Armory',
  act: 5,
  actTitle: 'The Coup',
  rankOnComplete: null,
  respectGain: 33,
  narrative: [
    { type: 'narration', text: "The first phase of the coup: cut Dimitri off from the Bratva's weapons stockpiles. As long as he controls the armory, any loyalist faction can arm itself for a fight. The main cache is stored in a fortified basement beneath a Russian Orthodox church -- Dimitri's most guarded secret." },
    { type: 'dialogue', text: "The church armory holds enough firepower to equip fifty men. There are four guards loyal to my father, rotating shifts. We need it taken without a shot fired -- noise brings attention we can't afford.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: '3 AM. Your crew approaches the church through ankle-deep snow. The stained glass windows are dark. Luka takes point, leading a team through the basement entrance while you handle the guards on the main level. Silent. Surgical. Just like Viktor taught you.' },
    { type: 'dialogue', text: "Guards neutralized. No shots, no injuries, all four secured. The armory is ours -- crates, ammunition, everything. Dimitri won't know until it's too late.", speaker: 'Luka' }
  ],
  objectives: [
    { type: 'jobs', target: 80, text: 'Complete 80 jobs (any type)' },
    { type: 'money', target: 170000, text: 'Secure $170,000 in arms and resources' },
    { type: 'gang', target: 13, text: 'Command 13 operatives across all sectors' },
    { type: 'properties', target: 4, text: 'Control 4 critical Bratva properties' },
    { type: 'reputation', target: 875, text: 'Reach 875 Respect' }
  ],
  rewards: { money: 72000, experience: 1480, reputation: 37 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The armory's contents are relocated to three separate secure locations known only to you, Nadia, and Luka. The church basement is left empty save for the icons on the wall, watching in silent judgment." },
    { type: 'dialogue', text: "Phase one complete. My father's teeth have been pulled. Now comes the hard part -- the man himself.", speaker: 'Nadia Kozlova' },
    { type: 'narration', text: "With the armory secured, Dimitri's power base shrinks dramatically. He still commands personal loyalty from some veterans, but without weapons or money, loyalty is just sentiment. The coup enters its final stages." }
  ],
  boss: null
},
{
  id: 'kozlov_ch24',
  title: "Viktor's Choice",
  act: 5,
  actTitle: 'The Coup',
  rankOnComplete: null,
  respectGain: 34,
  narrative: [
    { type: 'scene', text: 'A dimly lit bar, empty save for two men. Viktor sits across from you, nursing a glass of vodka with hands that have broken more bones than either of you can count. His face is a map of scars and hard years.' },
    { type: 'dialogue', text: "I've known Dimitri Kozlov for thirty-eight years. I stood beside him in Chechnya when mortars fell like rain. I held his wife's hand when she died. I watched him build the Bratva from nothing. And now you're asking me to watch it taken from him.", speaker: 'Viktor' },
    { type: 'narration', text: 'This is the conversation that determines everything. Viktor is the bridge between old and new -- without his blessing, the coup will be bathed in the blood of men who respect the old enforcer more than they fear anyone else.' },
    { type: 'dialogue', text: "I'm not blind. I see what Dimitri has become. The man I followed into war is gone -- drowned in a bottle years ago. But asking me to turn on him... you're asking me to cut out my own heart.", speaker: 'Viktor' },
    { type: 'scene', text: 'Viktor stares into his glass for a long time. The bar creaks in the wind. Finally, he looks up with eyes that are wet but steady -- the eyes of a man who has made the hardest decision of his life.' }
  ],
  objectives: [
    { type: 'jobs', target: 85, text: 'Complete 85 jobs (any type)' },
    { type: 'money', target: 200000, text: 'Secure $200,000 for the post-coup transition' },
    { type: 'gang', target: 14, text: 'Command 14 operatives loyal to the new order' },
    { type: 'properties', target: 4, text: 'Control 4 Bratva properties' },
    { type: 'reputation', target: 950, text: 'Reach 950 Respect' }
  ],
  rewards: { money: 86000, experience: 1740, reputation: 44 },
  choice: {
    prompt: 'Viktor is torn between lifetime loyalty to Dimitri and the future of the Bratva. How you handle this moment defines the transition.',
    options: [
      { text: 'Ask Viktor to stand with you -- the Bratva needs him, and Dimitri needs to let go', effect: 'respect', value: 10 },
      { text: 'Tell Viktor to step aside -- no one should have to betray the man they love', effect: 'reputation', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'Viktor finishes his vodka, sets the glass down with a deliberate click, and stands. He extends his scarred hand -- the same hand that held the ceremonial knife at your blood oath.' },
    { type: 'dialogue', text: "I won't raise a hand against Dimitri. But I won't raise one for him either. When it happens, I'll stand down. That's all I can give you. It's more than you deserve.", speaker: 'Viktor' },
    { type: 'narration', text: "Viktor's neutrality is, in practical terms, his blessing. The old enforcer walks out of the bar and into the snow, shoulders bowed under the weight of decades. The last obstacle is cleared. Only the Bear remains." }
  ],
  boss: null
},
{
  id: 'kozlov_ch25',
  title: 'The Bear Falls',
  act: 5,
  actTitle: 'The Coup',
  rankOnComplete: 'don',
  respectGain: 35,
  narrative: [
    { type: 'narration', text: "The night of the coup. Snow falls thick and silent over the city, muffling the world to a whisper. Your crew moves through the streets in black vehicles, converging on Dimitri's stronghold above the butcher shop -- the same room where you first drank vodka with the Bear." },
    { type: 'scene', text: "The building is almost unguarded. Dimitri's personal bodyguards -- the last six men still loyal -- stand at the entrance, but they know what's coming. Some have already been offered safe passage by Nadia. Others simply step aside when they see the size of your force." },
    { type: 'dialogue', text: "My father is upstairs. Alone. He sent the last guards away an hour ago -- I think he knows. Let me go in first. He deserves to hear it from family before... before it's done.", speaker: 'Nadia Kozlova' },
    { type: 'scene', text: "You climb the narrow stairs. The butcher shop below is dark and cold. Above, a single light burns behind a closed door. You push it open. Dimitri Kozlov sits in his chair -- the same steel chair from the fighting cage, brought here years ago as a trophy. He's sober. Clear-eyed for the first time in months. And he's holding a gun." },
    { type: 'dialogue', text: "So. The pup has come to take the den. I knew this day would come -- I've known since the cage, when you wouldn't stay down. Sit. Let's finish this like Bratva.", speaker: 'Dimitri Kozlov' }
  ],
  objectives: [
    { type: 'jobs', target: 90, text: 'Complete 90 jobs (any type)' },
    { type: 'money', target: 250000, text: 'Command $250,000 in total Bratva assets' },
    { type: 'gang', target: 15, text: 'Lead 15 soldiers as the new Pakhan' },
    { type: 'properties', target: 5, text: 'Control 5 properties across all territories' },
    { type: 'reputation', target: 1050, text: 'Reach 1050 Respect' }
  ],
  rewards: { money: 100000, experience: 2000, reputation: 50 },
  choice: {
    prompt: "Dimitri sets the gun on the table between you. The old Bear's eyes are clear, proud, and resigned. He asks you one final question: 'How does this end?'",
    options: [
      { text: 'Exile -- let Dimitri leave the country alive, a broken king sent to die quietly in Moscow', effect: 'reputation', value: 12 },
      { text: "The Bratva way -- Dimitri built this world on blood and iron, and that's how it must end", effect: 'respect', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Dawn breaks over the city, pale light cutting through the falling snow. The butcher shop is quiet. The steel chair sits empty. The era of Dimitri 'The Bear' Kozlov is over." },
    { type: 'dialogue', text: "It's done. The Bratva is yours -- ours. My father built this empire, and now we'll make it something that lasts. Welcome to the throne, Pakhan.", speaker: 'Nadia Kozlova' },
    { type: 'dialogue', text: "I've seen bosses come and go. I've seen the Bratva nearly die twice. You brought it back from the edge. Lead well -- or the next one who sits in that chair will be standing where you stood tonight.", speaker: 'Viktor' },
    { type: 'narration', text: 'You take your seat at the head of the table -- the new Pakhan of the Kozlov Bratva. The brotherhood that forged you in a cage now bows to your command. Iron and ice -- the strength to endure, the cold to make the hard decisions. This is your empire now. This is your winter.' }
  ],
  boss: {
    name: "Dimitri 'The Bear' Kozlov",
    power: 350,
    health: 550,
    gangSize: 6,
    reward: 55000,
    dialogue: {
      intro: 'I built this brotherhood with blood and bone. You want to take it from me? Then come, pup -- show me the Bear was right to let you into the den.',
      victory: "The Bear falls at last. Dimitri Kozlov's reign ends, and a new Pakhan rises from the ashes of the old order.",
      defeat: "Even in decline, the Bear's fury is devastating. Your coup crumbles, and Dimitri's roar echoes through the frozen streets."
    }
  }
}
    ],
  },

  // ======================================================================
  //  CHEN TRIAD  -  "Shadow & Silk"
  // ======================================================================
  chen: {
    storyTitle: 'Shadow & Silk',
    icon: 'Chen Triad',
    color: '#2e8b57',
    tagline: 'A tale of patience, intelligence, and the invisible hand that moves the world.',
    chapters: [{
  id: 'chen_ch1',
  title: 'The Riddle',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 5,
  narrative: [
    { type: 'scene', text: "The teahouse sits above a noodle shop in Chinatown, invisible to anyone who doesn't know to look for the jade dragon carved into the doorframe. Inside, the air is thick with jasmine steam and silence. An old man sits behind a Go board, placing stones with surgical precision." },
    { type: 'narration', text: 'Master Chen Wei does not recruit through violence or intimidation. He recruits through riddles. Those who solve them prove they possess the only currency the Triad values -- intelligence. You were given a sealed envelope containing a single line of classical Chinese poetry and told to find this place before moonrise.' },
    { type: 'dialogue', text: 'You found the teahouse. That means you read the poem correctly. But understanding words and understanding meaning are different rivers flowing to different seas. Sit. Play.', speaker: 'Chen Wei' },
    { type: 'scene', text: 'He gestures to the empty side of the Go board. The stones are already mid-game -- a puzzle left incomplete. You realize this is not a greeting. It is an examination.' },
    { type: 'dialogue', text: 'Every stone placed reveals how a mind works. Aggression, patience, fear, ambition -- the board sees all. Show me who you are.', speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 5, text: 'Complete 5 jobs (any type)' },
    { type: 'money', target: 1000, text: 'Earn $1,000 through discreet operations' }
  ],
  rewards: { money: 500, experience: 50, reputation: 2 },
  choice: {
    prompt: "Chen Wei's Go puzzle has two solutions -- one aggressive, one patient. The aggressive path captures more stones immediately but leaves your position exposed. The patient path sacrifices short-term gains for an unbreakable formation.",
    options: [
      { text: 'Play aggressively -- seize territory now and show decisive strength', effect: 'reputation', value: 3 },
      { text: 'Play patiently -- sacrifice stones to build an invisible fortress', effect: 'respect', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'Chen Wei studies the board for a long moment, his weathered fingers hovering above the stones. Then he nods -- once, almost imperceptibly.' },
    { type: 'dialogue', text: 'Interesting. Most who sit across from me play to win. You played to understand. That is rarer than you know.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'He pours you a cup of oolong tea from a pot that has been steeping since before you arrived, as if he knew exactly when you would earn it. The Triad does not shake hands. This cup is your first thread of silk binding you to something ancient and vast.' }
  ],
  boss: null
},
{
  id: 'chen_ch2',
  title: 'Ghost Protocol',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 6,
  narrative: [
    { type: 'narration', text: "Chen Wei's empire does not move through streets and docks. It moves through fiber optic cables and encrypted channels. The Triad's cyber division operates from a server room hidden beneath a dim sum restaurant, its entrance masked by a walk-in freezer door that requires a biometric scan and a rotating cipher." },
    { type: 'scene', text: "Banks of monitors glow blue-white in the darkness. A young man with sharp eyes and ink-stained fingers sits surrounded by three keyboards, lines of code cascading down his screens like digital waterfalls. He doesn't look up when you enter." },
    { type: 'dialogue', text: "So you're the one who solved the old man's puzzle. Congratulations. Now solve mine. I need someone to run a dead drop through seven proxy servers without leaving a single fingerprint. Think of it as digital silk -- one snag and the whole thread unravels.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: 'Liang slides a laptop across the table. The screen shows a network diagram more complex than a subway map. Your first cyber operation for the Triad begins not with a weapon, but with a keystroke.' }
  ],
  objectives: [
    { type: 'jobs', target: 8, text: 'Complete 8 jobs (any type)' },
    { type: 'money', target: 1500, text: 'Earn $1,500 from digital contracts' },
    { type: 'reputation', target: 10, text: 'Reach 10 Respect' }
  ],
  rewards: { money: 875, experience: 68, reputation: 3 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The last proxy handshake completes without a trace. Liang leans back in his chair for the first time, cracking his knuckles.' },
    { type: 'dialogue', text: 'Clean run. No artifacts, no logs, no ghosts -- except me. You might actually be useful.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "A notification pings on Liang's encrypted channel. Chen Wei has been watching the operation remotely. The message contains a single character -- the Chinese symbol for 'continue.' In the Triad, brevity is the highest praise." }
  ],
  boss: null
},
{
  id: 'chen_ch3',
  title: 'The Tea Ceremony',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 8,
  narrative: [
    { type: 'scene', text: "The room is bare except for a low table, a clay teapot, and two porcelain cups so thin you can see the shadow of your fingers through them. The walls are rice paper screens painted with mountain landscapes. Chen Wei kneels on a silk cushion, his movements deliberate as a calligrapher's brush." },
    { type: 'dialogue', text: 'The Triad was born six hundred years ago in a monastery, by monks who understood that the most dangerous weapon is not the sword -- it is the network. Five monks. Five fingers of one invisible hand. We are the heirs of that hand.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'As he speaks, he performs the gongfu tea ceremony with mechanical grace -- warming the cups, rinsing the leaves, pouring in a continuous arc that never breaks. Each step is a lesson. Each pause is deliberate. The history of the Chen Triad unfolds like silk from a spool: the old trade routes, the opium wars, the digital migration, the philosophy that information is the only empire that cannot be burned.' },
    { type: 'dialogue', text: "Most criminal organizations sell products. We sell something far more valuable -- we sell certainty. When a corporation needs to know what its rival will do tomorrow, they come to us. When a government needs a secret buried, they come to us. We are the silk thread that holds the world's seams together.", speaker: 'Chen Wei' },
    { type: 'scene', text: 'He places a cup before you. The tea is pale gold, almost translucent. Drinking it means accepting the weight of six centuries of shadow.' }
  ],
  objectives: [
    { type: 'jobs', target: 12, text: 'Complete 12 jobs (any type)' },
    { type: 'money', target: 2500, text: 'Accumulate $2,500 in Triad earnings' },
    { type: 'reputation', target: 20, text: 'Reach 20 Respect' }
  ],
  rewards: { money: 1250, experience: 85, reputation: 3 },
  choice: {
    prompt: 'Chen Wei reveals that a mid-level Triad member has been skimming profits from the digital marketplace. He asks how you would handle it.',
    options: [
      { text: 'Expose him publicly at the next council meeting -- transparency breeds loyalty', effect: 'reputation', value: 4 },
      { text: 'Confront him privately and offer a chance to repay -- mercy builds deeper allegiance', effect: 'respect', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The tea ceremony concludes in silence. Chen Wei collects the cups with the same precision he used to fill them, each movement a closing parenthesis.' },
    { type: 'dialogue', text: 'You listened without interrupting. In the West, they mistake silence for ignorance. Here, we know it is the sound of a mind at work.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'As you leave the teahouse, you notice details you missed before -- the security camera disguised as a lantern, the fiber optic cable woven into the decorative trim. The Triad hides in plain sight, and now you are learning to see the threads.' }
  ],
  boss: null
},
{
  id: 'chen_ch4',
  title: 'Digital Footprints',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 9,
  narrative: [
    { type: 'narration', text: "The Triad's greatest vulnerability is not a rival gang or law enforcement -- it is data. Every digital transaction leaves a ghost, a shadow impression in server logs and metadata. Liang has identified seventeen traces that could lead investigators to the Triad's financial infrastructure. They must be erased -- not deleted, but overwritten with plausible alternative histories." },
    { type: 'dialogue', text: "Deletion is amateur hour. Any forensic analyst can recover deleted data. What we do is rewrite reality. Every trace gets replaced with a convincing fake -- different timestamps, different IP addresses, different transaction amounts. When they look, they'll find a story. Just not the real one.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: 'You work through the night in the server room beneath the dim sum restaurant, the glow of monitors painting your face in shifting blues. Each trace is a puzzle -- find the original, construct the replacement, deploy it without triggering intrusion detection systems.' },
    { type: 'dialogue', text: "Careful with that banking node. It's triple-encrypted with a honeypot trap. Touch it wrong and we'll have Interpol knocking before sunrise.", speaker: "Liang 'Ghost' Zhao" }
  ],
  objectives: [
    { type: 'jobs', target: 15, text: 'Complete 15 jobs (any type)' },
    { type: 'money', target: 3500, text: 'Earn $3,500 from cyber-security contracts' },
    { type: 'reputation', target: 35, text: 'Reach 35 Respect' }
  ],
  rewards: { money: 1625, experience: 103, reputation: 4 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The last trace flickers and dies, replaced by a perfectly fabricated history of legitimate wire transfers between shell companies in Singapore and Zurich. The Triad's digital footprint is now a ghost story -- present everywhere, real nowhere." },
    { type: 'dialogue', text: 'Seventeen traces. Zero artifacts. You work clean. The old man was right about you.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: 'Liang sends the completion report through a one-time encrypted channel that self-destructs after reading. In the Chen Triad, even success leaves no evidence.' }
  ],
  boss: null
},
{
  id: 'chen_ch5',
  title: 'The Silk Thread',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 10,
  narrative: [
    { type: 'narration', text: "The old Silk Road carried porcelain, spices, and secrets across continents. The new one carries data, cryptocurrency, and influence through the dark web. Chen Wei has tasked you with establishing the Triad's first fully autonomous digital marketplace -- a hidden bazaar where information is traded like jade." },
    { type: 'dialogue', text: 'The marketplace must be self-sustaining. Escrow systems, reputation algorithms, encrypted communication channels. Think of it as a tea house that exists only in the space between servers.', speaker: 'Chen Wei' },
    { type: 'scene', text: 'You and Liang spend weeks architecting the system. The marketplace operates on a custom blockchain that Liang designed -- each transaction verified by a network of Triad-controlled nodes scattered across twelve countries. The interface is elegant, minimalist, styled after a traditional Chinese scroll painting.' },
    { type: 'dialogue', text: "Beautiful. It's like a digital Song Dynasty marketplace. The aesthetic isn't vanity -- it's branding. Our clients expect sophistication. Give them a crude forum and they'll trust us with crude work. Give them art and they'll trust us with empires.", speaker: "Liang 'Ghost' Zhao" }
  ],
  objectives: [
    { type: 'jobs', target: 18, text: 'Complete 18 jobs (any type)' },
    { type: 'money', target: 5000, text: 'Generate $5,000 in marketplace revenue' },
    { type: 'reputation', target: 50, text: 'Reach 50 Respect' }
  ],
  rewards: { money: 2000, experience: 120, reputation: 4 },
  choice: {
    prompt: 'A powerful client wants to use the marketplace to sell stolen medical research data. The sale would be enormously profitable but could endanger lives if the research is suppressed.',
    options: [
      { text: 'Allow the sale -- the Triad deals in information, not morality', effect: 'money', value: 2000 },
      { text: 'Refuse and offer to sell the data back to the original researchers -- build a reputation for principled dealing', effect: 'respect', value: 7 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The marketplace goes live at midnight, Eastern Standard Time. Within six hours, forty-seven verified buyers have registered, and the first three transactions have completed through escrow without incident.' },
    { type: 'dialogue', text: 'The silk thread is woven. Now it must be maintained -- gently, invisibly, like all things of true value.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Chen Wei's eyes carry something you haven't seen before -- not pride exactly, but recognition. You have built something that will outlast any shipment, any territory, any single life. The Triad's future is digital, and you helped write its first page." }
  ],
  boss: null
},
{
  id: 'chen_ch6',
  title: 'The Oracle',
  act: 1,
  actTitle: 'The Test',
  rankOnComplete: null,
  respectGain: 11,
  narrative: [
    { type: 'scene', text: "Chen Wei's private study is a room you did not know existed -- behind a sliding bookcase in the teahouse, down a narrow corridor lit by paper lanterns. The walls are covered floor to ceiling with photographs, newspaper clippings, corporate org charts, and red string connecting them like a spider's web made visible." },
    { type: 'dialogue', text: "This is my life's work. Forty years of connections. Every politician we have assisted, every corporation that owes us a debt, every law enforcement agent who looks the other way. This network -- not money, not weapons -- this is the true power of the Chen Triad.", speaker: 'Chen Wei' },
    { type: 'narration', text: 'You step closer and recognize faces -- senators, CEOs, a Supreme Court justice, three foreign ambassadors. The red strings trace relationships of debt, blackmail, favor, and blood. Chen Wei has built an invisible empire that stretches into every institution of power.' },
    { type: 'dialogue', text: 'I show you this not to boast, but to teach. This network took four decades to construct. It can be destroyed in four minutes by a single careless move. Every thread must be maintained with patience. Do you understand the weight of what I am offering you?', speaker: 'Chen Wei' },
    { type: 'scene', text: 'He pulls a jade pendant from a silk-lined box -- a small dragon coiled around a Go stone. It is the symbol of the Inner Circle. He does not give it to you yet. He simply lets you see it.' }
  ],
  objectives: [
    { type: 'jobs', target: 22, text: 'Complete 22 jobs (any type)' },
    { type: 'money', target: 7000, text: 'Accumulate $7,000 in operational funds' },
    { type: 'reputation', target: 75, text: 'Reach 75 Respect' }
  ],
  rewards: { money: 2800, experience: 140, reputation: 5 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "Chen Wei slides the bookcase closed behind you as you leave. The corridor disappears as if it never existed. The teahouse looks exactly as it always has -- an old man's quiet retreat above a noodle shop." },
    { type: 'dialogue', text: 'You have seen the web. Now you must decide if you wish to be a fly caught in it, or a spider who helps weave it.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Walking through Chinatown afterward, the world looks different. Every storefront, every passing businessman, every security camera could be a node in Chen Wei's network. The invisible empire is everywhere, and you are now one of the few who can see its outline." },
    { type: 'narration', text: 'Your phone buzzes -- a message from Liang containing a single encrypted coordinate. The next phase of your initiation begins tonight.' }
  ],
  boss: null
},
{
  id: 'chen_ch7',
  title: 'The Marking Ceremony',
  act: 2,
  actTitle: "The Dragon's Mark",
  rankOnComplete: 'soldier',
  respectGain: 13,
  narrative: [
    { type: 'scene', text: 'The ceremony takes place in a basement temple that predates the building above it by a century. Incense smoke coils between stone pillars carved with coiling dragons. Twelve senior Triad members stand in a circle, each holding a lit red candle. Chen Wei presides from a raised platform, flanked by Liang and a woman you have not seen before -- sharp-featured, still as a blade in its sheath.' },
    { type: 'dialogue', text: 'You have proven your mind. Now the Triad asks for your oath. This is not a contract -- it is a binding of spirit. The dragon does not release what it holds.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'The ceremony follows rituals unchanged for centuries. You drink rice wine mixed with your own blood. You recite the Thirty-Six Oaths in Cantonese, each one a promise heavier than the last. Betrayal of the Triad is answered with death -- not swift, but thorough, erasing not just life but legacy.' },
    { type: 'dialogue', text: "Welcome to the Dragon's body. I am Mei Lin. I handle the things that cannot be handled with keyboards.", speaker: 'Mei Lin' },
    { type: 'scene', text: 'Chen Wei places the jade pendant around your neck -- the dragon coiled around the Go stone. It is warm from his hands, as if it carries the heat of every oath that has been sworn before yours. You are now a soldier of the Chen Triad.' }
  ],
  objectives: [
    { type: 'jobs', target: 25, text: 'Complete 25 jobs (any type)' },
    { type: 'money', target: 9000, text: 'Demonstrate $9,000 in earned revenue' },
    { type: 'reputation', target: 100, text: 'Reach 100 Respect' }
  ],
  rewards: { money: 3600, experience: 160, reputation: 6 },
  choice: {
    prompt: 'During the oath ceremony, Mei Lin tests you with a question: a Triad soldier discovers his brother is an informant. What does he do?',
    options: [
      { text: 'Report it to the council immediately -- loyalty to the Triad supersedes blood', effect: 'reputation', value: 5 },
      { text: 'Confront the brother privately first -- give him one chance to confess and disappear', effect: 'respect', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The candles are extinguished one by one. The senior members file out in silence, their faces unreadable. Chen Wei remains on the platform, studying you.' },
    { type: 'dialogue', text: 'The pendant marks you as one of us. But remember -- jade is beautiful because it endures pressure without shattering. Be jade.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'As you leave the temple, Liang falls into step beside you. His usual detachment has softened -- you are no longer a tool to be used, but a colleague to be trusted. The Triad has welcomed you into its body, and now the real work begins.' }
  ],
  boss: null
},
{
  id: 'chen_ch8',
  title: 'Building the Network',
  act: 2,
  actTitle: "The Dragon's Mark",
  rankOnComplete: null,
  respectGain: 14,
  narrative: [
    { type: 'narration', text: "As a soldier of the Chen Triad, your first mandate is expansion -- not of territory, but of capability. Chen Wei's philosophy is simple: a network of ten brilliant minds is worth more than an army of a thousand fists. Your task is to identify, recruit, and integrate digital specialists into the Triad's cyber infrastructure." },
    { type: 'dialogue', text: 'I need people who think in code the way poets think in verse. Penetration testers, cryptographers, social engineers. Find them in the universities, the hackathons, the dark web forums. Bring them to me and I will give them purpose.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "Your first recruit is a nineteen-year-old cryptography prodigy expelled from MIT for hacking the university's financial systems as a 'proof of concept.' Your second is a former NSA analyst disillusioned by bureaucracy. Your third is a social engineer who once convinced a bank manager to wire six million dollars to a charity that didn't exist." },
    { type: 'dialogue', text: 'Quality over quantity. Always. One exceptional mind is worth a hundred keyboards.', speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 28, text: 'Complete 28 jobs (any type)' },
    { type: 'money', target: 12000, text: 'Invest $12,000 in network infrastructure' },
    { type: 'reputation', target: 130, text: 'Reach 130 Respect' },
    { type: 'gang', target: 2, text: 'Recruit 2 specialists to your division' }
  ],
  rewards: { money: 4400, experience: 180, reputation: 6 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The server room has doubled in size. New terminals hum alongside the originals, each one manned by a specialist who chose the Triad over the legitimate world. The digital marketplace processes three times its original volume.' },
    { type: 'dialogue', text: 'You have a gift for finding talent. The network grows stronger. But remember -- every new node is also a potential point of failure. Trust, but verify. Always.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "Mei Lin observes the expansion with an expression you cannot read. She operates in a different world -- physical, visceral, dangerous. But even she cannot deny that the Triad's digital arm is becoming its most powerful limb." }
  ],
  boss: null
},
{
  id: 'chen_ch9',
  title: 'The Invisible Hand',
  act: 2,
  actTitle: "The Dragon's Mark",
  rankOnComplete: null,
  respectGain: 15,
  narrative: [
    { type: 'narration', text: "Chen Wei's masterpiece is not crime -- it is influence. A Fortune 500 pharmaceutical company is about to merge with a biotech startup, a deal worth twelve billion dollars. The Triad has been contracted by an anonymous client to ensure the merger goes through, despite regulatory opposition. The fee is extraordinary. The method must be invisible." },
    { type: 'dialogue', text: 'We do not bribe. We do not threaten. We simply ensure that the right information reaches the right people at the right time. A leaked email here, a buried report there. The invisible hand guides the market.', speaker: 'Chen Wei' },
    { type: 'scene', text: 'You orchestrate a campaign of information warfare -- planting favorable analyst reports, suppressing a damaging clinical trial study, engineering a social media groundswell of public support. Every move is untraceable, every outcome appears organic.' },
    { type: 'dialogue', text: 'The SEC investigator looking into the merger has a gambling problem. Nothing illegal yet, but one well-timed notification to his supervisor would redirect his attention. Shall I?', speaker: "Liang 'Ghost' Zhao" }
  ],
  objectives: [
    { type: 'jobs', target: 32, text: 'Complete 32 jobs (any type)' },
    { type: 'money', target: 15000, text: 'Generate $15,000 in corporate espionage fees' },
    { type: 'reputation', target: 175, text: 'Reach 175 Respect' },
    { type: 'gang', target: 3, text: 'Expand your team to 3 operatives' }
  ],
  rewards: { money: 5200, experience: 200, reputation: 7 },
  choice: {
    prompt: "Liang can neutralize the SEC investigator by exposing his gambling, but it would destroy an innocent man's career. Alternatively, you can manipulate the investigation timeline through bureaucratic channels -- slower but bloodless.",
    options: [
      { text: "Expose the investigator -- efficiency matters more than one man's career", effect: 'reputation', value: 5 },
      { text: 'Manipulate the timeline -- the Triad should not create unnecessary victims', effect: 'respect', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The merger is announced on CNBC at 9:00 AM Eastern. The stock price surges. Regulatory approval sails through committee without a single dissenting vote. No one suspects the invisible hand that guided every piece into place.' },
    { type: 'dialogue', text: 'Twelve billion dollars changed hands today because of silk threads pulled in the dark. This is the power of information. This is what we are.', speaker: 'Chen Wei' },
    { type: 'narration', text: "The anonymous client's payment arrives in cryptocurrency, fractured across forty-seven wallets and laundered through nine exchanges before settling into the Triad's coffers. Another flawless operation. Another invisible victory." }
  ],
  boss: null
},
{
  id: 'chen_ch10',
  title: 'Phantom Menace',
  act: 2,
  actTitle: "The Dragon's Mark",
  rankOnComplete: null,
  respectGain: 16,
  narrative: [
    { type: 'scene', text: "The alarms begin at 3:47 AM -- soft chimes in Liang's monitoring systems that quickly escalate to screaming red alerts. Someone is inside the Triad's network. Not probing from outside, but already past every firewall, every encryption layer, moving through the infrastructure like smoke through a keyhole." },
    { type: 'dialogue', text: "We've been breached. Deep. Whoever this is, they're not law enforcement -- too elegant, too fast. This is a professional. They're targeting the marketplace escrow wallets. If they crack those, we lose everything.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "The attacker calls themselves 'Phantom' -- a handle whispered in dark web circles with a mix of respect and terror. They are the only hacker who has ever breached a Triad system and lived. Now they are doing it again, and this time they intend to burn everything to the ground." },
    { type: 'dialogue', text: 'Phantom once worked for us, years ago, before my time. They left under circumstances Chen Wei refuses to discuss. This is personal.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "The counter-assault begins. You and Liang work side by side, tracing Phantom's intrusion vectors while simultaneously hardening the systems they haven't reached yet. It is a chess match played at the speed of light, each move countered in milliseconds." }
  ],
  objectives: [
    { type: 'jobs', target: 35, text: 'Complete 35 jobs (any type)' },
    { type: 'money', target: 18000, text: 'Protect $18,000 in Triad digital assets' },
    { type: 'reputation', target: 200, text: 'Reach 200 Respect' },
    { type: 'gang', target: 3, text: 'Deploy 3 specialists in the counter-assault' }
  ],
  rewards: { money: 6000, experience: 220, reputation: 8 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The final trace locks onto Phantom's true location -- a server farm in Shenzhen, routed through a maze of mirrors but ultimately pinned down by a zero-day exploit Liang has been saving for exactly this moment." },
    { type: 'dialogue', text: 'Caught you, Phantom. Your silk unraveled.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "Phantom's systems go dark. The Triad's network stabilizes, the escrow wallets secured, the breach sealed. But the cost was significant -- three shell companies exposed, two encrypted channels burned. The invisible empire has scars now." },
    { type: 'dialogue', text: 'Phantom was once my student, as you are now. Brilliance without discipline becomes destruction. Remember that.', speaker: 'Chen Wei' }
  ],
  boss: { name: 'Phantom', power: 100, health: 180, gangSize: 3, reward: 8000, dialogue: { intro: "You think your firewalls can hold me? I built half of them. I know every backdoor, every weakness. The old man's empire is a house of cards and I am the wind.", victory: "Impossible... my algorithms were flawless. You didn't just defend -- you adapted. Who taught you to think like that?", defeat: 'The digital world bows to no master. Phantom will return, and next time, there will be no network left to save.' } }
},
{
  id: 'chen_ch11',
  title: 'The Inner Sanctum',
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: null,
  respectGain: 18,
  narrative: [
    { type: 'scene', text: "The invitation arrives not by phone or email, but by a hand-delivered scroll sealed with red wax bearing the imprint of the coiled dragon. Inside, a single line in classical calligraphy: 'The Sanctum opens its doors to those who have earned the silence within.'" },
    { type: 'narration', text: 'The ruling council of the Chen Triad -- the Inner Sanctum -- meets in a different location each time, chosen by a rotating algorithm that Chen Wei alone controls. Tonight it convenes in the private dining room of a Michelin-starred restaurant whose owner has owed the Triad a debt for thirty years. Seven chairs around a circular table. Six are occupied by the most powerful figures in the organization. The seventh has been empty for two years.' },
    { type: 'dialogue', text: 'You defended the network against Phantom. You built the marketplace. You have earned the right to observe. Sit in the seventh chair and listen. Speak only when asked.', speaker: 'Chen Wei' },
    { type: 'scene', text: 'The council discusses operations spanning four continents -- a shipping route through the South China Sea, a real estate portfolio in Vancouver, a political campaign in Southeast Asia. Mei Lin reports on a physical operation in Hong Kong with clinical precision. Liang presents the digital infrastructure review. Every word is measured, every decision unanimous.' }
  ],
  objectives: [
    { type: 'jobs', target: 38, text: 'Complete 38 jobs (any type)' },
    { type: 'money', target: 22000, text: 'Manage $22,000 in council-directed funds' },
    { type: 'reputation', target: 250, text: 'Reach 250 Respect' },
    { type: 'gang', target: 4, text: 'Command a team of 4 specialists' }
  ],
  rewards: { money: 7200, experience: 256, reputation: 9 },
  choice: {
    prompt: "During the council meeting, a dispute arises over expanding into weapons trafficking. Mei Lin argues it's necessary for muscle. Liang argues it attracts unwanted attention. Chen Wei asks your opinion.",
    options: [
      { text: 'Side with Mei Lin -- the Triad needs physical deterrence as well as digital power', effect: 'reputation', value: 6 },
      { text: 'Side with Liang -- weapons trafficking is noise, and the Triad thrives in silence', effect: 'respect', value: 9 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The meeting concludes at midnight. The council members depart one by one through different exits, each leaving exactly three minutes apart. Chen Wei remains seated, pouring himself a final cup of tea.' },
    { type: 'dialogue', text: 'You listened well tonight. Most newcomers try to impress the council with bold words. You impressed them with deliberate silence. The Sanctum will remember.', speaker: 'Chen Wei' },
    { type: 'narration', text: "As you exit through the kitchen -- your assigned departure route -- you catch Mei Lin's eye. She gives you the faintest nod. In her world, that is an avalanche of approval." }
  ],
  boss: null
},
{
  id: 'chen_ch12',
  title: 'Corporate Shadows',
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: null,
  respectGain: 19,
  narrative: [
    { type: 'narration', text: "The Triad's next target is Meridian Technologies -- a Fortune 500 defense contractor with classified government contracts worth billions. Chen Wei doesn't want to rob them. He wants to own them, invisibly, from the inside. Your mission: infiltrate their digital infrastructure, map their organizational power structure, and identify the pressure points that will let the Triad control Meridian without anyone -- including Meridian -- ever knowing." },
    { type: 'dialogue', text: "Meridian's cybersecurity is military-grade. They have former NSA on staff. A direct hack would be suicide. Instead, we go through the humans. Social engineering. Find me the weak link in their chain.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "Weeks of surveillance reveal the target: Meridian's CFO has a secret -- a second family in Taipei, funded through offshore accounts that the board doesn't know about. It is the perfect leverage point, delicate as a spider's web and just as strong." },
    { type: 'dialogue', text: "We don't blackmail. Blackmail is crude and creates enemies. We offer solutions. We help him consolidate his finances through our channels, and in return, he becomes our eyes inside Meridian. He will not feel controlled -- he will feel grateful.", speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 40, text: 'Complete 40 jobs (any type)' },
    { type: 'money', target: 26000, text: 'Channel $26,000 through corporate fronts' },
    { type: 'reputation', target: 300, text: 'Reach 300 Respect' },
    { type: 'gang', target: 5, text: 'Maintain a team of 5 operatives' }
  ],
  rewards: { money: 8400, experience: 292, reputation: 10 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The CFO signs the arrangement over dinner at a private club, believing he has found a sophisticated financial advisor. The Triad now has a direct line into one of America's largest defense contractors -- its board meetings, its classified projects, its strategic vulnerabilities." },
    { type: 'dialogue', text: "One thread, properly placed, can unravel an entire tapestry. Meridian is ours now. They simply don't know it yet.", speaker: 'Chen Wei' },
    { type: 'narration', text: 'Mei Lin reviews the intelligence haul with barely concealed admiration. Physical operatives spend months planning a single break-in. You have achieved permanent access with nothing more than patience and a dinner reservation.' }
  ],
  boss: null
},
{
  id: 'chen_ch13',
  title: 'The Jade Seat',
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: 'capo',
  respectGain: 20,
  narrative: [
    { type: 'scene', text: 'The Inner Sanctum convenes again, this time in a monastery in the hills above the city -- a Buddhist retreat that the Triad has funded for decades. The stone walls echo with chanted sutras from the floor above. Below, the council gathers around a jade table so old its surface has been worn smooth by generations of hands.' },
    { type: 'dialogue', text: "The seventh chair is no longer a guest's chair. The council has voted. You are offered a permanent seat -- a voice in the decisions that shape our empire. This is the rank of Capo in the old language, though we prefer a simpler word: architect.", speaker: 'Chen Wei' },
    { type: 'narration', text: "Mei Lin places a new pendant before you -- larger than the first, the jade carved into the shape of a dragon's claw gripping a pearl. It signifies not just membership, but authority. As a Capo, you command your own division and answer only to the Sanctum itself." },
    { type: 'dialogue', text: "Congratulations. Don't let it soften you. The higher you climb, the more people want to see you fall.", speaker: 'Mei Lin' }
  ],
  objectives: [
    { type: 'jobs', target: 43, text: 'Complete 43 jobs (any type)' },
    { type: 'money', target: 30000, text: 'Manage $30,000 in Triad resources' },
    { type: 'reputation', target: 350, text: 'Reach 350 Respect' },
    { type: 'gang', target: 5, text: 'Command 5 operatives under your authority' },
    { type: 'properties', target: 1, text: 'Establish 1 operational front property' }
  ],
  rewards: { money: 9600, experience: 328, reputation: 10 },
  choice: {
    prompt: "As a new Capo, you must choose your division's primary focus. This will define your role in the Triad's future.",
    options: [
      { text: 'Focus on digital intelligence -- expand the cyber empire and information brokerage', effect: 'respect', value: 10 },
      { text: "Focus on corporate infiltration -- become the Triad's hand inside legitimate power structures", effect: 'reputation', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The monastery bells ring as the ceremony concludes. The monks above continue their chanting, oblivious to the empire being shaped beneath their feet. Or perhaps not oblivious -- in the Chen Triad, nothing is ever quite what it seems.' },
    { type: 'dialogue', text: 'An architect does not lay bricks. An architect dreams structures into existence and trusts the builders to follow the blueprint. Dream well.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'You leave the monastery as a Capo of the Chen Triad -- one of seven voices that direct an invisible empire spanning continents. The jade pendant is heavier than it looks, weighted with responsibility and centuries of tradition.' }
  ],
  boss: null
},
{
  id: 'chen_ch14',
  title: 'The New Silk Road',
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: null,
  respectGain: 21,
  narrative: [
    { type: 'narration', text: "With a seat on the council and your own division, Chen Wei tasks you with the Triad's most ambitious project: the New Silk Road. Not a single marketplace, but a global network of interconnected dark web platforms spanning every continent -- each one specialized, each one feeding intelligence to the central hub. Information from Tokyo to Toronto, flowing through the Triad's invisible channels like water through ancient aqueducts." },
    { type: 'dialogue', text: 'The original Silk Road connected East to West. Ours will connect everything to everything. We will become the nervous system of the shadow economy.', speaker: 'Chen Wei' },
    { type: 'scene', text: "You establish nodes in Singapore, Zurich, Sï¿½o Paulo, and Lagos -- each one staffed by local operatives recruited through the Triad's expanding network. The platforms are tailored to regional markets: financial intelligence in Zurich, technology secrets in Singapore, resource data in Lagos, political intelligence in Sï¿½o Paulo." },
    { type: 'dialogue', text: 'The architecture is elegant. But elegance attracts admirers and enemies in equal measure. Security protocols must scale with the network. Every new node is a door, and every door can be kicked in.', speaker: "Liang 'Ghost' Zhao" }
  ],
  objectives: [
    { type: 'jobs', target: 46, text: 'Complete 46 jobs (any type)' },
    { type: 'money', target: 35000, text: 'Invest $35,000 in global infrastructure' },
    { type: 'reputation', target: 400, text: 'Reach 400 Respect' },
    { type: 'gang', target: 6, text: 'Deploy 6 operatives across international nodes' },
    { type: 'properties', target: 1, text: 'Maintain 1 international front operation' }
  ],
  rewards: { money: 10800, experience: 364, reputation: 11 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The New Silk Road goes live across all four continental nodes simultaneously. Data flows between them in encrypted streams, each transaction verified by the Triad's proprietary blockchain. Within the first month, revenue exceeds projections by two hundred percent." },
    { type: 'dialogue', text: 'Four continents. One heartbeat. You have done what took the ancient traders a lifetime -- connected the world through invisible threads of silk and shadow.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'The global network hums with activity. Intelligence flows like a river with many tributaries. The Chen Triad is no longer a local organization -- it is a global architecture of shadow, and you are one of its chief architects.' }
  ],
  boss: null
},
{
  id: 'chen_ch15',
  title: "Dragon's Eye",
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: null,
  respectGain: 23,
  narrative: [
    { type: 'scene', text: "In a private gallery of the Metropolitan Museum of Art sits the Dragon's Eye -- a jade artifact from the Ming Dynasty, a fist-sized sphere of translucent imperial jade carved to resemble a dragon's pupil. It is priceless. It is also, according to Chen Wei, rightfully the property of the Chen family, stolen by British soldiers during the Opium Wars and sold to an American collector in 1923." },
    { type: 'dialogue', text: "The Dragon's Eye was carved by my ancestor, Chen Baozhong, in 1436. It has been in foreign hands for over a century. I do not wish to steal it. I wish to bring it home. There is a difference.", speaker: 'Chen Wei' },
    { type: 'narration', text: "The heist -- Chen Wei refuses to call it that -- requires months of planning. Liang maps the museum's digital security: motion sensors, pressure plates, camera networks, silent alarms linked directly to the NYPD. Mei Lin handles physical reconnaissance, memorizing guard rotations and structural blueprints. Your role: coordinate the entire operation." },
    { type: 'dialogue', text: "The museum's head of security is Captain Harris. Ex-military, obsessive, paranoid. He runs that building like a fortress. The digital systems are one layer -- Harris is another layer entirely, and he doesn't have an off switch.", speaker: 'Mei Lin' },
    { type: 'scene', text: 'The planning sessions run deep into the night, the teahouse table covered in blueprints, network diagrams, and timeline charts. Every contingency must be mapped. Every second of the operation choreographed like a dance.' }
  ],
  objectives: [
    { type: 'jobs', target: 50, text: 'Complete 50 jobs (any type)' },
    { type: 'money', target: 40000, text: 'Invest $40,000 in heist preparation' },
    { type: 'reputation', target: 450, text: 'Reach 450 Respect' },
    { type: 'gang', target: 7, text: 'Assemble a 7-person heist team' },
    { type: 'properties', target: 2, text: 'Secure 2 staging properties near the museum' }
  ],
  rewards: { money: 12000, experience: 400, reputation: 12 },
  choice: {
    prompt: "The heist plan has two approaches. Liang's digital approach disables security remotely but leaves electronic traces that could be analyzed later. Mei Lin's physical approach uses a blackout and human infiltration -- riskier in the moment but leaves no digital evidence.",
    options: [
      { text: "Go with Liang's digital approach -- precision and speed minimize exposure time", effect: 'respect', value: 10 },
      { text: "Go with Mei Lin's physical approach -- eliminate all digital traces entirely", effect: 'reputation', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The plan is complete. Every team member has rehearsed their role dozens of times. The timing is calibrated to the second. Liang has prepared his digital tools. Mei Lin has prepared her physical ones. Everything converges on one night -- the annual museum gala, when security is stretched thin by VIP guests.' },
    { type: 'dialogue', text: 'In Go, the endgame is called yose. Every move counts double because the board is full. We are entering yose now. No mistakes.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Tomorrow night, the Dragon's Eye returns home after a century in exile. Or tomorrow night, the Chen Triad faces its greatest exposure risk. There is no middle ground." }
  ],
  boss: null
},
{
  id: 'chen_ch16',
  title: 'The Heist',
  act: 3,
  actTitle: 'The Inner Sanctum',
  rankOnComplete: null,
  respectGain: 24,
  narrative: [
    { type: 'scene', text: 'The museum gala is in full swing -- crystal chandeliers, champagne towers, guests in black tie circling through galleries of ancient treasures. Above them, the security infrastructure hums invisibly: three hundred cameras, eighty motion sensors, a dozen armed guards, all coordinated by Captain Harris from a command center that looks like a small Pentagon.' },
    { type: 'narration', text: "At precisely 9:47 PM, the operation begins. Liang initiates the first phase from a van parked three blocks away -- a cascading series of micro-disruptions to the museum's network that cause brief glitches in non-critical systems. Nothing alarming enough to trigger lockdown, but enough to occupy the tech team's attention." },
    { type: 'dialogue', text: 'Phase one is live. Camera feeds on the east wing are looping. You have an eleven-minute window. Move.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "Inside the museum, your team moves through service corridors and maintenance shafts mapped months in advance. Mei Lin leads the physical team with terrifying efficiency, bypassing pressure plates with dancer's precision. You coordinate from an earpiece, monitoring Liang's feeds and Captain Harris's movements simultaneously." },
    { type: 'dialogue', text: "Harris is moving toward the east wing. He's checking cameras manually -- paranoid bastard. You have six minutes, not eleven. Adapt.", speaker: "Liang 'Ghost' Zhao" }
  ],
  objectives: [
    { type: 'jobs', target: 53, text: 'Complete 53 jobs (any type)' },
    { type: 'money', target: 50000, text: 'Secure $50,000 worth of operational assets' },
    { type: 'reputation', target: 475, text: 'Reach 475 Respect' },
    { type: 'gang', target: 7, text: 'Coordinate your 7-person team flawlessly' },
    { type: 'properties', target: 2, text: 'Maintain 2 safe houses for extraction' },
    { type: 'reputation', target: 500, text: 'Reach 500 Respect' }
  ],
  rewards: { money: 15600, experience: 460, reputation: 13 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The Dragon's Eye rests in a climate-controlled case lined with silk -- the same silk that once wrapped it in the Chen family temple five hundred years ago. Chen Wei holds it with both hands, his eyes reflecting the jade's deep green luminescence. For the first time since you've known him, the old master's composure cracks -- just for a moment -- and you see something raw beneath: grief, relief, and a vindication that spans centuries." },
    { type: 'dialogue', text: 'Welcome home.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Captain Harris will discover the loss at the 6:00 AM security sweep. By then, the Dragon's Eye will be in a vault beneath the teahouse, and every trace of the operation will have been scrubbed from existence. The Triad has reclaimed its heritage without a single drop of blood." },
    { type: 'dialogue', text: "The old man is actually smiling. I've never seen that before. You did something none of us could.", speaker: "Liang 'Ghost' Zhao" }
  ],
  boss: { name: 'Captain Harris', power: 150, health: 250, gangSize: 4, reward: 15000, dialogue: { intro: "I've spent thirty years protecting this museum. I know every shadow, every blind spot, every trick in the book. You think you can walk in here and take what you want? My building. My rules. Nobody gets past me.", victory: "How... the cameras, the sensors, the guards -- I designed that system myself. It was perfect. Whoever you are, you didn't just beat my security. You made it invisible.", defeat: "This isn't over. I will find every fingerprint, every fiber, every digital ghost you left behind. Nobody steals from my museum and disappears." } }
},
{
  id: 'chen_ch17',
  title: 'The Long Game',
  act: 4,
  actTitle: 'The Long Game',
  rankOnComplete: null,
  respectGain: 25,
  narrative: [
    { type: 'scene', text: 'Chen Wei summons you to his private study -- the room behind the bookcase, the web of red strings and photographs. But something has changed. New connections have been added, dozens of them, all converging on a single node at the center of the web: a corporation called Jade Mountain Holdings.' },
    { type: 'dialogue', text: 'I have been building toward this moment for forty years. Jade Mountain is a shell -- layers within layers, companies owning companies owning companies, all leading back to one purpose. When I am finished, the Chen Triad will not merely operate in the shadows of legitimate business. We will become the legitimate business. The shadows will disappear because there will be nothing left to hide.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'The scope is staggering. Chen Wei has been acquiring controlling interests in companies across every sector -- technology, real estate, shipping, banking -- through a network of proxies so complex that no forensic accountant could trace the ownership chain. Jade Mountain Holdings is the capstone, the final structure that will unify everything under a single, seemingly legitimate corporate umbrella.' },
    { type: 'dialogue', text: 'This is my legacy. The Triad reborn as a legitimate empire. No more hiding, no more running. The world will see a powerful corporation. Only we will know the dragon that sleeps inside.', speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 56, text: 'Complete 56 jobs (any type)' },
    { type: 'money', target: 60000, text: 'Manage $60,000 in Jade Mountain transactions' },
    { type: 'reputation', target: 525, text: 'Reach 525 Respect' },
    { type: 'gang', target: 8, text: 'Deploy 8 operatives in corporate positions' },
    { type: 'properties', target: 2, text: 'Control 2 Jade Mountain subsidiary properties' },
    { type: 'reputation', target: 550, text: 'Reach 550 Respect' }
  ],
  rewards: { money: 19200, experience: 520, reputation: 14 },
  choice: {
    prompt: "Chen Wei's consolidation plan requires acquiring a community bank that serves Chinatown residents. The acquisition would displace small businesses that rely on the bank's generous lending practices.",
    options: [
      { text: "Proceed with the acquisition -- the Triad's transformation requires sacrifices", effect: 'reputation', value: 8 },
      { text: "Modify the plan to preserve the bank's community lending -- strength should protect, not exploit", effect: 'respect', value: 12 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'Jade Mountain Holdings files its incorporation papers through a prestigious Manhattan law firm. On paper, it is a diversified investment company with holdings in twelve countries. In reality, it is the culmination of forty years of invisible empire-building.' },
    { type: 'dialogue', text: 'The long game nears its conclusion. But remember -- the final moves of any great game are the most dangerous. Our enemies are not sleeping.', speaker: 'Chen Wei' },
    { type: 'narration', text: "You notice something Chen Wei didn't explicitly share: several of the red strings in his study lead not to external targets, but to members of the Triad itself. The consolidation isn't just about going legitimate -- it's about control. Chen Wei is centralizing power, and not everyone in the organization may agree with his vision." }
  ],
  boss: null
},
{
  id: 'chen_ch18',
  title: 'Counter-Intelligence',
  act: 4,
  actTitle: 'The Long Game',
  rankOnComplete: null,
  respectGain: 26,
  narrative: [
    { type: 'narration', text: "The unease that began as a whisper in the back of your mind has grown into a roar. Chen Wei's consolidation plan is brilliant, but it has a hidden dimension he hasn't disclosed to the full council. Jade Mountain Holdings doesn't just unify the Triad's assets -- it centralizes control under Chen Wei personally, effectively dissolving the council's authority. The Sanctum's other members don't see it yet, but you do." },
    { type: 'dialogue', text: "I've been running the numbers on Jade Mountain's ownership structure. Something doesn't add up. The proxy chains all converge on a single beneficial owner -- Chen Wei. Not the council. Not the Triad. Chen Wei.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: 'You begin building your own intelligence network within the network -- not to betray Chen Wei, but to understand his true intentions and protect yourself. Secret backup servers, mirrored databases, encrypted dead drops that only you and Liang can access. If the consolidation turns into a power grab, you need leverage.' },
    { type: 'dialogue', text: 'The student who does not question the master is not a student -- he is a servant. I taught you to think. Think.', speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 60, text: 'Complete 60 jobs (any type)' },
    { type: 'money', target: 70000, text: 'Secure $70,000 in independent reserves' },
    { type: 'reputation', target: 575, text: 'Reach 575 Respect' },
    { type: 'gang', target: 9, text: 'Maintain 9 loyal operatives' },
    { type: 'properties', target: 2, text: 'Establish 2 independent safe houses' },
    { type: 'reputation', target: 600, text: 'Reach 600 Respect' }
  ],
  rewards: { money: 22800, experience: 580, reputation: 16 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "Your parallel infrastructure is complete -- a shadow of a shadow. Every critical piece of Triad intelligence now has a copy that Chen Wei doesn't control. Liang has become your closest ally, equally disturbed by the consolidation's hidden architecture." },
    { type: 'dialogue', text: "We're not betraying him. We're ensuring the Triad survives regardless of his intentions. There's a difference. I think.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: 'Mei Lin has been watching you with increased intensity. Whether she senses your preparations or is conducting her own investigation, you cannot tell. In the Chen Triad, every ally is a potential adversary, and every shadow conceals another shadow.' }
  ],
  boss: null
},
{
  id: 'chen_ch19',
  title: "The Dragon's Voice",
  act: 4,
  actTitle: 'The Long Game',
  rankOnComplete: 'underboss',
  respectGain: 28,
  narrative: [
    { type: 'scene', text: "The Inner Sanctum meets in emergency session. The topic: the future of the Triad's leadership structure. Three council members have discovered what you and Liang already knew -- that Jade Mountain consolidates power under Chen Wei alone. The room crackles with tension that six centuries of tradition can barely contain." },
    { type: 'dialogue', text: 'The Triad has always been governed by consensus. What you propose, Master Chen, is monarchy. We did not swear oaths to serve a king.', speaker: 'Elder Fang' },
    { type: 'dialogue', text: 'I propose evolution, not monarchy. The world has changed. Consensus is too slow for the pace of modern warfare. We need a single hand on the wheel.', speaker: 'Chen Wei' },
    { type: 'narration', text: "The council fractures. Three members support Chen Wei's vision. Two oppose it. You hold the deciding voice. But before the vote, you present a third option -- a modified structure that preserves council authority while streamlining decision-making through a new role: Dragon's Voice, an underboss who serves as the bridge between the master and the council. The room falls silent as they realize you have outmaneuvered both factions." },
    { type: 'dialogue', text: "The Dragon's Voice. A compromise that is not a compromise -- it is a new architecture entirely. You would hold this position yourself, I presume?", speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 63, text: 'Complete 63 jobs (any type)' },
    { type: 'money', target: 80000, text: 'Control $80,000 in organizational assets' },
    { type: 'gang', target: 10, text: 'Command 10 operatives across divisions' },
    { type: 'properties', target: 3, text: 'Manage 3 Triad properties' },
    { type: 'reputation', target: 625, text: 'Reach 625 Respect' }
  ],
  rewards: { money: 26400, experience: 640, reputation: 17 },
  choice: {
    prompt: "Chen Wei's eyes bore into yours as the council waits for your answer. He is testing whether your ambition serves the Triad or yourself.",
    options: [
      { text: 'Accept the role with humility -- emphasize service to the organization above personal power', effect: 'respect', value: 14 },
      { text: "Accept the role with authority -- make clear that the Dragon's Voice will not be a puppet position", effect: 'reputation', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The vote is unanimous. The Chen Triad has a new underboss -- the Dragon's Voice, a role that has never existed before in six centuries of tradition. Chen Wei places a third pendant around your neck: the dragon now holds not just a pearl, but a Go stone and a key." },
    { type: 'dialogue', text: 'You created a position that did not exist and convinced seven of the most powerful people in this organization to give it to you. I would be concerned if I were not so impressed.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Mei Lin's expression as you leave the council chamber is unreadable -- something between respect and calculation. She had her own plans for the Triad's future, and you have just rewritten the board." },
    { type: 'dialogue', text: "The Dragon's Voice. It suits you. Just remember -- every voice can be silenced.", speaker: 'Mei Lin' }
  ],
  boss: null
},
{
  id: 'chen_ch20',
  title: "Mei Lin's Betrayal",
  act: 4,
  actTitle: 'The Long Game',
  rankOnComplete: null,
  respectGain: 29,
  narrative: [
    { type: 'scene', text: "Liang's emergency alert comes at 4:00 AM -- a priority cipher that you have never seen him use before. His voice on the encrypted channel is stripped of its usual calm, replaced by something close to fear." },
    { type: 'dialogue', text: "Mei Lin is selling us out. I intercepted an encrypted transmission she sent to an outside buyer -- she's offering the Triad's entire intelligence archive. Client lists, network maps, Jade Mountain's ownership structure, everything. The auction closes in seventy-two hours.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "The betrayal is surgical and devastating. Mei Lin has spent months copying the Triad's most sensitive data -- the same data you helped create and protect. Her buyer is unknown, but the asking price suggests a state actor or a rival syndicate with deep pockets. If the sale completes, the invisible empire becomes visible, and everything collapses." },
    { type: 'dialogue', text: "She was always ambitious, but I never imagined this. Mei Lin believes the Triad has become obsolete under Chen Wei's leadership. She wants to burn the old world and build her own from the ashes.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: 'Chen Wei receives the news in silence, his face carved from stone. He does not rage. He does not grieve. He places a single black Go stone on the board before him and stares at it for a long time.' }
  ],
  objectives: [
    { type: 'jobs', target: 66, text: 'Complete 66 jobs (any type)' },
    { type: 'money', target: 100000, text: 'Protect $100,000 in endangered Triad assets' },
    { type: 'gang', target: 10, text: 'Mobilize all 10 operatives for crisis response' },
    { type: 'properties', target: 3, text: 'Secure 3 properties against compromise' },
    { type: 'reputation', target: 675, text: 'Reach 675 Respect' }
  ],
  rewards: { money: 30000, experience: 700, reputation: 18 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "You lock down every compromised channel, rotate every encryption key, and begin the methodical process of quarantining Mei Lin's access to the network. But she anticipated this -- her back doors run deeper than Liang expected, woven into the code from years of trusted access." },
    { type: 'dialogue', text: "She has a dead man's switch. If we cut her off completely, the data dumps automatically to her buyer. We need to neutralize her personally before we can seal the breach.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: 'The Triad faces its greatest existential threat -- not from outside, but from within. The shadow war with Mei Lin will determine whether the invisible empire survives or shatters into a thousand visible pieces.' },
    { type: 'dialogue', text: "I raised her. Trained her. Gave her everything. Now she must be stopped. Do what must be done, Dragon's Voice. This is why I gave you that title.", speaker: 'Chen Wei' }
  ],
  boss: null
},
{
  id: 'chen_ch21',
  title: 'Shadow War',
  act: 4,
  actTitle: 'The Long Game',
  rankOnComplete: null,
  respectGain: 30,
  narrative: [
    { type: 'scene', text: "Mei Lin has gone to ground, operating from a network of safe houses she established years ago -- places even Chen Wei didn't know about. She has taken twelve loyalists with her, operatives from the physical division who follow her with a devotion that borders on fanaticism. The auction clock is ticking." },
    { type: 'dialogue', text: "I've triangulated her primary location -- a converted warehouse in the Meatpacking District. But she's moved three times in the last forty-eight hours. We need to pin her down and disable the dead man's switch simultaneously.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "The operation to neutralize Mei Lin requires everything you have learned -- Liang's digital precision, the physical team's infiltration skills, your own ability to coordinate both worlds. It is the inverse of the museum heist: instead of stealing in silence, you are hunting a predator who knows all your methods because she helped create them." },
    { type: 'dialogue', text: 'She knows how we think, how we move, how we plan. She will anticipate our standard approaches. We need to do something she would never expect -- something the old Triad would never do.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "You design a three-pronged approach: Liang attacks the dead man's switch from cyberspace, your operatives create a visible distraction at two of her known locations, and you personally confront Mei Lin at the third. She will expect digital warfare. She will not expect you to face her alone." }
  ],
  objectives: [
    { type: 'jobs', target: 70, text: 'Complete 70 jobs (any type)' },
    { type: 'money', target: 120000, text: 'Deploy $120,000 in war resources' },
    { type: 'gang', target: 11, text: 'Command 11 operatives in coordinated assault' },
    { type: 'properties', target: 3, text: 'Use 3 staging properties for the operation' },
    { type: 'reputation', target: 725, text: 'Reach 725 Respect' }
  ],
  rewards: { money: 44000, experience: 960, reputation: 24 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The warehouse is dark when you enter, lit only by the glow of server racks Mei Lin has assembled for her auction. She stands in the center, a blade in one hand and a detonator for the dead man's switch in the other. Her loyalists have been neutralized by your team outside. It is just the two of you now." },
    { type: 'dialogue', text: "You came alone. Chen Wei would never have done that. Maybe you are different after all. But it doesn't matter -- when I press this button, the Triad's secrets scatter to every intelligence agency on Earth.", speaker: 'Mei Lin' },
    { type: 'narration', text: "Liang's voice crackles in your earpiece: the dead man's switch has been neutralized from the server side. The detonator in Mei Lin's hand is connected to nothing. She doesn't know it yet. The shadow war ends not with violence, but with the quiet click of a disabled circuit and the look in Mei Lin's eyes when she presses the button and nothing happens." },
    { type: 'dialogue', text: "Checkmate, Mei Lin. Liang disabled your switch forty seconds ago. It's over. Chen Wei sends a message: you may leave with your life, but never return. The Triad repays betrayal with exile, not blood. That is his mercy. Take it.", speaker: 'You' }
  ],
  boss: { name: 'Mei Lin', power: 200, health: 300, gangSize: 6, reward: 22000, dialogue: { intro: "I built half of this empire's physical operations with my bare hands while you played with keyboards. Chen Wei is a fossil clinging to a dying philosophy. The future belongs to those willing to burn the past. I will sell every secret this Triad holds, and from the ashes, I will build something real.", victory: "You outplayed me. Not with force -- with patience. The old man's philosophy lives in you more than you know. Perhaps the Triad's future is not as bleak as I thought.", defeat: "You think you've won? The buyers are already out there. The demand for the Triad's secrets doesn't disappear because I'm gone. Someone else will come. Someone always comes." } }
},
{
  id: 'chen_ch22',
  title: 'The Mirror Network',
  act: 5,
  actTitle: 'Checkmate',
  rankOnComplete: null,
  respectGain: 31,
  narrative: [
    { type: 'narration', text: "Mei Lin's betrayal exposed a fundamental flaw in the Triad's architecture: too much power concentrated in too few hands. The data she nearly sold was vulnerable because it existed in a single, centralized system. As Dragon's Voice, you propose a radical restructuring -- the Mirror Network. Instead of one central hub, the Triad's intelligence will be distributed across dozens of independent nodes, each one complete but encrypted differently, each one a mirror of the whole that functions even if every other node is destroyed." },
    { type: 'dialogue', text: "You're describing a hydra. Cut off one head and the others survive. But who controls the encryption keys? A distributed network needs a master key, and whoever holds it holds everything.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "The answer comes from an unlikely source -- ancient Chinese cryptography. You design a key-sharing protocol based on Shamir's Secret Sharing, requiring a consensus of council members to reconstruct the master key. No single person -- not Chen Wei, not you, not anyone -- can access everything alone. It is a technological expression of the Triad's founding principle: five fingers of one hand." },
    { type: 'dialogue', text: 'Elegant. You have turned our weakness into a strength and our philosophy into an algorithm. This is what I hoped you would become.', speaker: 'Chen Wei' }
  ],
  objectives: [
    { type: 'jobs', target: 75, text: 'Complete 75 jobs (any type)' },
    { type: 'money', target: 140000, text: 'Invest $140,000 in distributed infrastructure' },
    { type: 'gang', target: 12, text: 'Deploy 12 operatives across the mirror network' },
    { type: 'properties', target: 4, text: 'Establish 4 mirror node locations' },
    { type: 'reputation', target: 800, text: 'Reach 800 Respect's architect" }
  ],
  rewards: { money: 58000, experience: 1220, reputation: 31 },
  choice: {
    prompt: 'Chen Wei observes your restructuring with an expression you cannot read. He asks whether the Mirror Network is designed to protect the Triad -- or to make yourself indispensable to it.',
    options: [
      { text: 'Honestly admit both -- the network protects everyone, including your own position', effect: 'respect', value: 15 },
      { text: "Deflect -- claim the design is purely for the organization's survival", effect: 'reputation', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The Mirror Network goes live across all Triad operations worldwide. Each node activates in sequence, a cascade of encrypted confirmations flowing through the system like synchronized heartbeats. The old centralized architecture is retired. The new hydra breathes.' },
    { type: 'dialogue', text: 'The Triad has survived for six centuries by adapting. You have given it its most significant adaptation since we moved from silk routes to fiber optics.', speaker: 'Chen Wei' },
    { type: 'narration', text: "But you notice something in Chen Wei's eyes that you've never seen before -- not pride, not approval, but wariness. He is beginning to recognize that his student has built something he does not fully control. The endgame approaches." }
  ],
  boss: null
},
{
  id: 'chen_ch23',
  title: 'Capturing the Key',
  act: 5,
  actTitle: 'Checkmate',
  rankOnComplete: null,
  respectGain: 33,
  narrative: [
    { type: 'scene', text: "Liang discovers it at 2:00 AM -- a hidden encryption layer buried so deep in the Triad's original codebase that it predates even his tenure. Chen Wei built a master override into every system the Triad has ever used. The Mirror Network, for all its distributed elegance, still contains a dormant backdoor that Chen Wei can activate at will." },
    { type: 'dialogue', text: 'He played us. The whole time we were building the Mirror Network, he was watching, approving, encouraging -- because he knew his override would still work. Every node we created, his key can unlock. The old man is ten moves ahead, as always.', speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "The master override is not a flaw or a betrayal -- it is Chen Wei's final insurance policy. A lifetime of building an empire has taught him that no system is safe without a failsafe, and he trusts no one to hold it but himself. If you want to truly lead the Triad, this key must be neutralized -- not destroyed, but captured and redistributed among the council through the same consensus protocol that governs the Mirror Network." },
    { type: 'dialogue', text: "Neutralizing the key without alerting him will be the most delicate operation we've ever attempted. We're not hacking an outsider. We're outmaneuvering the most brilliant strategist either of us has ever known.", speaker: "Liang 'Ghost' Zhao" },
    { type: 'scene', text: "The operation takes three weeks. You and Liang work in absolute secrecy, slowly encapsulating Chen Wei's override within a new encryption layer that subjects it to the council's consensus protocol. Each modification must be invisible, each alteration tested without triggering the monitoring systems Chen Wei certainly has in place." }
  ],
  objectives: [
    { type: 'jobs', target: 80, text: 'Complete 80 jobs (any type)' },
    { type: 'money', target: 170000, text: 'Manage $170,000 in operational security funds' },
    { type: 'gang', target: 13, text: 'Coordinate 13 trusted operatives' },
    { type: 'properties', target: 4, text: 'Maintain 4 secure operational bases' },
    { type: 'reputation', target: 875, text: 'Reach 875 Respect' }
  ],
  rewards: { money: 72000, experience: 1480, reputation: 37 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The final encapsulation completes at dawn. Chen Wei's master override still exists, but it now requires three of seven council members to activate -- including Chen Wei himself. The failsafe has been democratized. The invisible emperor has been made into a constitutional monarch without his knowledge." },
    { type: 'dialogue', text: "It's done. The key is captured. He can still use it, but only with council consent. The question is -- when does he find out?", speaker: "Liang 'Ghost' Zhao" },
    { type: 'narration', text: "You stare at the Go board in your private office -- a replica of the one Chen Wei uses. The stones are arranged in a pattern you have been studying for months: Chen Wei's favorite opening. You have spent weeks analyzing his style, his patterns, his philosophy. Because the final confrontation will not be fought with code or operatives. It will be fought across sixty-one lines on a wooden board, with black and white stones, in the language that Chen Wei respects above all others." }
  ],
  boss: null
},
{
  id: 'chen_ch24',
  title: 'The Final Board',
  act: 5,
  actTitle: 'Checkmate',
  rankOnComplete: null,
  respectGain: 34,
  narrative: [
    { type: 'narration', text: "Chen Wei knows. Of course he knows -- a mind that built an invisible empire across four decades does not miss the subtle shift in gravity when its foundations are altered. He has known about the key's encapsulation for at least a week, and he has said nothing. Instead, he has been playing Go alone in his teahouse, placing stones with increasing deliberation, as if working out a puzzle that has no solution." },
    { type: 'dialogue', text: 'You captured my key. I know this because the system responded half a millisecond slower after your modification -- a delay so small that only someone who built the original would notice. You are very good. But you are not yet better than me.', speaker: 'Chen Wei' },
    { type: 'scene', text: 'He places a Go board between you in the teahouse -- but this is not the teaching board from your first meeting. This is his personal board, a three-hundred-year-old kaya wood grid that has seen every important game in Chen family history. The stones are slate and shell, worn smooth by centuries of hands.' },
    { type: 'dialogue', text: "Let us settle this the way our ancestors would. One game. If you win, I cede control of Jade Mountain and the Triad's future to the council, with you as its leader. If I win, the key returns to me, and you accept that some empires require an emperor.", speaker: 'Chen Wei' },
    { type: 'scene', text: 'The game begins at sunset. Chen Wei plays black -- the color of the offense, the attacker. You play white -- the color of the defense, the respondent. He places his first stone in the star point, a classical opening that signals confidence. You respond with a move he has never seen you play before.' }
  ],
  objectives: [
    { type: 'jobs', target: 85, text: 'Complete 85 jobs (any type)' },
    { type: 'money', target: 200000, text: 'Secure $200,000 in Triad reserves' },
    { type: 'gang', target: 14, text: 'Ensure loyalty of 14 division operatives' },
    { type: 'properties', target: 4, text: 'Control 4 key Triad properties' },
    { type: 'reputation', target: 950, text: 'Reach 950 Respect' }
  ],
  rewards: { money: 86000, experience: 1740, reputation: 44 },
  choice: {
    prompt: 'Midway through the game, Chen Wei offers you a draw -- a shared leadership structure where he remains as ceremonial head while you hold operational control. It is a generous offer from a proud man.',
    options: [
      { text: 'Accept the draw -- honor the master while securing real power', effect: 'respect', value: 16 },
      { text: 'Decline and play on -- the Triad needs a clear leader, not a compromise', effect: 'reputation', value: 12 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The game stretches through the night. Tea is brewed and rebrewed. The stones accumulate on the board like a miniature landscape of mountains and rivers, territories won and lost and won again. Chen Wei's play is masterful -- decades of experience expressed in every placement. But your play is something he hasn't encountered: his own philosophy turned against him, his patterns recognized and countered, his favorite formations anticipated three moves in advance." },
    { type: 'dialogue', text: 'You have been studying my games. Not just learning Go -- learning me. When did you start?', speaker: 'Chen Wei' },
    { type: 'narration', text: 'Dawn breaks through the teahouse windows. The board is nearly full. The endgame -- yose -- has begun. Every stone now matters. Chen Wei studies the position for twenty minutes without moving, the longest pause of the game. When he finally looks up, his eyes hold something you have never seen in them before: recognition. Not of a student. Of an equal.' }
  ],
  boss: null
},
{
  id: 'chen_ch25',
  title: 'Checkmate',
  act: 5,
  actTitle: 'Checkmate',
  rankOnComplete: 'don',
  respectGain: 35,
  narrative: [
    { type: 'scene', text: "The final stones are placed as morning light floods the teahouse. The board tells its story: a game of extraordinary depth, two minds at the peak of their power clashing across nineteen lines and three hundred sixty-one intersections. Chen Wei counts the territory with practiced fingers, placing dead stones in their prisoners' bowls with gentle clicks that echo in the silence." },
    { type: 'dialogue', text: 'White wins by three and a half points. A narrow margin. In all my years of play, I have never been pressed this close by anyone. And I have played against masters in Beijing, Tokyo, and Seoul.', speaker: 'Chen Wei' },
    { type: 'narration', text: "Chen Wei does not rage. He does not mourn. He leans back, a smile spreading across his weathered face -- not the politician's smile or the strategist's smile, but the genuine expression of a teacher who has finally been surpassed by his student. This was always the endgame he hoped for." },
    { type: 'dialogue', text: 'I built an empire and called it a family. I trained minds and called them weapons. I made the world invisible and called it freedom. But the truth is simpler: I was searching for someone worthy of carrying what I built. Not a successor -- an evolution. The dragon does not die. It sheds its skin and becomes something new.', speaker: 'Chen Wei' },
    { type: 'scene', text: "He reaches into his robe and produces a final pendant -- not jade this time, but obsidian, carved into the shape of a Go stone wrapped in a dragon's coil. It is the symbol of the Dragon Master, the head of the Chen Triad. No one alive has seen it except Chen Wei. Until now." }
  ],
  objectives: [
    { type: 'jobs', target: 90, text: 'Complete 90 jobs (any type)' },
    { type: 'money', target: 250000, text: 'Control $250,000 in Triad assets' },
    { type: 'gang', target: 15, text: 'Command all 15 Triad division operatives' },
    { type: 'properties', target: 5, text: 'Oversee 5 properties across the empire' },
    { type: 'reputation', target: 1050, text: 'Reach 1050 Respect' }
  ],
  rewards: { money: 100000, experience: 2000, reputation: 50 },
  choice: {
    prompt: 'Chen Wei offers you the obsidian pendant. How do you accept the mantle of Dragon Master?',
    options: [
      { text: 'Accept with a bow and promise to honor the traditions while evolving the Triad for the future', effect: 'respect', value: 20 },
      { text: 'Accept and immediately announce reforms -- the new Dragon Master will rule by consensus, not decree', effect: 'reputation', value: 15 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The Inner Sanctum convenes one final time under Chen Wei's leadership. The old master stands before the council and places the obsidian pendant around your neck himself, his hands steady despite his years. The council members rise in unison -- not applauding, but standing in the traditional gesture of acknowledgment that has marked every succession for six centuries." },
    { type: 'dialogue', text: 'The Chen Triad has a new Dragon Master. I cede my position not because I was defeated, but because I was surpassed. That is the highest honor a master can receive. Lead well. The dragon watches.', speaker: 'Chen Wei' },
    { type: 'narration', text: 'Chen Wei retires to his teahouse, the Go board waiting as it always has. He will play there every day, an old man above a noodle shop, invisible to the world -- exactly as he prefers. The empire he built now rests on your shoulders: the Mirror Network humming across four continents, Jade Mountain Holdings growing in legitimate power, the New Silk Road flowing with intelligence. You are the Dragon Master -- not through violence or treachery, but through the only currency the Chen Triad has ever valued: the patient, relentless supremacy of the mind.' },
    { type: 'dialogue', text: "I've served two Dragon Masters now. The first one taught me to code. This one taught me that code is just another language for philosophy. I think I prefer your version.", speaker: "Liang 'Ghost' Zhao" }
  ],
  boss: null
}
    ],
  },

  // ======================================================================
  //  MORALES CARTEL  -  "Fire & Blood"
  // ======================================================================
  morales: {
    storyTitle: 'Fire & Blood',
    icon: 'Morales Cartel',
    color: '#ff8c00',
    tagline: 'A tale of loyalty, sacrifice, and the fire that burns in those who have nothing to lose.',
    chapters: [{
  id: 'morales_ch1',
  title: 'La Prueba',
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 5,
  narrative: [
    { type: 'scene', text: 'The desert sun beats down on a dusty cantina south of the border. Mariachi music drifts from a jukebox as you push through the beaded curtain. The air smells of tequila and gun oil.' },
    { type: 'narration', text: "A man with a scarred face and gold teeth sits in the corner booth, cleaning a knife with slow, deliberate strokes. Diego 'El Cuchillo' Vargas -- the Morales Cartel's most feared enforcer." },
    { type: 'dialogue', text: "So you're the one El Jefe's been hearing about. You want to run with us? Then prove it. There's a package at the border crossing -- three kilos, wrapped in saint candles. Bring it across before sunrise, and maybe you live to see another day.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'He slides a burner phone and a map across the table. The route is marked in red ink -- through the drainage tunnels beneath the Rio Grande. One way in, one way out.' }
  ],
  objectives: [
    { type: 'jobs', target: 5, text: 'Complete 5 jobs (any type)' },
    { type: 'money', target: 1000, text: 'Earn $1,000 from border runs' }
  ],
  rewards: { money: 500, experience: 50, reputation: 2 },
  choice: {
    prompt: "At the crossing, you spot an unguarded extra package worth thousands. Diego didn't mention it.",
    options: [
      { text: 'Take only what you were told -- loyalty first', effect: 'respect', value: 5 },
      { text: 'Grab the extra package -- more product, more profit', effect: 'money', value: 400 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "You emerge from the tunnel, clothes soaked, the package intact under your arm. Diego's black SUV idles at the rendezvous point, headlights cutting through the pre-dawn dark." },
    { type: 'dialogue', text: "You made it. Most don't, their first time. El Jefe will want to meet you. Get in.", speaker: 'Diego Vargas' },
    { type: 'narration', text: "The SUV tears down the desert highway toward the Morales compound. You've taken the first step into a world of fire and blood -- and there's no turning back." }
  ],
  boss: null
},
{
  id: 'morales_ch2',
  title: 'The Tunnel',
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 6,
  narrative: [
    { type: 'scene', text: "Deep beneath the desert floor, the sound of pickaxes echoes through a half-finished tunnel. Industrial lights hang from crude wiring, casting harsh shadows on the laborers. This is El Jefe's masterwork -- a tunnel stretching half a mile under the border." },
    { type: 'dialogue', text: 'This tunnel is my legacy, amigo. When it is finished, we move ten times what we move now. I need someone I can trust down here -- someone who keeps the workers moving and the engineers honest.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "Ricardo 'El Jefe' Morales stands before you in a white linen shirt, his dark eyes burning with ambition. He claps your shoulder with a calloused hand. Behind his warm smile lies the most dangerous man on the border." },
    { type: 'dialogue', text: "You watch them. You make sure the supports hold. And if anyone talks to anyone who isn't us -- you tell Diego. Understood?", speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 8, text: 'Complete 8 jobs (any type)' },
    { type: 'money', target: 1500, text: 'Earn $1,500 managing the tunnel operation' },
    { type: 'reputation', target: 10, text: 'Reach 10 Respect' }
  ],
  rewards: { money: 875, experience: 68, reputation: 2 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The final section of tunnel breaks through into the basement of a safe house on the American side. Cool air rushes in, carrying the smell of concrete and possibility.' },
    { type: 'dialogue', text: 'Beautiful. You did good work down here. The tunnel -- she breathes now. Like a living thing.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe hands you an envelope thick with cash and nods with genuine warmth. In the Morales Cartel, you've gone from stranger to someone worth remembering." }
  ],
  boss: null
},
{
  id: 'morales_ch3',
  title: 'Street Corners',
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 8,
  narrative: [
    { type: 'scene', text: "The barrio pulses with life -- lowriders cruise past murals of the Virgin Mary, street vendors hawk tamales, and kids play soccer in the alley. Beneath it all, the Morales Cartel's distribution network hums like a second heartbeat." },
    { type: 'narration', text: "Diego drives you through the territory in his gold-trimmed Escalade, pointing out corners, safe houses, and the invisible boundaries that separate Morales turf from everyone else's." },
    { type: 'dialogue', text: "See that bodega? That's ours. The laundromat? Ours. The parking lot behind the church? Also ours. But that block -- the one with the blue wall -- some pendejo named Rojas thinks he can sell there. He's wrong.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'Your job is clear: establish Morales dominance on every contested corner. Push out the independents, set up reliable dealers, and make sure the product flows without interruption.' }
  ],
  objectives: [
    { type: 'jobs', target: 12, text: 'Complete 12 jobs (any type)' },
    { type: 'money', target: 2500, text: 'Generate $2,500 in street revenue' },
    { type: 'reputation', target: 20, text: 'Reach 20 Respect' }
  ],
  rewards: { money: 1250, experience: 85, reputation: 3 },
  choice: {
    prompt: "Rojas refuses to leave the blue wall corner. He's small-time but defiant, and his grandmother lives upstairs.",
    options: [
      { text: 'Talk to him privately -- offer him a spot in the organization', effect: 'respect', value: 4 },
      { text: 'Make a public example -- smash his operation in front of everyone', effect: 'reputation', value: 3 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The blue wall corner is yours now. Morales banners -- subtle, but unmistakable -- mark every block in the territory. The dealers nod as you pass. You're known here." },
    { type: 'dialogue', text: "El Jefe is pleased. The streets are clean, the money flows. You've got instincts, gringo. Maybe you belong here after all.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'The barrio has accepted the Morales expansion. For now, the corners are quiet, the product moves, and your reputation grows with every successful day.' }
  ],
  boss: null
},
{
  id: 'morales_ch4',
  title: "Sofia's Kitchen",
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 9,
  narrative: [
    { type: 'scene', text: "The Morales compound is a sprawling hacienda surrounded by bougainvillea and armed guards. But the heart of it all is the kitchen -- Sofia Morales' domain. The smell of mole and fresh tortillas fills the air as the family gathers." },
    { type: 'dialogue', text: "In this family, we eat together. Always. You want my husband's trust? You earn mine first. Sit down. Eat. And tell me about your mother.", speaker: 'Sofia Morales' },
    { type: 'narration', text: 'Sofia Morales is no ordinary cartel wife. She manages the money laundering operations through a chain of restaurants, keeps the family together through bloodshed and betrayal, and has survived three assassination attempts meant for her husband.' },
    { type: 'dialogue', text: 'My husband sees soldiers. I see people. If you are going to be part of this familia, I need to know what kind of person you are. The streets will test your strength -- but I will test your soul.', speaker: 'Sofia Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 15, text: 'Complete 15 jobs (any type)' },
    { type: 'money', target: 3500, text: "Generate $3,500 through Sofia's restaurant fronts" },
    { type: 'reputation', target: 35, text: 'Reach 35 Respect' }
  ],
  rewards: { money: 1625, experience: 103, reputation: 4 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'After weeks of working the restaurant fronts and proving yourself through quiet competence, Sofia invites you back to the kitchen -- this time, just the two of you.' },
    { type: 'dialogue', text: 'You have good hands and a good heart. My husband will use the first. I pray you never lose the second. Welcome to the family.', speaker: 'Sofia Morales' },
    { type: 'narration', text: "Sofia places a silver medallion of the Virgin of Guadalupe around your neck. In the Morales Cartel, Sofia's blessing is worth more than gold." }
  ],
  boss: null
},
{
  id: 'morales_ch5',
  title: 'The Mule Run',
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 10,
  narrative: [
    { type: 'scene', text: 'A convoy of trucks sits in a warehouse on the Mexican side, loaded with hidden compartments. The biggest shipment the Morales Cartel has attempted -- fifty kilos, split across five vehicles, crossing at different points along a hundred-mile stretch of border.' },
    { type: 'dialogue', text: 'This is the big one, mi amigo. Fifty kilos. Five trucks. You coordinate the drivers, the timing, the checkpoints. If even one truck gets stopped, we lose millions. But if they all make it? We own this corridor for a decade.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe's eyes gleam with the fire that built his empire from nothing. He trusts you with this -- the largest operation you've ever touched. The drivers are nervous. The border patrol has been tipped off about 'something.' The clock is ticking." },
    { type: 'dialogue', text: "I'll be watching from the hilltop with binoculars. My heart will be with every truck. Every driver is someone's son. Bring them all home.", speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 18, text: 'Complete 18 jobs (any type)' },
    { type: 'money', target: 5000, text: 'Earn $5,000 from the cross-border operation' },
    { type: 'reputation', target: 50, text: 'Reach 50 Respect' }
  ],
  rewards: { money: 2000, experience: 120, reputation: 4 },
  choice: {
    prompt: "One truck's driver panics and wants to abort at the last checkpoint. If he turns back, the timing for all five is ruined.",
    options: [
      { text: 'Talk him through it calmly -- no one gets left behind', effect: 'respect', value: 6 },
      { text: 'Threaten his family -- the shipment comes first', effect: 'money', value: 1500 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Five trucks. Five safe arrivals. The warehouse on the American side erupts in celebration -- mariachi music blasts from someone's phone, tequila bottles are cracked open, and El Jefe himself embraces you." },
    { type: 'dialogue', text: 'Five for five! You are something special. Tonight, we celebrate like kings! Sofia -- bring the good tequila! The VERY good tequila!', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'The mule run is the stuff of legend now. The drivers tell the story in hushed, reverent tones. You coordinated the impossible, and El Jefe will never forget it.' }
  ],
  boss: null
},
{
  id: 'morales_ch6',
  title: "Diego's Test",
  act: 1,
  actTitle: 'La Prueba',
  rankOnComplete: null,
  respectGain: 11,
  narrative: [
    { type: 'scene', text: 'A moonless night in the desert. Diego drives you to an abandoned ranch miles from anywhere, the headlights illuminating a man tied to a chair. A traitor -- one of the tunnel workers who sold information to a rival crew.' },
    { type: 'dialogue', text: "This is Marco. He was one of us. He ate at Sofia's table. He took El Jefe's money. And then he sold the tunnel location to the Colombians. El Jefe says his fate is in your hands. This is my test for you.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'Diego leans against the truck, gold teeth glinting in the starlight. He places a pistol on the hood -- the same knife he always carries sits in his belt. The traitor whimpers through his gag, eyes wide with terror.' },
    { type: 'dialogue', text: "Everyone talks about loyalty until loyalty has a price. Tonight, you show me what yours costs. Or maybe... it has no price at all. That's what I'm hoping.", speaker: 'Diego Vargas' }
  ],
  objectives: [
    { type: 'jobs', target: 22, text: 'Complete 22 jobs (any type)' },
    { type: 'money', target: 7000, text: 'Accumulate $7,000' },
    { type: 'reputation', target: 75, text: 'Reach 75 Respect' }
  ],
  rewards: { money: 2800, experience: 140, reputation: 5 },
  choice: {
    prompt: 'Marco begs for his life, swearing he was coerced. Diego watches you impassively, waiting for your decision.',
    options: [
      { text: 'Spare him but mark him -- cut off his finger as a permanent warning', effect: 'respect', value: 5 },
      { text: 'End it cleanly -- a bullet, quick and final, no suffering', effect: 'reputation', value: 4 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The desert swallows the night's events. You ride back in silence, the weight of what happened settling into your bones. Diego drives slowly, uncharacteristically quiet." },
    { type: 'dialogue', text: "You passed. Not because of what you did -- but how you did it. No hesitation, no cruelty for its own sake. El Jefe was right about you. You're ready for the next step.", speaker: 'Diego Vargas' },
    { type: 'narration', text: "Diego extends his hand -- scarred, tattooed, stained with decades of violence. You shake it. For the first time, you see something like respect in the enforcer's cold eyes." }
  ],
  boss: null
},
{
  id: 'morales_ch7',
  title: 'Soldado',
  act: 2,
  actTitle: 'Soldado',
  rankOnComplete: 'soldier',
  respectGain: 13,
  narrative: [
    { type: 'scene', text: 'The Morales compound is decorated with red and gold -- the colors of the cartel. The inner courtyard has been transformed into a ceremonial space. Candles line the walls, casting dancing shadows on the faces of assembled soldiers and lieutenants.' },
    { type: 'dialogue', text: 'Today, you stop being an outsider. Today, you become Soldado -- a soldier of the Morales family. This is a blood oath, taken before God and familia. Once spoken, it can never be broken. Not by prison. Not by death. Not by anything.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe stands at the center in his finest suit, a ceremonial knife gleaming in his hand. Sofia stands behind him, rosary in hand, lips moving in silent prayer. Diego flanks his right side, and beside him -- Isabella Morales, El Jefe's daughter, watching with curious dark eyes." },
    { type: 'dialogue', text: 'Give me your hand. Your blood will mix with mine, and we will be bound forever. La familia Morales protects its own -- unto death and beyond.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 25, text: 'Complete 25 jobs (any type)' },
    { type: 'money', target: 9000, text: 'Accumulate $9,000 for the cartel treasury' },
    { type: 'reputation', target: 100, text: 'Reach 100 Respect' }
  ],
  rewards: { money: 3600, experience: 160, reputation: 6 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "Your blood and El Jefe's mingle on the ceremonial blade. The courtyard erupts -- gunshots fired into the air, mariachi horns blaring, embraces from men who were strangers weeks ago and are now brothers." },
    { type: 'dialogue', text: 'Welcome, Soldado! Tonight you are reborn. From this day, you carry the Morales name in your heart. Betray it, and I will cut it out myself. But love it? Love it and it will love you back forever.', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: "Congratulations. Try not to die too quickly -- I'm just starting to like you.", speaker: 'Isabella Morales' },
    { type: 'narration', text: 'The fiesta rages until dawn. You are Soldado now -- a sworn soldier of the Morales Cartel. The blood on your palm has dried into a thin scar. It will never fully heal, and that is the point.' }
  ],
  boss: null
},
{
  id: 'morales_ch8',
  title: 'Festival of the Dead',
  act: 2,
  actTitle: 'Soldado',
  rankOnComplete: null,
  respectGain: 14,
  narrative: [
    { type: 'scene', text: "Dï¿½a de los Muertos transforms the city into a riot of color and memory. Marigold petals carpet the streets, sugar skulls grin from every altar, and painted faces blur the line between the living and the dead. It's the perfect cover for the Morales Cartel's biggest urban shipment." },
    { type: 'narration', text: 'El Jefe has hidden twenty kilos inside hollow parade floats -- giant skeletal figures that will roll through the city center. Your job: ensure the floats reach three separate safe houses without interception, using the festival crowd as cover.' },
    { type: 'dialogue', text: "The dead protect us tonight, Soldado. Their spirits dance in the streets and blind the eyes of our enemies. Move the product through the parade route. Diego's men will handle security. You handle the logistics.", speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: "And remember -- tonight is sacred. No blood on the festival. No guns where children can see. Sofia would never forgive us, and honestly? She's scarier than the DEA.", speaker: 'Diego Vargas' }
  ],
  objectives: [
    { type: 'jobs', target: 28, text: 'Complete 28 jobs (any type)' },
    { type: 'money', target: 12000, text: 'Generate $12,000 from festival shipments' },
    { type: 'reputation', target: 130, text: 'Reach 130 Respect' },
    { type: 'gang', target: 2, text: 'Recruit 2 reliable crew members' }
  ],
  rewards: { money: 4400, experience: 180, reputation: 6 },
  choice: {
    prompt: 'A rival crew spots the float transfer. You can handle this quietly or send a message during the most sacred night of the year.',
    options: [
      { text: "Divert the floats through back alleys -- protect the festival's sanctity", effect: 'respect', value: 6 },
      { text: "Have Diego's men intercept the rivals publicly -- show who owns this city", effect: 'reputation', value: 5 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The last float reaches its safe house as fireworks explode over the cemetery. Twenty kilos delivered without a shot fired. The festival continues, the dead smile from their altars, and the living are none the wiser.' },
    { type: 'dialogue', text: "Perfect. Not one drop of blood on the marigolds. Sofia is making you a special plate -- that's how you know you did good. Even Diego is smiling, and that man hasn't smiled since 2007.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: "In the glow of a thousand candles honoring the departed, you eat Sofia's cooking and drink aged tequila with the Morales inner circle. The dead watch over you tonight. Tomorrow, business resumes." }
  ],
  boss: null
},
{
  id: 'morales_ch9',
  title: 'The Supply Chain',
  act: 2,
  actTitle: 'Soldado',
  rankOnComplete: null,
  respectGain: 15,
  narrative: [
    { type: 'scene', text: 'A warehouse in an industrial district, converted into a command center. Maps cover every wall -- supply routes, distribution points, safe houses, and the territories of every competitor within three hundred miles. El Jefe wants you to build something bigger.' },
    { type: 'dialogue', text: "We've been moving product like it's 1995 -- one truck at a time, one corner at a time. I want a machine. A supply chain so efficient that the Colombians beg to sell through us instead of against us.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: "Building a modern distribution network means recruiting drivers, establishing safe house chains, bribing the right officials, and creating redundancy so that if one link breaks, the chain still holds. It's logistics -- just with more guns." },
    { type: 'dialogue', text: 'Isabella studied business for two years before she switched to medicine. She drew up these route plans. Smart girl, my daughter. Too smart for this life, but the blood... the blood knows what it knows.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 32, text: 'Complete 32 jobs (any type)' },
    { type: 'money', target: 15000, text: 'Generate $15,000 through the distribution network' },
    { type: 'reputation', target: 175, text: 'Reach 175 Respect' },
    { type: 'gang', target: 3, text: 'Recruit 3 crew members for logistics' }
  ],
  rewards: { money: 5200, experience: 200, reputation: 7 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The new supply chain hums to life. Product moves from source to street in forty-eight hours instead of two weeks. Revenue doubles within a month. El Jefe watches the numbers climb with tears in his eyes.' },
    { type: 'dialogue', text: 'This... this is what I dreamed of when I was a boy picking avocados in Sinaloa. An empire. A real empire. And you helped build it.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "But empires attract attention. Word of the Morales Cartel's expansion reaches Colombia, where a man known only as El Diablo begins to take notice." }
  ],
  boss: null
},
{
  id: 'morales_ch10',
  title: 'Colombian Ambush',
  act: 2,
  actTitle: 'Soldado',
  rankOnComplete: null,
  respectGain: 16,
  narrative: [
    { type: 'scene', text: 'Dawn breaks over the lab -- a converted ranch house deep in the desert where the Morales Cartel processes its product. The morning shift has just arrived when the first shots ring out. Colombian paramilitary soldiers pour from two armored trucks, AK-47s blazing.' },
    { type: 'narration', text: "The attack is coordinated and brutal -- a Colombian scouting force sent by El Diablo to test the Morales defenses. They've hit the lab at its most vulnerable, when the night guards are changing shifts." },
    { type: 'dialogue', text: "ï¿½Colombianos! They're hitting the lab! Get everyone armed -- NOW! This is not a drill, Soldado. They want our product and our blood. Give them neither!", speaker: 'Diego Vargas' },
    { type: 'dialogue', text: 'Protect the workers first! The product can be replaced -- people cannot! This is what la familia means!', speaker: 'Sofia Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 35, text: 'Complete 35 jobs (any type)' },
    { type: 'money', target: 18000, text: 'Accumulate $18,000 in war funds' },
    { type: 'reputation', target: 200, text: 'Reach 200 Respect' },
    { type: 'gang', target: 3, text: 'Maintain a crew of 3 for the defense' }
  ],
  rewards: { money: 6000, experience: 220, reputation: 8 },
  choice: {
    prompt: 'The Colombian commander is retreating. You can pursue him for intel on El Diablo, or secure the lab and protect the wounded.',
    options: [
      { text: 'Secure the lab -- our people need help now', effect: 'respect', value: 8 },
      { text: 'Pursue the commander -- we need to know what El Diablo is planning', effect: 'reputation', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The Colombian scout force is broken. Bodies litter the desert sand around the lab. Smoke rises from bullet-pocked walls. But the Morales flag still flies, and the workers are alive.' },
    { type: 'dialogue', text: "They came for us. They FAILED. But this is only the beginning -- El Diablo doesn't send scouts unless an army follows. We need to be ready.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'El Jefe arrives by helicopter and surveys the damage with a face carved from stone. He says nothing for a long time. Then he looks at you, and something shifts in his expression -- from boss to father, from patriarch to general.' },
    { type: 'dialogue', text: 'War is coming. And I will need warriors. You fought well today, Soldado. Soon, you will fight as something more.', speaker: 'El Jefe Morales' }
  ],
  boss: {
    name: 'Colombian Scout Commander',
    power: 130,
    health: 210,
    gangSize: 5,
    reward: 8000,
    dialogue: {
      intro: 'El Diablo sends his regards, Morales dogs! This desert will be your grave!',
      victory: "The commander falls to his knees, blood streaming from his mouth. 'El Diablo... will burn you all...' he gasps before collapsing into the sand.",
      defeat: "The commander laughs as his men drag you away. 'Tell your El Jefe -- this is just a taste of what's coming from Colombia!'"
    }
  }
},
{
  id: 'morales_ch11',
  title: 'El Teniente',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: null,
  respectGain: 18,
  narrative: [
    { type: 'scene', text: 'The Morales compound is somber after the Colombian attack. Armed guards have tripled. The easy laughter and mariachi music are gone, replaced by the sound of weapons being cleaned and plans being drawn.' },
    { type: 'dialogue', text: 'The Colombians killed four of our people. Four families without fathers tonight. This cannot stand. I am promoting you to Teniente -- lieutenant. You will command your own squad and help me plan our response.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "Lieutenant. It's more than a title -- it's a weight. You now command a squad of soldiers, manage your own section of operations, and sit at El Jefe's war table. The promotion carries with it both privilege and the expectation of blood." },
    { type: 'dialogue', text: 'As Teniente, you answer only to me and Diego. Everyone else answers to you. Use that power wisely -- or I will have Diego explain what happens to lieutenants who fail.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 38, text: 'Complete 38 jobs (any type)' },
    { type: 'money', target: 22000, text: "Generate $22,000 managing your squad's territory" },
    { type: 'reputation', target: 250, text: 'Reach 250 Respect' },
    { type: 'gang', target: 4, text: 'Build your squad to 4 members' }
  ],
  rewards: { money: 7200, experience: 256, reputation: 9 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'Your first month as lieutenant passes in a blur of operations, territory management, and war preparation. Your squad is tight, loyal, and effective. El Jefe watches your progress with quiet approval.' },
    { type: 'dialogue', text: "You remind me of myself, thirty years ago. Hungry. Smart. Dangerous when pushed. But don't let it go to your head -- I was also much more handsome.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: "The war with Colombia looms on the horizon, but for now, the Morales Cartel is stronger than ever. And at El Jefe's war table, your voice carries weight." }
  ],
  boss: null
},
{
  id: 'morales_ch12',
  title: 'The Golden Ring',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: null,
  respectGain: 19,
  narrative: [
    { type: 'scene', text: "El Jefe's private study -- a room lined with family photographs, Catholic icons, and a glass case containing mementos of his rise. He opens a velvet box and removes a heavy gold ring engraved with the Morales crest: a serpent coiled around a cross." },
    { type: 'dialogue', text: 'This ring was made from the first gold I ever earned -- not from drugs, from honest work in the mines when I was fifteen. Every lieutenant who proves themselves wears one. It means you are part of something older than any of us.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'The ring is warm and heavy on your finger. Only six people in the world wear one -- Diego, three other lieutenants, and now you. Each ring is slightly different, hand-engraved by a jeweler in Guadalajara who has served the Morales family for decades.' },
    { type: 'dialogue', text: "Don't lose it. And don't dishonor it. My father's memory lives in that gold. My children's future lives in that gold. Treat it accordingly.", speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 40, text: 'Complete 40 jobs (any type)' },
    { type: 'money', target: 26000, text: 'Generate $26,000 to fund war preparations' },
    { type: 'reputation', target: 300, text: 'Reach 300 Respect' },
    { type: 'gang', target: 5, text: 'Expand your crew to 5 members' }
  ],
  rewards: { money: 8400, experience: 292, reputation: 10 },
  choice: {
    prompt: 'At the ring ceremony, El Jefe asks you to swear your oath. How do you seal it?',
    options: [
      { text: 'Blood oath -- cut your palm and press it to the ring, binding yourself to the old ways', effect: 'respect', value: 8 },
      { text: 'Verbal oath before the family -- let your word and your record speak for themselves', effect: 'reputation', value: 6 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "That night, a private dinner is held in your honor. Sofia cooks her legendary mole negro. Diego, for the first time, calls you 'hermano' -- brother." },
    { type: 'dialogue', text: "You earned that ring in blood and sweat. Most men who wear one are buried with it. Let's both hope you wear yours for a very long time.", speaker: 'Diego Vargas' },
    { type: 'narration', text: "The gold ring catches the candlelight as you raise your glass. You are no longer just a soldier -- you are one of El Jefe's chosen, bound by gold and blood to the Morales name." }
  ],
  boss: null
},
{
  id: 'morales_ch13',
  title: 'Promoted to Capo',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: 'capo',
  respectGain: 20,
  narrative: [
    { type: 'scene', text: 'A formal meeting in the Morales war room -- a converted wine cellar beneath the hacienda. Maps of territories, photographs of rivals, and financial ledgers cover a massive oak table. Every lieutenant and captain is present.' },
    { type: 'dialogue', text: 'Listen to me, all of you. The Colombians are circling. The Americans are tightening the border. We need to be stronger, smarter, bigger. Today, I am naming a new Capo -- someone who has earned it in the tunnels, on the streets, and in battle.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe turns to you. The room holds its breath. A few lieutenants who expected the promotion for themselves shift uncomfortably, but Diego's steady gaze keeps them in line." },
    { type: 'dialogue', text: 'You are now Capo. You command your own territory, your own crew, your own operations. You answer to me and God -- in that order. Make us proud.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 43, text: 'Complete 43 jobs (any type)' },
    { type: 'money', target: 30000, text: 'Generate $30,000 from your territory' },
    { type: 'reputation', target: 350, text: 'Reach 350 Respect' },
    { type: 'gang', target: 5, text: 'Command a crew of 5' },
    { type: 'properties', target: 1, text: 'Acquire your first property as a base of operations' }
  ],
  rewards: { money: 9600, experience: 328, reputation: 10 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'Your territory is established -- a stretch of the city that generates steady revenue and serves as a buffer zone against Colombian encroachment. Your crew is loyal, your operations are running clean.' },
    { type: 'dialogue', text: 'When I made Capo, I was ten years older than you. Either you are very talented, or I was very slow. Probably both.', speaker: 'Diego Vargas' },
    { type: 'dialogue', text: "Papa says you're the future of the cartel. I think he might be right. Don't let him down -- he takes disappointment very personally.", speaker: 'Isabella Morales' },
    { type: 'narration', text: 'As Capo, you now sit at the innermost circle of the Morales Cartel. The Colombian war is coming, and you will be on the front lines.' }
  ],
  boss: null
},
{
  id: 'morales_ch14',
  title: 'Expanding South',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: null,
  respectGain: 21,
  narrative: [
    { type: 'scene', text: "The southern border territories are contested ground -- small-time cartels, independent operators, and Colombian-backed gangs all fight for scraps. El Jefe wants it all, and he's sending you to take it." },
    { type: 'dialogue', text: 'The south is chaos. Every village has its own jefe, its own rules, its own little kingdom. I want one kingdom -- mine. Go south, Capo. Make allies where you can. Make examples where you must.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "The expansion south is both military and diplomatic. Some villages welcome the Morales Cartel's protection and the jobs it brings. Others resist, loyal to local bosses or terrified of Colombian retaliation." },
    { type: 'dialogue', text: "In the south, respect is earned face to face. Bring gifts. Share meals. Learn their names. Then, if they still refuse us -- well, that's why God invented Diego.", speaker: 'Sofia Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 46, text: 'Complete 46 jobs (any type)' },
    { type: 'money', target: 35000, text: 'Generate $35,000 from new southern operations' },
    { type: 'reputation', target: 400, text: 'Reach 400 Respect' },
    { type: 'gang', target: 6, text: 'Recruit 6 crew members including local allies' },
    { type: 'properties', target: 1, text: 'Establish a southern base of operations' }
  ],
  rewards: { money: 10800, experience: 364, reputation: 11 },
  choice: {
    prompt: "A southern village mayor offers an alliance, but only if you help defend his town against Colombian scouts -- without El Jefe's approval.",
    options: [
      { text: 'Help the village -- allies on the ground are worth more than permission', effect: 'respect', value: 8 },
      { text: 'Call El Jefe first -- loyalty to the chain of command above all', effect: 'reputation', value: 7 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The southern expansion is complete. Five villages, two towns, and a critical highway junction now fly Morales colors. The supply chain extends deeper into Mexico than ever before.' },
    { type: 'dialogue', text: "You've given us a foothold they can't rip out. The south is ours. Now we must hold it -- because El Diablo will come for it, mark my words.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: "The Morales empire stretches across the border like a great serpent. But to the south, another serpent stirs -- and El Diablo's patience is running thin." }
  ],
  boss: null
},
{
  id: 'morales_ch15',
  title: 'The Colombian War Begins',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: null,
  respectGain: 23,
  narrative: [
    { type: 'scene', text: "A car bomb detonates outside one of the Morales restaurants in broad daylight. Three civilians are killed. A message is carved into the hood of a nearby car: 'EL DIABLO VIENE.' El Diablo is coming." },
    { type: 'narration', text: "The Colombian war has officially begun. El Diablo's forces strike from the south -- supply chain attacks, targeted assassinations, and terror campaigns designed to break the Morales Cartel's grip on the border corridor." },
    { type: 'dialogue', text: 'They killed innocents. CIVILIANS. In front of MY restaurant, where CHILDREN eat! This is not business anymore -- this is personal. This is blood for blood. Sangre por sangre!', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: "I've seen wars before, Capo. This one will be different. El Diablo doesn't fight for territory -- he fights to destroy. We need to fortify everything. Every safe house, every route, every corner.", speaker: 'Diego Vargas' }
  ],
  objectives: [
    { type: 'jobs', target: 50, text: 'Complete 50 jobs (any type)' },
    { type: 'money', target: 40000, text: 'Maintain $40,000 in war funds' },
    { type: 'reputation', target: 450, text: 'Reach 450 Respect' },
    { type: 'gang', target: 7, text: 'Recruit 7 soldiers for the war effort' },
    { type: 'properties', target: 2, text: 'Secure 2 fortified properties' }
  ],
  rewards: { money: 12000, experience: 400, reputation: 12 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The first wave of the Colombian offensive is repelled. The Morales Cartel holds every key position, but the cost is steep -- men lost, businesses damaged, and the constant threat of another attack.' },
    { type: 'dialogue', text: "We held. But holding isn't winning. We need to take the fight to them -- cut off their supply lines, hit their staging areas. Attack is the best defense.", speaker: 'Diego Vargas' },
    { type: 'narration', text: 'The border runs red with the first blood of the Colombian war. Families mourn, soldiers sharpen their blades, and El Jefe prays at his private altar. The real battle has only just begun.' }
  ],
  boss: null
},
{
  id: 'morales_ch16',
  title: 'Sangre y Fuego',
  act: 3,
  actTitle: 'El Teniente',
  rankOnComplete: null,
  respectGain: 24,
  narrative: [
    { type: 'scene', text: "Sofia bursts into El Jefe's study, clutching a folder of photographs. Her face is pale, her hands trembling. Inside: surveillance photos of the Morales inner circle -- taken from within the compound itself. There is a traitor in the house." },
    { type: 'dialogue', text: "These were found in Agent Martinez's car after a routine traffic stop. Martinez -- DEA, deep cover. He's been inside our operation for eighteen months. He's been at our DINNERS, Ricardo!", speaker: 'Sofia Morales' },
    { type: 'narration', text: 'The revelation hits like a bomb. Agent Martinez -- the quiet, reliable sicario who joined a year and a half ago -- is a federal agent. He has names, routes, locations, and enough evidence to bring down the entire Morales operation.' },
    { type: 'dialogue', text: 'Find him. Before he reaches the border. Before he uploads what he has. If that evidence reaches Washington, we are all dead or in cages for the rest of our lives. GO!', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 53, text: 'Complete 53 jobs (any type)' },
    { type: 'money', target: 50000, text: 'Secure $50,000 in emergency funds' },
    { type: 'reputation', target: 475, text: 'Reach 475 Respect' },
    { type: 'gang', target: 7, text: 'Maintain 7 loyal crew members' },
    { type: 'properties', target: 2, text: 'Maintain 2 secure safe houses' },
    { type: 'reputation', target: 500, text: 'Reach 500 Respect' }
  ],
  rewards: { money: 15600, experience: 460, reputation: 13 },
  choice: {
    prompt: "You've cornered Agent Martinez in a warehouse. He offers to feed you false intel to the DEA in exchange for his life.",
    options: [
      { text: 'Accept the deal -- a double agent inside the DEA is invaluable', effect: 'respect', value: 10 },
      { text: 'End the threat permanently -- dead men send no reports', effect: 'reputation', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The Martinez crisis is resolved. The evidence is destroyed, burned in a barrel in the desert. The Morales Cartel has survived -- but the near-miss has shaken everyone, even El Jefe.' },
    { type: 'dialogue', text: 'Eighteen months. He sat at my table for eighteen months. I shared tequila with a man who was writing my verdict. Never again. From now on, trust is earned in years, not months.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'The fire that consumes the evidence sends sparks into the night sky. The Morales Cartel endures, but the scars of betrayal run deep. And the Colombian war still rages.' }
  ],
  boss: {
    name: 'DEA Agent Martinez',
    power: 170,
    health: 260,
    gangSize: 4,
    reward: 15000,
    dialogue: {
      intro: "You think you're the good guys? I've seen what your 'familia' does. Every corpse, every ruined life -- I have it all documented. You can't stop what's coming.",
      victory: "Martinez slumps against the warehouse wall, the fight gone out of him. 'You've won this round, but the DEA doesn't forget. They'll send someone else. They always do.'",
      defeat: "Martinez smiles coldly as he pulls his badge. 'It's over, amigo. Federal jurisdiction. The Morales Cartel dies tonight.'"
    }
  }
},
{
  id: 'morales_ch17',
  title: 'The Ceasefire',
  act: 4,
  actTitle: 'Sangre y Fuego',
  rankOnComplete: null,
  respectGain: 25,
  narrative: [
    { type: 'scene', text: "A neutral cantina in Juï¿½rez -- midway between Morales territory and El Diablo's advance positions. The air is thick with cigar smoke and mutual suspicion. Both sides have agreed to a temporary ceasefire to discuss terms." },
    { type: 'dialogue', text: "I don't want peace with that Colombian devil. But my people are tired. Sofia says we need time to rebuild, and when Sofia speaks, even God listens. Go to Juï¿½rez. Negotiate. Buy us time -- that's all I ask.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'El Diablo has sent his own representative -- a cold-eyed woman named La Serpiente, who speaks softly and carries the authority to make deals or declare war with equal ease.' },
    { type: 'dialogue', text: "El Diablo respects strength, not words. But he is a businessman above all. Show him that peace is more profitable than war, and perhaps we can find an arrangement that doesn't end with everyone dead.", speaker: 'La Serpiente' }
  ],
  objectives: [
    { type: 'jobs', target: 56, text: 'Complete 56 jobs (any type)' },
    { type: 'money', target: 60000, text: 'Secure $60,000 for rebuilding and negotiations' },
    { type: 'reputation', target: 525, text: 'Reach 525 Respect' },
    { type: 'gang', target: 8, text: 'Maintain 8 crew members during the ceasefire' },
    { type: 'properties', target: 2, text: 'Hold 2 properties as negotiation leverage' },
    { type: 'reputation', target: 550, text: 'Reach 550 Respect' }
  ],
  rewards: { money: 19200, experience: 520, reputation: 14 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The ceasefire holds -- barely. Colombian forces pull back from three contested zones, and the Morales Cartel agrees to stay north of the river. It's a fragile peace, built on sand." },
    { type: 'dialogue', text: "You bought us time. Maybe a month, maybe three. El Diablo won't honor this forever -- he's a snake, and snakes don't negotiate, they coil. But for now... we breathe.", speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'The ceasefire brings an uneasy quiet to the border. But beneath the surface, both sides are rearming, repositioning, and preparing for the inevitable next round.' }
  ],
  boss: null
},
{
  id: 'morales_ch18',
  title: 'Isabella in Danger',
  act: 4,
  actTitle: 'Sangre y Fuego',
  rankOnComplete: null,
  respectGain: 26,
  narrative: [
    { type: 'scene', text: "Isabella's medical school apartment in Mexico City. She's been studying pre-med, trying to build a life away from the cartel. But when you arrive to check on her -- at Sofia's request -- you notice things. A car that doesn't belong across the street. A new maintenance worker who watches too carefully." },
    { type: 'dialogue', text: "I'm fine! You and Papa are so paranoid. I'm just a student -- no one cares about me here. I'm not part of the family business, remember? That was the deal.", speaker: 'Isabella Morales' },
    { type: 'narration', text: 'But the signs are unmistakable. Colombian eyes are on Isabella. Photographs of her daily routine are found in the apartment of a deported cartel associate. El Diablo knows exactly who she is and where she is.' },
    { type: 'dialogue', text: "My daughter. They're watching my daughter. If they touch one hair on her head -- ONE HAIR -- I will burn Colombia to the ground. I don't care what it costs. I don't care who dies. She is everything.", speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 60, text: 'Complete 60 jobs (any type)' },
    { type: 'money', target: 70000, text: 'Fund $70,000 in security measures for Isabella' },
    { type: 'reputation', target: 575, text: 'Reach 575 Respect' },
    { type: 'gang', target: 9, text: 'Assign 9 crew members to protective details' },
    { type: 'properties', target: 2, text: 'Secure 2 safe houses for extraction routes' },
    { type: 'reputation', target: 600, text: 'Reach 600 Respect' }
  ],
  rewards: { money: 22800, experience: 580, reputation: 16 },
  choice: {
    prompt: "You've confirmed Colombian surveillance on Isabella. She doesn't know. Do you tell her the truth or handle it quietly?",
    options: [
      { text: 'Tell Isabella everything -- she deserves to know and can help protect herself', effect: 'respect', value: 10 },
      { text: "Handle it silently -- she's safer not knowing, less likely to panic or run", effect: 'reputation', value: 8 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Security around Isabella has been tightened to an invisible fortress -- disguised guards, counter-surveillance teams, and extraction plans for every scenario. But the threat hasn't gone away." },
    { type: 'dialogue', text: "She's safe for now. But 'for now' is not enough. Not for my little girl. We need to end this war before they try something worse.", speaker: 'Sofia Morales' },
    { type: 'narration', text: "The shadow of El Diablo falls over the Morales family's most precious treasure. The Colombian war is no longer about territory or product -- it's about family." }
  ],
  boss: null
},
{
  id: 'morales_ch19',
  title: 'Named Underboss',
  act: 4,
  actTitle: 'Sangre y Fuego',
  rankOnComplete: 'underboss',
  respectGain: 28,
  narrative: [
    { type: 'scene', text: "El Jefe's private chapel within the compound -- a small, candlelit room with a shrine to the Virgin of Guadalupe and photographs of departed Morales family members. He has summoned you here alone, away from all ears." },
    { type: 'dialogue', text: 'I am getting old, mi amigo. This war, these threats against my daughter -- they have aged me ten years in ten months. I need someone at my right hand who I trust with everything. Not just the business. The family.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe kneels before the shrine and crosses himself. When he stands, there are tears in his eyes. He removes a heavy gold chain from around his neck -- the symbol of the Morales Underboss, worn by only three people in the cartel's fifty-year history." },
    { type: 'dialogue', text: 'You are my right hand now. My Underboss. If I fall, you lead. If I call, you answer. If my family is threatened, you are the shield. Can you carry this weight?', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 63, text: 'Complete 63 jobs (any type)' },
    { type: 'money', target: 80000, text: 'Manage $80,000 in cartel operations' },
    { type: 'gang', target: 10, text: 'Command 10 crew members' },
    { type: 'properties', target: 3, text: 'Oversee 3 key properties' },
    { type: 'reputation', target: 625, text: 'Reach 625 Respect' }
  ],
  rewards: { money: 26400, experience: 640, reputation: 17 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'The gold chain rests heavy around your neck. Word spreads through the cartel like wildfire -- the new Underboss. Diego nods with genuine approval. Sofia kisses both your cheeks. Even the hardened soldiers stand a little straighter when you pass.' },
    { type: 'dialogue', text: "I told Papa you were the right choice. He doesn't listen to me about most things, but he listened about this. Don't make me regret vouching for you.", speaker: 'Isabella Morales' },
    { type: 'narration', text: "As Underboss, the entire weight of the Morales empire rests on your shoulders alongside El Jefe's. The Colombian threat looms ever larger, and the most dangerous chapter of the war is about to begin." }
  ],
  boss: null
},
{
  id: 'morales_ch20',
  title: 'The Abduction',
  act: 4,
  actTitle: 'Sangre y Fuego',
  rankOnComplete: null,
  respectGain: 29,
  narrative: [
    { type: 'scene', text: "A phone call at 3 AM shatters the night. Isabella's safe house in Mexico City is in flames. The guards are dead -- killed with Colombian military precision. Isabella is gone." },
    { type: 'narration', text: "El Diablo has broken the ceasefire in the most devastating way imaginable. A video arrives within the hour -- Isabella, blindfolded, in a concrete room, with El Diablo's serpent flag on the wall behind her. His demands: total surrender of the Morales border territories." },
    { type: 'dialogue', text: "My baby... my baby girl... Ricardo, get her back. GET HER BACK! I don't care about the territories, the money, the empire -- BRING MY DAUGHTER HOME!", speaker: 'Sofia Morales' },
    { type: 'dialogue', text: 'That Colombian dog thinks he can take my blood and make demands? I WILL BURN HIS WORLD DOWN! Every soldier we have -- EVERY ONE -- mobilize now. We are going to war. Real war. Total war.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 66, text: 'Complete 66 jobs (any type)' },
    { type: 'money', target: 100000, text: 'Amass $100,000 in war chest funds' },
    { type: 'gang', target: 10, text: 'Mobilize all 10 crew members for the rescue' },
    { type: 'properties', target: 3, text: 'Fortify 3 staging properties for the assault' },
    { type: 'reputation', target: 675, text: 'Reach 675 Respect' }
  ],
  rewards: { money: 30000, experience: 700, reputation: 18 },
  choice: {
    prompt: 'El Diablo demands the border territories in exchange for Isabella. El Jefe is torn between rage and love.',
    options: [
      { text: 'Negotiate a fake surrender -- buy time to locate Isabella while appearing to comply', effect: 'respect', value: 12 },
      { text: 'Refuse all terms -- send El Diablo a message written in the blood of his scouts', effect: 'reputation', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "Intelligence pinpoints Isabella's location -- a fortified compound in the Colombian jungle, guarded by El Diablo's personal army. The rescue will be the most dangerous operation in Morales Cartel history." },
    { type: 'dialogue', text: 'I know where she is. A compound near Medellï¿½n. Fifty guards, at least. El Diablo himself is there -- he wants to be present when he breaks us. Instead, we will break him.', speaker: 'Diego Vargas' },
    { type: 'narration', text: "The Morales war machine mobilizes. Every soldier, every weapon, every resource points south. El Jefe hasn't slept in three days. His eyes burn with a father's fury. The time for negotiation is over." }
  ],
  boss: null
},
{
  id: 'morales_ch21',
  title: 'The Rescue',
  act: 4,
  actTitle: 'Sangre y Fuego',
  rankOnComplete: null,
  respectGain: 30,
  narrative: [
    { type: 'scene', text: "The Colombian jungle at midnight. Humidity wraps around you like a wet blanket as your team moves through the undergrowth toward El Diablo's compound. Distant music drifts from inside -- reggaeton and laughter. They don't know you're coming." },
    { type: 'narration', text: 'The assault plan is surgical: Diego leads a diversionary attack on the main gate, your extraction team breaches from the river side, and a third team cuts the power. You have twelve minutes before Colombian reinforcements arrive from nearby villages.' },
    { type: 'dialogue', text: "Twelve minutes. Enough time to kill, enough time to save. Remember why we're here -- not for revenge, not for territory. For Isabella. Everything else is secondary. EVERYTHING.", speaker: 'Diego Vargas' },
    { type: 'dialogue', text: 'Bring my daughter home. After that... you and I will discuss what happens to El Diablo. Slowly.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 70, text: 'Complete 70 jobs (any type)' },
    { type: 'money', target: 120000, text: 'Deploy $120,000 in military resources' },
    { type: 'gang', target: 11, text: 'Command 11 soldiers in the assault' },
    { type: 'properties', target: 3, text: 'Maintain 3 properties for staging and recovery' },
    { type: 'reputation', target: 725, text: 'Reach 725 Respect' }
  ],
  rewards: { money: 44000, experience: 960, reputation: 24 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: "The compound burns behind you as you carry Isabella -- bruised, terrified, but alive -- to the extraction point. El Diablo's forces are shattered, his compound a smoking ruin. Diego stands over the aftermath, gold teeth flashing in the firelight." },
    { type: 'dialogue', text: 'You came for me. You actually came. I thought... I thought I was going to die there. Thank you. I will never forget this. Never.', speaker: 'Isabella Morales' },
    { type: 'dialogue', text: 'My daughter. My beautiful girl. You brought her home. Whatever you want -- whatever you need -- for the rest of your life, it is yours. You are family. True family.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'In the flickering light of the burning compound, El Jefe embraces his daughter and weeps openly. Sofia drops to her knees in prayer. The Colombian war has reached its climax -- and the Morales family has survived through fire and blood.' }
  ],
  boss: {
    name: 'El Diablo - Colombian Cartel Leader',
    power: 250,
    health: 400,
    gangSize: 10,
    reward: 25000,
    dialogue: {
      intro: "Welcome to my jungle, little Morales dogs! Did you really think you could walk into my home? I've been waiting for this -- I'm going to destroy everything your pathetic El Jefe built, starting with you!",
      victory: "El Diablo staggers back, blood pouring from a dozen wounds. 'Impossible... I am EL DIABLO! I don't lose to border rats!' He collapses into the mud as his empire crumbles around him.",
      defeat: "El Diablo grabs Isabella by the arm, his eyes wild with triumph. 'Tell your El Jefe -- the border belongs to Colombia now. His daughter will never see Mexico again!'"
    }
  }
},
{
  id: 'morales_ch22',
  title: 'Aftermath',
  act: 5,
  actTitle: 'La Corona',
  rankOnComplete: null,
  respectGain: 31,
  narrative: [
    { type: 'scene', text: 'The Morales compound, weeks after the rescue. Bullet holes are being patched, walls repainted, gardens replanted. Isabella sits in the courtyard with Sofia, both quiet, both healing. The war is won, but the scars run deep.' },
    { type: 'narration', text: "The defeat of El Diablo has sent shockwaves through the criminal underworld. The Colombian cartel's border operations have collapsed. Morales territory has expanded to its greatest extent ever. But the cost -- in lives, in trust, in innocence -- is immense." },
    { type: 'dialogue', text: "We won. That's what everyone keeps telling me. Then why does victory feel so heavy? We lost good people. My daughter lost her innocence. I lost... something I can't name. Maybe it was my belief that I could keep my family safe.", speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: "Papa, I don't want you to feel guilty. You came for me. That's what matters. But please -- please think about what happens next. I don't want to bury you too.", speaker: 'Isabella Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 75, text: 'Complete 75 jobs (any type)' },
    { type: 'money', target: 140000, text: 'Generate $140,000 rebuilding the empire' },
    { type: 'gang', target: 12, text: 'Rebuild the crew to 12 loyal members' },
    { type: 'properties', target: 4, text: 'Restore and acquire 4 properties' },
    { type: 'reputation', target: 800, text: 'Reach 800 Respect' }
  ],
  rewards: { money: 58000, experience: 1220, reputation: 31 },
  choice: {
    prompt: 'Captured Colombian soldiers await judgment. They were following orders, but they also guarded Isabella during her captivity.',
    options: [
      { text: 'Show mercy -- release them with a message that the Morales Cartel fights with honor', effect: 'respect', value: 12 },
      { text: 'Make examples -- the world must know the cost of threatening Morales blood', effect: 'reputation', value: 10 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: "The compound is restored, more beautiful than before. New murals adorn the walls -- depicting the Morales family's history, from El Jefe's humble beginnings to the great Colombian war. Your face is among them." },
    { type: 'dialogue', text: 'The artist captured your likeness well. Though he made your jaw a bit more heroic than reality, no? Ha! I joke, I joke. You earned every brushstroke.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "Peace settles over the Morales empire like the first rain after a long drought. But something has changed in El Jefe's eyes -- a weariness that wasn't there before. The lion is thinking about resting." }
  ],
  boss: null
},
{
  id: 'morales_ch23',
  title: "El Jefe's Decision",
  act: 5,
  actTitle: 'La Corona',
  rankOnComplete: null,
  respectGain: 33,
  narrative: [
    { type: 'scene', text: "Sunset over the hacienda. El Jefe sits on the veranda, watching Isabella walk through the garden with Sofia. He holds a glass of aged tequila but hasn't touched it. The golden light paints everything in amber and shadow." },
    { type: 'dialogue', text: 'When I was young, I swore I would build an empire so big that my family would never know hunger, never know fear. I built the empire. But the fear? The fear found us anyway. It always does.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: "El Jefe has been quiet for weeks -- attending fewer meetings, spending more time with Sofia and Isabella. The old fire still burns in his eyes, but it's softer now, directed inward. Something monumental is brewing behind that weathered face." },
    { type: 'dialogue', text: 'I have made a decision. Perhaps the hardest decision of my life. I am going to retire. Step away. Let someone younger, someone hungrier carry the weight. My family needs a father -- not a general.', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: 'Ricardo... are you sure? This empire IS you. Without you at the helm--', speaker: 'Sofia Morales' },
    { type: 'dialogue', text: 'Without me at the helm, it will survive. Because I chose my successor well. I chose someone who loves this family as much as I do.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 80, text: 'Complete 80 jobs (any type)' },
    { type: 'money', target: 170000, text: 'Secure $170,000 in transition funds' },
    { type: 'gang', target: 13, text: 'Grow the organization to 13 loyal members' },
    { type: 'properties', target: 4, text: 'Control 4 key properties across the empire' },
    { type: 'reputation', target: 875, text: 'Reach 875 Respect' }
  ],
  rewards: { money: 72000, experience: 1480, reputation: 37 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'El Jefe gathers the entire Morales leadership for a private announcement. The room falls silent as the most powerful drug lord on the border tells them he is stepping down.' },
    { type: 'dialogue', text: 'I have fought for forty years. I have buried friends, enemies, and too many young men who deserved better. Now I want to watch my daughter become a doctor. I want to grow old with my wife. I want peace. And so -- I am naming my successor.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'Every eye in the room turns to you. Diego nods slowly. Sofia wipes a tear from her cheek. The torch is about to be passed.' }
  ],
  boss: null
},
{
  id: 'morales_ch24',
  title: 'Passing the Torch',
  act: 5,
  actTitle: 'La Corona',
  rankOnComplete: null,
  respectGain: 34,
  narrative: [
    { type: 'scene', text: 'The weeks before the succession are a whirlwind of preparation. Every contact, every route, every alliance, every secret -- El Jefe shares it all. Late nights in his study, maps and ledgers spread between tequila glasses and cigar smoke.' },
    { type: 'dialogue', text: 'This ledger contains every payment to every official who has ever looked the other way. Memorize it. Then burn it. The information lives in your head now -- nowhere else.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'Diego takes you on a tour of every operation, every safe house, every tunnel. He introduces you to contacts in government, in law enforcement, in rival organizations. He teaches you the language of power -- spoken in favors, threats, and gold.' },
    { type: 'dialogue', text: "I serve the Morales name, not the man. El Jefe is stepping down, but the name endures. You carry it now. Don't make it lighter than it is -- it should always feel heavy. That's how you know you're doing it right.", speaker: 'Diego Vargas' }
  ],
  objectives: [
    { type: 'jobs', target: 85, text: 'Complete 85 jobs (any type)' },
    { type: 'money', target: 200000, text: 'Manage $200,000 in cartel assets' },
    { type: 'gang', target: 14, text: 'Command loyalty of 14 crew members' },
    { type: 'properties', target: 4, text: 'Oversee all 4 key cartel properties' },
    { type: 'reputation', target: 950, text: 'Reach 950 Respect' }
  ],
  rewards: { money: 86000, experience: 1740, reputation: 44 },
  choice: {
    prompt: 'With total power approaching, you must decide the future direction of the Morales Cartel.',
    options: [
      { text: "Honor the old ways -- maintain tradition, keep Sofia's values, respect the culture that built this empire", effect: 'respect', value: 15 },
      { text: 'Modernize the operation -- new technology, new markets, evolve the empire into something the world has never seen', effect: 'money', value: 50000 }
    ]
  },
  completionNarrative: [
    { type: 'scene', text: 'The final night before the coronation. El Jefe finds you alone on the veranda where he once sat watching sunsets. He carries two glasses and the oldest bottle of tequila in his collection.' },
    { type: 'dialogue', text: "This bottle was given to me by my father the night before he died. He said -- save it for the moment you know your life's work is complete. I've been saving it for thirty-seven years. Tonight, it is complete.", speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: 'Tomorrow, you will be El Jefe. But tonight, you are my friend. My brother. The person who saved my daughter and gave an old man the courage to rest. Salud, mi amigo. Salud.', speaker: 'El Jefe Morales' },
    { type: 'narration', text: 'You drink together in silence as the stars wheel overhead. Two men, bound by blood and fire, sharing the last quiet moment before everything changes.' }
  ],
  boss: null
},
{
  id: 'morales_ch25',
  title: 'La Corona',
  act: 5,
  actTitle: 'La Corona',
  rankOnComplete: 'don',
  respectGain: 35,
  narrative: [
    { type: 'scene', text: 'The Morales compound has been transformed. Thousands of marigold petals cover the courtyard in rivers of gold and orange. Candles line every wall, every archway, every step. A mariachi band plays softly as the entire Morales organization gathers -- soldiers, lieutenants, capos, and family.' },
    { type: 'narration', text: "This is La Corona -- the crowning ceremony, performed only four times in the Morales Cartel's fifty-year history. It is part coronation, part wedding, part funeral for the old regime. El Jefe stands at the center in his finest white suit, a golden crown -- symbolic, ornate, forged by the same Guadalajara jeweler who made the lieutenant rings -- resting on a velvet cushion beside him." },
    { type: 'dialogue', text: 'For forty years, I have led this family. Through blood and fire, through joy and grief, through the tunnels and across the borders. Every scar on my body tells a story. Every gray hair is a battle survived. But today, my story ends -- and yours begins.', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: 'You are the one I chose. Not because you are the strongest -- Diego would win that contest. Not because you are the smartest -- Sofia would claim that honor. But because you have the biggest heart. And in this life of fire and blood, it is the heart that matters most.', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: 'Take care of my family. Take care of my people. And when the world tests you -- and it will -- remember that you are not just a criminal, not just a boss. You are the keeper of a legacy. You are Morales. You are family.', speaker: 'El Jefe Morales' }
  ],
  objectives: [
    { type: 'jobs', target: 90, text: 'Complete 90 jobs (any type)' },
    { type: 'money', target: 250000, text: 'Command $250,000 in cartel wealth' },
    { type: 'gang', target: 15, text: 'Lead an organization of 15 loyal members' },
    { type: 'properties', target: 5, text: 'Control all 5 Morales empire properties' },
    { type: 'reputation', target: 1050, text: 'Reach 1050 Respect' }
  ],
  rewards: { money: 100000, experience: 2000, reputation: 50 },
  choice: null,
  completionNarrative: [
    { type: 'scene', text: 'El Jefe lifts the golden crown from its cushion and places it on your head. The courtyard erupts -- gunshots into the air, mariachi horns blaring, flowers thrown, tears flowing freely. Sofia embraces you. Diego drops to one knee. Isabella whispers a prayer.' },
    { type: 'dialogue', text: 'Rise, El Jefe. Rise and lead your people. The Morales Cartel lives on -- stronger, fiercer, united by blood and bound by love. Viva Morales! VIVA MORALES!', speaker: 'El Jefe Morales' },
    { type: 'dialogue', text: "I'm going to call you 'boss' now, aren't I? Don't let it go to your head. I still have the knife, and I'm still faster than you.", speaker: 'Diego Vargas' },
    { type: 'narration', text: "The crown settles on your brow -- warm from El Jefe's hands, heavy with history. The marigold petals swirl in the evening breeze as the Morales empire enters a new era. Fire and blood brought you here. Love and loyalty will carry you forward. You are El Jefe now. You are La Corona. And the Morales legacy -- of passion, of family, of fire and blood -- lives on through you." }
  ],
  boss: null
}
    ],
  },
};


// ================================================================
//  LEGACY EXPORTS (kept for backwards compatibility)
// ================================================================

export const factionMissions = { torrino: [], kozlov: [], chen: [], morales: [] };
export const missionProgress = {
  activeCampaign: null,
  completedCampaigns: [],
  completedMissions: [],
  availableFactionMissions: {},
  unlockedTurfMissions: [],
  unlockedBossBattles: [],
  factionReputation: { torrino: 0, kozlov: 0, chen: 0, morales: 0 }
};
