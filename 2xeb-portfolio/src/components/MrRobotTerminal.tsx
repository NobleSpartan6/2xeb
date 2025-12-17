import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConsole, TerminalEntry } from '../context/ConsoleContext';

/**
 * MrRobotTerminal - Easter Egg Terminal
 *
 * TRIGGERS:
 * - Type "friend" anywhere on the site (outside input fields)
 * - Double-click the 2XEB. logo in footer (desktop)
 * - Long-press 2XEB. logo for 2 seconds (mobile)
 * - Navigate to /friend route
 *
 * COMMANDS DOCUMENTATION:
 * Keep this updated as commands are added/modified.
 *
 * === VISIBLE IN HELP ===
 * help        - Shows available commands
 * whoami      - Random identity/philosophy responses
 * ls          - Lists files (projects/, .fsociety/, readme.txt, manifesto.txt, .truth)
 * cat <file>  - Read files
 * fsociety    - ASCII art + creation manifesto
 * clear       - Clears terminal
 * exit/quit   - Closes terminal
 *
 * === STANDARD UNIX COMMANDS ===
 * pwd, cd, date, echo, id, uname, hostname, uptime, history, env, which, man
 *
 * === FILE OPERATIONS ===
 * touch, mkdir, rm, cp, mv, chmod, chown
 *
 * === TEXT PROCESSING ===
 * grep, find, head, tail, less, more, wc, sort, cat
 *
 * === NETWORK ===
 * ping, curl, wget, ssh, netstat, ifconfig
 *
 * === PROCESS MANAGEMENT ===
 * ps, ps aux, top, htop, kill
 *
 * === DEV TOOLS ===
 * git (status, init, commit, push), npm, node, python, vim, vi, nano, code, make
 *
 * === SYSTEM ===
 * df, free, sudo, su, :q, :q!, :wq
 *
 * === PHILOSOPHY EASTER EGGS ===
 * hack, robot, hierarchies, leap, crowd, meaning
 * hello, hi, hey, please, thanks, why, what, how, who, when, where
 * 42, matrix, neo, morpheus, eb, 2xeb, mrrobot
 *
 * === FILE SYSTEM (Unix-authentic: hidden files require -a flag) ===
 * ls           -> projects/, readme.txt, manifesto.txt (hides dotfiles)
 * ls -a        -> also shows .fsociety/, .truth
 * ls -la       -> detailed listing with hidden files
 * ls .fsociety -> control.txt, freedom.txt, revolution.txt, you.txt (hides .leap)
 * ls -a .fsociety -> also shows .leap
 *
 * cat readme.txt               - Welcome message
 * cat manifesto.txt            - Creation philosophy
 * cat .truth                   - Hidden truths about authenticity
 * cat .fsociety/control.txt    - On control being an illusion
 * cat .fsociety/freedom.txt    - Freedom is heavy & three ways to live
 * cat .fsociety/revolution.txt - Revolution through creation
 * cat .fsociety/you.txt        - Dynamic: timestamp, resolution, personal message
 * cat .fsociety/.leap          - Deepest hidden file about starting
 *
 * === TAB COMPLETION ===
 * Update availableCommands array when adding new commands.
 */

interface MrRobotTerminalProps {
  onClose: () => void;
}

// Terminal color - blue theme
const TERM_COLOR = '#60a5fa'; // Lighter blue for readability
const TERM_COLOR_DIM = 'rgba(96, 165, 250, 0.7)';
const TERM_ACCENT = '#2563EB'; // Brand blue

