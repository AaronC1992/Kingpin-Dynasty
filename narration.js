/**
 * narration.js
 * 
 * Manages narrative variations and random narration selection for the game.
 * Provides thematic, mafia-style flavor text for various game events
 * (job outcomes, jail sentences, car theft, etc.).
 */

export const narrationVariations = {
    jobFailure: [
        " The job went south, kid. You walk away with nothing but your life. The Family doesn't forgive easily.",
        " A disaster. The Feds swarmed the joint. The Don will have words with you.",
        " Amateur hour! You fumbled like a street punk. In this Family, you earn respect or you disappear.",
        " The plan fell apart. In this life, mistakes can be fatal. Keep your mouth shut or face exile.",
        " Luck wasn't with you. You leave empty-handed, swearing on your mother's grave to do better for the Family next time.",
        " A mess from start to finish. You're lucky you're not sleeping with the fishes tonight."
    ],
    
    jobSuccess: [
        " The job's done. You slip away with the cash, smooth and professional. That's how a Consigliere would handle it.",
        " Another score for the Family. You showed respect and precision. The Don will hear of your loyalty.",
        " Clean work. No witnesses, no heat. The Family's respect for you grows.",
        " A professional hit. You executed the plan flawlessly. This is what separates a Made Man from a nobody.",
        " Perfect execution. The money is in hand, and the message has been sent. A good day for business.",
        " Textbook work. You handled the situation like a true professional. Time to enjoy the spoils."
    ],
    
    jailSentences: [
        " The steel bars slam shut. You kept your mouth shut, like a true man of honor. Now you do your time.",
        " Caught by the Feds. You know the drill - say nothing, admit nothing. The Family will look after you... eventually.",
        " A temporary setback. You're in the joint now, surrounded by rats and snitches. Keep your head down and your eyes open.",
        " The judge threw the book at you. Now you're just another number in the system. Don't let them break you.",
        " Handcuffs and a cold cell. The price of doing business. Remember the code - silence is golden.",
        " The law won this round. You're behind bars, but your mind is still on the streets. Bide your time."
    ],
    
    jailBreakouts: [
        " You're out! Slipping past the guards like a ghost. The air outside tastes like freedom and opportunity.",
        " A clean break. You left the joint without a trace. The Feds will be scratching their heads for weeks.",
        " Escape artist! You navigated the walls and fences like you owned the place. Back to business.",
        " The perfect escape. You orchestrated it with the precision of a bank heist. Freedom is yours again.",
        " Vanished into thin air. You left the cage behind, leaving the guards looking like fools.",
        " Prison couldn't hold you. You walked out like you were checking out of a hotel. The streets are calling."
    ],
    
    carTheftSuccess: [
        "Clean getaway! The vehicle is now property of the Family.",
        "A smooth lift. You hotwired the ride and drove off before anyone noticed. Nice wheels.",
        "Professional work. The car practically begged to be taken. It's in the garage now.",
        "Flawless. You slipped into the driver's seat and claimed what was yours. Welcome to your new ride.",
        "Taken like a pro. The car is yours, and the owner is none the wiser.",
        "Masterful. You acquired the vehicle with the skill of a veteran. It's safe in the garage."
    ],
    
    carTheftDamaged: [
        "You got the car, but it was messy. It's in the garage, but it'll need some work.",
        "Success, but at a cost. You secured the vehicle, but left a bit of a trail. Be careful.",
        "Mission accomplished, barely. The car is yours, but it's seen better days after that escape.",
        "Stolen, but scarred. You got the wheels, but it wasn't the cleanest job.",
        "Victory with complications. The car is in the garage, but the heat is on.",
        "Hard-earned wheels. You got it, but it was a fight. It's safe now, mostly."
    ],
    
    carTheftFailure: [
        "You scouted for wheels, but found nothing worth the risk.",
        "No luck. Every car was too hot or too guarded. Better to walk away than get pinched.",
        "Slim pickings. The streets are crawling with cops. Not the night for a lift.",
        "Bad timing. Every target had eyes on it. You walked away to fight another day.",
        "Too much heat. You couldn't find an opening. Smart move to lay low.",
        "Tough break. All the good rides were locked down tight. Maybe next time."
    ],
    
    healthLoss: [
        " You took a hit. Blood on your suit, but you're still standing. Tough it out.",
        " That hurt. You patch yourself up, reminding yourself that this life has a price.",
        " A painful lesson. You took some damage, but you're not out of the game yet.",
        " Battle scars. You add another one to the collection. Wear it with pride.",
        " Rough night. You took a beating, but you're still breathing. Others weren't so lucky.",
        " Violence is part of the job. You learned that the hard way tonight."
    ],
    
    jailBreakoutFailure: [
        " The guards were waiting. Your escape attempt failed. Back to the hole.",
        " Busted. Security was too tight. You're back in your cell, with more time to think.",
        " So close. You almost made it, but the alarms sounded. Back to square one.",
        " Amateur mistake. Your plan fell apart. You're not going anywhere anytime soon.",
        " The walls held. Your attempt was futile. You're stuck in here for now.",
        " Dragged back. The guards caught you. You're in deeper trouble now."
    ],
    
    territoryExpansionSuccess: [
        " Territory secured. The Family's shadow stretches further. This neighborhood now pays tribute to the Don. ",
        " Expansion complete! You claim another piece of the city as your own. The neighborhood knows who's in charge now.",
        " Turf war victory! Your gang plants its flag in new territory. Respect and revenue follow conquest.",
        " Street domination! You extend your reach across another block. This city is slowly becoming yours.",
        " New ground claimed! Your criminal empire grows with each successful expansion. Power has its rewards.",
        " Territory conquered! Another district falls under your control. Building an empire one block at a time."
    ],
    
    territoryExpansionFailure: [
        " Expansion failed! The locals fought back harder than expected. You retreat with fewer soldiers than you started with.",
        " Hostile takeover denied! The enemy was ready for you. Your gang takes losses in the failed power grab.",
        " Turf war casualty! Your attempt to expand backfires spectacularly. Some of your crew won't be coming home.",
        " Strategic withdrawal! The operation goes south fast. Better to retreat now than lose everyone in a hopeless fight.",
        " Costly mistake! Your expansion attempt becomes a bloodbath. The streets remember failed ambitions.",
        " Territory defense wins! The locals prove that they won't give up their turf without a fight. You pay the price."
    ],
    
    recruitmentSuccess: [
        " New blood joins the crew! Fresh talent means fresh opportunities in the criminal underworld.",
        " Welcome to the Family! Another soldier joins your ranks, ready to earn respect and serve the Don. ",
        " Recruitment successful! Your gang grows stronger with each new member willing to walk the criminal path.",
        " Street partnership formed! New talent brings new skills to your organization. The crew expands.",
        " Another ally secured! Your criminal network grows as ambitious newcomers join the cause.",
        " Gang member acquired! Fresh faces bring fresh energy to your criminal enterprise."
    ],
    
    prisonerBreakoutSuccess: [
        " Liberation achieved! Another soul freed from concrete and steel. Your reputation as a liberator grows.",
        " Jailbreak mastermind! You orchestrate the perfect escape. The underground respects those who free their own.",
        " Freedom fighter! You turn the prison into a revolving door. Guards are left scratching their heads.",
        " Rescue mission complete! You prove that no cage can hold those with friends on the outside.",
        " Prison break success! Your reputation for springing people grows with each successful operation.",
        " Liberation operation successful! You add another name to your list of successful jailbreaks."
    ],
    
    prisonerBreakoutFailure: [
        " Breakout blown! Security was ready for your rescue attempt. Sometimes the system wins.",
        " Mission compromised! The guards saw through your plan faster than you could execute it.",
        " Rescue attempt failed! The prison proves that not all liberation missions succeed.",
        " Operation shutdown! Your jailbreak plan crumbles under the weight of tight security.",
        " Caught in the act! Your attempt to free a fellow criminal backfires spectacularly.",
        " Security victory! The guards prove they're not as incompetent as you thought."
    ],
    
    carDamage: [
        " Your ride takes a beating! Metal scrapes and glass cracks as the job gets rough. The car's seen better days.",
        " Rough driving! Your vehicle shows the wear and tear of a life lived on the edge.",
        " Battle damage! The car bears new scars from your latest criminal enterprise.",
        " Wear and tear! Each job leaves its mark on your wheels - the price of doing business.",
        " Road warrior wounds! Your car accumulates damage like a veteran of street warfare.",
        " Mechanical casualties! The vehicle pays the price for your dangerous lifestyle."
    ]
};

/**
 * Get a random narration string for a given category
 * @param {string} category - The narration category (e.g., 'jobSuccess', 'jailSentences')
 * @returns {string} A random narration string from that category, or empty string if category not found
 */
export function getRandomNarration(category) {
    const variations = narrationVariations[category];
    if (!variations || variations.length === 0) return "";
    return variations[Math.floor(Math.random() * variations.length)];
}
