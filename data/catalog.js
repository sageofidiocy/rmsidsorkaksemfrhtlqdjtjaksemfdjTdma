/* Static catalogs: activities (MET), skills, norms, titles, penalties.
   MET values approximate the 2024 Adult Compendium of Physical Activities.
   Calories = MET x bodyweight(kg) x hours. */
(function () {
  const A = (id, name, group, met, skill) => ({ id, name, group, met, skill });
  const ACTIVITIES = [
    A('bjj_drill', 'Brazilian Jiu-Jitsu — Drills', 'Combat', [4.0, 5.3, 6.5], 'bjj'),
    A('bjj_spar', 'Brazilian Jiu-Jitsu — Sparring (rolling)', 'Combat', [7.0, 8.0, 10.3], 'bjj'),
    A('mt_drill', 'Muay Thai — Drills / pads', 'Combat', [5.3, 7.3, 9.0], 'muaythai'),
    A('mt_spar', 'Muay Thai — Sparring', 'Combat', [7.8, 10.3, 12.0], 'muaythai'),
    A('box_drill', 'Boxing — Drills / bag', 'Combat', [4.5, 5.5, 7.0], 'boxing'),
    A('box_spar', 'Boxing — Sparring', 'Combat', [6.5, 7.8, 12.8], 'boxing'),
    A('mma', 'MMA — Training', 'Combat', [5.3, 8.0, 10.3], 'mma'),
    A('boulder', 'Bouldering', 'Climbing', [4.5, 5.8, 7.5], 'climbing'),
    A('rope', 'Rock climbing (rope)', 'Climbing', [5.0, 7.3, 8.0], 'climbing'),
    A('run', 'Running (distance)', 'Running', [8.3, 9.8, 11.8], 'longrun'),
    A('sprint', 'Sprint intervals', 'Running', [9.0, 12.0, 15.0], 'sprint'),
    A('walk', 'Walking', 'Running', [2.8, 3.5, 5.0], null),
    A('hike', 'Hiking', 'Running', [5.3, 6.0, 7.8], 'hiking'),
    A('lift', 'Weight lifting', 'Strength', [3.5, 5.0, 6.0], 'weights'),
    A('calis', 'Calisthenics (push-ups, pull-ups, squats)', 'Strength', [2.8, 3.8, 8.0], null),
    A('hiit', 'HIIT / circuit', 'Strength', [6.0, 8.0, 10.0], null),
    A('jumprope', 'Jump rope', 'Strength', [8.8, 11.8, 12.3], null),
    A('yoga', 'Yoga / mobility', 'Strength', [2.5, 3.0, 4.0], 'mobility'),
    A('swim', 'Swimming laps', 'Water', [5.8, 8.3, 9.8], 'swimming'),
    A('waterpolo', 'Water polo', 'Water', [7.0, 10.0, 12.0], 'waterpolo'),
    A('basketball', 'Basketball', 'Sports', [6.0, 6.5, 8.0], 'basketball'),
    A('soccer', 'Soccer', 'Sports', [7.0, 7.0, 10.0], 'soccer'),
    A('tennis', 'Tennis', 'Sports', [5.0, 7.3, 8.0], 'tennis'),
    A('cycling', 'Cycling', 'Sports', [4.0, 6.8, 10.0], 'cycling'),
    A('rowing', 'Rowing machine', 'Sports', [4.8, 7.0, 8.5], null),
    A('ski_down', 'Skiing — downhill', 'Sports', [4.3, 5.3, 8.0], 'skiing'),
    A('ski_xc', 'Skiing — cross-country', 'Sports', [6.8, 9.0, 12.5], 'skiing'),
  ];

  // stat helpers. t: r=self rating 1-10, cefr, h=practice hours, c=consistency, m=measured metric (norm), a=auto
  const r = (k, n) => ({ k, n, t: 'r' });
  const H = (k = 150) => ({ k: 'hours', n: 'Practice hours', t: 'h', scale: k });
  const C = { k: 'cons', n: 'Consistency', t: 'c' };
  const m = (k, n, norm) => ({ k, n, t: 'm', norm });
  const lang = (id, name) => ({ id, name, cat: 'Languages', list: 'Study', unit: 'min', base: 20, max: 120,
    stats: [{ k: 'L', n: 'Listening', t: 'cefr' }, { k: 'S', n: 'Speaking', t: 'cefr' }, { k: 'R', n: 'Reading', t: 'cefr' }, { k: 'W', n: 'Writing', t: 'cefr' }, H(200), C] });
  const inst = (id, name) => ({ id, name, cat: 'Instruments', list: 'Craft', unit: 'min', base: 20, max: 120,
    stats: [r('tech', 'Technique'), r('theory', 'Theory'), r('rep', 'Repertoire'), r('ear', 'Ear & rhythm'), H(200), C] });
  const S = (id, name, cat, list, unit, base, max, stats, phys) => ({ id, name, cat, list, unit, base, max, stats, phys: !!phys });

  const SKILLS = [
    S('prayer', 'Prayer', 'Faith', 'Faith', 'min', 10, 60, [r('devotion', 'Devotion'), r('focus', 'Focus'), H(100), C]),
    S('bible', 'Bible Reading', 'Faith', 'Faith', 'ch', 1, 10, [r('scripture', 'Scripture knowledge'), r('memory', 'Memorization'), H(100), C]),
    S('theology', 'Theology', 'Faith', 'Study', 'min', 20, 90, [r('doctrine', 'Doctrine'), r('history', 'Church history'), r('apol', 'Apologetics'), H(200), C]),
    S('philosophy', 'Philosophy', 'Study', 'Study', 'min', 20, 90, [r('know', 'Knowledge'), r('reason', 'Reasoning'), r('texts', 'Primary texts'), H(200), C]),
    lang('korean', 'Korean'), lang('english', 'English'), lang('spanish', 'Spanish'), lang('german', 'German'),
    lang('french', 'French'), lang('japanese', 'Japanese'), lang('chinese', 'Chinese'),
    S('writing', 'Writing', 'Craft', 'Craft', 'min', 30, 180, [r('craft', 'Craft'), r('clarity', 'Clarity'), r('voice', 'Voice'), H(250), C]),
    S('video', 'Video Editing', 'Craft', 'Craft', 'min', 30, 180, [r('cut', 'Cutting & pacing'), r('color', 'Color'), r('sound', 'Sound'), r('motion', 'Motion graphics'), H(250), C]),
    S('drawing', 'Drawing', 'Craft', 'Craft', 'min', 30, 180, [r('fund', 'Fundamentals'), r('anat', 'Anatomy'), r('persp', 'Perspective'), r('color', 'Color'), H(250), C]),
    inst('piano', 'Piano'), inst('guitar', 'Guitar'), inst('cajon', 'Cajón'), inst('harmonica', 'Harmonica'), inst('trumpet', 'Trumpet'),
    S('work', 'Ability at Work', 'Work', 'Work', 'min', 60, 240, [r('output', 'Output'), r('quality', 'Quality'), r('focus', 'Focus'), r('comms', 'Communication'), H(400), C]),
    S('discipline', 'Discipline', 'Core', null, null, 0, 0, [
      { k: 'd_comp', n: 'Completion (30d)', t: 'a' }, { k: 'd_streak', n: 'Streak', t: 'a' }, { k: 'd_sleep', n: 'Sleep on time', t: 'a' },
      { k: 'd_clean', n: 'Penalty-free', t: 'a' }, { k: 'd_perfect', n: 'Perfect days', t: 'a' }]),
    S('bjj', 'Brazilian Jiu-Jitsu', 'Combat', 'Training', 'min', 45, 120, [r('guard', 'Guard'), r('pass', 'Passing'), r('td', 'Takedowns'), r('subs', 'Submissions'), r('esc', 'Escapes'), H(300), C], true),
    S('muaythai', 'Muay Thai', 'Combat', 'Training', 'min', 45, 120, [r('strike', 'Striking'), r('kicks', 'Kicks'), r('clinch', 'Clinch'), r('def', 'Defense'), r('cond', 'Conditioning'), H(300), C], true),
    S('boxing', 'Boxing', 'Combat', 'Training', 'min', 45, 120, [r('punch', 'Punching'), r('foot', 'Footwork'), r('head', 'Head movement'), r('power', 'Power'), r('cond', 'Conditioning'), H(300), C], true),
    S('mma', 'MMA', 'Combat', 'Training', 'min', 45, 120, [r('strike', 'Striking'), r('wrestle', 'Wrestling'), r('grap', 'Grappling'), r('cage', 'Cage control'), H(300), C], true),
    S('climbing', 'Rock Climbing / Bouldering', 'Climbing', 'Training', 'min', 45, 150, [r('grade', 'Max grade'), r('finger', 'Finger strength'), r('tech', 'Technique'), r('endur', 'Endurance'), r('head', 'Head game'), H(250), C], true),
    S('sprint', 'Running — Sprinting', 'Running', 'Training', 'sprints', 4, 12, [m('sprint100', '100 m time', 'sprint100'), r('accel', 'Acceleration'), r('form', 'Form'), H(100), C], true),
    S('longrun', 'Running — Long Distance', 'Running', 'Training', 'km', 3, 21, [m('run5k', '5K time', 'run5k'), r('endur', 'Endurance'), r('form', 'Form'), H(200), C], true),
    S('skiing', 'Skiing', 'Sports', 'Training', 'min', 60, 240, [r('tech', 'Technique'), r('terrain', 'Terrain'), r('control', 'Speed control'), H(150), C], true),
    S('pushups', 'Push-ups', 'Exercise', 'Training', 'reps', 30, 300, [m('pushups', 'Max reps', 'pushups'), H(80), C], true),
    S('pullups', 'Pull-ups', 'Exercise', 'Training', 'reps', 10, 100, [m('pullups', 'Max reps', 'pullups'), H(80), C], true),
    S('squats', 'Squats', 'Exercise', 'Training', 'reps', 40, 400, [r('depth', 'Depth & form'), r('endur', 'Endurance'), H(80), C], true),
    S('plank', 'Plank', 'Exercise', 'Training', 'sec', 60, 600, [m('plank', 'Max hold', 'plank'), H(40), C], true),
    S('weights', 'Weight Lifting', 'Exercise', 'Training', 'min', 45, 90, [r('upper', 'Upper body'), r('lower', 'Lower body'), r('form', 'Form'), H(300), C], true),
    S('mobility', 'Yoga / Mobility', 'Exercise', 'Training', 'min', 15, 60, [m('sitreach', 'Sit & reach', 'sitreach'), r('balance', 'Balance'), H(100), C], true),
    S('swimming', 'Swimming', 'Sports', 'Training', 'min', 30, 120, [r('tech', 'Technique'), r('speed', 'Speed'), r('endur', 'Endurance'), H(200), C], true),
    S('waterpolo', 'Water Polo', 'Sports', 'Training', 'min', 60, 150, [r('swim', 'Swimming'), r('shoot', 'Shooting'), r('pass', 'Passing'), r('def', 'Defense'), r('egg', 'Eggbeater'), H(300), C], true),
    S('basketball', 'Basketball', 'Sports', 'Training', 'min', 45, 120, [r('shoot', 'Shooting'), r('handle', 'Handling'), r('def', 'Defense'), H(200), C], true),
    S('soccer', 'Soccer', 'Sports', 'Training', 'min', 45, 120, [r('touch', 'Touch'), r('pass', 'Passing'), r('fit', 'Fitness'), H(200), C], true),
    S('tennis', 'Tennis', 'Sports', 'Training', 'min', 45, 120, [r('fore', 'Forehand'), r('back', 'Backhand'), r('serve', 'Serve'), H(200), C], true),
    S('cycling', 'Cycling', 'Sports', 'Training', 'min', 30, 180, [r('endur', 'Endurance'), r('power', 'Power'), H(200), C], true),
    S('hiking', 'Hiking', 'Sports', 'Training', 'min', 60, 300, [r('endur', 'Endurance'), r('nav', 'Navigation'), H(150), C], true),
  ];

  // Approximate adult reference norms at age 25 (mean, sd) with drift per decade. lower=true means lower is better.
  const NORMS = {
    bodyfat: { n: 'Body fat', u: '%', lower: true, M: [19, 6, 1.5], F: [27, 6, 1.5], floor: { M: 8, F: 16 } },
    rhr: { n: 'Resting HR', u: 'bpm', lower: true, M: [70, 10, 0], F: [73, 10, 0] },
    pushups: { n: 'Push-ups', u: 'reps', M: [27, 11, -4], F: [18, 10, -3] },
    pullups: { n: 'Pull-ups', u: 'reps', M: [7, 5, -1], F: [1.5, 2.5, -0.3] },
    plank: { n: 'Plank', u: 'sec', M: [100, 50, -8], F: [85, 45, -8] },
    run5k: { n: '5K time', u: 'min', lower: true, M: [31, 7, 1.5], F: [36, 7, 1.5] },
    sprint100: { n: '100 m', u: 'sec', lower: true, M: [15, 2, 0.6], F: [17.5, 2.3, 0.6] },
    sitreach: { n: 'Sit & reach', u: 'cm', M: [28, 9, -1.5], F: [33, 8, -1] },
  };

  const CEFR = ['None', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'];
  const CEFR_PCT = [2, 40, 55, 68, 80, 90, 96, 99];
  // self rating 1..10 -> percentile vs general adult population
  const RATING_PCT = [0, 20, 40, 52, 62, 72, 81, 88, 94, 98, 99.7];
  const RATING_LABEL = ['', 'Never tried', 'Dabbled', 'Beginner', 'Novice', 'Intermediate', 'Solid hobbyist', 'Advanced', 'Competitive', 'Expert', 'Elite'];

  const PENALTY = [
    null,
    { name: 'Tier I', ex: [['Push-ups', 30, 'reps'], ['Squats', 50, 'reps'], ['Plank', 60, 'sec']] },
    { name: 'Tier II', ex: [['Push-ups', 60, 'reps'], ['Squats', 100, 'reps'], ['Burpees', 30, 'reps'], ['Plank', 120, 'sec']] },
    { name: 'Tier III — Hell', ex: [['Push-ups', 100, 'reps'], ['Squats', 200, 'reps'], ['Burpees', 75, 'reps'], ['Run', 3, 'km'], ['Plank', 300, 'sec']] },
  ];

  const TITLE_CATALOG = {
    Degrees: ['High School Diploma', "Associate's Degree", "Bachelor's Degree", "Master's Degree", 'Doctorate', 'Professional Certification', 'Language Certificate (TOPIK / DELE / JLPT / HSK …)'],
    Jobs: ['First Job', 'Lifeguard', 'Customer Service', 'Intern', 'Club President', 'Team Captain', 'Freelancer', 'Game Designer', 'Game Programmer', 'Shipped a Game', 'AAA Studio Hire', 'Promotion', 'Founder', 'Studio Lead'],
    Places: ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Antarctica', 'South Korea', 'Japan', 'China', 'Germany', 'France', 'Spain', 'Mexico', 'Italy', 'United Kingdom', 'Thailand', 'Brazil', 'Israel', 'Vatican City', 'Seoul', 'Tokyo', 'Great Wall of China', 'Mount Fuji Summit', 'Eiffel Tower', 'Jerusalem', "St. Peter's Basilica", 'Camino de Santiago (walked)', 'Machu Picchu', 'Grand Canyon', 'The Alps (skied)', 'Arctic Circle', 'Everest Base Camp', '10 Countries', '25 Countries', '50 Countries', 'All 50 US States'],
    Milestones: ['Graduated College', 'Moved Out', 'Moved Abroad', 'Half Marathon', 'Marathon', 'First Amateur Fight', 'First Muay Thai Fight', 'BJJ Blue Belt', 'BJJ Purple Belt', 'BJJ Brown Belt', 'BJJ Black Belt', 'Climbed V5', 'Climbed V8', 'Black Diamond Run', 'Published Writing', 'First Performance (music)', 'Baptism', 'Confirmation', 'Got Married', 'Became a Parent', 'Bought a Home', 'Debt-Free'],
  };

  window.CATALOG = { ACTIVITIES, SKILLS, NORMS, CEFR, CEFR_PCT, RATING_PCT, RATING_LABEL, PENALTY, TITLE_CATALOG };
})();
