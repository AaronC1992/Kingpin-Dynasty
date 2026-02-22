/**
 * narration.js
 * 
 * Manages narrative variations and random narration selection for the game.
 * Provides thematic, mafia-style flavor text for various game events
 * (job outcomes, jail sentences, car theft, etc.).
 * 
 * Weather and season-aware: ~50% of the time a contextual message is chosen
 * that references the current conditions, giving the player gameplay hints.
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

// ==================== WEATHER-SPECIFIC NARRATIONS ====================
// These reference gameplay effects so players learn how weather impacts them
const weatherNarrations = {
    // --- JOB SUCCESS ---
    jobSuccess_rain: [
        " The downpour masked your movements perfectly — fewer eyes on the street when it's pouring. Rain is a criminal's best friend.",
        " Rainwater washes away the evidence. The storm kept witnesses indoors and gave you the edge you needed.",
        " The steady rain drumming on rooftops covered any noise you made. Wet streets, clean getaway.",
        " Nobody lingers in the rain. You moved through empty streets like a phantom — easy money tonight."
    ],
    jobSuccess_drizzle: [
        " A light drizzle kept the sidewalks thin. Just enough cover to move without being noticed.",
        " The soft rain gave you a slight edge — people hurry home when it drizzles, leaving fewer witnesses."
    ],
    jobSuccess_snow: [
        " The snow muffled every footstep. Your tracks will be buried by morning — the evidence disappears with the drifts.",
        " A white blanket over the city. Nobody saw you coming, nobody will find a trace. Winter is kind to criminals.",
        " Fresh snowfall covered your escape route within minutes. Nature itself conspired in your favor tonight."
    ],
    jobSuccess_blizzard: [
        " The blizzard turned the city blind. Cops couldn't patrol, cameras were useless — you had the whole city to yourself.",
        " Whiteout conditions. The blizzard shut down half the police force and you capitalized. Brutal weather, beautiful score.",
        " Visibility was zero in that blizzard. You could've robbed the precinct itself and nobody would've seen a thing."
    ],
    jobSuccess_sleet: [
        " Icy sleet kept the streets deserted. Anyone with sense stayed home — which made your job a whole lot easier.",
        " The sleet stung like needles, but it kept every witness locked indoors. Pain for gain."
    ],
    jobSuccess_fog: [
        " The fog rolled in like a gift from the underworld. You were a ghost — invisible, untouchable. Perfect cover for dirty work.",
        " Dense fog swallowed the city. Witnesses couldn't see past their own hands. Your stealth advantage was enormous tonight.",
        " The thick fog turned the job into a cakewalk. Even the security cameras couldn't pierce this soup."
    ],
    jobSuccess_storm: [
        " Thunder and chaos — the storm knocked out power and scattered the cops. You moved through the pandemonium like a shark through dark water.",
        " The storm had police scrambling for emergencies elsewhere. Their distraction was your opportunity.",
        " Lightning lit the sky while you cleaned out the score. The storm's chaos was your best alibi."
    ],
    jobSuccess_heatwave: [
        " The scorching heat drove the cops off their foot patrols. Nobody patrols when it's this hot — except you.",
        " Half the city was hiding from the heat. Empty streets, lazy security, wilting witnesses. Heatwaves are good for business.",
        " The heat frays tempers and dulls attention. You exploited every distracted guard and drowsy lookout."
    ],
    jobSuccess_humid: [
        " The thick, muggy air slowed everyone down — everyone except you. While the city sweated, you scored.",
        " Oppressive humidity kept people sluggish and inattentive. Their discomfort was your advantage."
    ],
    jobSuccess_overcast: [
        " Grey skies and no shadows to give you away. An overcast day keeps things low-profile — just the way you like it.",
        " The dull, cloudy sky kept the streets quieter than usual. Less foot traffic, fewer witnesses."
    ],
    jobSuccess_clear: [
        " Bold move pulling this off under clear skies — but your skills spoke louder than the weather. Clean execution.",
        " Not a cloud in the sky and you still pulled it off. That's confidence. That's skill."
    ],

    // --- JOB FAILURE ---
    jobFailure_rain: [
        " The rain slowed you down when you needed speed. Wet hands, slippery surfaces — the weather cost you this one.",
        " You slipped on a rain-soaked step and the whole plan collapsed. The rain giveth cover, and the rain taketh away.",
        " The downpour turned your getaway into a slog. Your clothes are soaked and your pockets are empty."
    ],
    jobFailure_drizzle: [
        " Even a light drizzle can make things go sideways. Damp conditions and bad luck — not your night.",
        " The drizzle wasn't heavy enough to keep witnesses away, but enough to make you fumble. Worst of both worlds."
    ],
    jobFailure_snow: [
        " Your footprints in the fresh snow led them right to you. In winter, the ground itself betrays you.",
        " The cold slowed your fingers and the snow revealed your path. Winter fights against the careless.",
        " Snow might cover evidence eventually — but tonight it gave you away before it could help."
    ],
    jobFailure_blizzard: [
        " The blizzard was supposed to help, but you could barely see your own hands. You stumbled blind and the job fell apart.",
        " Whiteout conditions cut both ways. The blizzard blinded you as much as the cops. You burned energy fighting the storm and got nothing.",
        " That blizzard drained every ounce of strength you had. You retreated half-frozen with nothing to show for it."
    ],
    jobFailure_sleet: [
        " Ice-coated streets sent you skidding at the worst moment. The sleet turned your escape into a disaster.",
        " Sleet makes everything treacherous — roads, sidewalks, and criminal plans alike. You learned that the hard way."
    ],
    jobFailure_fog: [
        " The fog hid you, but it hid the guards too. You walked right into a patrol you never saw coming.",
        " So thick you could cut it — but the fog confused your sense of direction. You ended up where you shouldn't have been."
    ],
    jobFailure_storm: [
        " The storm knocked out your planning. Power outages, flooded streets — nothing went according to plan in this chaos.",
        " Lightning gave away your position at the worst possible moment. The storm betrayed you tonight.",
        " The storm drained your energy faster than expected. You were exhausted before the job even started."
    ],
    jobFailure_heatwave: [
        " The sweltering heat sapped your focus. You were drenched in sweat and making mistakes before you even started.",
        " Heatstroke nearly got you before the cops did. This scorching weather burns through energy fast.",
        " The heat made you sloppy. Tempers ran hot and your plan fell apart in the furnace of a city."
    ],
    jobFailure_humid: [
        " The thick, muggy air made every movement twice as exhausting. You ran out of steam before the finish line.",
        " Suffocating humidity drained your energy. You were gasping before the job even went wrong."
    ],
    jobFailure_overcast: [
        " Grey skies didn't help or hurt — this failure was all on you. The weather was neutral, the plan was not.",
        " An unremarkable day for a remarkable failure. The overcast sky watched your plan crumble without comment."
    ],
    jobFailure_clear: [
        " Clear skies meant clear sight lines — for the witnesses too. Everyone saw everything. Bad day for crime.",
        " Not a cloud to hide behind. Under these bright skies, you were exposed from the start."
    ],

    // --- CAR THEFT SUCCESS ---
    carTheftSuccess_rain: [
        "The rain kept everyone inside and puddles drowned out the sound of you breaking in. Perfect theft weather.",
        "Raindrops on the windshield, but your hands were steady. The wet streets made for a clean, quiet getaway."
    ],
    carTheftSuccess_snow: [
        "You brushed the snow off the windshield and drove off into a white haze. Your tire tracks are already filling in.",
        "The owner won't even notice 'til the snow melts. By then, this baby's long gone."
    ],
    carTheftSuccess_blizzard: [
        "Stole it in a blizzard — visibility zero. The owner could've watched from six feet away and seen nothing.",
        "Whiteout getaway. The car vanished into the blizzard like it never existed."
    ],
    carTheftSuccess_fog: [
        "The fog swallowed you and the car whole. You drove off into the mist like a ghost with new wheels.",
        "Dense fog turned the theft into a magic trick. Now you see the car, now you don't."
    ],
    carTheftSuccess_storm: [
        "Thunder covered the sound of the window breaking. The storm was your partner on this job.",
        "You drove off in the chaos of the storm. Nobody's chasing anyone in this weather."
    ],
    carTheftSuccess_heatwave: [
        "The heat drove everyone indoors and to their AC. The parking lot was yours for the taking.",
        "Too hot for anyone to care about a car alarm. You drove off while the city melted."
    ],
    carTheftSuccess_clear: [
        "Broad daylight, clear skies, and you still boosted it — that takes nerve. Respect.",
        "Not a cloud in the sky and you pulled it off anyway. Pure professional."
    ],

    // --- CAR THEFT FAILURE ---
    carTheftFailure_rain: [
        "Your tools slipped on the wet door handle. The rain turned your fingers into fumbling traitors.",
        "The rain made visibility poor, but it also made your grip worse. Couldn't get in."
    ],
    carTheftFailure_snow: [
        "Your footprints in the snow led straight to the car. A patrol spotted the trail before you could break in.",
        "Numb fingers from the cold — you couldn't work the lock. Winter doesn't favor car thieves."
    ],
    carTheftFailure_blizzard: [
        "The blizzard was supposed to be perfect cover, but you couldn't even find the cars under all that snow.",
        "Frozen locks, frozen hands, frozen plans. The blizzard shut everything down, including your crime."
    ],
    carTheftFailure_sleet: [
        "The icy sleet made every surface treacherous. You slipped trying to reach the car and had to abort.",
        "Sleet coated everything in a layer of ice — including the car doors. Couldn't even get a grip."
    ],
    carTheftFailure_fog: [
        "The fog hid the cars, but it hid the security cameras you walked right in front of. Close call.",
        "You couldn't tell a patrol car from a sedan in this fog. Wisely, you backed off."
    ],
    carTheftFailure_storm: [
        "The storm set off every car alarm on the block. Too much attention, too much noise. Had to bail.",
        "Lightning lit you up like a spotlight mid-break-in. The weather announced your crime to the whole street."
    ],
    carTheftFailure_heatwave: [
        "The metal was scorching hot to the touch. Between the heat burns and the sweat, you couldn't get a grip.",
        "The heatwave had people sitting on porches trying to cool off — too many eyes to risk it."
    ],
    carTheftFailure_clear: [
        "Clear skies, full visibility — every resident on the block had a front-row seat. No chance.",
        "Perfect weather for a walk, terrible weather for a theft. Too many people out enjoying the sunshine."
    ],

    // --- CAR THEFT DAMAGED ---
    carTheftDamaged_rain: [
        "You got the car but the wet roads made for a rough escape. Hydroplaned into a curb — it'll buff out. Maybe.",
        "Stolen in the rain, scratched in the chase. The slick streets didn't do the paint job any favors."
    ],
    carTheftDamaged_snow: [
        "The car is yours but it's sporting some new dents from sliding on icy patches. Winter driving tax.",
        "Fishtailed in the snow on the way out. The car's safe, but the bodywork tells a war story."
    ],
    carTheftDamaged_blizzard: [
        "Got the car, but driving through a blizzard did a number on it. Visibility was zero — hit something you never even saw.",
        "You boosted it in whiteout conditions. The dents are from things you literally couldn't avoid in the storm."
    ],
    carTheftDamaged_storm: [
        "The storm flung debris across the road during your getaway. The car took some hits but you're home free.",
        "A tree branch came down mid-escape. The car caught it, but at least you kept moving."
    ],
    carTheftDamaged_sleet: [
        "Icy roads turned the getaway into a demolition derby. The car slid into practically everything.",
        "You got the wheels, but the sleet made the drive back a bumper-car nightmare."
    ],

    // --- CAR DAMAGE (during jobs) ---
    carDamage_rain: [
        " The wet roads didn't help — your car slid and scraped through the escape. Rain takes its toll on paintwork.",
        " Hydroplaning during the getaway left some new dents. Rainy conditions punish your ride."
    ],
    carDamage_snow: [
        " Icy roads and poor traction — your car took a beating sliding on winter streets. Cold weather is hard on vehicles.",
        " Snow and ice chewed up your undercarriage. Winter driving adds damage to every job."
    ],
    carDamage_blizzard: [
        " The blizzard battered your car mercilessly. Visibility zero, impacts from debris — severe vehicle damage.",
        " Driving through a blizzard is brutal on any vehicle. Your ride paid a steep price for the getaway."
    ],
    carDamage_sleet: [
        " The icy sleet coated the road and you lost control twice during the escape. Your car shows every impact.",
        " Sleet turns roads into skating rinks. Your car's body panels can testify to that."
    ],
    carDamage_storm: [
        " The storm flung branches and debris into your path. Your car is dented but still rolling.",
        " Storm damage — the weather itself attacked your vehicle during the job."
    ],

    // --- HEALTH LOSS ---
    healthLoss_blizzard: [
        " The blizzard sapped your strength. Frostbite on your fingers, ice in your lungs. Winter is unforgiving.",
        " Between the job and the blizzard, your body took a pounding. The cold alone nearly finished you."
    ],
    healthLoss_heatwave: [
        " The scorching heat compounded your injuries. Dehydration and exhaustion hit you like a second beating.",
        " Between the violence and the heatwave, your body is running on fumes. The heat is a silent enemy."
    ],
    healthLoss_storm: [
        " The storm battered you on top of everything else. Nature and the streets teaming up against you tonight.",
        " Soaked, battered, and bleeding — the storm made your injuries that much worse."
    ],
    healthLoss_snow: [
        " The bitter cold numbs the pain but slows the healing. Wounds don't close fast when the temperature drops.",
        " Blood on the fresh snow. The cold keeps you alert, but your body is paying the price."
    ]
};

// ==================== SEASON-SPECIFIC NARRATIONS ====================
// These reference the overall feel of each season
const seasonNarrations = {
    // --- JOB SUCCESS ---
    jobSuccess_spring: [
        " Spring rain washes the streets clean — and your criminal record stays spotless after tonight's work.",
        " The city is coming alive with spring. New season, new opportunities, new scores.",
        " Fresh spring air and fresh cash. The thaw brings new life to the streets and your wallet."
    ],
    jobSuccess_summer: [
        " Long summer nights mean more time for business. The city never sleeps when it's warm, and neither do you.",
        " Summer heat makes people careless. Their laziness lined your pockets tonight.",
        " Another hot summer score. The nights are long and profitable."
    ],
    jobSuccess_autumn: [
        " Autumn shadows fall early — more darkness means more cover for the Family's operations.",
        " The leaves fall and the money flows. Autumn's early dusk is a thief's best friend.",
        " Crisp autumn air and a crisp payday. The shortening days work in your favor."
    ],
    jobSuccess_winter: [
        " Cold hands, warm pockets. Winter keeps the streets empty and the scores easy for those tough enough.",
        " The long winter night was your ally. Darkness came early and stayed late — plenty of time to work.",
        " They say crime doesn't pay in winter. They're wrong. It pays those who brave the cold."
    ],

    // --- JOB FAILURE ---
    jobFailure_spring: [
        " Spring showers made a mess of the job. The thaw isn't just for ice — your plans melted too.",
        " Everything's blooming but your criminal career. Spring can be unpredictable."
    ],
    jobFailure_summer: [
        " The summer heat got to you. Dehydration and frustration — the season of burnout strikes again.",
        " Long summer days mean more daylight, more witnesses, more chances things go wrong."
    ],
    jobFailure_autumn: [
        " The autumn wind seemed to carry your plans away with the falling leaves. Nothing stuck tonight.",
        " Short days, shorter tempers. The autumn chill made everyone edgy, including you."
    ],
    jobFailure_winter: [
        " The winter cold froze more than the pipes tonight — it froze your plans solid. Nothing went right.",
        " Bitter winter, bitter failure. The cold makes everything harder and your mistakes costlier."
    ],

    // --- CAR THEFT SUCCESS ---
    carTheftSuccess_spring: [
        "Spring rain on the windshield as you pull away with someone else's ride. Poetic, almost.",
        "The spring thaw loosened up more than just the ice — it loosened up that car's security too."
    ],
    carTheftSuccess_summer: [
        "Windows down, summer breeze, stolen wheels. Life of crime has its perks.",
        "The owner's probably at the beach. They won't notice 'til September."
    ],
    carTheftSuccess_autumn: [
        "You pulled away as autumn leaves scattered in your wake. Cinematic getaway.",
        "The early dusk gave you perfect timing. Gone before the streetlights finished flickering on."
    ],
    carTheftSuccess_winter: [
        "The engine coughed in the cold but turned over. You drove off into a frozen, empty city.",
        "No one's lingering outside in winter. The car was sitting there alone, practically begging."
    ],

    // --- CAR THEFT FAILURE ---
    carTheftFailure_spring: [
        "Spring has everyone out walking and enjoying the weather. Too many eyes for a clean boost.",
        "The spring crowds made it impossible. Everyone's out after winter hibernation."
    ],
    carTheftFailure_summer: [
        "Block parties and barbecues — half the neighborhood was outside at 10pm. Summer is terrible for car theft.",
        "The long twilight betrayed you. Still too much light at this hour in summer."
    ],
    carTheftFailure_autumn: [
        "Dead leaves crunching underfoot announced your approach. Autumn's natural alarm system got you.",
        "The autumn dusk played tricks with the shadows. You misjudged the timing."
    ],
    carTheftFailure_winter: [
        "Your fingers were too numb from the cold to work the tools. Winter defeats car thieves with frostbite.",
        "The car was buried under snow and ice. By the time you cleared it, a patrol swung by."
    ]
};

/**
 * Get a random narration string for a given category.
 * ~50% of the time, returns a weather- or season-specific narration
 * that hints at gameplay effects, keeping the text fresh and immersive.
 * 
 * @param {string} category - The narration category (e.g., 'jobSuccess', 'jailSentences')
 * @returns {string} A random narration string from that category, or empty string if category not found
 */
