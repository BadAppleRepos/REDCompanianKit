/*
 * Game data for Cyberpunk RED.
 * Numbers (costs, humanity loss, SP, damage) follow the core rulebook as closely as possible,
 * but double-check them against your book — everything here is plain data and easy to edit.
 * Humanity Loss: `hl` is the average used by default, `hlDice` is what you roll if you want random.
 */
window.CPR = window.CPR || {};

CPR.DATA = {
  STATS: [
    { id: 'INT', name: 'Intelligence' },
    { id: 'REF', name: 'Reflexes' },
    { id: 'DEX', name: 'Dexterity' },
    { id: 'TECH', name: 'Technique' },
    { id: 'COOL', name: 'Cool' },
    { id: 'WILL', name: 'Willpower' },
    { id: 'LUCK', name: 'Luck' },
    { id: 'MOVE', name: 'Move' },
    { id: 'BODY', name: 'Body' },
    { id: 'EMP', name: 'Empathy' },
  ],

  RULES: {
    statPoints: 62, statMin: 2, statMax: 8,
    skillPoints: 86, skillMaxAtCreation: 6, basicSkillMin: 2,
    startingRoleRank: 4,
    startingMoney: 2550,
  },

  ROLES: [
    { id: 'rockerboy', name: 'Rockerboy', ability: 'Charismatic Impact', desc: 'Rebel rockers who use performance to fight authority and sway fans.' },
    { id: 'solo', name: 'Solo', ability: 'Combat Awareness', desc: 'Bodyguards, assassins and soldiers for hire.' },
    { id: 'netrunner', name: 'Netrunner', ability: 'Interface', desc: 'Hackers who jack into the NET to break systems.' },
    { id: 'tech', name: 'Tech', ability: 'Maker', desc: 'Renegade mechanics and inventors who fix, upgrade and invent.' },
    { id: 'medtech', name: 'Medtech', ability: 'Medicine', desc: 'Street doctors who patch up meat and chrome.' },
    { id: 'media', name: 'Media', ability: 'Credibility', desc: 'Reporters and influencers who expose the truth.' },
    { id: 'exec', name: 'Exec', ability: 'Teamwork', desc: 'Corporate climbers with a team at their back.' },
    { id: 'lawman', name: 'Lawman', ability: 'Backup', desc: 'Cops and marshals who can call in support.' },
    { id: 'fixer', name: 'Fixer', ability: 'Operator', desc: 'Deal makers, smugglers and information brokers.' },
    { id: 'nomad', name: 'Nomad', ability: 'Moto', desc: 'Road warriors with a family vehicle pool.' },
  ],

  // cat: skill category, stat: linked stat, x2: costs double, basic: starts at 2 minimum
  SKILLS: [
    // Awareness
    { name: 'Concentration', cat: 'Awareness', stat: 'WILL', basic: true },
    { name: 'Conceal/Reveal Object', cat: 'Awareness', stat: 'INT' },
    { name: 'Lip Reading', cat: 'Awareness', stat: 'INT' },
    { name: 'Perception', cat: 'Awareness', stat: 'INT', basic: true },
    { name: 'Tracking', cat: 'Awareness', stat: 'INT' },
    // Body
    { name: 'Athletics', cat: 'Body', stat: 'DEX', basic: true },
    { name: 'Contortionist', cat: 'Body', stat: 'DEX' },
    { name: 'Dance', cat: 'Body', stat: 'DEX' },
    { name: 'Endurance', cat: 'Body', stat: 'WILL' },
    { name: 'Resist Torture/Drugs', cat: 'Body', stat: 'WILL' },
    { name: 'Stealth', cat: 'Body', stat: 'DEX', basic: true },
    // Control
    { name: 'Drive Land Vehicle', cat: 'Control', stat: 'REF' },
    { name: 'Pilot Air Vehicle', cat: 'Control', stat: 'REF', x2: true },
    { name: 'Pilot Sea Vehicle', cat: 'Control', stat: 'REF' },
    { name: 'Riding', cat: 'Control', stat: 'REF' },
    // Education
    { name: 'Accounting', cat: 'Education', stat: 'INT' },
    { name: 'Animal Handling', cat: 'Education', stat: 'INT' },
    { name: 'Bureaucracy', cat: 'Education', stat: 'INT' },
    { name: 'Business', cat: 'Education', stat: 'INT' },
    { name: 'Composition', cat: 'Education', stat: 'INT' },
    { name: 'Criminology', cat: 'Education', stat: 'INT' },
    { name: 'Cryptography', cat: 'Education', stat: 'INT' },
    { name: 'Deduction', cat: 'Education', stat: 'INT' },
    { name: 'Education', cat: 'Education', stat: 'INT', basic: true },
    { name: 'Gamble', cat: 'Education', stat: 'INT' },
    { name: 'Language (Streetslang)', cat: 'Education', stat: 'INT', basic: true },
    { name: 'Library Search', cat: 'Education', stat: 'INT' },
    { name: 'Local Expert (Your Home)', cat: 'Education', stat: 'INT', basic: true },
    { name: 'Science', cat: 'Education', stat: 'INT' },
    { name: 'Tactics', cat: 'Education', stat: 'INT' },
    { name: 'Wilderness Survival', cat: 'Education', stat: 'INT' },
    // Fighting
    { name: 'Brawling', cat: 'Fighting', stat: 'DEX', basic: true },
    { name: 'Evasion', cat: 'Fighting', stat: 'DEX', basic: true },
    { name: 'Martial Arts', cat: 'Fighting', stat: 'DEX', x2: true },
    { name: 'Melee Weapon', cat: 'Fighting', stat: 'DEX' },
    // Performance
    { name: 'Acting', cat: 'Performance', stat: 'COOL' },
    { name: 'Play Instrument', cat: 'Performance', stat: 'TECH' },
    // Ranged Weapon
    { name: 'Archery', cat: 'Ranged Weapon', stat: 'REF' },
    { name: 'Autofire', cat: 'Ranged Weapon', stat: 'REF', x2: true },
    { name: 'Handgun', cat: 'Ranged Weapon', stat: 'REF' },
    { name: 'Heavy Weapons', cat: 'Ranged Weapon', stat: 'REF', x2: true },
    { name: 'Shoulder Arms', cat: 'Ranged Weapon', stat: 'REF' },
    // Social
    { name: 'Bribery', cat: 'Social', stat: 'COOL' },
    { name: 'Conversation', cat: 'Social', stat: 'EMP', basic: true },
    { name: 'Human Perception', cat: 'Social', stat: 'EMP', basic: true },
    { name: 'Interrogation', cat: 'Social', stat: 'COOL' },
    { name: 'Persuasion', cat: 'Social', stat: 'COOL', basic: true },
    { name: 'Personal Grooming', cat: 'Social', stat: 'COOL' },
    { name: 'Streetwise', cat: 'Social', stat: 'COOL' },
    { name: 'Trading', cat: 'Social', stat: 'COOL' },
    { name: 'Wardrobe & Style', cat: 'Social', stat: 'COOL' },
    // Technique
    { name: 'Air Vehicle Tech', cat: 'Technique', stat: 'TECH' },
    { name: 'Basic Tech', cat: 'Technique', stat: 'TECH' },
    { name: 'Cybertech', cat: 'Technique', stat: 'TECH' },
    { name: 'Demolitions', cat: 'Technique', stat: 'TECH', x2: true },
    { name: 'Electronics/Security Tech', cat: 'Technique', stat: 'TECH', x2: true },
    { name: 'First Aid', cat: 'Technique', stat: 'TECH', basic: true },
    { name: 'Forgery', cat: 'Technique', stat: 'TECH' },
    { name: 'Land Vehicle Tech', cat: 'Technique', stat: 'TECH' },
    { name: 'Paint/Draw/Sculpt', cat: 'Technique', stat: 'TECH' },
    { name: 'Paramedic', cat: 'Technique', stat: 'TECH', x2: true },
    { name: 'Photography/Film', cat: 'Technique', stat: 'TECH' },
    { name: 'Pick Lock', cat: 'Technique', stat: 'TECH' },
    { name: 'Pick Pocket', cat: 'Technique', stat: 'TECH' },
    { name: 'Sea Vehicle Tech', cat: 'Technique', stat: 'TECH' },
    { name: 'Weaponstech', cat: 'Technique', stat: 'TECH' },
  ],

  /*
   * Cyberware body zones. Zones with a `foundation` need that piece installed before
   * options can go in; `slots` is the option-slot capacity. Zones without a foundation
   * are open lists (add as many rows as you like, up to `slots` before a warning).
   */
  CYBER_ZONES: [
    { id: 'neural', label: 'Head — Neuralware', body: 'head', foundation: 'neural_link', cat: 'neural', slots: 5 },
    { id: 'chips', label: 'Chipware', body: 'head', needs: 'chipware_socket', cat: 'chip', slots: 0,
      note: 'One chip per Chipware Socket installed in your Neural Link.' },
    { id: 'eyeL', label: 'Left Eye — Cyberoptics', body: 'eyes', foundation: 'cybereye', cat: 'optic', slots: 3 },
    { id: 'eyeR', label: 'Right Eye — Cyberoptics', body: 'eyes', foundation: 'cybereye', cat: 'optic', slots: 3 },
    { id: 'audio', label: 'Ears — Cyberaudio', body: 'ears', foundation: 'cyberaudio_suite', cat: 'audio', slots: 3 },
    { id: 'armL', label: 'Left Arm — Cyberarm', body: 'armL', foundation: 'cyberarm', cat: 'arm', slots: 4 },
    { id: 'armR', label: 'Right Arm — Cyberarm', body: 'armR', foundation: 'cyberarm', cat: 'arm', slots: 4 },
    { id: 'legL', label: 'Left Leg — Cyberleg', body: 'legL', foundation: 'cyberleg', cat: 'leg', slots: 3 },
    { id: 'legR', label: 'Right Leg — Cyberleg', body: 'legR', foundation: 'cyberleg', cat: 'leg', slots: 3 },
    { id: 'internal', label: 'Torso — Internal', body: 'torso', cat: 'internal', slots: 7 },
    { id: 'external', label: 'Skin — External', body: 'torso', cat: 'external', slots: 3 },
    { id: 'fashion', label: 'Fashionware', body: 'head', cat: 'fashion', slots: 7 },
    { id: 'borg', label: 'Borgware', body: 'torso', cat: 'borg', slots: 3 },
  ],

  CYBERWARE: [
    // ---- Foundations ----
    { id: 'neural_link', cat: 'foundation', name: 'Neural Link', cost: 500, hl: 7, hlDice: '2d6', desc: 'Required for all neuralware. 5 option slots.' },
    { id: 'cybereye', cat: 'foundation', name: 'Cybereye', cost: 100, hl: 7, hlDice: '2d6', desc: 'Replaces one eye. 3 option slots.' },
    { id: 'cyberaudio_suite', cat: 'foundation', name: 'Cyberaudio Suite', cost: 500, hl: 7, hlDice: '2d6', desc: 'Installed in the ears. 3 option slots.' },
    { id: 'cyberarm', cat: 'foundation', name: 'Cyberarm', cost: 500, hl: 7, hlDice: '2d6', desc: 'Replaces one arm; includes a standard hand. 4 option slots.' },
    { id: 'cyberleg', cat: 'foundation', name: 'Cyberleg', cost: 100, hl: 3, hlDice: '1d6', desc: 'Replaces one leg; includes a standard foot. 3 option slots.' },

    // ---- Neuralware (Neural Link options) ----
    { id: 'braindance_recorder', cat: 'neural', name: 'Braindance Recorder', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Records experiences as braindance.' },
    { id: 'chipware_socket', cat: 'neural', name: 'Chipware Socket', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Holds one piece of chipware.' },
    { id: 'interface_plugs', cat: 'neural', name: 'Interface Plugs', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Plug into cyberdecks, vehicles and smartguns.' },
    { id: 'kerenzikov', cat: 'neural', name: 'Kerenzikov', cost: 500, hl: 14, hlDice: '4d6', slots: 1, desc: '+2 to Initiative (always on). Cannot combine with Sandevistan.' },
    { id: 'sandevistan', cat: 'neural', name: 'Sandevistan', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: '+3 to Initiative for 1 minute, then cooldown.' },

    // ---- Chipware ----
    { id: 'chemical_analyzer', cat: 'chip', name: 'Chemical Analyzer', cost: 500, hl: 7, hlDice: '2d6', desc: 'Analyze substances by touch.' },
    { id: 'memory_chip', cat: 'chip', name: 'Memory Chip', cost: 10, hl: 0, hlDice: '0', desc: 'Data storage.' },
    { id: 'olfactory_boost', cat: 'chip', name: 'Olfactory Boost', cost: 100, hl: 7, hlDice: '2d6', desc: 'Track by scent.' },
    { id: 'pain_editor', cat: 'chip', name: 'Pain Editor', cost: 1000, hl: 14, hlDice: '4d6', desc: 'Ignore Seriously Wounded penalties.' },
    { id: 'skill_chip', cat: 'chip', name: 'Skill Chip', cost: 500, hl: 7, hlDice: '2d6', desc: 'Grants a skill at level 3 (x2 skills cost 1,000eb).' },
    { id: 'tactile_boost', cat: 'chip', name: 'Tactile Boost', cost: 100, hl: 7, hlDice: '2d6', desc: 'Sense motion through touch.' },

    // ---- Cyberoptics ----
    { id: 'anti_dazzle', cat: 'optic', name: 'Anti-Dazzle', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Immune to flashbang blinding.' },
    { id: 'chyron', cat: 'optic', name: 'Chyron', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Heads-up display window.' },
    { id: 'color_shift', cat: 'optic', name: 'Color Shift', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Change iris color.' },
    { id: 'dartgun', cat: 'optic', name: 'Dartgun', cost: 500, hl: 7, hlDice: '2d6', slots: 3, desc: 'One-shot concealed dart. Takes all 3 slots.' },
    { id: 'image_enhance', cat: 'optic', name: 'Image Enhance', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: '+2 Perception for sight.' },
    { id: 'low_light', cat: 'optic', name: 'Low Light / Infrared / UV', cost: 500, hl: 3, hlDice: '1d6', slots: 2, desc: 'See in darkness and heat signatures.' },
    { id: 'microoptics', cat: 'optic', name: 'MicroOptics', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Magnification up to 400x.' },
    { id: 'microvideo', cat: 'optic', name: 'MicroVideo', cost: 500, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Record video through the eye.' },
    { id: 'radiation_detector', cat: 'optic', name: 'Radiation Detector', cost: 1000, hl: 3, hlDice: '1d6', slots: 1, desc: 'See radiation as a glow.' },
    { id: 'targeting_scope', cat: 'optic', name: 'Targeting Scope', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: '+1 to Aimed Shots.' },
    { id: 'teleoptics', cat: 'optic', name: 'TeleOptics', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'See detail up to 800m away.' },
    { id: 'virtuality', cat: 'optic', name: 'Virtuality', cost: 100, hl: 2, hlDice: '1d6/2', slots: 2, desc: 'Project cyberspace/AR overlays. Needs both eyes.' },

    // ---- Cyberaudio ----
    { id: 'amplified_hearing', cat: 'audio', name: 'Amplified Hearing', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: '+2 Perception for hearing.' },
    { id: 'audio_recorder', cat: 'audio', name: 'Audio Recorder', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Record what you hear.' },
    { id: 'bug_detector', cat: 'audio', name: 'Bug Detector', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Beeps near listening devices.' },
    { id: 'homing_tracer', cat: 'audio', name: 'Homing Tracer', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Follow a tracer signal.' },
    { id: 'internal_agent', cat: 'audio', name: 'Internal Agent', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'An Agent built into your head.' },
    { id: 'level_damper', cat: 'audio', name: 'Level Damper', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Immune to deafening effects.' },
    { id: 'radio_communicator', cat: 'audio', name: 'Radio Communicator', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Radio within 1 mile.' },
    { id: 'radio_scanner', cat: 'audio', name: 'Radio Scanner / Music Player', cost: 50, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Scan bands, play music.' },
    { id: 'radar_detector', cat: 'audio', name: 'Radar Detector', cost: 500, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Beeps when scanned by radar.' },
    { id: 'scrambler', cat: 'audio', name: 'Scrambler / Descrambler', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Encrypt your communications.' },
    { id: 'voice_stress', cat: 'audio', name: 'Voice Stress Analyzer', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: '+2 Human Perception (lies).' },

    // ---- Cyberarm options ----
    { id: 'big_knucks', cat: 'arm', name: 'Big Knucks', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: 'Armored knuckles; Medium Melee Weapon damage.' },
    { id: 'grapple_hand', cat: 'arm', name: 'Grapple Hand', cost: 100, hl: 3, hlDice: '1d6', slots: 2, desc: 'Launchable grapple with 30m line.' },
    { id: 'medscanner', cat: 'arm', name: 'Medscanner', cost: 1000, hl: 7, hlDice: '2d6', slots: 2, desc: '+2 First Aid and Paramedic.' },
    { id: 'popup_grenade', cat: 'arm', name: 'Popup Grenade Launcher', cost: 500, hl: 7, hlDice: '2d6', slots: 2, desc: 'Concealed grenade launcher, 1 shot.' },
    { id: 'popup_melee', cat: 'arm', name: 'Popup Melee Weapon', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Concealed Light/Medium/Heavy melee weapon.' },
    { id: 'popup_ranged', cat: 'arm', name: 'Popup Ranged Weapon', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Concealed one-handed ranged weapon.' },
    { id: 'popup_shield', cat: 'arm', name: 'Popup Shield', cost: 500, hl: 7, hlDice: '2d6', slots: 2, desc: 'Concealed bulletproof shield (10 HP).' },
    { id: 'quick_change', cat: 'arm', name: 'Quick Change Mount', cost: 100, hl: 3, hlDice: '1d6', slots: 0, desc: 'Swap cyberhands quickly. Uses no slots.' },
    { id: 'rippers', cat: 'arm', name: 'Rippers', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Claws; Medium Melee Weapon damage.' },
    { id: 'scratchers', cat: 'arm', name: 'Scratchers', cost: 100, hl: 2, hlDice: '1d6/2', slots: 1, desc: 'Fingernail blades; Light Melee damage.' },
    { id: 'slice_n_dice', cat: 'arm', name: "Slice 'n Dice", cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Monofilament wire; Medium Melee damage.' },
    { id: 'subdermal_grip', cat: 'arm', name: 'Subdermal Grip', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: 'Draw a smartgun-linked weapon fast.' },
    { id: 'techscanner', cat: 'arm', name: 'Techscanner', cost: 1000, hl: 7, hlDice: '2d6', slots: 2, desc: '+2 to many Tech skills.' },
    { id: 'tool_hand', cat: 'arm', name: 'Tool Hand', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: 'Built-in tools.' },
    { id: 'wolvers', cat: 'arm', name: 'Wolvers', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Knuckle blades; Heavy Melee damage.' },
    { id: 'cyberdeck_arm', cat: 'arm', name: 'Cyberdeck (Arm-mounted)', cost: 500, hl: 3, hlDice: '1d6', slots: 3, desc: 'Cyberdeck built into the arm.' },

    // ---- Cyberleg options ----
    { id: 'grip_foot', cat: 'leg', name: 'Grip Foot', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: 'Climb without penalties.' },
    { id: 'jump_booster', cat: 'leg', name: 'Jump Booster', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Leap far. Needs both legs.' },
    { id: 'skate_foot', cat: 'leg', name: 'Skate Foot', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Built-in skates, faster movement.' },
    { id: 'talon_foot', cat: 'leg', name: 'Talon Foot', cost: 500, hl: 3, hlDice: '1d6', slots: 1, desc: 'Foot blade; Medium Melee damage.' },
    { id: 'web_foot', cat: 'leg', name: 'Web Foot', cost: 100, hl: 3, hlDice: '1d6', slots: 1, desc: 'Swim faster.' },
    { id: 'hidden_holster_leg', cat: 'leg', name: 'Hidden Holster', cost: 500, hl: 7, hlDice: '2d6', slots: 1, desc: 'Concealed weapon compartment.' },

    // ---- Internal body ----
    { id: 'audiovox', cat: 'internal', name: 'AudioVox', cost: 500, hl: 3, hlDice: '1d6', desc: 'Voice synthesizer; +2 Play Instrument (voice).' },
    { id: 'contraceptive', cat: 'internal', name: 'Contraceptive Implant', cost: 10, hl: 0, hlDice: '0', desc: 'Prevents pregnancy.' },
    { id: 'cybersnake', cat: 'internal', name: 'Cybersnake', cost: 1000, hl: 14, hlDice: '4d6', desc: 'Throat-mounted weapon; Very Heavy Melee damage.' },
    { id: 'enhanced_antibodies', cat: 'internal', name: 'Enhanced Antibodies', cost: 500, hl: 2, hlDice: '1d6/2', desc: 'Faster healing.' },
    { id: 'gills', cat: 'internal', name: 'Gills', cost: 1000, hl: 7, hlDice: '2d6', desc: 'Breathe underwater.' },
    { id: 'muscle_bone_lace', cat: 'internal', name: 'Grafted Muscle & Bone Lace', cost: 1000, hl: 14, hlDice: '4d6', desc: '+2 BODY (raise BODY in the Stats tab yourself).' },
    { id: 'independent_air', cat: 'internal', name: 'Independent Air Supply', cost: 1000, hl: 2, hlDice: '1d6/2', desc: '30 minutes of air.' },
    { id: 'midnight_lady', cat: 'internal', name: 'Midnight Lady / Mr. Studd', cost: 100, hl: 7, hlDice: '2d6', desc: 'Sexual implant.' },
    { id: 'nasal_filters', cat: 'internal', name: 'Nasal Filters', cost: 100, hl: 2, hlDice: '1d6/2', desc: 'Immune to toxic gases and fumes.' },
    { id: 'radar_sonar', cat: 'internal', name: 'Radar / Sonar Implant', cost: 1000, hl: 7, hlDice: '2d6', desc: 'Sense surroundings within 50m.' },
    { id: 'toxin_binders', cat: 'internal', name: 'Toxin Binders', cost: 100, hl: 2, hlDice: '1d6/2', desc: '+2 Resist Torture/Drugs vs poison.' },
    { id: 'vampyres', cat: 'internal', name: 'Vampyres', cost: 500, hl: 14, hlDice: '4d6', desc: 'Fangs; Light Melee damage, can inject poison.' },

    // ---- External body ----
    { id: 'hidden_holster', cat: 'external', name: 'Hidden Holster', cost: 500, hl: 7, hlDice: '2d6', desc: 'Concealed compartment for a weapon.' },
    { id: 'skin_weave', cat: 'external', name: 'Skin Weave', cost: 500, hl: 7, hlDice: '2d6', desc: 'SP 7 to Body and Head. Does not stack with worn armor.' },
    { id: 'subdermal_armor', cat: 'external', name: 'Subdermal Armor', cost: 1000, hl: 14, hlDice: '4d6', desc: 'SP 11 to Body and Head. Does not stack with worn armor.' },
    { id: 'subdermal_pocket', cat: 'external', name: 'Subdermal Pocket', cost: 100, hl: 3, hlDice: '1d6', desc: 'Small hidden pouch under the skin.' },

    // ---- Fashionware ----
    { id: 'biomonitor', cat: 'fashion', name: 'Biomonitor', cost: 100, hl: 0, hlDice: '0', desc: 'Subdermal readout of vitals.' },
    { id: 'chemskin', cat: 'fashion', name: 'Chemskin', cost: 100, hl: 0, hlDice: '0', desc: 'Skin color change; +2 Personal Grooming.' },
    { id: 'emp_threading', cat: 'fashion', name: 'EMP Threading', cost: 10, hl: 0, hlDice: '0', desc: 'Decorative silver lines.' },
    { id: 'light_tattoo', cat: 'fashion', name: 'Light Tattoo', cost: 100, hl: 0, hlDice: '0', desc: 'Glowing tattoos; +2 Wardrobe & Style with 3+.' },
    { id: 'shift_tacts', cat: 'fashion', name: 'Shift Tacts', cost: 100, hl: 0, hlDice: '0', desc: 'Color-changing contacts.' },
    { id: 'skinwatch', cat: 'fashion', name: 'Skinwatch', cost: 100, hl: 0, hlDice: '0', desc: 'Watch display under the skin.' },
    { id: 'techhair', cat: 'fashion', name: 'Techhair', cost: 100, hl: 0, hlDice: '0', desc: 'Color-changing, light-emitting hair.' },

    // ---- Borgware ----
    { id: 'shoulder_mount', cat: 'borg', name: 'Artificial Shoulder Mount', cost: 1000, hl: 14, hlDice: '4d6', desc: 'Mount for two extra cyberarms. Needs a Linear Frame.' },
    { id: 'linear_frame_sigma', cat: 'borg', name: 'Linear Frame Sigma', cost: 1000, hl: 14, hlDice: '4d6', desc: 'Exoskeleton; BODY becomes 12.' },
    { id: 'linear_frame_beta', cat: 'borg', name: 'Linear Frame Beta', cost: 5000, hl: 14, hlDice: '4d6', desc: 'Heavy exoskeleton; BODY becomes 14.' },
    { id: 'multioptic_mount', cat: 'borg', name: 'MultiOptic Mount', cost: 1000, hl: 7, hlDice: '2d6', desc: 'Mount for up to five extra cybereyes.' },
    { id: 'sensor_array', cat: 'borg', name: 'Sensor Array', cost: 1000, hl: 14, hlDice: '4d6', desc: 'Mount for up to five extra cyberaudio options.' },
  ],

  WEAPONS: [
    { name: 'Medium Pistol', skill: 'Handgun', damage: '2d6', rof: 2, mag: 12, cost: 50, hands: 1 },
    { name: 'Heavy Pistol', skill: 'Handgun', damage: '3d6', rof: 2, mag: 8, cost: 100, hands: 1 },
    { name: 'Very Heavy Pistol', skill: 'Handgun', damage: '4d6', rof: 1, mag: 8, cost: 100, hands: 1 },
    { name: 'SMG', skill: 'Handgun', damage: '2d6', rof: 1, mag: 30, cost: 100, hands: 1, notes: 'Autofire (3)' },
    { name: 'Heavy SMG', skill: 'Handgun', damage: '3d6', rof: 1, mag: 40, cost: 100, hands: 2, notes: 'Autofire (3)' },
    { name: 'Shotgun', skill: 'Shoulder Arms', damage: '5d6', rof: 1, mag: 4, cost: 500, hands: 2, notes: 'Shotgun shell: 3d6 area' },
    { name: 'Assault Rifle', skill: 'Shoulder Arms', damage: '5d6', rof: 1, mag: 25, cost: 500, hands: 2, notes: 'Autofire (4)' },
    { name: 'Sniper Rifle', skill: 'Shoulder Arms', damage: '5d6', rof: 1, mag: 4, cost: 500, hands: 2 },
    { name: 'Bow / Crossbow', skill: 'Archery', damage: '4d6', rof: 1, mag: 0, cost: 100, hands: 2 },
    { name: 'Grenade Launcher', skill: 'Heavy Weapons', damage: '6d6', rof: 1, mag: 2, cost: 500, hands: 2, notes: 'Explosive' },
    { name: 'Rocket Launcher', skill: 'Heavy Weapons', damage: '8d6', rof: 1, mag: 1, cost: 500, hands: 2, notes: 'Explosive' },
    { name: 'Light Melee Weapon', skill: 'Melee Weapon', damage: '1d6', rof: 2, mag: 0, cost: 50, hands: 1 },
    { name: 'Medium Melee Weapon', skill: 'Melee Weapon', damage: '2d6', rof: 2, mag: 0, cost: 50, hands: 1 },
    { name: 'Heavy Melee Weapon', skill: 'Melee Weapon', damage: '3d6', rof: 2, mag: 0, cost: 100, hands: 2 },
    { name: 'Very Heavy Melee Weapon', skill: 'Melee Weapon', damage: '4d6', rof: 1, mag: 0, cost: 500, hands: 2 },
  ],

  ARMOR: [
    { name: 'None', sp: 0, penalty: 0, cost: 0 },
    { name: 'Leathers', sp: 4, penalty: 0, cost: 20 },
    { name: 'Kevlar', sp: 7, penalty: 0, cost: 50 },
    { name: 'Light Armorjack', sp: 11, penalty: 0, cost: 100 },
    { name: 'Bodyweight Suit', sp: 11, penalty: 0, cost: 1000 },
    { name: 'Medium Armorjack', sp: 12, penalty: 2, cost: 100 },
    { name: 'Heavy Armorjack', sp: 13, penalty: 2, cost: 500 },
    { name: 'Flak', sp: 15, penalty: 4, cost: 500 },
    { name: 'Metalgear', sp: 18, penalty: 4, cost: 5000 },
  ],

  // Generic quick-add NPCs for the combat tracker (GM can edit everything after adding).
  NPC_TEMPLATES: [
    { name: 'Street Punk', ref: 5, hp: 25, spHead: 4, spBody: 4, notes: 'Medium Pistol 2d6, Brawling' },
    { name: 'Gang Enforcer', ref: 6, hp: 35, spHead: 7, spBody: 11, notes: 'Heavy Pistol 3d6, Heavy Melee 3d6' },
    { name: 'Corp Security', ref: 6, hp: 35, spHead: 11, spBody: 11, notes: 'SMG 2d6 Autofire 3' },
    { name: 'Merc Solo', ref: 8, hp: 45, spHead: 11, spBody: 13, notes: 'Assault Rifle 5d6, Autofire 4' },
    { name: 'Cyberpsycho', ref: 8, hp: 55, spHead: 13, spBody: 15, notes: 'Heavy chrome. Very Heavy Melee 4d6' },
  ],

  TERRAIN: [
    { id: 'floor', name: 'Floor', color: '#2a3140' },
    { id: 'wall', name: 'Wall', color: '#9aa3b5' },
    { id: 'cover', name: 'Cover', color: '#8a6a2a' },
    { id: 'door', name: 'Door', color: '#5a3d1e' },
    { id: 'street', name: 'Street', color: '#1c1f26' },
    { id: 'grass', name: 'Grass', color: '#2c5a2a' },
    { id: 'water', name: 'Water', color: '#1d4f86' },
    { id: 'hazard', name: 'Hazard', color: '#b4231f' },
    { id: 'neon', name: 'Neon', color: '#c519ff' },
    { id: 'glass', name: 'Glass', color: '#3fb6c9' },
    { id: 'vehicle', name: 'Vehicle', color: '#c9a227' },
    { id: 'dark', name: 'Dark', color: '#0a0b0e' },
  ],

  TOKEN_COLORS: ['#19e3ff', '#ff2a3d', '#f7e21b', '#3dff9a', '#ff9b2a', '#c519ff', '#ffffff', '#5b6cff'],

  LIFEPATH_FIELDS: [
    ['culturalOrigin', 'Cultural Origin & Languages'],
    ['personality', 'Personality'],
    ['clothingStyle', 'Clothing Style'],
    ['hairstyle', 'Hairstyle'],
    ['affectation', 'Affectation You Are Never Without'],
    ['valueMost', 'What Do You Value Most?'],
    ['feelPeople', 'How Do You Feel About Most People?'],
    ['valuedPerson', 'Most Valued Person in Your Life'],
    ['valuedPossession', 'Most Valued Possession'],
    ['family', 'Family Background'],
    ['childhood', 'Childhood Environment'],
    ['familyCrisis', 'Family Crisis'],
    ['friends', 'Friends'],
    ['enemies', 'Enemies'],
    ['loveAffairs', 'Tragic Love Affairs'],
    ['lifeGoals', 'Life Goals'],
    ['roleLifepath', 'Role-specific Lifepath'],
  ],
};

/*
 * Longer descriptions shown in the Ripperdoc view. Written as plain-language summaries of what each
 * piece does at the table; `fx` are short effect tags. Adjust to match your book or house rules.
 */
CPR.DATA.CYBER_INFO = {
  // Foundations
  neural_link: { fx: ['5 option slots'], text: 'The backbone of all neuralware: a processor at the base of the skull with a wiring harness that runs down the spine. On its own it does nothing you would notice, but every reflex booster, interface port and chip socket plugs into it.' },
  cybereye: { fx: ['3 option slots'], text: 'A full replacement eye. With no options it works just like a natural eye. Some options only work as a pair, so they need a cybereye on both sides, each with the option installed.' },
  cyberaudio_suite: { fx: ['3 option slots'], text: 'A compact implant in the inner ear that sits alongside your natural hearing. It hosts communication, recording and detection options.' },
  cyberarm: { fx: ['4 option slots', 'Can be targeted separately'], text: 'A complete arm replacement that comes with a standard cyberhand. It holds pop-up weapons, tools and scanners. A cyberarm can be damaged or disabled on its own, and repairing it takes Cybertech.' },
  cyberleg: { fx: ['3 option slots'], text: 'A complete leg replacement with a standard cyberfoot. Several leg options (Jump Booster, Skate Foot, Web Foot) only work when both legs have them.' },

  // Neuralware
  braindance_recorder: { fx: ['Record braindance'], text: 'Captures everything you see, hear and feel, including emotions, to a chip or linked device so it can be replayed as braindance. A favorite of Media and Rockerboys.' },
  chipware_socket: { fx: ['Holds 1 chip'], text: 'A socket at the base of the skull. Each socket runs one piece of chipware. Install more sockets to run more chips at the same time.' },
  interface_plugs: { fx: ['Jack into machines'], text: 'Ports, usually in the wrists or temples, that let you plug straight into machines. Netrunners need them to use a cyberdeck. They also link you to smartguns and smart vehicles.' },
  kerenzikov: { fx: ['+2 Initiative (always on)'], text: 'A reflex booster that is always running and speeds up your reaction time. Add +2 to every Initiative roll. You cannot have both a Kerenzikov and a Sandevistan.' },
  sandevistan: { fx: ['+3 Initiative for 1 min', 'Recharge 1 hour'], text: 'A speedware burst you activate with an Action. For one minute you add +3 to Initiative. Then it needs about an hour to recharge. You cannot have both a Sandevistan and a Kerenzikov.' },

  // Chipware
  chemical_analyzer: { fx: ['Identify substances'], text: 'Chemical sensors in a fingertip, driven by the chip. A touch identifies drugs, poisons and compounds.' },
  memory_chip: { fx: ['Data storage'], text: 'Plain data storage for files, recordings and contacts. It costs no Humanity.' },
  olfactory_boost: { fx: ['Track by scent'], text: 'Gives you a sense of smell sharp enough to follow people by scent and pick out substances by odor.' },
  pain_editor: { fx: ['Ignore Seriously Wounded penalty'], text: 'Shuts down pain signals, so you ignore the action penalties for being Seriously Wounded. The downside is that you cannot feel how badly you are hurt.' },
  skill_chip: { fx: ['Skill at level 3'], text: 'Gives you one specific skill at level 3 while slotted. It does not add to skill you already have; you use whichever is higher. Chips for x2 skills cost double.' },
  tactile_boost: { fx: ['Sense vibration'], text: 'Heightens your sense of touch until you can feel footsteps and movement through floors and walls, so it is hard to sneak up on you.' },

  // Cyberoptics
  anti_dazzle: { fx: ['Immune to flash blinding'], text: 'A polarizing layer that clamps down on sudden glare. Flashbangs and bright lights cannot blind you.' },
  chyron: { fx: ['HUD window'], text: 'Puts a small window in the corner of your vision that shows text, video or data from your Agent or linked devices.' },
  color_shift: { fx: ['Cosmetic'], text: 'Change the color and pattern of your iris whenever you like. Purely for style.' },
  dartgun: { fx: ['Concealed 1-shot dart', 'Uses all 3 slots'], text: 'A one-shot dart launcher hidden inside the eye. The dart can carry drugs or poison, and the launcher is nearly impossible to spot without a scan.' },
  image_enhance: { fx: ['+2 sight Perception'], text: 'Sharper vision and pattern recognition: +2 to Perception, Lip Reading and Conceal/Reveal Object checks that rely on sight.' },
  low_light: { fx: ['Ignore darkness/smoke', 'Thermal vision', '2 slots'], text: 'Low-light, infrared and UV vision in one package. You can see in near darkness, through smoke and fog, and see heat signatures through thin cover.' },
  microoptics: { fx: ['400x magnification'], text: 'A microscope in your eye, with magnification up to 400x for fingerprints, circuit boards and fine print.' },
  microvideo: { fx: ['Record video'], text: 'Records video and still images of whatever you look at, saved to a chip or linked device.' },
  radiation_detector: { fx: ['See radiation'], text: 'Makes radiation visible as a glow, so contamination shows up before it hurts you.' },
  targeting_scope: { fx: ['+1 Aimed Shots'], text: 'Overlays crosshairs and range data on your vision: +1 to Aimed Shots with ranged weapons.' },
  teleoptics: { fx: ['See detail to 800m'], text: 'Telescopic zoom that lets you make out detail up to about 800 meters away. Ideal for scouting and overwatch.' },
  virtuality: { fx: ['See the NET + real world', 'Needs both eyes', '2 slots'], text: 'Projects cyberspace and AR overlays straight onto your vision. A Netrunner can watch the NET and the room around them at once. Must be installed in both eyes.' },

  // Cyberaudio
  amplified_hearing: { fx: ['+2 hearing Perception'], text: 'Boosted hearing range and sensitivity: +2 to Perception checks that rely on sound.' },
  audio_recorder: { fx: ['Record audio'], text: 'Records everything you hear to a chip or linked device.' },
  bug_detector: { fx: ['Detect bugs'], text: 'Gives a warning tone when you are within a few meters of an active listening device.' },
  homing_tracer: { fx: ['Follow tracer'], text: 'Tracks a tracer beacon (one is included) at long range. Tag a car or a person and follow them.' },
  internal_agent: { fx: ['Hands-free Agent'], text: 'A full Agent (the 2045 smartphone and assistant) built into your head: calls, messages and searches, all hands-free.' },
  level_damper: { fx: ['Immune to deafening'], text: 'Automatic volume control. Loud noises and sonic weapons cannot deafen you.' },
  radio_communicator: { fx: ['Radio ~1 mile'], text: 'A built-in radio with roughly a one-mile range, so you can talk to your crew without visible gear.' },
  radio_scanner: { fx: ['Scan bands', 'Music'], text: 'Listen in on police, corp and gang radio, or just play music in your head.' },
  radar_detector: { fx: ['Detect radar'], text: 'Beeps when radar is sweeping you.' },
  scrambler: { fx: ['Encrypt comms'], text: 'Encrypts your radio and phone traffic, and decrypts other traffic if you know the scramble.' },
  voice_stress: { fx: ['+2 to detect lies'], text: 'Picks up stress patterns in a speaker\'s voice: +2 to Human Perception and Interrogation checks to spot lies.' },

  // Cyberarm options
  big_knucks: { fx: ['Medium Melee (2d6)', 'Concealed'], text: 'Reinforced, armored knuckles. Your punches hit like a Medium Melee Weapon, and nobody sees them coming.' },
  grapple_hand: { fx: ['30m grapple line', '2 slots'], text: 'The hand launches on a 30 meter line to grab, climb or pull things toward you.' },
  medscanner: { fx: ['+2 First Aid & Paramedic', '2 slots'], text: 'Diagnostic sensors and tools built into the hand: +2 to First Aid and Paramedic checks.' },
  popup_grenade: { fx: ['1-shot grenade launcher', '2 slots'], text: 'A single-shot grenade launcher hidden in the forearm. Reload it like any grenade launcher.' },
  popup_melee: { fx: ['Light/Medium/Heavy melee', 'Concealed'], text: 'A blade or bludgeon that unfolds from the forearm. Pick Light, Medium or Heavy melee damage when you buy it. It stays hidden until deployed.' },
  popup_ranged: { fx: ['Concealed pistol/SMG'], text: 'A one-handed firearm (pistol or SMG class) built into the forearm. It cannot be found without a scan.' },
  popup_shield: { fx: ['Bulletproof shield', '2 slots'], text: 'A folding bulletproof shield that snaps out of the forearm and absorbs hits until it is destroyed.' },
  quick_change: { fx: ['Swap hands fast', '0 slots'], text: 'A mount that lets you swap cyberhands in seconds. It uses no option slots.' },
  rippers: { fx: ['Medium Melee (2d6)', 'Concealed'], text: 'Carbon-fiber claws that extend from the fingertips. They deal Medium Melee Weapon damage.' },
  scratchers: { fx: ['Light Melee (1d6)', 'Concealed'], text: 'Short blades under the fingernails. They deal Light Melee Weapon damage and are easy to explain away.' },
  slice_n_dice: { fx: ['Medium Melee (2d6)', 'Concealed'], text: 'A monofilament whip that unreels from the thumb and cuts through almost anything. It deals Medium Melee Weapon damage.' },
  subdermal_grip: { fx: ['Smartgun link'], text: 'An interface pad in the palm that links you to a smartgun without needing Interface Plugs.' },
  techscanner: { fx: ['+2 to Tech skills', '2 slots'], text: 'Sensors and micro-tools in the hand: +2 to Basic Tech, Cybertech, Weaponstech, vehicle tech and Electronics/Security Tech checks.' },
  tool_hand: { fx: ['Built-in tools'], text: 'The fingers hold screwdrivers, wrenches, a small drill and other tools, so you always have basic tools on you.' },
  wolvers: { fx: ['Heavy Melee (3d6)', 'Concealed'], text: 'Long blades that slide out over the knuckles. They deal Heavy Melee Weapon damage.' },
  cyberdeck_arm: { fx: ['Built-in cyberdeck', '3 slots'], text: 'A cyberdeck housed in the arm, so a Netrunner always has one. You still need Interface Plugs to jack in.' },

  // Cyberleg options
  grip_foot: { fx: ['Climb freely'], text: 'Gripping toes and adhesive pads that let you climb walls and ropes without the usual penalties.' },
  jump_booster: { fx: ['Long jumps', 'Needs both legs'], text: 'Pneumatic boosters that let you leap far without a running start. Must be installed in both legs.' },
  skate_foot: { fx: ['Faster on pavement', 'Needs both legs'], text: 'Retractable skates in the feet that make you much faster on smooth ground.' },
  talon_foot: { fx: ['Medium Melee (2d6)', 'Concealed'], text: 'A blade that extends from the foot. It deals Medium Melee Weapon damage when kicking.' },
  web_foot: { fx: ['Faster swimming', 'Needs both legs'], text: 'Webbing that extends between the toes so you swim much faster.' },
  hidden_holster_leg: { fx: ['Concealed weapon'], text: 'A hidden compartment in the leg big enough for a pistol or a similar small weapon.' },

  // Internal
  audiovox: { fx: ['+2 singing', 'Mimic voices'], text: 'Replaces the voice box with a synthesizer. You can sing with perfect pitch and imitate other voices: +2 to Play Instrument when singing.' },
  contraceptive: { fx: ['No Humanity cost'], text: 'Long-term, reversible contraception.' },
  cybersnake: { fx: ['Very Heavy Melee (4d6)'], text: 'A mechanical serpent that lives in your throat and strikes out of your mouth. It deals Very Heavy Melee Weapon damage and terrifies everyone who sees it.' },
  enhanced_antibodies: { fx: ['Faster healing'], text: 'An upgraded immune system that helps you recover from wounds and fight off disease.' },
  gills: { fx: ['Breathe underwater'], text: 'Pulls oxygen from water, so you can stay underwater indefinitely.' },
  muscle_bone_lace: { fx: ['+2 BODY'], text: 'Lab-grown muscle and reinforced bone: +2 BODY, which also raises HP and Death Save. Update BODY on the Stats tab yourself.' },
  independent_air: { fx: ['30 min of air'], text: 'An internal air reserve that lets you breathe for about 30 minutes with no outside air. Gas attacks will not reach you while it lasts.' },
  midnight_lady: { fx: ['Pleasure implant'], text: 'Sexual enhancement implant. It does exactly what you think.' },
  nasal_filters: { fx: ['Immune to gas & fumes'], text: 'Filters in the nasal passages that block toxic gases, smoke, fumes and airborne drugs.' },
  radar_sonar: { fx: ['Sense surroundings 50m'], text: 'Active radar and sonar that maps your surroundings within about 50 meters, even in pitch darkness or thick smoke.' },
  toxin_binders: { fx: ['+2 vs poison & drugs'], text: 'Filters in the bloodstream that neutralize toxins: +2 to Resist Torture/Drugs against poisons and drugs.' },
  vampyres: { fx: ['Light Melee (1d6)', 'Inject poison'], text: 'Retractable fangs with reservoirs. They deal Light Melee Weapon damage and can deliver a drug or poison with the bite.' },

  // External
  hidden_holster: { fx: ['Concealed weapon'], text: 'A compartment under the skin, usually at the hip or thigh, that hides a pistol-sized weapon from pat-downs.' },
  skin_weave: { fx: ['SP 7 head & body', 'Self-repairs'], text: 'Armored mesh woven under the skin: SP 7 on head and body. It does not stack with worn armor, so use whichever is higher. It repairs itself over time.' },
  subdermal_armor: { fx: ['SP 11 head & body', 'Self-repairs'], text: 'Armor plates grown under the skin: SP 11 on head and body. It does not stack with worn armor, so use whichever is higher. It repairs itself over time.' },
  subdermal_pocket: { fx: ['Hidden pouch'], text: 'A small pouch under the skin, sealed with a zip-seam, for hiding credchips, keys or data shards.' },

  // Fashionware
  biomonitor: { fx: ['Vitals readout'], text: 'A subdermal display of your pulse, blood pressure and other vitals. It can alert a trauma team or your doctor.' },
  chemskin: { fx: ['+2 Personal Grooming'], text: 'Changes your skin tone and pattern: +2 to Personal Grooming.' },
  emp_threading: { fx: ['Cosmetic'], text: 'Thin silver lines laid under the skin in circuit-like patterns. Purely decorative, despite the rumors.' },
  light_tattoo: { fx: ['+2 Wardrobe & Style (3+)'], text: 'Glowing, animated tattoos. With three or more you get +2 to Wardrobe & Style.' },
  shift_tacts: { fx: ['Cosmetic'], text: 'Contact lenses that change color and pattern on command.' },
  skinwatch: { fx: ['Time display'], text: 'A glowing display of the time under the skin of your wrist.' },
  techhair: { fx: ['+2 Wardrobe & Style'], text: 'Artificial hair that changes color and glows. Counts toward your look.' },

  // Borgware
  shoulder_mount: { fx: ['+2 cyberarm mounts', 'Needs Linear Frame'], text: 'A second set of shoulders, so you can mount two more cyberarms. Requires a Linear Frame.' },
  linear_frame_sigma: { fx: ['BODY becomes 12'], text: 'A full-body exoskeleton grafted to your skeleton. Your BODY counts as 12 for lifting, carrying and melee damage.' },
  linear_frame_beta: { fx: ['BODY becomes 14'], text: 'A heavy industrial exoskeleton. Your BODY counts as 14 for lifting, carrying and melee damage.' },
  multioptic_mount: { fx: ['+5 cybereye mounts'], text: 'A mount that holds up to five more cybereyes, for an unnerving spider-like array of optics.' },
  sensor_array: { fx: ['+5 cyberaudio options'], text: 'A mount that holds up to five more cyberaudio options.' },
};

// Cyberware that works as a weapon: shown with Hit/Damage buttons on the Play tab.
CPR.DATA.CYBER_WEAPONS = {
  big_knucks: { damage: '2d6', skill: 'Brawling', rof: 2 },
  rippers: { damage: '2d6', skill: 'Melee Weapon', rof: 2 },
  scratchers: { damage: '1d6', skill: 'Melee Weapon', rof: 2 },
  slice_n_dice: { damage: '2d6', skill: 'Melee Weapon', rof: 2 },
  wolvers: { damage: '3d6', skill: 'Melee Weapon', rof: 2 },
  talon_foot: { damage: '2d6', skill: 'Melee Weapon', rof: 2 },
  cybersnake: { damage: '4d6', skill: 'Melee Weapon', rof: 1 },
  vampyres: { damage: '1d6', skill: 'Melee Weapon', rof: 2 },
};

/*
 * Weapon types from the Edgerunners Mission Kit. The rule reminders are placeholders the GM
 * replaces with the book's wording on the Homebrew page (stored per device, shared with the library).
 */
CPR.DATA.WEAPON_TYPES = [
  { id: '', name: 'Standard' },
  { id: 'power', name: 'Power', rule: 'Power weapon — enter its special rule from the Mission Kit on the Homebrew page.' },
  { id: 'tech', name: 'Tech', rule: 'Tech weapon — enter its special rule from the Mission Kit on the Homebrew page.' },
  { id: 'smart', name: 'Smart', rule: 'Smart weapon — enter its special rule from the Mission Kit on the Homebrew page.' },
];

/*
 * ============================== NETRUNNING (core rulebook) ==============================
 * Values entered from memory of the core rulebook — check them against your book.
 * Effects are short summaries written for this app (the policy allows summaries, not book text).
 * Black ICE is deliberately not included: the Homebrew Content Policy forbids reproducing
 * stat blocks for enemies / hazards. Your GM runs those.
 */
// NET Actions rolled as Interface + 1d10 vs the DV the GM sets (or an opposing roll).
CPR.DATA.INTERFACE_ABILITIES = [
  { id: 'backdoor', name: 'Backdoor', text: 'Get past a Password on the current floor.' },
  { id: 'cloak', name: 'Cloak', text: 'Hide your actions; anyone trying to trace you must beat this roll.' },
  { id: 'control', name: 'Control', text: 'Operate a Control Node you reach (doors, cameras, turrets…).' },
  { id: 'eyedee', name: 'Eye-Dee', text: 'Identify a file or piece of data you find.' },
  { id: 'pathfinder', name: 'Pathfinder', text: 'Map the Architecture ahead of you.' },
  { id: 'scanner', name: 'Scanner', text: 'Find Access Points and Architectures nearby (in meatspace).' },
  { id: 'slide', name: 'Slide', text: 'Slip away from a Black ICE that is chasing you.' },
  { id: 'virus', name: 'Virus', text: 'At the bottom of an Architecture, leave a Virus that does what you choose.' },
  { id: 'zap', name: 'Zap', damage: '1d6', text: 'Basic attack: damage to a Program\'s REZ or to an enemy Netrunner\'s brain.' },
];

// Cyberdeck quality sets how many slots you have for Programs.
CPR.DATA.CYBERDECKS = [
  { id: '', name: 'No cyberdeck', slots: 0, cost: 0 },
  { id: 'poor', name: 'Poor Quality Cyberdeck', slots: 5, cost: 100 },
  { id: 'standard', name: 'Cyberdeck', slots: 7, cost: 500 },
  { id: 'excellent', name: 'Excellent Quality Cyberdeck', slots: 9, cost: 1000 },
];

// Programs: class Booster / Defender / Attacker (anti-program or anti-personnel). Each uses 1 deck slot.
// atk: added to Interface when attacking with it.  rez: its "hit points" in the NET.
// damage / damage2: dice for its two damage cases (label says which target).
CPR.DATA.PROGRAMS = [
  // Boosters — add to your NET actions while rezzed
  { id: 'eraser', name: 'Eraser', cls: 'Booster', atk: 0, def: 0, rez: 7, cost: 20, text: '+2 to Cloak while rezzed.' },
  { id: 'see_ya', name: 'See Ya', cls: 'Booster', atk: 0, def: 0, rez: 7, cost: 20, text: '+2 to Pathfinder while rezzed.' },
  { id: 'speedy', name: 'Speedy Gonzalvez', cls: 'Booster', atk: 0, def: 0, rez: 7, cost: 100, text: '+2 to your Speed in the NET while rezzed.' },
  { id: 'worm', name: 'Worm', cls: 'Booster', atk: 0, def: 0, rez: 7, cost: 50, text: '+2 to Backdoor while rezzed.' },
  // Defenders — protect you or your deck
  { id: 'armor', name: 'Armor', cls: 'Defender', atk: 0, def: 0, rez: 7, cost: 50, text: 'Reduces brain damage you take by 4. Derezzes after it soaks one hit.' },
  { id: 'flak', name: 'Flak', cls: 'Defender', atk: 0, def: 0, rez: 7, cost: 50, text: 'Drops the ATK of non-Black ICE attacker programs aimed at you to 0.' },
  { id: 'shield', name: 'Shield', cls: 'Defender', atk: 0, def: 0, rez: 7, cost: 20, text: 'Stops the first brain damage you would take, then derezzes.' },
  // Attackers (anti-program)
  { id: 'banhammer', name: 'Banhammer', cls: 'Attacker', kind: 'Anti-Program', atk: 1, def: 0, rez: 0, cost: 50,
    damage: '3d6', dmgLabel: 'vs non-Black ICE program', damage2: '2d6', dmg2Label: 'vs Black ICE', text: 'Hits a program\'s REZ: harder against regular programs.' },
  { id: 'sword', name: 'Sword', cls: 'Attacker', kind: 'Anti-Program', atk: 1, def: 0, rez: 0, cost: 100,
    damage: '3d6', dmgLabel: 'vs Black ICE', damage2: '2d6', dmg2Label: 'vs non-Black ICE program', text: 'Hits a program\'s REZ: harder against Black ICE.' },
  { id: 'deckkrash', name: 'DeckKRASH', cls: 'Attacker', kind: 'Anti-Program', atk: 0, def: 0, rez: 0, cost: 100, text: 'Forces an enemy Netrunner to jack out unsafely if it hits.' },
  // Attackers (anti-personnel)
  { id: 'hellbolt', name: 'Hellbolt', cls: 'Attacker', kind: 'Anti-Personnel', atk: 2, def: 0, rez: 0, cost: 100,
    damage: '2d6', dmgLabel: 'brain damage', text: 'Brain damage to an enemy Netrunner, and sets their deck on fire.' },
  { id: 'nervescrub', name: 'Nervescrub', cls: 'Attacker', kind: 'Anti-Personnel', atk: 0, def: 0, rez: 0, cost: 100,
    damage: '1d6', dmgLabel: 'INT, REF & DEX lost (1 hour)', text: 'Temporarily lowers an enemy Netrunner\'s INT, REF and DEX.' },
  { id: 'poison_flatline', name: 'Poison Flatline', cls: 'Attacker', kind: 'Anti-Personnel', atk: 0, def: 0, rez: 0, cost: 100, text: 'Destroys one non-Black ICE program on the enemy Netrunner\'s deck.' },
  { id: 'superglue', name: 'Superglue', cls: 'Attacker', kind: 'Anti-Personnel', atk: 2, def: 0, rez: 0, cost: 100,
    damage: '1d6', dmgLabel: 'rounds stuck', text: 'Stops an enemy Netrunner from going deeper or jacking out for a few rounds.' },
  { id: 'vrizzbolt', name: 'Vrizzbolt', cls: 'Attacker', kind: 'Anti-Personnel', atk: 1, def: 0, rez: 0, cost: 50,
    damage: '1d6', dmgLabel: 'brain damage', text: 'Brain damage, and the target loses a NET action next turn.' },
];
CPR.DATA.programById = Object.fromEntries(CPR.DATA.PROGRAMS.map(p => [p.id, p]));

/*
 * ===================== EDGERUNNERS MISSION KIT — FILL IN FROM YOUR BOOK =====================
 * These are built into the app like any core cyberware / quickhack. Their numbers aren't published
 * anywhere public, so they start empty (null / '') and show "⚠ Mission Kit values not entered"
 * until you copy them in here. Nothing is guessed.
 *
 *   cost: eb        hl: average Humanity Loss     hlDice: e.g. '2d6'     slots: option slots used
 *   damage: e.g. '3d6'    skill: attack skill     rof: rate of fire     fx: short effect tags
 *   body: BODY counts as this for Choke, Slam and strength feats while installed
 *   pair: true if it's meant to go in both arms (values above are per arm)
 */
CPR.DATA.MISSION_KIT_SOURCE = 'Edgerunners Mission Kit';
CPR.DATA.MISSION_KIT_CYBERWARE = [
  { id: 'gorilla_arms', name: 'Gorilla Arms', cost: 500, hl: 7, hlDice: '2d6', slots: 2, damage: '3d6', body: 11, pair: true, skill: 'Brawling', rof: 2,
    fx: ['3d6 damage', 'BODY counts as 11 for Choke, Slam & strength', 'Per arm: 500eb, 2d6 HL (4d6 for a pair)'],
    pairFx: ['Force open doors', 'Move Thick Cover objects', 'Choke & Slam opponents'],
    text: 'Heavily reinforced cyberarm actuators and knuckles built for crushing melee strikes and brute-force feats of strength. Strikes with them deal 3d6 damage, and while installed your BODY counts as 11 for Choke, Slam and feats of strength. With a pair installed, you can force open doors, move Thick Cover objects, and Choke and Slam opponents.' },
  { id: 'mantis_blades', name: 'Mantis Blades', cost: null, hl: null, hlDice: '', slots: null, damage: '', skill: 'Melee Weapon', rof: 2, fx: [],
    text: 'Long blades that unfold from the forearm of a cyberarm and lock into place for slashing attacks.' },
  { id: 'monowire', name: 'Monowire', cost: null, hl: null, hlDice: '', slots: null, damage: '', skill: 'Melee Weapon', rof: 1, fx: [],
    text: 'A monofilament whip that deploys from the hand, cutting at range from the wielder.' },
];
/* =========================================================================================== */

/*
 * ============================ PROTOTYPE QUICKHACKS (table rules) ============================
 * Built-in quickhacks for this table. In-world they're early "prototypes": every attempt costs
 * the Netrunner (quickhack DV / 2, rounded down) - Interface rank + 1d6 temporary Humanity, minimum 1,
 * tracked on the Netrunning tab and cleared on a long rest.
 *   tier: Simple / Standard / Difficult / Advanced    dv: Quickhack DV    duration: how long it lasts
 *   damage + dmgLabel: dice to roll for the effect (leave '' if nothing to roll)
 */
CPR.DATA.QUICKHACK_SOURCE = 'Prototype quickhack';
CPR.DATA.QUICKHACK_TIERS = ['Simple', 'Standard', 'Difficult', 'Advanced'];
CPR.DATA.QUICKHACK_STRAIN = '1d6'; // temporary Humanity per attempt: DV/2 - Interface + this roll, minimum 1
CPR.DATA.QUICKHACK_STRAIN_TEXT = 'DV ÷ 2 − Interface + 1d6 (min 1)';
// Jack In / Force Out thresholds used by the rolls on the Netrunning tab.
CPR.DATA.FIREWALL_DV = 6;          // base firewall when jacking into a neuroport
CPR.DATA.FIREWALL_AUTO_PASS = 3;   // Interface rank that passes the base firewall automatically
CPR.DATA.QUICKHACK_RULES = [
  ['Range & access', 'With a neuroport-based cyberdeck, quickhack a target\'s neuroport from up to 50m away.'],
  ['1. Jack In', 'Your Interface + 1d10 vs the target\'s WILL + 1d10. Base Firewall is DV 6 (passed automatically at Interface 3+). Failing only alerts the target.'],
  ['2. Run a quickhack', 'Your Interface + 1d10 must be greater than the quickhack\'s DV. A NET Action; one quickhack per target per turn.'],
  ['3. Force Out', 'The target can spend an Action (ROF 1): their WILL + Concentration + 1d10 vs your Interface + 1d10. If they win, you jack out unsafely and are locked out for 60 minutes.'],
  ['Prototype strain', 'Every quickhack attempt costs you temporary Humanity equal to its DV ÷ 2 (rounded down), minus your Interface rank, plus 1d6 (minimum 1). It lasts until your next long rest.'],
];
CPR.DATA.QUICKHACKS = [
  { id: 'mk_sonic_shock', name: 'Sonic Shock', tier: 'Simple', dv: '6', duration: '60 sec (20 rounds)',
    effect: 'Target suffers the Damaged Ear Critical Injury (can\'t hear or communicate), without its bonus damage.' },
  { id: 'mk_short_circuit', name: 'Short Circuit', tier: 'Standard', dv: '8', duration: '60 sec (20 rounds)',
    effect: 'Disables 3 pieces of the target\'s cyberware chosen by the GM (not foundational limbs or neuroports).' },
  { id: 'mk_overheat', name: 'Overheat', tier: 'Standard', dv: '8', duration: 'Until extinguished',
    effect: '4 damage straight to HP at the end of each of the target\'s turns, ignoring armor. Putting it out takes a ROF 1 Action.' },
  { id: 'mk_cyberware_malfunction', name: 'Cyberware Malfunction', tier: 'Difficult', dv: '10', duration: '60 sec (20 rounds)',
    effect: 'Disables 1 piece of cyberware that you choose.' },
  { id: 'mk_slow', name: 'Slow', tier: 'Difficult', dv: '10', duration: '60 sec (20 rounds)', damage: '1d6', dmgLabel: 'MOVE lost',
    effect: 'Lowers the target\'s MOVE by 1d6. At 0 MOVE they can\'t take Move Actions.' },
  { id: 'mk_synapse_burnout', name: 'Synapse Burnout', tier: 'Difficult', dv: '10', duration: 'Instant', damage: '3d6', dmgLabel: 'damage to HP',
    effect: '3d6 damage straight to HP. Ignores armor and doesn\'t ablate it.' },
  { id: 'mk_shard_ejection', name: 'Shard Ejection', tier: 'Advanced', dv: '12', duration: 'Instant',
    effect: 'Ejects 1 piece of slotted chipware from the target into an adjacent square.' },
  { id: 'mk_system_reset', name: 'System Reset', tier: 'Advanced', dv: '12', duration: '60 sec (20 rounds)',
    effect: 'Target falls Prone and stays Unconscious until it ends or they take damage.' },
  { id: 'mk_puppet', name: 'Puppet', tier: 'Advanced', dv: '12', duration: '1 turn (their next)',
    effect: 'You take over the target\'s Action and Move Action on their next turn.' },
];
// Saves from before these existed: old placeholder ids map onto their replacements.
CPR.DATA.QUICKHACK_ALIASES = { mk_cripple_movement: 'mk_slow', mk_reboot: 'mk_system_reset' };
/* =========================================================================================== */

// Turn the Mission Kit table into regular built-in cyberware (Cyberarm options).
CPR.DATA.MISSION_KIT_CYBERWARE.forEach(m => {
  // Which book values are still empty (pieces with a `body` rule don't need their own damage).
  const missing = [];
  if (m.cost == null) missing.push('cost');
  if (m.hl == null) missing.push('Humanity Loss');
  if (m.slots == null) missing.push('slots');
  if (!m.damage) missing.push('damage');
  CPR.DATA.CYBERWARE.push({
    id: m.id, cat: 'arm', name: m.name, cost: Number(m.cost) || 0, hl: Number(m.hl) || 0, hlDice: m.hlDice || '',
    slots: m.slots == null ? 1 : Number(m.slots), desc: m.text, source: CPR.DATA.MISSION_KIT_SOURCE,
    unset: missing.length > 0, missing, body: m.body || null, pair: !!m.pair, pairFx: m.pairFx || [],
  });
  CPR.DATA.CYBER_INFO[m.id] = { fx: m.fx || [], text: m.text };
  if (m.damage) CPR.DATA.CYBER_WEAPONS[m.id] = { damage: m.damage, skill: m.skill, rof: m.rof };
});

// Pieces that can't be installed together.
CPR.DATA.CYBER_CONFLICTS = { kerenzikov: ['sandevistan'], sandevistan: ['kerenzikov'] };

// Playstyle tag shown on each item card.
CPR.DATA.CYBER_KIND = (function () {
  const k = {};
  const set = (kind, ids) => ids.forEach(id => (k[id] = kind));
  set('Combat', ['kerenzikov', 'sandevistan', 'dartgun', 'targeting_scope', 'big_knucks', 'popup_grenade', 'popup_melee', 'popup_ranged',
    'rippers', 'scratchers', 'slice_n_dice', 'wolvers', 'talon_foot', 'cybersnake', 'vampyres', 'subdermal_grip', 'pain_editor',
    'gorilla_arms', 'mantis_blades', 'monowire']);
  set('Defense', ['skin_weave', 'subdermal_armor', 'popup_shield', 'anti_dazzle', 'level_damper', 'nasal_filters', 'independent_air',
    'toxin_binders', 'enhanced_antibodies', 'muscle_bone_lace', 'linear_frame_sigma', 'linear_frame_beta']);
  set('Sensory', ['image_enhance', 'low_light', 'microoptics', 'teleoptics', 'radiation_detector', 'amplified_hearing', 'bug_detector',
    'radar_detector', 'voice_stress', 'radar_sonar', 'olfactory_boost', 'tactile_boost', 'chemical_analyzer', 'homing_tracer']);
  set('Netrunning', ['interface_plugs', 'virtuality', 'cyberdeck_arm']);
  set('Style', ['color_shift', 'biomonitor', 'chemskin', 'emp_threading', 'light_tattoo', 'shift_tacts', 'skinwatch', 'techhair', 'audiovox', 'midnight_lady']);
  return k;
})();

CPR.DATA.CYBERWARE.forEach(c => {
  const info = CPR.DATA.CYBER_INFO[c.id] || {};
  c.details = info.text || c.desc;
  c.fx = info.fx || [];
  c.kind = c.cat === 'foundation' ? 'Foundation' : (CPR.DATA.CYBER_KIND[c.id] || 'Utility');
  if (CPR.DATA.CYBER_WEAPONS[c.id]) c.weapon = CPR.DATA.CYBER_WEAPONS[c.id];
});

CPR.DATA.cyberById = Object.fromEntries(CPR.DATA.CYBERWARE.map(c => [c.id, c]));
