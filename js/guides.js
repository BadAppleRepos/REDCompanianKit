/* Guides: step-by-step quick-reference flows for combat and the NET. Summaries in our own words. */
CPR.guides = (function () {
  const D = CPR.DATA, S = CPR.store, U = CPR.ui, esc = U.esc;
  let root, guide = S.read('ui.guide', 'combat');

  // Each step: title, text (plain), optional bullets [[label, text]], optional tip.
  const GUIDES = {
    combat: {
      name: 'Combat',
      icon: '⚔',
      intro: `One round is about 3 seconds. Everyone gets one Turn per round, in Initiative order.`,
      tool: { view: 'combat', label: 'Open the Combat tracker' },
      steps: [
        {
          title: 'Set the scene',
          text: `The GM places everyone on the map and points out cover, distances and anything that blocks line of sight.`,
          tip: `The Maps tab has square and hex grids; one square is 2m.`,
        },
        {
          title: 'Roll Initiative',
          text: `Everyone rolls REF + 1d10. Highest goes first. Re-roll ties between the tied characters.`,
          bullets: [
            ['Order is fixed', `The order stays the same for the whole fight.`],
            ['Late arrivals', `Anyone joining mid-fight rolls and slots into the order.`],
          ],
        },
        {
          title: 'Take your Turn',
          text: `On your Turn you get one Move Action and one Action, in either order.`,
          bullets: [
            ['Move Action', `Move up to MOVE squares (MOVE × 2 m).`],
            ['Action', `Attack, Run (move again), Reload, Use a Skill, use or ready an item, get up, Grab / Choke / Throw, or Hold your Action for later in the round.`],
            ['Rate of Fire', `A weapon with ROF 2 can make two attacks with one Action.`],
          ],
        },
        {
          title: 'Make the attack roll',
          text: `Beat the target number to hit. Ties go to the defender.`,
          bullets: [
            ['Ranged', `REF + weapon skill + 1d10 vs a DV set by the weapon type and the distance.`],
            ['Dodging bullets', `A defender with REF 8 or higher may instead roll DEX + Evasion + 1d10 against the shot.`],
            ['Melee & Brawling', `DEX + Melee Weapon (or Brawling / Martial Arts) + 1d10 vs the defender's DEX + Evasion + 1d10.`],
            ['Aimed shot', `−8 to hit for a specific spot: head, a held item, or a leg.`],
            ['Autofire', `Uses its own DV table and 10 rounds. On a hit roll 2d6 × how much you beat the DV by, up to the weapon's autofire cap.`],
          ],
          tip: `Remember situational mods: Seriously Wounded −2, Mortally Wounded −4, plus cover, lighting and aiming.`,
        },
        {
          title: 'Roll damage',
          text: `Roll the weapon's damage dice.`,
          bullets: [
            ['Critical Injury', `Two or more 6s on the damage dice: roll a Critical Injury and add 5 bonus damage straight to HP.`],
            ['Headshots', `Damage that gets through head armor is doubled.`],
          ],
        },
        {
          title: 'Apply armor',
          text: `Subtract the target's SP at the hit location (body unless it was an aimed head shot). Anything left over comes off HP.`,
          bullets: [
            ['Ablation', `If any damage got through, that armor loses 1 SP.`],
            ['Melee weapons', `Melee weapon attacks count the armor as half its SP (round up). Brawling doesn't.`],
          ],
          tip: `The Combat tracker does the SP subtraction and ablation for you.`,
        },
        {
          title: 'Check wound state',
          text: `Compare the target's HP to their thresholds.`,
          bullets: [
            ['Lightly Wounded', `Below full HP. No penalty.`],
            ['Seriously Wounded', `Below half HP: −2 to all Actions.`],
            ['Mortally Wounded', `Below 1 HP: −4 to all Actions, −6 MOVE, and a Death Save at the start of each of their Turns.`],
          ],
        },
        {
          title: 'Death Saves',
          text: `A Mortally Wounded character rolls 1d10 at the start of each of their Turns and must roll under their BODY. A natural 10 always fails. Failing means death.`,
          bullets: [
            ['Getting harder', `Each Death Save made adds +1 to the next roll.`],
            ['Stabilizing', `An ally uses First Aid or Paramedic (the DV rises with the wound state). A stabilized character stops making Death Saves.`],
          ],
        },
        {
          title: 'Next Turn, next round',
          text: `Play passes down the Initiative order. When everyone has gone, start a new round from the top. Keep going until one side is down, runs, or surrenders.`,
        },
      ],
    },

    net: {
      name: 'NET',
      icon: '⌁',
      intro: `Netrunning happens alongside the fight. The Netrunner's body stays in meatspace while their mind moves through the Architecture.`,
      tool: { view: 'characters', label: 'Open a character’s Netrunning tab' },
      steps: [
        {
          title: 'Get ready',
          text: `You need the Netrunner Role (Interface), a cyberdeck loaded with Programs, and interface plugs.`,
          tip: `Set up the deck and Programs on the character's Netrunning tab.`,
        },
        {
          title: 'Find an Access Point',
          text: `The GM decides where the Architecture can be reached. Scanner helps find Access Points nearby. Get to one and plug in.`,
          tip: `Your body stays behind. Find cover or bring a bodyguard.`,
        },
        {
          title: 'Jack In',
          text: `Jacking in takes your Meat Action. You arrive at the top floor of the Architecture.`,
        },
        {
          title: 'Spend your NET Actions',
          text: `While jacked in, your Turn is a Move Action in meatspace plus a number of NET Actions set by your Interface rank.`,
          bullets: [
            ['Interface 1–3', `2 NET Actions`],
            ['Interface 4–6', `3 NET Actions`],
            ['Interface 7–9', `4 NET Actions`],
            ['Interface 10', `5 NET Actions`],
          ],
          tip: `Each of these costs one NET Action: moving one floor, using an Interface ability, activating or deactivating a Program, or attacking.`,
        },
        {
          title: 'Move down the floors',
          text: `Floors are revealed as you reach them. Pathfinder can map the floors ahead first. Some Architectures branch.`,
          bullets: [
            ['Password', `Beat its DV with Backdoor to go past it.`],
            ['File', `Use Eye-Dee to learn what it is.`],
            ['Control Node', `Use Control to run doors, cameras, turrets and so on.`],
            ['Black ICE', `A hostile program. Go to the next step.`],
          ],
          tip: `Interface rolls are Interface + 1d10 (plus any Booster) vs the DV.`,
        },
        {
          title: 'Deal with Black ICE',
          text: `Black ICE rolls Initiative and joins the turn order when you meet it.`,
          bullets: [
            ['Slide', `Interface + 1d10 vs the ICE's roll to slip away from it.`],
            ['Fight', `Zap or an Attacker Program. Damage hits the ICE's REZ; at 0 REZ it's derezzed.`],
            ['Getting hit', `Depending on the ICE, damage hits your Programs' REZ, your deck, or your brain (HP). Defender Programs help soak it.`],
          ],
          tip: `Enemy Netrunners and Demons are fought the same way, with Programs and Interface rolls.`,
        },
        {
          title: 'Reach the bottom',
          text: `On the lowest floor you can use Virus to leave a lasting effect in the Architecture, such as wiping records, opening locks, or planting a backdoor for later.`,
        },
        {
          title: 'Jack Out',
          text: `Jacking out takes your Meat Action. Leave safely by getting clear of hostile Black ICE first.`,
          bullets: [
            ['Unsafe exit', `Leaving with hostile Black ICE still active, or being unplugged by someone else, lets that ICE hit you as you go.`],
          ],
        },
      ],
      extra: () => `<details class="qh-rules guide-extra"><summary>Quickhacking (prototype rules used by this app)</summary>
        <dl>${D.QUICKHACK_RULES.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`,
    },
  };

  function render() {
    if (!GUIDES[guide]) guide = 'combat';
    const g = GUIDES[guide];
    root.innerHTML = `<div class="guides">
      <div class="row guide-head">
        <div class="tabs guide-tabs">${Object.entries(GUIDES).map(([id, x]) =>
          `<button class="${id === guide ? 'active' : ''}" data-guide="${id}">${x.icon} ${esc(x.name)} Flow</button>`).join('')}</div>
        <span class="spacer"></span>
        <button class="btn sm ghost" data-goto="${g.tool.view}">${esc(g.tool.label)} →</button>
      </div>
      <div class="panel">
        <h3>Step-by-Step ${esc(g.name)} Flow</h3>
        <p class="muted" style="margin-top:0">${esc(g.intro)}</p>
        <ol class="guide-steps">${g.steps.map((s, i) => `<li class="guide-step">
          <div class="gs-num">${i + 1}</div>
          <div class="gs-body">
            <b>${esc(s.title)}</b>
            <p>${esc(s.text)}</p>
            ${s.bullets ? `<dl>${s.bullets.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
            ${s.tip ? `<div class="gs-tip">${esc(s.tip)}</div>` : ''}
          </div></li>`).join('')}</ol>
        ${g.extra ? g.extra() : ''}
        <p class="muted small" style="margin-bottom:0">A quick-reference summary. Check the Cyberpunk RED core rules for the full details and range tables, and go with your GM's rulings.</p>
      </div>
    </div>`;
  }

  function onClick(e) {
    const t = e.target.closest('[data-guide]');
    if (t) { guide = t.dataset.guide; S.write('ui.guide', guide); render(); window.scrollTo(0, 0); return; }
    const go = e.target.closest('[data-goto]');
    if (go) { const nav = document.querySelector(`#mainnav [data-view="${go.dataset.goto}"]`); if (nav) nav.click(); }
  }

  return {
    mount(el) { root = el; root.addEventListener('click', onClick); },
    onShow() { render(); },
  };
})();