export function getRandomNarration(category) {
    // Try to pull contextual narration ~50% of the time
    if (Math.random() < 0.5) {
        const weather = (typeof window !== 'undefined' && window.currentWeather) || null;
        const season = (typeof window !== 'undefined' && window.currentSeason) || null;

        // 60% chance to use weather-specific, 40% season-specific (when both exist)
        const preferWeather = Math.random() < 0.6;

        if (preferWeather && weather) {
            const weatherKey = `${category}_${weather}`;
            if (weatherNarrations[weatherKey] && weatherNarrations[weatherKey].length > 0) {
                return weatherNarrations[weatherKey][Math.floor(Math.random() * weatherNarrations[weatherKey].length)];
            }
        }
        
        if (season) {
            const seasonKey = `${category}_${season}`;
            if (seasonNarrations[seasonKey] && seasonNarrations[seasonKey].length > 0) {
                return seasonNarrations[seasonKey][Math.floor(Math.random() * seasonNarrations[seasonKey].length)];
            }
        }

        // Fall through to weather if season didn't match
        if (!preferWeather && weather) {
            const weatherKey = `${category}_${weather}`;
            if (weatherNarrations[weatherKey] && weatherNarrations[weatherKey].length > 0) {
                return weatherNarrations[weatherKey][Math.floor(Math.random() * weatherNarrations[weatherKey].length)];
            }
        }
    }

    // Default: pick from the generic pool
    const variations = narrationVariations[category];
    if (!variations || variations.length === 0) return "";
    return variations[Math.floor(Math.random() * variations.length)];
}