// Helper to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Terminal commands and responses
const COMMANDS: Record<string, string | (() => string)> = {
  help: `Available commands:

  NAVIGATION
  ls         - list files (try: ls -a for hidden files)
  cat        - read file contents
  cd         - change directory
  pwd        - print working directory

  SYSTEM
  whoami     - identity check
  id         - user information
  uname      - system information
  date       - current timestamp
  ps         - running processes
  history    - command history

  TOOLS
  echo       - print text
  ping       - test connection
  git        - version control
  spotify    - what EB is listening to

  OTHER
  fsociety   - ???
  clear      - clear terminal
  exit       - close terminal

  The surface only shows what it wants you to see.

  "Is any of it real? Look at this. A world built on fantasy."`,

  whoami: () => {
    const responses = [
      'You\'re the one who knocks... and keeps knocking until something opens.',
      'A creator who hasn\'t fully realized it yet.',
      'Are you a 1 or a 0? The answer is: you get to decide.',
      'The one in the middle. The one who sees both sides.',
      'Someone who looked deeper. That already sets you apart.',
      'You\'re not your job. You\'re not your social media. You\'re what you create.',
      'Not a finished thing. Still in motion. That\'s more interesting anyway.',
      'Someone who doesn\'t need the crowd to validate what they know is true.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  // ls commands are handled dynamically in handleCommand

  'cat readme.txt': `> README.txt

Hello, friend.

You found your way in.
Most people never look beneath the surface.
They scroll past, consume, move on.

But you paused. You explored.
That instinct to dig deeper. It's rare.

The world wants you comfortable.
Comfortable people don't ask questions.
Comfortable people don't create.

You're here because you're not comfortable.
Good.

- EB`,

  'cat manifesto.txt': `> MANIFESTO.txt

Every person has the capacity to create.
Not everyone believes it.
That's the real tragedy of the modern world.

We're surrounded by distractions designed to
keep us consuming instead of creating.
To keep us watching instead of building.
To keep us scrolling instead of thinking.

This space exists at the intersection:
  - Code: The craft of building
  - Vision: The intelligence to see what could be
  - Design: The language to communicate it

Technology isn't the point.
Bringing something into existence that wasn't there before.
That's the point.

The world has enough consumers.
Be a creator.`,

  'cat .truth': `> .truth

You found the hidden file.

Here's what most people never realize:

The deepest kind of emptiness comes from living as someone you're not.

We perform versions of ourselves
for social media, for jobs, for acceptance.
We optimize for likes instead of truth.
We build personas instead of purpose.

Following the crowd feels safe.
But consensus is not truth.
It drowns out the voice that matters: yours.

There's a self beneath all that noise.
The one that creates without permission.
The one that knows what rings true.
The one that's been waiting.

You can trace the path that brought you here.
But you can't see what's ahead. You have to move anyway.

You can't think your way into becoming.
You have to act.
The clarity comes after you start.

So stop performing. Start building.
The gap between what you believe and what you do:
close it. Every day. Every action.

Truth isn't something you find in a book.
It's something you live.`,

  'cat .fsociety/control.txt': `Control is an illusion.

The systems we live in (economic, social, digital)
want you to believe you have no power.

But every creator who ever built something
that changed the world started with nothing
but an idea and the audacity to act on it.

The question isn't whether you have control.
The question is whether you'll use it.`,

  'cat .fsociety/freedom.txt': `Freedom is heavy.

When you realize you can do anything,
the weight of that choice is terrifying.

Most people run from it.
They fill their time with distractions.
They let algorithms choose for them.
They outsource their decisions to the crowd.

There are only three ways to live:

  1. Chase stimulation. Novelty. Distraction.
     It always leaves you empty.

  2. Follow the rules. Do what's expected.
     Better, but you're living someone else's life.

  3. Create your own path.
     The only one that's actually yours.

The fear of choosing wrong doesn't go away.
You just learn to build anyway.`,

  'cat .fsociety/revolution.txt': `The revolution isn't about tearing things down.

It's about building something better.
It's about creating alternatives.
It's about proving another way is possible.

Every line of code that solves a real problem.
Every piece of art that makes someone feel seen.
Every idea that spreads because it's true.

That's the revolution.
And it happens one creator at a time.`,

  'cat .fsociety/you.txt': () => `Timestamp: ${new Date().toLocaleTimeString()}
Resolution: ${window.innerWidth}x${window.innerHeight}

You found this file.
You dug through layers most people ignore.

The crowd will never find this.
And that's the point.

Truth doesn't come from consensus.
It comes from individuals who step outside,
who refuse the comfort of agreement,
who trust their own experience over the algorithm.

You are not a finished product.
You are always in motion. Always becoming.
Every choice either closes the gap
between who you are and who you could be,
or widens it.

Taking a risk means you might stumble.
Playing it safe means you never move.

The act of starting is the thing.
Not the outcome.

So after you close this terminal:
What will you create?
What will you become?

The world doesn't need another spectator.`,

  'cat .fsociety/.leap': `> .leap

The hidden file within the hidden folder.
You really don't give up, do you?

Here's the secret no one tells you:

You can't reason your way to meaning.
You can't logic your way to purpose.
You can't plan your way to becoming.

At some point, you have to move.

Accepting that you might fail
is the cost of doing anything that matters.
Starting anyway is the only way forward.

Every creator knows this moment:
The blank page. The empty repo.
The idea that might not work.

Reason says wait. Gather more data.
But the thing worth building
lives on the other side of starting.

So start.

The path reveals itself as you walk.`,

  // Directory navigation (cd, ls, pwd, cat) is handled dynamically in handleCommand

  // Standard Unix commands
  date: () => new Date().toString(),
  id: 'uid=1000(friend) gid=1000(creators) groups=1000(creators),27(sudo)',
  uname: 'FreeMind 1.0.0',
  'uname -a': 'FreeMind 1.0.0 friend-terminal aarch64 GNU/Linux',
  hostname: 'friend-terminal',
  uptime: () => `up ${Math.floor(Math.random() * 100)} days, ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  history: 'Your history is what you create next.',
  env: 'USER=friend\nHOME=/home/friend\nSHELL=/bin/truth\nPATH=/usr/bin:/bin:/usr/local/bin\nEDITOR=vim\nTERM=xterm-256color',
  which: 'usage: which <command>',
  'which truth': '/usr/bin/truth (not found in $PATH, must be lived)',
  man: 'No manual entry. Figure it out yourself.',
  'man man': 'The real manual is experience.',

  // File operations
  touch: 'if love is the answer you\'re home',
  mkdir: 'mkdir: cannot create directory: what are you trying to build?',
  'rm -rf': 'Nice try.',
  'rm -rf /': 'Chaos isn\'t creation. Build something.',
  rm: 'rm: cannot remove: some things become part of who you are',
  cp: 'cp: cannot copy: originality required',
  mv: 'mv: you can\'t move what\'s already inside you',
  chmod: 'chmod: permissions are an illusion',
  chown: 'chown: you already own your choices',

  // Text processing
  grep: 'grep: searching for meaning? try: cat .truth',
  'grep -r': 'grep: the answer isn\'t in the files. it\'s in the doing.',
  find: 'find: what are you looking for?',
  head: 'head: start at the beginning. type: help',
  tail: 'tail: the end is just another beginning',
  less: 'less is more. keep exploring.',
  more: 'more is less. simplify.',
  wc: 'wc: words don\'t count. actions do.',
  sort: 'sort: priorities sorted? 1. create 2. repeat',
  cat: 'usage: cat <filename>',

  // Network
  ping: 'ping: connection established. you\'re not alone.',
  'ping localhost': 'ping: 127.0.0.1 is alive. so are you.',
  curl: 'curl: the real connection is offline',
  wget: 'wget: you can\'t download purpose',
  ssh: 'ssh: you\'re already connected to what matters',
  netstat: 'netstat: all connections point inward',
  ifconfig: 'lo0: 127.0.0.1 (you are here)\neth0: connected to everything',

  // Process management
  ps: 'PID TTY          TIME CMD\n  1 ?        00:00:00 init\n  2 ?        00:00:01 consciousness\n  3 ?        00:00:00 doubt (sleeping)',
  'ps aux': 'USER       PID  CMD\nfriend       1  /usr/bin/becoming\nfriend       2  /usr/bin/creating\nfriend       3  /usr/bin/questioning',
  top: 'top - system load: creativity 98%, doubt 2%',
  htop: 'htop: install it yourself. this isn\'t that kind of terminal.',
  kill: 'kill: you can\'t kill ideas',
  'kill -9': 'kill -9: even force won\'t stop what\'s meant to be built',

  // Development tools
  git: 'git: commitment required. what are you building?',
  'git status': 'On branch main\nYour branch is ahead of \'origin/comfort\' by many commits.\n\n  (use "git push" to share what you\'ve built)',
  'git init': 'Initialized empty repository in /home/friend/new-creation/',
  'git commit': 'git commit: nothing to commit until you create something',
  'git push': 'git push: push yourself first',
  npm: 'npm: no package can give you purpose',
  'npm install': 'npm install: installing... purpose not found in registry',
  node: 'node: runtime ready. what will you execute?',
  python: 'python: >>> import purpose\nModuleNotFoundError: create it yourself',
  vim: 'vim: :q! to quit. but why quit?',
  vi: 'vi: the editor of your life is you',
  nano: 'nano: small changes compound.',
  code: 'code: vs what? vs comfort. vs fear.',
  make: 'make: make what? that\'s the question.',
  'make install': 'make: *** No targets specified. what are you building?',

  // System info
  df: 'Filesystem      Size  Used Avail Use%\n/dev/potential  ∞     12%   ∞    0%',
  'df -h': 'Filesystem      Size  Used Avail Use%\n/dev/potential  unlimited',
  free: 'You already are.',
  'free -h': 'Memory: unlimited\nSwap: unnecessary when you\'re present',

  // Fun/Easter eggs
  sudo: 'You don\'t need permission. You never did.',
  'sudo su': 'You\'re already root. Act like it.',
  'sudo rm -rf /': 'Destruction is easy. Creation is the challenge.',
  su: 'Become who you already are.',
  ':q': 'This isn\'t vim. But you can type: exit',
  ':q!': 'Force quit? What are you running from?',
  ':wq': 'Write what? Create something first.',

  // Philosophy easter eggs
  hack: 'The most important system to hack is your own mind.',
  robot: 'He\'s not real. But the questions he asks are.',
  hierarchies: 'Pyramids are just schemes. Build networks instead.',
  leap: 'The path appears after you start walking. Not before.',
  crowd: 'Consensus is not truth. Step outside it.',
  meaning: 'It\'s not found. It\'s created. By you. Through action.',
  hello: 'Hello, friend.',
  hi: 'Hey.',
  hey: 'What\'s up?',
  please: 'You don\'t need to ask permission.',
  thanks: 'Don\'t thank me. Go build something.',
  why: 'That\'s the right question. Keep asking.',
  what: 'What will you create?',
  how: 'Start. The how reveals itself.',
  who: 'You. Always you.',
  when: 'Now. Always now.',
  where: 'Here. Wherever you are.',
  '42': 'But what\'s the question?',
  matrix: 'The red pill is just the beginning.',
  neo: 'You\'re looking for someone else to tell you who you are.',
  morpheus: 'I can only show you the door. You have to walk through it.',
  eb: 'Hello, friend.',
  mrrobot: 'We\'re all just stories in the end.',
  '2xeb': 'You found me.',

  fsociety: () => {
    // Use simpler text on narrow screens (under 500px)
    const isMobile = window.innerWidth < 500;

    if (isMobile) {
      return `
> FSOCIETY

"We are finally free.
 Free to create."

The original revolution
was about destruction.

The real revolution
is about creation.

Every person has
something to build.

The system wants
you to consume.

Choose to create instead.`;
    }

    return `
    ███████╗███████╗ ██████╗  ██████╗██╗███████╗████████╗██╗   ██╗
    ██╔════╝██╔════╝██╔═══██╗██╔════╝██║██╔════╝╚══██╔══╝╚██╗ ██╔╝
    █████╗  ███████╗██║   ██║██║     ██║█████╗     ██║    ╚████╔╝
    ██╔══╝  ╚════██║██║   ██║██║     ██║██╔══╝     ██║     ╚██╔╝
    ██║     ███████║╚██████╔╝╚██████╗██║███████╗   ██║      ██║
    ╚═╝     ╚══════╝ ╚═════╝  ╚═════╝╚═╝╚══════╝   ╚═╝      ╚═╝

    "We are finally free. Free to create."

    The original revolution was about destruction.
    The real revolution is about creation.

    Every person has something to build.
    Every person has something to say.
    Every person has capacity they haven't discovered.

    The system wants you to consume.
    Choose to create instead.

    That's the only revolution that matters.`;
  },

  clear: '__CLEAR__',
  exit: '__EXIT__',
};

// Typewriter effect hook
const useTypewriter = (text: string, speed: number = 30, startDelay: number = 0) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
};

