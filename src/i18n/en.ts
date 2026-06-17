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
    // Single-letter Win/Draw/Loss abbreviations (stats tables, match rows).
    w: 'W',
    d: 'D',
    l: 'L',
    // Fallback display name for a signed-in player without a chosen game name.
    you: 'You',
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
    howToPlay: 'How to play',
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
    appearanceH: 'Appearance',
    colourTheme: 'Colour theme',
    changeTheme: 'Change',
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

  // Profile popover (account, multiplayer rating, daily streak, offline stats, GDPR).
  profile: {
    aria: 'Profile',
    close: 'Close',
    title: 'Your profile',
    tagline: 'Account info + offline history.',
    accountH: 'Account',
    gameName: 'Game name',
    rename: 'Rename',
    email: 'Email',
    signInMethod: 'Sign-in method',
    providerGoogle: 'Google',
    providerEmail: 'Email & password',
    providerUnknown: 'Unknown',
    emailUnverified:
      'Email not yet verified. Check your inbox (and spam folder) for the link we sent.',
    fallbackName: 'Player 1',
    accountFallback: 'Account',
    multiplayerH: 'Multiplayer',
    rating: 'Rating',
    provisional: (n: number, total: number) => `Provisional ${n}/${total}`,
    provisionalTitle: 'Rating stabilises after 10 ranked games',
    lastMatches: (n: number) => `Last ${n} matches`,
    noMatches: 'No ranked matches yet. Queue up from the menu.',
    streakH: 'Daily streak',
    streakEmpty: 'Play today’s puzzle to start a streak. (Coming soon.)',
    currentStreak: 'Current streak',
    longest: 'Longest',
    dayN: (n: number) => `Day ${n}`,
    streakHint: 'Streak counts daily-puzzle completions. Miss a day and it resets.',
    offlineHistoryH: (name: string) => `Offline history — “${name}”`,
    offlineEmpty:
      'No games on this device yet. Start a Vs-AI or Hot-seat match to populate this.',
    totalGames: 'Total games',
    vsBotsWDL: 'Vs-Bots · W/D/L',
    hotseatWDL: 'Hot-seat · W/D/L',
    pointsScored: 'Points scored',
    pointsGiven: 'Points given',
    avg: (v: string) => `avg ${v}`,
    offlineHint: 'Stored on this device under the name from Settings. Cloud sync comes next.',
    dataH: 'Your data',
    dataHint:
      'Under GDPR you can download everything we hold about you, or delete your account entirely. Deletion is immediate and cannot be undone.',
    preparing: 'Preparing…',
    downloadData: 'Download my data',
    deleteAccount: 'Delete my account',
    signOut: 'Sign out',
    done: 'Done',
    deleteFailed: 'Deletion failed. Please try again.',
    deleteConfirmTitle: 'Delete your account?',
    deleteConfirmBody:
      "This permanently removes your account, sign-in, leaderboard entry, and scrubs your name from past matches. Opponents keep their rating history. If you're in a live game it will forfeit. This cannot be undone.",
    cancel: 'Cancel',
    deleting: 'Deleting…',
    deleteForever: 'Delete forever',
  },

  // Sign-in / create-account popover.
  signIn: {
    aria: 'Sign in',
    close: 'Close',
    titleGate: 'Sign in to play',
    titleSignIn: 'Sign in',
    titleSignUp: 'Create account',
    google: 'Continue with Google',
    orEmail: 'or with email',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Password (min 6 chars)',
    confirmPlaceholder: 'Confirm password',
    submitSignIn: 'Sign in',
    submitSignUp: 'Create account',
    newHere: 'New here?',
    createAccount: 'Create an account',
    haveOne: 'Already have one?',
    signInLink: 'Sign in',
    tryAnon: 'Want to try anonymous without signing in?',
    accountCreated: (email: string) =>
      `Account created. If email confirmation is on, check ${email} (and spam) to verify.`,
    errPasswordsMatch: "Passwords don't match.",
    errInvalidCreds: 'Email or password is incorrect.',
    errAlreadyRegistered: 'That email is already registered. Sign in instead.',
    errWeakPassword: 'Password must be at least 6 characters.',
    errInvalidEmail: "That email doesn't look right.",
    errNotConfirmed: 'Please confirm your email first (check your inbox).',
    errRateLimit: 'Too many attempts. Try again in a minute.',
    errNetwork: 'Network error. Check your connection and try again.',
    errGeneric: 'Something went wrong.',
  },

  // Username claim / rename popover.
  username: {
    ariaClaim: 'Pick a game name',
    ariaRename: 'Rename',
    cancel: 'Cancel',
    titleClaim: 'Pick your game name',
    titleRename: 'Rename',
    taglineClaim:
      'This is what other players will see. Unique to you. You can rename later.',
    taglineRename: 'Stats follow your account, not the name — they carry over.',
    placeholder: 'e.g. Donatas',
    claim: 'Claim name',
    save: 'Save',
    signOut: 'Sign out',
    checking: 'Checking…',
    available: 'Available',
    taken: 'Taken — try another',
    hint: '3–16 chars · letters, digits, _ or -',
    checkFailed: 'Check failed.',
    genericError: 'Something went wrong.',
    invalidShort: 'At least 3 characters.',
    invalidLong: 'Max 16 characters.',
    invalidChars: 'Letters, digits, _ or - only.',
  },

  // Friend presence status labels (keyed by FriendStatus).
  friendStatus: {
    menu: 'On menu',
    'in-ai': 'Vs Bots',
    'in-hotseat': 'Hot-seat',
    'in-ranked': 'Ranked match',
    'searching-ranked': 'Searching…',
    'in-daily': "Today's puzzle",
    offline: 'Offline',
  },

  // Time controls (keyed by TimeControl id). Names are flavour; per/sub translate.
  timeControls: {
    '1min': { label: 'Bullet', per: '1 minute per player', sub: 'Fast and frantic.' },
    '3min': { label: 'Blitz', per: '3 minutes per player', sub: 'Balanced default.' },
    '5min': { label: 'Rapid', per: '5 minutes per player', sub: 'Time to think.' },
  },

  // Friends button (menu chip) + Friends popover.
  friends: {
    online: (n: number) => `👥 ${n} online`,
    friends: '👥 Friends',
    addFriendTitle: 'Add a friend',
    onlineOfTotal: (online: number, total: number) => `${online} of ${total} online`,
    newBadge: (n: number) => `${n} new`,
    aria: 'Friends',
    close: 'Close',
    title: 'Friends',
    tabOnline: 'Online',
    tabAll: 'All',
    tabRequests: 'Requests',
    emptyOnline: 'No friends online right now.',
    emptyAll: 'No friends yet — add one below.',
    addByUsername: 'Add a friend by username',
    usernamePlaceholder: 'username',
    sending: 'Sending…',
    send: 'Send',
    requestSent: 'Request sent.',
    requestFailed: 'Request failed.',
    removeConfirm: (name: string) => `Remove ${name} from friends?`,
    blockConfirm: (name: string) =>
      `Block ${name}? They won't be able to send you friend requests or game invites.`,
    inviteToGame: 'Invite to a game',
    friendMustBeOnMenu: 'Friend must be on menu',
    invite: 'Invite',
    more: 'More',
    removeFriend: 'Remove friend',
    block: 'Block',
    statusAria: (label: string) => `Status: ${label}`,
    noPending: 'No pending requests.',
    incomingH: 'Incoming',
    wantsToBeFriends: 'wants to be friends',
    accept: 'Accept',
    decline: 'Decline',
    sentH: 'Sent',
    waitingForThem: 'waiting for them',
    cancel: 'Cancel',
  },

  // Send-invite dialog + incoming-invite toast.
  invite: {
    aria: 'Send invite',
    close: 'Close',
    title: (name: string) => `Invite ${name}`,
    waiting: (name: string) => `Invite sent to ${name}. Waiting for them to accept…`,
    cancelInvite: 'Cancel invite',
    declined: (name: string) => `${name} didn't accept the invite.`,
    sendAgain: 'Send again',
    shapeH: 'Shape',
    timeH: 'Time control',
    ranked: 'Ranked match',
    rankedHint:
      "Counts for Elo only if your opponent also accepts ranked. Otherwise it's a casual match.",
    cancel: 'Cancel',
    send: 'Send invite',
    sending: 'Sending…',
    inviteFailed: 'Invite failed.',
    reasonOffline: 'is offline',
    reasonSearching: 'is searching for a match',
    reasonInGame: 'is in a game',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason} — can't invite right now.`,
    toastAria: 'Game invites',
    aFriend: 'A friend',
    invitesYou: 'invites you',
    theyPickedRanked: 'They picked Ranked',
    declineFrom: (name: string) => `Decline invite from ${name}`,
    decline: 'Decline',
    acceptCasual: 'Accept casual',
    acceptRanked: 'Accept ranked',
    accept: 'Accept',
  },

  // GameOver screen (all modes: ai / hot-seat / daily / multiplayer).
  gameOver: {
    oppWantsRematchTitle: 'Your opponent wants a rematch',
    acceptRematch: 'Accept rematch',
    waitingForOpponent: 'Waiting for opponent…',
    cancel: 'Cancel',
    rematch: 'Rematch',
    youWin: 'You win',
    playerWins: (name: string) => `${name} wins`,
    aborted: 'Game aborted',
    abortedSub: 'no first move · no rating change',
    draw: 'Game ended in a draw',
    youLost: 'You lost',
    onPoints: 'on points',
    onTime: 'on time',
    oppResigned: 'opponent resigned',
    oppDisconnected: 'opponent disconnected',
    youResigned: 'you resigned',
    disconnected: 'disconnected',
    drawTitle: 'Draw',
    champion: 'DotDuel champion',
    impossibleDefeated: 'Impossible — defeated',
    rating: 'Rating',
    timesUp: '⏱ Time’s up',
    yourScore: 'Your score:',
    bestToday: 'Best today:',
    attemptOf: (n: number) => ` · attempt ${n}/3`,
    streakLabel: 'Streak:',
    dayN: (n: number) => `Day ${n}`,
    bestDay: (n: number) => `(best: Day ${n})`,
    attemptsLeft: (n: number) =>
      `${n} attempt${n === 1 ? '' : 's'} left today. Your best counts on the leaderboard.`,
    allAttemptsUsed: 'All 3 attempts used. Come back tomorrow at midnight UTC.',
    savingResult: 'Saving result…',
    menu: 'Menu',
    lobby: 'Lobby',
    playAgain: 'Play again',
    leaderboard: 'Leaderboard',
    tryAgainN: (n: number) => `Try again (${n} left)`,
    addAsFriend: (name: string) => `➕ Add ${name} as friend`,
    sendingRequest: 'Sending request…',
    friendRequestSent: 'Friend request sent.',
    couldntSend: "Couldn't send — try again",
    champHeadline: "You've completed DotDuel single player!",
    champBody:
      "You've conquered every shape on every level. The toughest challenge left is real humans.",
    comingSoonTitle: 'Coming soon',
    multiplayerComingSoon: 'Multiplayer · coming soon',
    impossibleHeadline: (shape: string) => `You took down the toughest AI on ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} is your next mountain. Start from ${beginner} and work your way back up.`,
    tryShape: (shape: string) => `Try ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `${shape} is now unlocked!`,
    shapeUnlockedBody: (shape: string) =>
      `A fresh board with new strategy. Or stick with ${shape} and step up the difficulty.`,
    pushTo: (level: string, shape: string) => `Or push to ${level} on ${shape}`,
    levelUnlockedHeadline: (level: string) => `${level} unlocked.`,
    levelUnlockedBody: 'The AI just got smarter. Ready to face it?',
    tryLevel: (level: string) => `Try ${level}`,
    niceOne: 'Nice one.',
    niceOneBody: 'Already cleared this. Want a tougher fight?',
  },

  // Multiplayer lobby + matchmaking + match-found + clock.
  lobby: {
    back: '‹ Back',
    title: 'Multiplayer',
    intro: (rating: number) =>
      `Pick a time control. We'll match you against another player at a similar rating (yours: ${rating}).`,
    lockedTitle: 'Locked while the player base grows — only Blitz is open for now to keep matchmaking fast.',
    comingBackSoon: 'Coming back soon',
    board: 'Board:',
    unlockHint: (nextLabel: string, n: number) =>
      `— ${nextLabel} unlocks in ${n} more ranked ${n === 1 ? 'game' : 'games'}.`,
    findMatch: 'Find ranked match',
  },

  matchmaking: {
    finding: 'Finding an opponent…',
    waitingAtRating: (s: number) => `Waiting for a player at your rating (${s}s)`,
    stillSearching: (s: number) =>
      `Still searching — we may pair you with a ranked AI shortly (${s}s)`,
    cancelSearch: 'Cancel search',
    rangeHint: "Match range expands by ~25 Elo per second. We'll pair you with the closest opponent.",
  },

  matchFound: {
    opponentFound: 'Opponent found!',
    youPlayerN: (n: number) => `You · Player ${n}`,
    playerN: (n: number) => `Player ${n}`,
    ready: '✓ Ready',
    notReady: '— Not ready',
    vs: 'vs',
    bot: 'BOT',
    aiOpponent: 'AI opponent',
    bothReady: 'Both ready — starting…',
    startsIn: (s: number) => `Starts in ${s}`,
    shapeLine: (shape: string) => `Shape: ${shape}. Player 1 moves first.`,
    shapeRandom: 'random',
    readyWaiting: '✓ Ready — waiting on opponent',
    readyBtn: 'Ready!',
    backToMenu: 'Back to menu',
  },

  clock: {
    remaining: (time: string) => `${time} remaining`,
  },

  // Share / invite-a-friend buttons (native share sheet + clipboard fallback)
  // + the result-share dialog (GameResultShareButton). Platform names (X,
  // WhatsApp, Telegram, Facebook) stay as-is (brands).
  share: {
    title: 'DotDuel — fast 2-player dot strategy',
    textInvite: 'Play me a quick game of dots.',
    textShare: 'Try DotDuel — a fast 2-player dot strategy game.',
    labelInvite: '➕ Invite a friend',
    labelShare: 'Share DotDuel',
    linkCopied: 'Link copied — paste it anywhere',
    couldNotShare: 'Could not share — try again',
    preparing: 'Preparing…',
    shareResult: '📤 Share result',
    imageCopied: 'Image copied — paste it anywhere',
    imageCopyFailed: 'Couldn’t copy the image — try Download',
    textCopied: 'Text and link copied',
    textCopyFailed: 'Couldn’t copy — try Download',
    imageSaved: 'Image saved',
    dialogAria: 'Share your result',
    dialogTitle: 'Share your result',
    close: 'Close',
    resultCardAlt: 'Your result card',
    copyImage: '📋 Copy image',
    copyTextLink: '🔗 Copy text + link',
    hintCardLink:
      'Your link shows the card picture automatically when pasted. For an inline image, Copy image and paste it into your post.',
    hintNoCardLink:
      'Platform buttons share your text and link. To include the picture, use Copy image and paste it into your post.',
    downloadImage: '⬇ Download image',
  },

  // Rankings popover (global Elo leaderboard + local profiles + head-to-head).
  rankings: {
    aria: 'Rankings',
    backToRankings: 'Back to rankings',
    closeRankings: 'Close rankings',
    back: 'Back',
    close: 'Close',
    aiOpponent: 'AI opponent',
    player: 'Player',
    h2hTagline: 'Head-to-head record by opponent.',
    title: 'Rankings',
    globalTagline: 'Global Elo across all multiplayer players.',
    localTagline: 'Local profiles on this device — vs-AI and hot-seat history.',
    globalElo: 'Global Elo',
    local: 'Local',
    shape: 'Shape:',
    all: 'All',
    emptyLocalAll: 'No games recorded yet on this device.',
    emptyLocalShape: (shape: string) => `No games on ${shape} yet.`,
    colRank: '#',
    colPlayer: 'Player',
    colGames: 'Games',
    colWinPct: 'Win %',
    deleteProfile: 'Delete profile',
    noH2H: 'No head-to-head games recorded.',
    colOpponent: 'Opponent',
    colWinPctShort: 'W %',
    colLossPctShort: 'L %',
    colDrawPctShort: 'D %',
    done: 'Done',
    confirmAria: 'Confirm delete profile',
    deleteTitle: 'Delete profile?',
    deleteBody: (name: string) =>
      `${name} will be removed from the rankings and from every head-to-head record on this device.`,
    deleteConfirm2: 'Do you really want to delete this? Data will be unrecoverable.',
    cancel: 'Cancel',
    signInPrompt: 'Sign in to see the global Elo leaderboard.',
    signIn: 'Sign in',
    loadError: 'Couldn’t load the leaderboard — check your connection.',
    tryAgain: 'Try again',
    colElo: 'Elo',
    emptyGlobal: 'No ranked multiplayer games played yet. Be the first to top the chart.',
    you: 'you',
    summaryGames: 'games',
    winRate: 'win rate',
  },

  // Daily-puzzle leaderboard popover.
  puzzleBoard: {
    aria: 'Puzzle leaderboard',
    close: 'Close',
    title: 'Daily winners',
    tagline:
      'Highest score takes the day. Ties broken by who finished first. Resets at midnight UTC.',
    loading: 'Loading…',
    empty: 'No one has finished a daily puzzle yet. Be the first.',
    today: 'Today',
    date: (month: string, day: number) => `${month} ${day}`,
    you: ' (you)',
    done: 'Done',
  },

  // In-game side panel (player card, stats, points totals, avatars).
  sidePanel: {
    featuredTitle: (title: string) => `${title} — tap for achievements`,
    noGames: 'no games yet',
    botLabel: (level: string) => `Bot · ${level}`,
    botShort: (level: number) => `Bot L${level}`,
    hotseat: 'Hot-seat',
    hotseatShort: 'HS',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} games · ${record} · ${pct} wins`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `Across ${games} games: ${scored} pts scored, ${given} pts given. Averages ${avgS} / ${avgG} per game.`,
    aiLabel: (level: string) => `AI opponent, ${level} difficulty`,
  },

  // Achievements popover + unlock toast.
  // `byId`/`tracks` are per-language OVERRIDES of the catalog (catalog.ts is the
  // English source of truth, so they stay {} for English and the UI falls back
  // to the catalog). Other languages fill `byId` with every achievement id →
  // { title, desc }, and `tracks` keyed by the English track label.
  achievements: {
    byId: {} as Record<string, { title: string; desc: string }>,
    tracks: {} as Record<string, string>,
    aria: 'Achievements',
    close: 'Close',
    title: 'Achievements',
    unlocked: 'unlocked',
    hiddenReveal: 'Hidden — keep playing to reveal this one.',
    statusUnlocked: '✓ Unlocked',
    statusLocked: 'Locked',
    pinTitle: 'Show this badge next to your name in games',
    featured: '★ Featured',
    pin: 'Pin',
    detailHint: 'Tap a badge to see what it’s for.',
    secret: '???',
    hidden: 'Hidden',
    hiddenAria: 'Hidden achievement',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Achievement unlocked',
  },

  // "How to play" popover — looping animated scenes (carousel).
  howto: {
    aria: 'How to play',
    close: 'Close',
    title: 'How to play',
    tagline: 'Watch each move — the board shows exactly what happens.',
    prev: 'Previous',
    next: 'Next',
    done: 'Got it',
    scenes: {
      place: {
        title: 'Place a dot',
        body: 'On your turn, tap any empty dot to colour it. Then it’s your opponent’s turn.',
      },
      corner: {
        title: 'A corner scores 1',
        body: 'A single corner dot counts as a line of 1 — it scores 1 point on its own.',
      },
      lineScored: {
        title: 'Complete a line',
        body: 'Colour every dot on a straight line and it scores its length in points.',
      },
      claim: {
        title: 'Claim waiting lines',
        body: 'One move can finish several lines — only the longest scores, the rest wait (glowing). Tap a dot on a waiting line to claim its points. Either player can grab them.',
      },
      triThreeWays: {
        title: 'Triangle: 3 directions',
        body: 'Lines run across and along both diagonals.',
      },
      sqFourWays: {
        title: 'Square: 4 directions',
        body: 'Lines run across, down, and along both diagonals.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};

export type Messages = typeof en;
