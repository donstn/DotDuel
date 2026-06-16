/**
 * English — the SOURCE OF TRUTH for every user-facing string.
 *
 * How this works:
 * - Strings are grouped into namespaces by where they appear (menu, footer,
 *   game, …). Keep the grouping meaningful so a translator has context.
 * - A value is either a plain string, or a function `(args) => string` when it
 *   needs interpolation or grammar that varies by value (counts, names). Putting
 *   the logic in a function lets each language apply its OWN rules — important
 *   for Lithuanian, whose plural/case forms differ from English.
 * - `Messages = typeof en` is derived from this file. Every other language must
 *   satisfy that type, so a missing or wrong-shaped key is a COMPILE error and
 *   nothing can silently ship untranslated.
 *
 * Adding a language: copy this file's shape to `<lang>.ts`, translate the
 * values, register it in `index.tsx`. Nothing else changes.
 */
export const en = {
  // Generic, reused across screens.
  common: {
    back: 'Back',
    cancel: 'Cancel',
    close: 'Close',
    locked: 'Locked',
    signInToView: 'Sign in to view.',
    signInToPlay: 'Sign in to play.',
  },

  // Language picker (top-right, next to the theme button).
  lang: {
    label: 'Language',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  // Board shapes — used in the shape picker, setup screens and player tags.
  shapes: {
    triangle: 'Triangle',
    square: 'Square',
    rectangle: 'Rectangle',
    rhombus: 'Rhombus',
  },

  // Bot difficulty levels (1→5).
  difficulty: {
    1: 'Beginner',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Impossible',
  },

  // Home menu and its sub-screens.
  menu: {
    // One-line rules blurb under the title (shown to signed-out visitors).
    tagline:
      'Take turns placing dots, finish a line to score points for its length. Win by scoring most points while coloring the whole board.',
    // Signed-in greeting prefix; the bold {name} and the tagline follow in the UI.
    welcomeLead: 'Welcome,',

    changeTheme: 'Change colour theme',

    // Auth row.
    profile: 'Profile',
    signOut: 'Sign out',
    signIn: 'Sign in',
    shareDotDuel: 'Share DotDuel',

    // Top-level category shelves.
    singlePlayer: 'Single player',
    singlePlayerSub: 'Bots & daily puzzle.',
    multiplayer: 'Multiplayer',
    multiplayerSub: 'Hot-seat & online ranked.',
    rankings: 'Rankings',
    rankingsSub: 'Puzzle, local & rated boards.',

    // Single-player sub-screen.
    bots: 'Bots',
    botsSub: 'Five levels, gentle to merciless.',

    // Multiplayer sub-screen.
    hotseat: 'Hot-seat',
    hotseatSub: '1 device · 2 players.',

    // Rankings sub-screen.
    puzzleRankings: 'Puzzle rankings',
    puzzleRankingsSub: "Today's best puzzle scores.",
    localRankings: 'Local rankings',
    localRankingsSub: 'Your records on this device.',
    ratedRankings: 'Rated rankings',
    ratedRankingsSub: 'Global online Elo leaderboard.',
    achievements: 'Achievements',
    achievementsSub: 'Badges you’ve earned for playing.',

    // Daily-puzzle card (sign-in gated, 3 states).
    dailyPuzzle: 'Daily puzzle',
    dailyDoneSub: (best: number) => `✓ Done · best ${best} · resets midnight UTC`,
    dailyDoneTitle: 'All 3 attempts used. Come back tomorrow.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Attempt ${attempt}/${max} · best ${best}`,
    dailyFreshSub: (max: number) => `${max} attempts · 3 min · top score wins.`,
    dailySignInTitle: "Sign in to play today's puzzle",

    // Online-ranked card.
    onlineRanked: 'Online ranked game',
    onlineFindMatch: 'Find a rated match.',
    onlineSignInTitle: 'Sign in to play online',
    onlineUnreachable: 'Server unreachable — your network may be blocking it.',
    onlineUnreachableTitle:
      'Your network is blocking the game server (likely an ad/tracker blocker or DNS filter)',
    onlineLocked: 'Active on another tab/device — finish or close it there.',
    onlineLockedTitle: 'You have a multiplayer session open on another tab or device',

    // Pickers.
    chooseShape: 'Choose shape',
    chooseDifficulty: 'Choose difficulty',
    dots: (n: number) => `${n} dots`,
    level: (d: number) => `Level ${d}`,
    shapeLockedTitle: 'Beat the previous shape on Hard to unlock',

    // Name-entry / setup screens.
    whosPlaying: "Who's playing?",
    vsBot: (shape: string, difficulty: string) => `${shape} · vs Bot · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · confirm or change names before starting`,
    yourNameFirst: 'Your name — plays first',
    player1First: 'Player 1 — plays first',
    player2: 'Player 2',
    signedInAs: (name: string) => `Signed in as ${name}. Change in Profile.`,
    swapColours: 'Swap colours (Player 1 cream · Player 2 green)',
    startGame: 'Start game',
    player1Placeholder: 'Player 1',
    player2Placeholder: 'Player 2',
  },

  // Persistent footer (also shown in-game).
  footer: {
    rules: 'Rules',
    settings: 'Settings',
    privacy: 'Privacy',
    theme: 'Theme',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. All rights reserved. DotDuel and the DotDuel logo are claimed trademarks of their author.',
    versionTitle: "See what's new",
  },

  // In-game screen.
  game: {
    ptsLeft: 'PTS LEFT',
    linesToClaim: (n: number): string => (n === 1 ? 'line to claim' : 'lines to claim'),
    pendingTitle: 'Lines waiting to be claimed — tap a coloured dot on one to claim it.',
    leaveMatch: 'Leave match',
    backToMenu: 'Back to menu',
    dailyTime: 'Your time for this attempt',
    seeUnclaimed: 'See unclaimed lines',
    seeUnclaimedTitle: (on: boolean) => `See unclaimed lines: ${on ? 'on' : 'off'}`,
    rules: 'How to play',
    showRules: 'Show rules',
    resign: 'Resign',
    resignTitle: 'Resign and end the game',
    // vs-AI / hot-seat back-out confirm.
    resignConfirmTitle: 'Resign?',
    resignConfirmBody: "You'll lose this game.",
    // Online-ranked resign confirm.
    resignRankedTitle: 'Resign this ranked game?',
    resignRankedBody: 'It counts as a loss on your rated record.',
    thinking: 'Thinking',
    bot: 'BOT',
    aiOpponent: 'AI opponent',
  },

  // Rules popover (How to play).
  rules: {
    aria: 'How to play DotDuel',
    close: 'Close rules',
    title: 'How to play DotDuel',
    tagline: 'Take turns. Complete lines. Get the most points.',
    goalH: 'Goal',
    goalP: 'Score more points than your opponent.',
    turnH: 'Each turn',
    turnP: 'Do one of these, then the turn passes:',
    turnTapEmpty: 'Tap an empty dot to color it.',
    turnTapClaim:
      'Tap a dot on a finished, unclaimed line to claim its points (no new dot placed).',
    scoringH: 'Scoring',
    scoringP:
      'A line is any straight run of dots — horizontal, vertical, or diagonal. When every dot on a line is colored, it pays its length in points.',
    score3: '3-dot line → 3 pts',
    score5: '5-dot line → 5 pts',
    score8: '8-dot line → 8 pts',
    scoreCorner: 'A single corner dot counts as a 1-pt “line”',
    catchH: 'The catch — one move, one score',
    catchP:
      'If your dot finishes several lines at once, you score only the longest. The other finished lines become unclaimed — anyone can grab them on a later turn.',
    watchH: 'Watch the board',
    watchP:
      'The game won’t mark unclaimed lines. Spot a fully colored line that hasn’t been crossed off, then tap any of its dots to claim it. Free points for paying attention.',
    endH: 'Game end',
    endP:
      'When every dot is colored and every finished line has been claimed. Highest score wins; equal scores draw.',
    tipsH: 'Tips',
    tip1: 'Avoid moves that finish two lines — you give the rest away.',
    tip2: 'Always take a free corner or big completion.',
    tip3: 'A 0-point block can be smarter than a small score.',
    tip4: 'Late game: scan for unclaimed lines before placing.',
    modesH: 'Modes',
    modeBotsLead: 'Vs Bots',
    modeBots: '— five difficulty levels. Beat Easy on one shape to unlock the next.',
    modeHotseatLead: 'Hot-seat',
    modeHotseat: '— two players, one device.',
    modeMpLead: 'Multiplayer',
    modeMp: '— live with global Elo ranking, chess-style time controls, and rematches.',
    gotIt: 'Got it',
  },

  // Settings popover.
  settings: {
    aria: 'Settings',
    close: 'Close settings',
    title: 'Settings',
    tagline: 'Saved locally on this device.',
    yourName: 'Your name',
    yourNameHintSignedIn: (name: string) => `Signed in as ${name}. Rename in Profile.`,
    yourNameHint: 'Used in Vs-AI mode AND as Player 1 in Hot-seat.',
    hotseatOpponent: 'Hot-seat opponent',
    player2Name: 'Player 2 name',
    swapColours: 'Swap colours (Player 1 cream · Player 2 green)',
    privacyH: 'Privacy',
    whoCanChallenge: 'Who can challenge me to a game?',
    everyone: 'Everyone',
    friendsOnly: 'Friends only',
    nobody: 'Nobody',
    showStatus: 'Show my status to friends',
    showStatusHint:
      'When off, friends see you as offline. Friend requests still work; only the live status indicator is hidden.',
    resetProgress: 'Reset progress',
    resetProgressConfirm: 'Reset progress? Unlocked shapes and levels will be lost.',
    resetStats: 'Reset stats',
    resetStatsConfirm: "Reset stats? Every player's W/D/L history on this device will be erased.",
    renameNote:
      "Note: renaming yourself starts a fresh stats row. Old name's history is kept under that old name.",
    done: 'Done',
  },

  // Theme picker. Theme NAMES stay as-is (brand/flavour); taglines are translated.
  theme: {
    aria: 'Choose a theme',
    close: 'Close themes',
    title: 'Theme',
    tagline: 'Pick a palette. Saved to this device.',
    sunFriendly: 'Sun-friendly',
    done: 'Done',
    taglines: {
      'forest-pearl': 'The original. Emerald on jade vignette.',
      'royal-court': 'Violet velvet vs antique gold.',
      'tempo-rivals': 'Wine red vs sky blue. Classic.',
      'sunset-catan': 'Terracotta deserts, parchment pieces.',
      'coral-reef': 'Deep teal water, coral playmates.',
      'twilight-cosmos': 'Indigo void vs electric cyan.',
      'monochrome-pro': 'Black & white pieces on wood. Maximum contrast.',
      'vintage-press': 'Burgundy & navy ink on parchment. Sun-friendly.',
    } as Record<string, string>,
  },

  // Changelog popover. Entry text itself stays in its authored language.
  changelog: {
    aria: "What's new",
    close: 'Close',
    title: "What's new",
    tagline: 'Recent updates to DotDuel, newest first.',
    empty: 'No release notes yet.',
    entryEmpty: 'Release notes coming soon.',
    added: 'Added',
    changed: 'Changed',
    fixed: 'Fixed',
    done: 'Done',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },

  // Privacy Policy (GDPR). Legal text — review carefully before shipping.
  privacy: {
    aria: 'Privacy Policy',
    close: 'Close',
    title: 'Privacy Policy',
    tagline: 'What we collect, why we collect it, and how to delete it.',
    whoH: 'Who we are',
    whoP: 'DotDuel is an independent two-player dot-coloring game. The controller of your personal data under GDPR is the developer. Contact:',
    collectH: 'What we collect',
    collectP: "Only what's needed to make the game work and stay fair.",
    collectAccountLead: 'Account:',
    collectAccount:
      'email, display name, sign-in provider (Google or password), account creation date. Source: you, via Supabase Auth at sign-up.',
    collectRatingLead: 'Multiplayer rating:',
    collectRating:
      'your current Elo, placement-games counter, and last-played timestamp. Source: computed server-side at the end of every ranked match.',
    collectHistoryLead: 'Match history:',
    collectHistory:
      "each ranked match stores both players' UIDs, display names, final scores, rating deltas, shape, time control, duration, and how the game ended (normal / timeout / resign).",
    collectLiveLead: 'Live game state:',
    collectLive:
      'while a multiplayer game is in progress we store the board, clock, and your turn in our Realtime Database. This is deleted shortly after the game ends.',
    collectFriendsLead: 'Friends & invites:',
    collectFriends:
      'your friend list, pending requests, online status, and game invites. If you joined through another player’s invite link or QR code, we record which player invited you (their random invite code — so future referral rewards can be honoured).',
    collectDeviceLead: 'Device-only data:',
    collectDevice:
      "your single-player progress, vs-AI/hot-seat stats, theme preference, and tutorial-seen flag. Stored in your browser's localStorage and never transmitted to us.",
    collectAnalyticsLead: 'Analytics (only if you accept):',
    collectAnalytics:
      'Google Analytics auto-collected events — page views, device model, locale, screen size, anonymous session ID. Not tied to your account in our system.',
    whyH: 'Why we collect it (lawful bases)',
    whyContractLead: 'Contract (Art. 6.1.b):',
    whyContract:
      'account, rating, match history, live game state — all required to operate the multiplayer service you signed up for.',
    whyLegitLead: 'Legitimate interest (Art. 6.1.f):',
    whyLegit:
      'leaderboard and ranked play — to provide a fair, competitive environment for all players.',
    whyConsentLead: 'Consent (Art. 6.1.a):',
    whyConsentAds:
      'Google Analytics AND Google AdSense — both only load after you click Accept on the consent banner. Declined or undecided means neither starts.',
    whyConsentNoAds:
      'Google Analytics — only loaded after you click Accept on the consent banner. Declined or undecided means it never starts.',
    sharedH: "Who it's shared with",
    sharedAds:
      'We use Supabase (database, authentication, realtime infrastructure and serverless functions, hosted in the EU) as our backend provider, plus Google for sign-in and consent-gated Analytics, plus Google AdSense to serve small banner ads on a few menu screens. Both Analytics and AdSense load only after you accept the consent banner. Supabase and Google process data under their standard terms / Data Processing Addenda. We do not sell or share your data with any other third party.',
    sharedNoAds:
      'We use Supabase (database, authentication, realtime infrastructure and serverless functions, hosted in the EU) as our backend provider, plus Google for sign-in and consent-gated Analytics. Analytics only loads after you accept the consent banner. Supabase and Google process data under their standard terms / Data Processing Addenda. We do not sell or share your data with any other third party. We do not currently use third-party ad networks.',
    keepH: 'How long we keep it',
    keepAccountLead: 'Account + leaderboard:',
    keepAccount: 'until you delete your account.',
    keepHistoryLead: 'Match history:',
    keepHistory: 'up to 24 months after the match ended, then permanently deleted.',
    keepLiveLead: 'Live game state:',
    keepLive: 'deleted within ~24 hours of game end.',
    keepAnalyticsLead: 'Analytics:',
    keepAnalytics: "per Google's defaults (currently 14 months for event data).",
    keepDeviceLead: 'Device-only data:',
    keepDevice: 'stays until you clear your browser data.',
    rightsH: 'Your rights',
    rightsP: 'Under GDPR you have the right to:',
    rightAccessLead: 'Access',
    rightAccess: 'the personal data we hold about you — use “Download my data” in your Profile.',
    rightRectifyLead: 'Rectify',
    rightRectify: 'inaccurate data — use the “Rename” button in your Profile.',
    rightEraseLead: 'Erase',
    rightErase:
      'your account (“right to be forgotten”) — use “Delete my account” in your Profile. Effect is immediate.',
    rightPortLead: 'Port',
    rightPort: 'your data — the download above is a machine-readable JSON file you can take elsewhere.',
    rightObjectLead: 'Object',
    rightObject: 'to analytics — use the toggle below or click Decline on the banner at first launch.',
    rightComplainLead: 'Lodge a complaint',
    rightComplain:
      "with your national data protection authority if you believe we've mishandled your data.",
    rankingsNoteLead: 'Important note on rankings.',
    rankingsNote:
      'If you delete your account (or are removed for any reason), your display name and account identifier are scrubbed from all public records. However, the rating changes you caused on other players’ Elo are NOT reversed — past matches are immutable. Opponents you played against keep their rating gains and losses; their match history shows “Deleted player” where your name used to be.',
    cookiesH: 'Cookies and analytics',
    cookiesP:
      'We do not set tracking cookies. Our sign-in (Supabase Auth) uses first-party session storage to keep you signed in. Google Analytics uses cookies, but only if you accept below.',
    currentChoice: 'Current analytics choice:',
    choiceAccepted: 'Accepted',
    choiceDeclined: 'Declined',
    choiceUndecided: 'Not yet decided',
    acceptAnalytics: 'Accept analytics',
    declineAnalytics: 'Decline analytics',
    consentReloadHint:
      'Switching from Accepted to Declined will reload the page to fully stop the Analytics SDK.',
    contactH: 'How to contact us',
    contactP: 'For any privacy question, data-access request, or complaint:',
    effectiveH: 'Effective date',
    effectiveLead: (date: string) => `This policy is effective from ${date}. We'll update it here if anything material changes. The canonical version is published at`,
    done: 'Done',
  },
};

export type Messages = typeof en;