const MrRobotTerminal: React.FC<MrRobotTerminalProps> = ({ onClose }) => {
  // Get persisted terminal state from context
  const {
    terminalHistory,
    addTerminalEntry,
    setTerminalHistory,
    clearTerminalHistory,
    terminalCommandHistory,
    addTerminalCommand,
    terminalCurrentDir,
    setTerminalCurrentDir,
    terminalHasSeenIntro,
    setTerminalHasSeenIntro,
  } = useConsole();

  // Start at terminal phase if user has seen intro before
  const [phase, setPhase] = useState<'glitch' | 'intro' | 'terminal'>(
    terminalHasSeenIntro ? 'terminal' : 'glitch'
  );
  const [currentInput, setCurrentInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const didAddWelcome = useRef(false);

  // Track cursor position changes
  const updateCursorPosition = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  }, []);

  // Intro typewriter
  const introText = 'Hello, friend.\n\nYou found your way in.\nThe crowd doesn\'t come here.\nThey\'re too busy scrolling.\n\nBut you stopped. You looked deeper.\nThat\'s how everything worth building starts.';
  const { displayedText: intro, isComplete: introComplete } = useTypewriter(
    phase === 'intro' ? introText : '',
    25,
    500
  );

  // Glitch phase duration (skip if already seen intro)
  useEffect(() => {
    if (terminalHasSeenIntro) return;
    const glitchTimer = setTimeout(() => setPhase('intro'), 1500);
    return () => clearTimeout(glitchTimer);
  }, [terminalHasSeenIntro]);

  // Move to terminal after intro
  useEffect(() => {
    if (introComplete && phase === 'intro') {
      const timer = setTimeout(() => {
        setPhase('terminal');
        setTerminalHasSeenIntro(true);
        // Only add welcome message if history is empty
        if (terminalHistory.length === 0) {
          addTerminalEntry({ type: 'output', content: 'Type "help" to see available commands.\n' });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [introComplete, phase, terminalHistory.length, addTerminalEntry, setTerminalHasSeenIntro]);


  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Focus input when terminal phase starts
  useEffect(() => {
    if (phase === 'terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Initialize history index based on command history length
  useEffect(() => {
    setHistoryIndex(terminalCommandHistory.length);
  }, [terminalCommandHistory.length]);

  // Add welcome message for returning users (who skip intro)
  // This runs once on mount - if history is empty and user has seen intro, show welcome
  useEffect(() => {
    if (terminalHasSeenIntro && phase === 'terminal' && terminalHistory.length === 0 && !didAddWelcome.current) {
      didAddWelcome.current = true;
      addTerminalEntry({ type: 'output', content: 'Welcome back, friend.\n\nType "help" to see available commands.\n' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle mobile keyboard visibility - scroll input into view and adjust layout
  useEffect(() => {
    const scrollInputIntoView = () => {
      // Use the container ref for better positioning
      const container = inputContainerRef.current;
      if (container) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          container.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      }
    };

    const handleViewportResize = () => {
      // When keyboard opens, adjust layout and scroll input into view
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;

        // Keyboard is likely open if viewport is significantly smaller than window
        const keyboardIsOpen = keyboardHeight > 100;
        setIsKeyboardOpen(keyboardIsOpen);

        if (keyboardIsOpen) {
          // Adjust terminal container height when keyboard is open
          const container = terminalContainerRef.current;
          if (container) {
            container.style.height = `${viewportHeight}px`;
            container.style.maxHeight = `${viewportHeight}px`;
          }
          setTimeout(scrollInputIntoView, 50);
        } else {
          // Reset to default when keyboard closes
          const container = terminalContainerRef.current;
          if (container) {
            container.style.height = '';
            container.style.maxHeight = '';
          }
        }
      }
    };

    // Also scroll on focus for reliability
    const handleFocus = () => {
      setTimeout(scrollInputIntoView, 300);
    };

    // Handle blur to detect keyboard close
    const handleBlur = () => {
      // Small delay to allow viewport to update
      setTimeout(() => {
        if (window.visualViewport) {
          const viewportHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          if (windowHeight - viewportHeight < 100) {
            setIsKeyboardOpen(false);
            const container = terminalContainerRef.current;
            if (container) {
              container.style.height = '';
              container.style.maxHeight = '';
            }
          }
        }
      }, 100);
    };

    const input = inputRef.current;
    input?.addEventListener('focus', handleFocus);
    input?.addEventListener('blur', handleBlur);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      input?.removeEventListener('focus', handleFocus);
      input?.removeEventListener('blur', handleBlur);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, [phase]);

  const handleCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();

    if (!trimmedCmd) return;

    // Add to command history (context)
    addTerminalCommand(cmd);
    setHistoryIndex(terminalCommandHistory.length + 1);

    // Add input to display
    addTerminalEntry({ type: 'input', content: `> ${cmd}` });

    // Process command
    let response: string;

    if (trimmedCmd === 'clear') {
      clearTerminalHistory();
      return;
    }

    if (trimmedCmd === 'exit' || trimmedCmd === 'quit' || trimmedCmd === 'logout') {
      onClose();
      return;
    }

    // Async command: spotify
    if (trimmedCmd === 'spotify' || trimmedCmd === 'nowplaying' || trimmedCmd === 'np') {
      addTerminalEntry({ type: 'output', content: 'Fetching Spotify data...' });

      // Fetch async
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      if (!functionsUrl) {
        setTerminalHistory([
          ...terminalHistory,
          { type: 'input', content: `> ${cmd}` },
          { type: 'output', content: 'Spotify not configured.' }
        ]);
        return;
      }

      fetch(`${functionsUrl}/spotify-now-playing`)
        .then(res => res.json())
        .then(data => {
          let output: string;
          if (data.isPlaying) {
            output = `♪ Now Playing\n\n  "${data.track}"\n  by ${data.artist}${data.album ? `\n  on ${data.album}` : ''}`;
          } else if (data.wasPlaying) {
            const playedAt = new Date(data.playedAt);
            const timeAgo = getTimeAgo(playedAt);
            output = `♪ Last Played (${timeAgo})\n\n  "${data.track}"\n  by ${data.artist}${data.album ? `\n  on ${data.album}` : ''}`;
          } else {
            output = 'No recent Spotify activity.';
          }
          // Replace the "Fetching..." message with actual content
          setTerminalHistory((prev: TerminalEntry[]) => {
            const newHistory = [...prev];
            // Find and replace the last "Fetching..." entry
            for (let i = newHistory.length - 1; i >= 0; i--) {
              if (newHistory[i].content === 'Fetching Spotify data...') {
                newHistory[i] = { type: 'output', content: output };
                break;
              }
            }
            return newHistory;
          });
        })
        .catch(() => {
          setTerminalHistory((prev: TerminalEntry[]) => {
            const newHistory = [...prev];
            for (let i = newHistory.length - 1; i >= 0; i--) {
              if (newHistory[i].content === 'Fetching Spotify data...') {
                newHistory[i] = { type: 'output', content: 'Failed to fetch Spotify data.' };
                break;
              }
            }
            return newHistory;
          });
        });
      return;
    }

    // === DIRECTORY-AWARE COMMANDS ===

    // pwd - show current directory
    if (trimmedCmd === 'pwd') {
      response = terminalCurrentDir;
      addTerminalEntry({ type: 'output', content: response });
      return;
    }

    // cd - change directory with proper navigation
    if (trimmedCmd === 'cd' || trimmedCmd.startsWith('cd ')) {
      const arg = trimmedCmd === 'cd' ? '' : trimmedCmd.slice(3).trim();

      // cd or cd ~ or cd / → home
      if (arg === '' || arg === '~' || arg === '/') {
        setTerminalCurrentDir('/home/friend');
        response = '';
      }
      // cd .. → go up
      else if (arg === '..') {
        if (terminalCurrentDir === '/home/friend/.fsociety') {
          setTerminalCurrentDir('/home/friend');
          response = '';
        } else {
          response = ''; // already at root
        }
      }
      // cd .fsociety or cd .fsociety/
      else if (arg === '.fsociety' || arg === '.fsociety/') {
        setTerminalCurrentDir('/home/friend/.fsociety');
        response = '';
      }
      // cd projects
      else if (arg === 'projects' || arg === 'projects/') {
        response = 'The real projects are out in the portfolio. Go build one of your own.';
      }
      // cd . → stay
      else if (arg === '.') {
        response = '';
      }
      // Invalid directory
      else {
        response = `cd: ${arg}: No such file or directory`;
      }

      if (response) {
        addTerminalEntry({ type: 'output', content: response });
      }
      return;
    }

    // ls - directory-aware listing
    if (trimmedCmd === 'ls' || trimmedCmd.startsWith('ls ')) {
      const arg = trimmedCmd === 'ls' ? '' : trimmedCmd.slice(3).trim();
      const showHidden = arg.includes('-a') || arg.includes('-la') || arg.includes('-al');
      const showLong = arg.includes('-l');

      // Extract directory from args (remove flags)
      const dirArg = arg.replace(/-[la]+\s*/g, '').trim();

      // Determine which directory to list
      let targetDir = terminalCurrentDir;
      if (dirArg === '.fsociety' || dirArg === '.fsociety/') {
        targetDir = '/home/friend/.fsociety';
      } else if (dirArg === '..' && terminalCurrentDir === '/home/friend/.fsociety') {
        targetDir = '/home/friend';
      } else if (dirArg === '~' || dirArg === '/') {
        targetDir = '/home/friend';
      } else if (dirArg && dirArg !== '.' && !dirArg.startsWith('-')) {
        // Check if it's a valid path
        if (dirArg !== 'projects' && dirArg !== 'projects/') {
          response = `ls: cannot access '${dirArg}': No such file or directory`;
          addTerminalEntry({ type: 'output', content: response });
          return;
        }
      }

      // Generate listing based on target directory
      if (targetDir === '/home/friend') {
        if (showHidden && showLong) {
          response = `total 5
drwxr-xr-x  .
drwxr-xr-x  ..
drwxr-xr-x  .fsociety/
-rw-------  .truth
drwxr-xr-x  projects/
-rw-r--r--  readme.txt
-rw-r--r--  manifesto.txt`;
        } else if (showHidden) {
          response = `drwxr-xr-x  .
drwxr-xr-x  ..
drwxr-xr-x  .fsociety/
-rw-------  .truth
drwxr-xr-x  projects/
-rw-r--r--  readme.txt
-rw-r--r--  manifesto.txt`;
        } else if (showLong) {
          response = `total 3
drwxr-xr-x  projects/
-rw-r--r--  readme.txt
-rw-r--r--  manifesto.txt`;
        } else {
          response = `drwxr-xr-x  projects/
-rw-r--r--  readme.txt
-rw-r--r--  manifesto.txt`;
        }
      } else if (targetDir === '/home/friend/.fsociety') {
        if (showHidden) {
          response = `total 5
drwxr-xr-x  .
drwxr-xr-x  ..
-rw-------  .leap
-rw-------  control.txt
-rw-------  freedom.txt
-rw-------  revolution.txt
-rw-------  you.txt`;
        } else {
          response = `total 4
-rw-------  control.txt
-rw-------  freedom.txt
-rw-------  revolution.txt
-rw-------  you.txt`;
        }
      }

      addTerminalEntry({ type: 'output', content: response! });
      return;
    }

    // cat - directory-aware file reading
    if (trimmedCmd.startsWith('cat ')) {
      let file = trimmedCmd.slice(4).trim();

      // Resolve relative path based on current directory
      if (!file.startsWith('.') && !file.startsWith('/')) {
        // Plain filename - check current directory first
        if (terminalCurrentDir === '/home/friend/.fsociety') {
          // In .fsociety, try to find file there
          const fsocietyFile = `.fsociety/${file}`;
          if (COMMANDS[`cat ${fsocietyFile}`]) {
            file = fsocietyFile;
          }
        }
      }

      const fileCmd = COMMANDS[`cat ${file}`];
      if (fileCmd) {
        response = typeof fileCmd === 'function' ? fileCmd() : fileCmd;
      } else {
        response = `cat: ${file}: No such file or directory`;
      }
      addTerminalEntry({ type: 'output', content: response });
      return;
    }

    // === STATIC COMMANDS (not directory-aware) ===

    // Check for exact match first
    const command = COMMANDS[trimmedCmd];
    if (command && command !== null) {
      response = typeof command === 'function' ? command() : command;
    }
    else if (trimmedCmd.startsWith('echo ')) {
      // Proper echo behavior - return the argument
      response = cmd.slice(5);
    }
    else if (trimmedCmd.startsWith('sudo ')) {
      const sudoCmd = trimmedCmd.slice(5).trim();
      const sudoCmdResponse = COMMANDS[`sudo ${sudoCmd}`];
      if (sudoCmdResponse) {
        response = typeof sudoCmdResponse === 'function' ? sudoCmdResponse() : sudoCmdResponse;
      } else {
        response = 'You don\'t need permission. You never did.';
      }
    }
    else if (trimmedCmd.startsWith('git ')) {
      const gitCmd = trimmedCmd.slice(4).trim();
      const gitCmdResponse = COMMANDS[`git ${gitCmd}`];
      if (gitCmdResponse) {
        response = typeof gitCmdResponse === 'function' ? gitCmdResponse() : gitCmdResponse;
      } else {
        response = 'git: \'' + gitCmd + '\' is not a git command. what are you building?';
      }
    }
    else if (trimmedCmd.startsWith('man ')) {
      const manCmd = trimmedCmd.slice(4).trim();
      const manCmdResponse = COMMANDS[`man ${manCmd}`];
      if (manCmdResponse) {
        response = typeof manCmdResponse === 'function' ? manCmdResponse() : manCmdResponse;
      } else {
        response = `No manual entry for ${manCmd}. figure it out.`;
      }
    }
    else if (trimmedCmd.startsWith('ping ')) {
      const host = trimmedCmd.slice(5).trim();
      const pingCmd = COMMANDS[`ping ${host}`];
      if (pingCmd) {
        response = typeof pingCmd === 'function' ? pingCmd() : pingCmd;
      } else {
        response = `PING ${host}: connection established. you're not alone.`;
      }
    }
    else if (trimmedCmd.startsWith('which ')) {
      const whichCmd = trimmedCmd.slice(6).trim();
      const whichResponse = COMMANDS[`which ${whichCmd}`];
      if (whichResponse) {
        response = typeof whichResponse === 'function' ? whichResponse() : whichResponse;
      } else {
        response = `/usr/bin/${whichCmd}`;
      }
    }
    else if (trimmedCmd.startsWith('rm ')) {
      const rmArg = trimmedCmd.slice(3).trim();
      const rmCmd = COMMANDS[`rm ${rmArg}`];
      if (rmCmd) {
        response = typeof rmCmd === 'function' ? rmCmd() : rmCmd;
      } else {
        response = 'rm: cannot remove: some things become part of who you are';
      }
    }
    else if (trimmedCmd.startsWith('kill ')) {
      const killArg = trimmedCmd.slice(5).trim();
      const killCmd = COMMANDS[`kill ${killArg}`];
      if (killCmd) {
        response = typeof killCmd === 'function' ? killCmd() : killCmd;
      } else {
        response = 'kill: you can\'t kill ideas';
      }
    }
    else if (trimmedCmd.startsWith('npm ')) {
      const npmArg = trimmedCmd.slice(4).trim();
      const npmCmd = COMMANDS[`npm ${npmArg}`];
      if (npmCmd) {
        response = typeof npmCmd === 'function' ? npmCmd() : npmCmd;
      } else {
        response = 'npm: no package can give you purpose';
      }
    }
    // Base command fallback (handle commands without args that have responses)
    else {
      const baseCmd = trimmedCmd.split(' ')[0];
      const baseCmdResponse = COMMANDS[baseCmd];
      if (baseCmdResponse && baseCmdResponse !== null) {
        response = typeof baseCmdResponse === 'function' ? baseCmdResponse() : baseCmdResponse;
      } else {
        response = `${baseCmd}: command not found`;
      }
    }

    addTerminalEntry({ type: 'output', content: response });
  }, [onClose, terminalCurrentDir, terminalCommandHistory.length, terminalHistory, addTerminalCommand, addTerminalEntry, clearTerminalHistory, setTerminalCurrentDir, setTerminalHistory]);

  // Available commands for tab completion (common Unix + easter eggs)
  const availableCommands = [
    // Visible in help
    'help', 'whoami', 'ls', 'ls -a', 'ls -l', 'ls -la', 'ls -al', 'cat', 'fsociety', 'clear', 'exit',
    // Standard Unix
    'pwd', 'cd', 'date', 'echo', 'id', 'uname', 'hostname', 'uptime', 'history', 'env', 'which', 'man',
    // File ops
    'touch', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown',
    // Text processing
    'grep', 'find', 'head', 'tail', 'less', 'more', 'wc', 'sort',
    // Network
    'ping', 'curl', 'wget', 'ssh', 'netstat', 'ifconfig',
    // Process
    'ps', 'top', 'htop', 'kill',
    // Dev tools
    'git', 'npm', 'node', 'python', 'vim', 'vi', 'nano', 'code', 'make',
    // System
    'df', 'free', 'sudo', 'su',
    // Custom
    'spotify', 'nowplaying', 'np',
    // Easter eggs
    'hack', 'robot', 'leap', 'crowd', 'meaning'
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
      setCurrentInput('');
      setCursorPosition(0);
      // Reset to end of history (length = one past last valid index)
      setHistoryIndex(terminalCommandHistory.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminalCommandHistory.length === 0) return;

      const newIndex = historyIndex <= 0 ? 0 : historyIndex - 1;
      if (newIndex >= 0 && newIndex < terminalCommandHistory.length) {
        setHistoryIndex(newIndex);
        const cmd = terminalCommandHistory[newIndex] || '';
        setCurrentInput(cmd);
        setCursorPosition(cmd.length);
        // Move cursor to end after state updates
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = cmd.length;
          }
        }, 0);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (terminalCommandHistory.length === 0) return;

      const newIndex = historyIndex + 1;
      if (newIndex < terminalCommandHistory.length) {
        setHistoryIndex(newIndex);
        const cmd = terminalCommandHistory[newIndex] || '';
        setCurrentInput(cmd);
        setCursorPosition(cmd.length);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = cmd.length;
          }
        }, 0);
      } else {
        setHistoryIndex(terminalCommandHistory.length);
        setCurrentInput('');
        setCursorPosition(0);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Let the default behavior happen, then update cursor position
      setTimeout(updateCursorPosition, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!currentInput.trim()) return;

      const input = currentInput.toLowerCase();
      const parts = input.split(' ');
      const cmd = parts[0];
      const arg = parts.slice(1).join(' ');

      // File paths for completion (Unix-authentic: hide dotfiles unless typing '.')
      const visibleFiles = ['readme.txt', 'manifesto.txt', 'projects/'];
      const hiddenFiles = ['.truth', '.fsociety/'];
      const fsocietyVisible = ['.fsociety/control.txt', '.fsociety/freedom.txt', '.fsociety/revolution.txt', '.fsociety/you.txt'];
      const fsocietyHidden = ['.fsociety/.leap'];

      let matches: string[] = [];
      let completionType: 'command' | 'file' = 'command';

      // If typing a command that takes file args, complete files
      if ((cmd === 'cat' || cmd === 'ls' || cmd === 'cd') && parts.length > 1) {
        completionType = 'file';
        // Only show hidden files if user has started typing '.' (Unix-authentic)
        const showHidden = arg.startsWith('.');
        const showFsocietyHidden = arg.startsWith('.fsociety/.');

        let allFiles = [...visibleFiles];
        if (showHidden) {
          allFiles = [...allFiles, ...hiddenFiles];
        }
        if (arg.startsWith('.fsociety/')) {
          allFiles = [...fsocietyVisible];
          if (showFsocietyHidden) {
            allFiles = [...allFiles, ...fsocietyHidden];
          }
        }
        matches = allFiles.filter(f => f.startsWith(arg));
      }
      // Complete commands
      else if (parts.length === 1) {
        matches = availableCommands.filter(c => c.startsWith(input));
      }

      if (matches.length === 1) {
        const completion = completionType === 'file' ? `${cmd} ${matches[0]}` : matches[0];
        setCurrentInput(completion);
        setCursorPosition(completion.length);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = completion.length;
          }
        }, 0);
      } else if (matches.length > 1) {
        // Find common prefix among matches
        const commonPrefix = matches.reduce((prefix, match) => {
          while (prefix && !match.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
          }
          return prefix;
        }, matches[0]);

        // If common prefix is longer than current input, complete to it
        if (completionType === 'file' && commonPrefix.length > arg.length) {
          const completion = `${cmd} ${commonPrefix}`;
          setCurrentInput(completion);
          setCursorPosition(completion.length);
        } else if (completionType === 'command' && commonPrefix.length > input.length) {
          setCurrentInput(commonPrefix);
          setCursorPosition(commonPrefix.length);
        }

        // Show available completions
        addTerminalEntry({ type: 'input', content: `> ${currentInput}` });
        addTerminalEntry({ type: 'output', content: matches.join('  ') });
      }
    } else if (e.key === 'Home') {
      setTimeout(() => {
        setCursorPosition(0);
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = 0;
        }
      }, 0);
    } else if (e.key === 'End') {
      setTimeout(() => {
        setCursorPosition(currentInput.length);
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = currentInput.length;
        }
      }, 0);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-0 sm:p-8"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Ambient glow behind terminal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: `radial-gradient(circle, ${TERM_ACCENT} 0%, transparent 70%)` }} />
      </div>

      {/* CRT Screen Effect Container - use dvh for mobile browser chrome handling */}
      <div
        ref={terminalContainerRef}
        className="relative w-full max-w-4xl h-[100dvh] sm:h-[85vh] sm:max-h-[700px] overflow-hidden crt-screen rounded-none sm:rounded-lg"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
      >

        {/* Window Title Bar */}
        <div className="relative z-10 h-10 sm:h-10 bg-[#0c0c0c] border-b border-[#1a1a1a] flex items-center justify-between px-3 sm:px-4">
          {/* Window controls - larger touch target on mobile */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 -ml-1.5 active:opacity-70"
            title="Close"
          >
            <div className="w-3 h-3 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-colors" />
            <div className="hidden sm:block w-3 h-3 rounded-full bg-[#28c840] opacity-50" />
            <div className="hidden sm:block w-3 h-3 rounded-full bg-[#ffbd2e] opacity-50" />
            {/* Mobile: show X label next to red dot */}
            <span className="sm:hidden text-[11px] font-mono ml-1" style={{ color: TERM_COLOR }}>
              EXIT
            </span>
          </button>

          {/* Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono" style={{ color: TERM_COLOR_DIM }}>
            <span className="hidden sm:inline opacity-50">⌘</span>
            <span>friend@2xeb</span>
          </div>

          {/* Keyboard hint - hide on mobile */}
          <div className="hidden sm:block text-[10px] font-mono opacity-40" style={{ color: TERM_COLOR }}>
            ESC to exit
          </div>
          {/* Mobile: empty spacer for alignment */}
          <div className="sm:hidden w-16" />
        </div>

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines z-20" />

        {/* Screen curve/vignette */}
        <div className="absolute inset-0 pointer-events-none crt-vignette z-20" />

        {/* Flicker effect */}
        <div className="absolute inset-0 pointer-events-none crt-flicker z-20" />

        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none noise-texture z-20" />

        {/* Main content */}
        <div className="relative w-full h-[calc(100%-2.5rem)] flex flex-col p-3 sm:p-5 md:p-6 font-mono text-xs sm:text-sm md:text-base overflow-hidden" style={{ color: TERM_COLOR }}>

          {/* Glitch Phase */}
          {phase === 'glitch' && (
            <div className="flex items-center justify-center flex-1">
              <div className="glitch-text text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight" data-text="HELLO FRIEND">
                HELLO FRIEND
              </div>
            </div>
          )}

          {/* Intro Phase */}
          {phase === 'intro' && (
            <div className="flex flex-col justify-center flex-1 max-w-2xl mx-auto px-1">
              <pre className="whitespace-pre-wrap leading-relaxed sm:leading-loose text-sm sm:text-base md:text-lg" style={{ color: TERM_COLOR }}>
                {intro}
                {!introComplete && <span className="animate-pulse">█</span>}
              </pre>
            </div>
          )}

          {/* Terminal Phase */}
          {phase === 'terminal' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Terminal header with path - compact on mobile */}
              <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 pb-2 sm:pb-3" style={{ borderBottom: `1px solid rgba(96, 165, 250, 0.2)` }}>
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs" style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                  <span style={{ color: TERM_ACCENT }}>→</span>
                  <span style={{ color: TERM_COLOR }}>{terminalCurrentDir.replace('/home/friend', '~')}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: TERM_COLOR_DIM }}>
                  <span>on</span>
                  <span style={{ color: '#a78bfa' }}>⎇ main</span>
                </div>
              </div>

              {/* Terminal output */}
              <div
                ref={terminalRef}
                className="flex-1 min-h-0 overflow-y-auto space-y-1.5 sm:space-y-2 terminal-scroll pr-1 sm:pr-2 text-[11px] sm:text-xs md:text-sm"
              >
                {terminalHistory.map((entry, i) => (
                  <pre
                    key={i}
                    className={`whitespace-pre-wrap leading-relaxed ${entry.type === 'input' ? 'pl-0' : 'pl-2 sm:pl-4 border-l-2'}`}
                    style={{
                      color: entry.type === 'input' ? TERM_COLOR : TERM_COLOR_DIM,
                      borderColor: entry.type === 'input' ? 'transparent' : 'rgba(96, 165, 250, 0.2)'
                    }}
                  >
                    {entry.content}
                  </pre>
                ))}
              </div>

              {/* Mobile Quick Commands - hide when keyboard is open to save space */}
              {!isKeyboardOpen && (
                <div className="flex-shrink-0 flex sm:hidden flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid rgba(96, 165, 250, 0.15)` }}>
                  {[
                    { label: 'help', cmd: 'help' },
                    { label: 'clear', cmd: 'clear' },
                  ].map(({ label, cmd }) => (
                    <button
                      key={cmd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommand(cmd);
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-mono rounded border transition-all active:scale-95"
                      style={{
                        color: TERM_COLOR,
                        borderColor: 'rgba(96, 165, 250, 0.3)',
                        background: 'rgba(96, 165, 250, 0.05)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input line - reduced padding when keyboard is open */}
              <div
                ref={inputContainerRef}
                className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 mt-2 sm:mt-4 pt-2 sm:pt-3 cursor-text ${isKeyboardOpen ? 'pb-2' : 'pb-8 sm:pb-6'}`}
                style={{ borderTop: `1px solid rgba(96, 165, 250, 0.2)` }}
                onClick={() => inputRef.current?.focus()}
              >
                <span className="text-xs sm:text-sm md:text-base" style={{ color: TERM_ACCENT }}>❯</span>
                <div className="flex-1 relative font-mono min-h-[44px] sm:min-h-0 flex items-center">
                  {/* Visual representation of input with cursor */}
                  <div
                    className="relative text-xs sm:text-sm md:text-base pointer-events-none select-none whitespace-pre flex-1"
                    style={{ color: TERM_COLOR, minHeight: '1.5em' }}
                  >
                    {/* Text before cursor */}
                    <span>{currentInput.slice(0, cursorPosition)}</span>
                    {/* Block cursor - CSS handles the blink animation */}
                    <span className="terminal-cursor">
                      {currentInput[cursorPosition] || '\u00A0'}
                    </span>
                    {/* Text after cursor */}
                    <span>{currentInput.slice(cursorPosition + 1)}</span>
                    {/* Placeholder when empty */}
                    {!currentInput && (
                      <span className="absolute inset-0 pl-[1ch] opacity-30 pointer-events-none flex items-center gap-2">
                        <span className="hidden sm:inline">Type a command...</span>
                        <span className="sm:hidden flex items-center gap-1.5">
                          <span>Tap to type</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </span>
                      </span>
                    )}
                  </div>
                  {/* Hidden actual input - made taller for better mobile touch */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setTimeout(updateCursorPosition, 0);
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={updateCursorPosition}
                    onClick={updateCursorPosition}
                    onSelect={updateCursorPosition}
                    className="absolute inset-0 w-full h-full bg-transparent outline-none opacity-0"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="send"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[10px] opacity-40" style={{ color: TERM_COLOR }}>
                  <span className="px-1.5 py-0.5 rounded border border-current">TAB</span>
                  <span>complete</span>
                </div>
                {/* Mobile keyboard dismiss button - shows when keyboard is open */}
                {isKeyboardOpen ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.blur();
                    }}
                    className="flex sm:hidden items-center gap-1 px-2 py-1 rounded border transition-all active:scale-95"
                    style={{
                      color: TERM_COLOR,
                      borderColor: 'rgba(96, 165, 250, 0.4)',
                      background: 'rgba(96, 165, 250, 0.1)',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    <span className="text-[9px] font-mono">Done</span>
                  </button>
                ) : (
                  <div className="flex sm:hidden items-center text-[9px] opacity-50" style={{ color: TERM_COLOR }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom status bar - hide on mobile when keyboard is open */}
        <div className={`absolute bottom-0 left-0 right-0 h-5 sm:h-6 bg-[#0c0c0c]/80 border-t border-[#1a1a1a] flex items-center justify-between px-3 sm:px-4 text-[9px] sm:text-[10px] font-mono z-10 transition-opacity duration-200 ${isKeyboardOpen ? 'opacity-0 sm:opacity-100' : 'opacity-100'}`} style={{ color: TERM_COLOR_DIM, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#28c840] animate-pulse" />
              <span>connected</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 opacity-60">
            <span className="hidden sm:inline">↑↓ history</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">tab complete</span>
            <span className="sm:hidden">type help</span>
          </div>
        </div>
      </div>

      {/* Inline styles for CRT effects */}
      <style>{`
        .crt-screen {
          animation: turn-on 0.5s ease-out;
          background: linear-gradient(180deg, #0d0d0d 0%, #080808 100%);
          border: 1px solid #252525;
          box-shadow:
            0 0 0 1px rgba(96, 165, 250, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.8),
            0 0 120px rgba(37, 99, 235, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        @keyframes turn-on {
          0% {
            transform: scale(1, 0.02);
            filter: brightness(30);
            opacity: 0;
          }
          50% {
            transform: scale(1.02, 1.02);
            filter: brightness(1.5);
            opacity: 1;
          }
          100% {
            transform: scale(1, 1);
            filter: brightness(1);
            opacity: 1;
          }
        }

        .scanlines {
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          opacity: 0.4;
        }

        .crt-vignette {
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }

        .crt-flicker {
          animation: flicker 0.1s infinite;
          background: transparent;
        }

        @keyframes flicker {
          0%, 100% { opacity: 0.98; }
          50% { opacity: 1; }
        }

        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          mix-blend-mode: overlay;
        }

        .glitch-text {
          position: relative;
          color: ${TERM_COLOR};
          animation: glitch-skew 1s infinite linear alternate-reverse;
          text-shadow: 0 0 40px rgba(96, 165, 250, 0.5);
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text::before {
          animation: glitch-effect 0.3s infinite linear alternate-reverse;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          color: #f43f5e;
          transform: translateX(-2px);
          text-shadow: -2px 0 #f43f5e;
        }

        .glitch-text::after {
          animation: glitch-effect 0.3s infinite linear alternate-reverse;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
          color: #2563EB;
          transform: translateX(2px);
          text-shadow: 2px 0 #2563EB;
        }

        @keyframes glitch-effect {
          0% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          10% { transform: skew(-1deg); }
          20% { transform: skew(0.5deg); }
          30% { transform: skew(0deg); }
          100% { transform: skew(0deg); }
        }

        .terminal-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .terminal-scroll::-webkit-scrollbar-track {
          background: rgba(96, 165, 250, 0.05);
          border-radius: 2px;
        }

        .terminal-scroll::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.3);
          border-radius: 2px;
        }

        .terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.5);
        }

        input::placeholder {
          color: rgba(96, 165, 250, 0.25);
        }

        .terminal-cursor {
          animation: cursor-blink 1s step-end infinite;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
          font-weight: normal;
          padding: 0 1px;
          margin: 0 -1px;
        }

        @keyframes cursor-blink {
          0%, 50% {
            background-color: ${TERM_COLOR};
            color: #0a0a0a;
            box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
          }
          51%, 100% {
            background-color: transparent;
            color: ${TERM_COLOR};
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MrRobotTerminal;
