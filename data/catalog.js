/* Static catalogs: activities (MET), skills, norms, titles, penalties.
   MET values approximate the 2024 Adult Compendium of Physical Activities.
   Calories = MET x bodyweight(kg) x hours. */
(function () {
  // f = the Workout subfolder the activity is listed under (same ids as the skill folders below)
  const A = (id, name, f, met, skill) => ({ id, name, f, met, skill });
  const R = (id, name, skill, rs, met = [2.8, 3.8, 8.0]) => Object.assign(A(id, name, 'strength', met, skill), { reps: rs }); // counted in reps
  const ACTIVITIES = [
    A('bjj_drill', 'Brazilian Jiu-Jitsu — Drills', 'combat', [4.0, 5.3, 6.5], 'bjj'),
    A('bjj_spar', 'Brazilian Jiu-Jitsu — Sparring (rolling)', 'combat', [7.0, 8.0, 10.3], 'bjj'),
    A('mt_drill', 'Muay Thai — Drills / pads', 'combat', [5.3, 7.3, 9.0], 'muaythai'),
    A('mt_spar', 'Muay Thai — Sparring', 'combat', [7.8, 10.3, 12.0], 'muaythai'),
    A('box_drill', 'Boxing — Drills / bag', 'combat', [4.5, 5.5, 7.0], 'boxing'),
    A('box_spar', 'Boxing — Sparring', 'combat', [6.5, 7.8, 12.8], 'boxing'),
    A('mma', 'MMA — Training', 'combat', [5.3, 8.0, 10.3], 'mma'),
    A('wrestling', 'Wrestling', 'combat', [4.5, 6.0, 8.0], 'wrestling'),
    A('judo', 'Judo', 'combat', [4.0, 5.3, 10.3], 'judo'),
    A('karate', 'Karate', 'combat', [4.0, 5.3, 10.3], 'karate'),
    A('tkd', 'Taekwondo', 'combat', [4.0, 5.3, 10.3], 'taekwondo'),
    A('kickbox', 'Kickboxing', 'combat', [5.3, 7.3, 10.3], 'kickboxing'),
    A('krav', 'Krav Maga', 'combat', [5.3, 7.3, 10.3], 'kravmaga'),
    A('kungfu', 'Kung Fu', 'combat', [4.0, 5.3, 10.3], 'kungfu'),
    A('hapkido', 'Hapkido', 'combat', [4.0, 5.3, 8.0], 'hapkido'),
    A('aikido', 'Aikido', 'combat', [3.0, 4.0, 6.0], 'aikido'),
    A('kendo', 'Kendo', 'combat', [4.0, 5.3, 8.0], 'kendo'),
    A('sambo', 'Sambo', 'combat', [5.3, 7.0, 10.3], 'sambo'),
    A('capoeira', 'Capoeira', 'combat', [4.0, 5.3, 8.0], 'capoeira'),
    A('fencing', 'Fencing', 'combat', [4.0, 6.0, 8.0], 'fencing'),
    A('run', 'Running (distance)', 'running', [8.3, 9.8, 11.8], 'longrun'),
    A('sprint', 'Sprint intervals', 'running', [9.0, 12.0, 15.0], 'sprint'),
    A('trail', 'Trail running', 'running', [8.0, 9.5, 12.0], 'trailrun'),
    A('walk', 'Walking', 'running', [2.8, 3.5, 5.0], null),
    A('boulder', 'Bouldering', 'climbing', [4.5, 5.8, 7.5], 'climbing'),
    A('rope', 'Rock climbing (rope)', 'climbing', [5.0, 7.3, 8.0], 'climbing'),
    A('mountaineer', 'Mountaineering', 'climbing', [5.0, 7.0, 9.5], 'mountaineering'),
    A('lift', 'Weight lifting', 'strength', [3.5, 5.0, 6.0], 'weights'),
    A('powerlift', 'Powerlifting', 'strength', [3.5, 5.0, 6.0], 'powerlifting'),
    A('olylift', 'Olympic weightlifting', 'strength', [4.0, 5.5, 6.5], 'olylifting'),
    A('kettlebell', 'Kettlebells', 'strength', [5.0, 7.0, 9.8], 'kettlebells'),
    A('calis', 'Calisthenics (push-ups, pull-ups, squats)', 'strength', [2.8, 3.8, 8.0], 'calisthenics'),
    // v12: rep exercises, logged in reps (reps = seconds per rep, used for the time and calorie estimate)
    R('pushups', 'Push-ups', 'pushups', 2.5), R('pullups', 'Pull-ups', 'pullups', 3), R('squats', 'Squats', 'squats', 2.5),
    R('burpees', 'Burpees', null, 5, [5.0, 8.0, 10.0]), R('situps', 'Sit-ups / crunches', null, 2.5), R('dips', 'Dips', null, 3),
    R('lunges', 'Lunges', null, 3), R('jacks', 'Jumping jacks', null, 1.2), R('kbswing', 'Kettlebell swings', 'kettlebells', 2, [5.0, 7.0, 9.8]),
    A('hiit', 'HIIT / circuit', 'strength', [6.0, 8.0, 10.0], null),
    A('jumprope', 'Jump rope', 'strength', [8.8, 11.8, 12.3], 'jumprope'),
    A('rowing', 'Rowing machine', 'strength', [4.8, 7.0, 8.5], null),
    A('elliptical', 'Elliptical', 'strength', [4.0, 5.0, 6.5], null),
    A('yoga', 'Yoga / mobility', 'strength', [2.5, 3.0, 4.0], 'mobility'),
    A('pilates', 'Pilates', 'strength', [2.8, 3.0, 4.0], 'pilates'),
    A('swim', 'Swimming laps', 'water', [5.8, 8.3, 9.8], 'swimming'),
    A('waterpolo', 'Water polo', 'water', [7.0, 10.0, 12.0], 'waterpolo'),
    A('surf', 'Surfing', 'water', [3.0, 4.0, 5.0], 'surfing'),
    A('diving', 'Diving (scuba / free)', 'water', [5.0, 7.0, 8.0], 'diving'),
    A('kayak', 'Kayaking / canoeing', 'water', [3.5, 5.0, 8.0], 'kayaking'),
    A('row_water', 'Rowing (on the water)', 'water', [4.8, 7.0, 12.0], 'rowing'),
    A('basketball', 'Basketball', 'ball', [6.0, 6.5, 8.0], 'basketball'),
    A('soccer', 'Soccer', 'ball', [7.0, 7.0, 10.0], 'soccer'),
    A('tennis', 'Tennis', 'ball', [5.0, 7.3, 8.0], 'tennis'),
    A('volleyball', 'Volleyball', 'ball', [3.0, 4.0, 8.0], 'volleyball'),
    A('baseball', 'Baseball / softball', 'ball', [4.0, 5.0, 6.0], 'baseball'),
    A('football', 'American football', 'ball', [6.0, 8.0, 9.0], 'football'),
    A('golf', 'Golf (walking)', 'ball', [3.5, 4.3, 5.3], 'golf'),
    A('tabletennis', 'Table tennis', 'ball', [3.0, 4.0, 5.5], 'tabletennis'),
    A('badminton', 'Badminton', 'ball', [4.5, 5.5, 7.0], 'badminton'),
    A('pickleball', 'Pickleball', 'ball', [3.5, 4.5, 6.0], 'pickleball'),
    A('hockey', 'Ice hockey', 'ball', [6.0, 8.0, 10.0], 'hockey'),
    A('rugby', 'Rugby', 'ball', [6.3, 8.3, 10.0], 'rugby'),
    A('hike', 'Hiking', 'outdoor', [5.3, 6.0, 7.8], 'hiking'),
    A('cycling', 'Cycling', 'outdoor', [4.0, 6.8, 10.0], 'cycling'),
    A('ski_down', 'Skiing — downhill', 'outdoor', [4.3, 5.3, 8.0], 'skiing'),
    A('ski_xc', 'Skiing — cross-country', 'outdoor', [6.8, 9.0, 12.5], 'skiing'),
    A('snowboard', 'Snowboarding', 'outdoor', [4.3, 5.3, 8.0], 'snowboarding'),
    A('skate_ice', 'Ice skating', 'outdoor', [5.5, 7.0, 9.0], 'iceskating'),
    A('skateboard', 'Skateboarding', 'outdoor', [4.0, 5.0, 6.0], 'skateboarding'),
    A('archery', 'Archery', 'outdoor', [3.0, 3.5, 4.3], 'archery'),
    A('riding', 'Horseback riding', 'outdoor', [3.8, 5.5, 7.3], 'riding'),
    A('dance', 'Dance', 'dance', [3.0, 5.0, 7.3], null),
    A('dance_v', 'Dance — vigorous (hip-hop, swing, salsa)', 'dance', [5.5, 7.3, 8.5], null),
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
  // 한국어문회 한자능력검정시험 grades with the number of characters each requires
  const HANJA_GRADES = ['None', '8급 · 50자', '7급 · 150자', '6급 · 300자', '5급 · 500자', '4급 · 1,000자', '3급 · 1,817자', '2급 · 2,355자', '1급 · 3,500자', '특급 · 5,978자'];
  const S = (id, name, cat, list, unit, base, max, stats, phys) => ({ id, name, cat, list, unit, base, max, stats, phys: !!phys });

  const SKILLS = [
    // Prayer moved to task quests in v7 (no hexagon). Kept here so its old XP and earned titles stay valid.
    Object.assign(S('prayer', 'Prayer', 'Faith', 'Faith', 'min', 10, 60, [r('devotion', 'Devotion'), r('focus', 'Focus'), H(100), C]), { moved: 'pray' }),
    S('bible', 'Bible Reading', 'Faith', 'Faith', 'ch', 1, 10, [r('scripture', 'Scripture knowledge'), r('memory', 'Memorization'), H(100), C]),
    S('theology', 'Theology', 'Faith', 'Study', 'min', 20, 90, [r('doctrine', 'Doctrine'), r('history', 'Church history'), r('apol', 'Apologetics'), H(200), C]),
    S('philosophy', 'Philosophy', 'Study', 'Study', 'min', 20, 90, [r('know', 'Knowledge'), r('reason', 'Reasoning'), r('texts', 'Primary texts'), H(200), C]),
    lang('korean', 'Korean'), lang('english', 'English'), lang('spanish', 'Spanish'), lang('german', 'German'),
    lang('french', 'French'), lang('japanese', 'Japanese'), lang('chinese', 'Chinese'),
    S('hanja', 'Hanja (漢字)', 'Languages', 'Study', 'min', 15, 90, [{ k: 'grade', n: 'Grade (급수)', t: 'scale', opts: HANJA_GRADES, pct: [2, 25, 40, 52, 64, 75, 85, 91, 96, 99] }, r('read', 'Reading (훈·음)'), r('write', 'Writing'), r('vocab', 'Hanja vocabulary (한자어)'), H(200), C]),
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

  /* ---- more defaults (v9). Every id is permanent: titles are stored as sk_<id>_<level> ---- */
  const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '');
  // a ratings-based skill: axes are self-rated 1-10, plus practice hours and consistency
  const RS = (id, name, f, cat, list, unit, base, max, axes, hrs, phys, extra) => Object.assign(S(id, name, cat, list, unit, base, max, axes.map(n => r(slug(n), n)).concat([H(hrs), C]), phys), { f }, extra || {});
  const L2 = (id, name) => Object.assign(lang(id, name), { f: 'lang' }), I2 = (id, name) => Object.assign(inst(id, name), { f: 'music' });
  const fight = (id, name, axes) => RS(id, name, 'combat', 'Combat', 'Training', 'min', 45, 120, axes, 300, true);
  const sport = (id, name, f, axes, base = 45, max = 120, hrs = 200) => RS(id, name, f, 'Sports', 'Training', 'min', base, max, axes, hrs, true);
  const gym = (id, name, axes, base = 30, max = 90, hrs = 150) => RS(id, name, 'strength', 'Exercise', 'Training', 'min', base, max, axes, hrs, true);
  const study = (id, name, axes, hrs = 250) => RS(id, name, 'study', 'Study', 'Study', 'min', 20, 120, axes, hrs);
  const art = (id, name, axes, hrs = 250) => RS(id, name, 'craft', 'Craft', 'Craft', 'min', 30, 180, axes, hrs);
  const dance = (id, name, axes, act) => RS(id, name, 'dance', 'Dance', 'Training', 'min', 30, 120, axes, 200, true, { act });
  SKILLS.push(
    RS('scripture', 'Scripture Memorization', 'faith', 'Faith', 'Faith', 'min', 10, 45, ['Verses memorized', 'Recall', 'Understanding'], 100),
    RS('churchhist', 'Church History', 'faith', 'Faith', 'Study', 'min', 20, 90, ['Early church', 'Reformation', 'Modern church'], 150),
    study('history', 'History', ['Ancient', 'Medieval', 'Modern', 'Historiography']),
    study('math', 'Mathematics', ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Proofs'], 300),
    study('physics', 'Physics', ['Mechanics', 'Electromagnetism', 'Thermodynamics', 'Modern physics'], 300),
    study('chemistry', 'Chemistry', ['General', 'Organic', 'Lab work']),
    study('biology', 'Biology', ['Cell biology', 'Anatomy', 'Ecology', 'Genetics']),
    study('economics', 'Economics', ['Microeconomics', 'Macroeconomics', 'Finance', 'Data']),
    study('psychology', 'Psychology', ['Cognitive', 'Developmental', 'Social', 'Clinical']),
    study('literature', 'Literature', ['Close reading', 'Classics', 'Poetry', 'Criticism']),
    L2('italian', 'Italian'), L2('portuguese', 'Portuguese'), L2('russian', 'Russian'), L2('arabic', 'Arabic'), L2('hindi', 'Hindi'), L2('vietnamese', 'Vietnamese'),
    L2('latin', 'Latin'), L2('greek', 'Koine Greek'), L2('hebrew', 'Biblical Hebrew'), L2('asl', 'Sign Language (ASL)'),
    art('painting', 'Painting', ['Color', 'Composition', 'Brushwork', 'Values']),
    art('photography', 'Photography', ['Composition', 'Light', 'Editing', 'Camera craft']),
    art('design', 'Graphic Design', ['Typography', 'Layout', 'Color', 'Branding']),
    art('modeling3d', '3D Modeling', ['Modeling', 'Texturing', 'Lighting', 'Rigging']),
    art('animation', 'Animation', ['Timing', 'Posing', 'Drawing', 'Software']),
    art('gamedev', 'Game Development', ['Programming', 'Design', 'Art', 'Shipping'], 400),
    art('calligraphy', 'Calligraphy', ['Brush control', 'Structure', 'Rhythm', 'Scripts']),
    art('woodworking', 'Woodworking', ['Joinery', 'Tools', 'Finishing', 'Design']),
    art('sewing', 'Sewing & Knitting', ['Technique', 'Patterns', 'Finishing']),
    art('pottery', 'Pottery', ['Throwing', 'Hand-building', 'Glazing']),
    I2('singing', 'Singing'), I2('violin', 'Violin'), I2('cello', 'Cello'), I2('drums', 'Drums'), I2('bass', 'Bass Guitar'), I2('ukulele', 'Ukulele'), I2('flute', 'Flute'), I2('saxophone', 'Saxophone'),
    RS('programming', 'Programming', 'work', 'Work', 'Work', 'min', 30, 180, ['Fundamentals', 'Algorithms', 'Systems', 'Tooling', 'Projects'], 400),
    RS('speaking', 'Public Speaking', 'work', 'Work', 'Work', 'min', 15, 60, ['Delivery', 'Structure', 'Confidence', 'Storytelling'], 100),
    RS('typing', 'Typing', 'work', 'Work', 'Work', 'min', 10, 30, ['Speed', 'Accuracy', 'Touch typing'], 40),
    RS('leadership', 'Leadership', 'work', 'Work', 'Work', 'min', 20, 60, ['Vision', 'Delegation', 'Feedback', 'Decisions'], 300),
    RS('negotiation', 'Sales & Negotiation', 'work', 'Work', 'Work', 'min', 20, 60, ['Preparation', 'Persuasion', 'Listening', 'Closing'], 200),
    RS('spreadsheets', 'Spreadsheets', 'work', 'Work', 'Work', 'min', 20, 60, ['Formulas', 'Data cleanup', 'Charts', 'Automation'], 100),
    RS('cooking', 'Cooking', 'life', 'Life', 'Daily', 'min', 20, 90, ['Knife skills', 'Techniques', 'Flavor', 'Meal planning'], 200),
    RS('baking', 'Baking', 'life', 'Life', 'Daily', 'min', 30, 120, ['Bread', 'Pastry', 'Precision', 'Decorating'], 150),
    RS('finance', 'Personal Finance', 'life', 'Life', 'Daily', 'min', 15, 60, ['Budgeting', 'Saving', 'Investing', 'Taxes'], 80),
    RS('gardening', 'Gardening', 'life', 'Life', 'Chores', 'min', 20, 90, ['Soil', 'Plants', 'Pests', 'Harvest'], 150),
    RS('diy', 'Home Repair', 'life', 'Life', 'Chores', 'min', 30, 120, ['Tools', 'Plumbing', 'Electrical', 'Carpentry'], 150),
    RS('firstaid', 'First Aid', 'life', 'Life', 'Study', 'min', 10, 30, ['CPR', 'Wounds', 'Emergencies'], 40),
    RS('driving', 'Driving', 'life', 'Life', 'Daily', 'min', 20, 60, ['Control', 'Awareness', 'Parking', 'Highway'], 100),
    RS('chess', 'Chess', 'mind', 'Mind', 'Study', 'min', 20, 120, ['Tactics', 'Strategy', 'Openings', 'Endgames'], 300),
    RS('go', 'Go (Baduk)', 'mind', 'Mind', 'Study', 'min', 20, 120, ['Reading', 'Shape', 'Openings', 'Endgame'], 300),
    RS('rubik', "Rubik's Cube", 'mind', 'Mind', 'Study', 'min', 10, 60, ['Algorithms', 'Look-ahead', 'Speed'], 60),
    RS('memory', 'Memory Training', 'mind', 'Mind', 'Study', 'min', 10, 45, ['Numbers', 'Names', 'Memory palace'], 60),
    RS('speedreading', 'Speed Reading', 'mind', 'Mind', 'Study', 'min', 10, 45, ['Speed', 'Comprehension', 'Retention'], 50),
    fight('wrestling', 'Wrestling', ['Takedowns', 'Top control', 'Escapes', 'Conditioning']),
    fight('judo', 'Judo', ['Throws', 'Grips', 'Newaza', 'Breakfalls']),
    fight('karate', 'Karate', ['Kihon', 'Kata', 'Kumite', 'Conditioning']),
    fight('taekwondo', 'Taekwondo', ['Kicks', 'Poomsae', 'Sparring', 'Flexibility']),
    fight('kickboxing', 'Kickboxing', ['Punches', 'Kicks', 'Defense', 'Conditioning']),
    fight('kravmaga', 'Krav Maga', ['Striking', 'Defenses', 'Ground', 'Awareness']),
    fight('kungfu', 'Kung Fu', ['Forms', 'Stances', 'Sparring', 'Flexibility']),
    fight('hapkido', 'Hapkido', ['Joint locks', 'Throws', 'Kicks', 'Breakfalls']),
    fight('aikido', 'Aikido', ['Ukemi', 'Techniques', 'Weapons', 'Flow']),
    fight('kendo', 'Kendo', ['Strikes', 'Footwork', 'Kata', 'Spirit']),
    fight('sambo', 'Sambo', ['Throws', 'Leg locks', 'Ground', 'Conditioning']),
    fight('capoeira', 'Capoeira', ['Movement', 'Kicks', 'Music', 'Acrobatics']),
    fight('fencing', 'Fencing', ['Footwork', 'Blade work', 'Tactics', 'Speed']),
    RS('trailrun', 'Trail Running', 'running', 'Running', 'Training', 'km', 3, 30, ['Endurance', 'Climbing', 'Descending', 'Footing'], 150, true),
    RS('mountaineering', 'Mountaineering', 'climbing', 'Climbing', 'Training', 'min', 60, 300, ['Endurance', 'Rope work', 'Navigation', 'Altitude'], 200, true),
    gym('calisthenics', 'Calisthenics', ['Pushing', 'Pulling', 'Core', 'Skills']),
    gym('powerlifting', 'Powerlifting', ['Squat', 'Bench', 'Deadlift', 'Form'], 45, 120, 300),
    gym('olylifting', 'Olympic Weightlifting', ['Snatch', 'Clean & jerk', 'Mobility', 'Speed'], 45, 120, 300),
    gym('kettlebells', 'Kettlebells', ['Swings', 'Get-ups', 'Snatches', 'Endurance'], 15, 60, 100),
    gym('pilates', 'Pilates', ['Core', 'Control', 'Flexibility'], 20, 60, 100),
    gym('jumprope', 'Jump Rope', ['Endurance', 'Tricks', 'Rhythm'], 10, 30, 60),
    RS('handstand', 'Handstands', 'strength', 'Exercise', 'Training', 'min', 10, 30, ['Balance', 'Strength', 'Shape'], 80, true, { act: 'calis' }),
    sport('surfing', 'Surfing', 'water', ['Paddling', 'Pop-up', 'Wave reading', 'Turns'], 60, 180),
    sport('diving', 'Diving', 'water', ['Breath-hold', 'Buoyancy', 'Safety', 'Navigation'], 30, 120, 150),
    sport('kayaking', 'Kayaking & Canoeing', 'water', ['Strokes', 'Endurance', 'Rescue', 'Navigation'], 45, 180, 150),
    sport('rowing', 'Rowing', 'water', ['Technique', 'Power', 'Endurance'], 30, 120),
    sport('volleyball', 'Volleyball', 'ball', ['Serve', 'Passing', 'Setting', 'Spiking']),
    sport('baseball', 'Baseball / Softball', 'ball', ['Hitting', 'Fielding', 'Throwing', 'Base running']),
    sport('football', 'American Football', 'ball', ['Speed', 'Catching', 'Blocking', 'Playbook']),
    sport('golf', 'Golf', 'ball', ['Driving', 'Irons', 'Short game', 'Putting'], 45, 240),
    sport('tabletennis', 'Table Tennis', 'ball', ['Forehand', 'Backhand', 'Serve', 'Spin'], 30, 120),
    sport('badminton', 'Badminton', 'ball', ['Clears', 'Smashes', 'Net play', 'Footwork']),
    sport('pickleball', 'Pickleball', 'ball', ['Dinks', 'Drives', 'Serve', 'Strategy']),
    sport('hockey', 'Ice Hockey', 'ball', ['Skating', 'Stickhandling', 'Shooting', 'Defense'], 60, 150),
    sport('rugby', 'Rugby', 'ball', ['Tackling', 'Passing', 'Running', 'Rucking'], 60, 150),
    sport('snowboarding', 'Snowboarding', 'outdoor', ['Carving', 'Terrain', 'Park', 'Speed control'], 60, 240, 150),
    sport('iceskating', 'Ice Skating', 'outdoor', ['Edges', 'Speed', 'Spins', 'Balance'], 30, 120, 150),
    sport('skateboarding', 'Skateboarding', 'outdoor', ['Balance', 'Tricks', 'Transitions', 'Style'], 30, 120, 150),
    sport('archery', 'Archery', 'outdoor', ['Form', 'Accuracy', 'Consistency'], 30, 120, 150),
    sport('riding', 'Horseback Riding', 'outdoor', ['Seat', 'Control', 'Jumping', 'Horse care'], 45, 120, 200),
    dance('ballroom', 'Ballroom', ['Frame', 'Footwork', 'Musicality', 'Partnering'], 'dance'),
    dance('salsa', 'Salsa', ['Footwork', 'Turns', 'Musicality', 'Partnering'], 'dance_v'),
    dance('hiphop', 'Hip-Hop Dance', ['Grooves', 'Choreography', 'Freestyle', 'Musicality'], 'dance_v'),
    dance('ballet', 'Ballet', ['Technique', 'Turnout', 'Jumps', 'Artistry'], 'dance'),
    dance('swing', 'Swing Dance', ['Footwork', 'Connection', 'Musicality', 'Aerials'], 'dance_v'),
  );
  /* Folders for the Skills library (two levels). Workout is the big one; its subfolders also group "Log a workout". */
  const F = (id, name, parent = null) => ({ id, name, parent });
  const FOLDERS = [F('faith', 'Faith'), F('study', 'Study'), F('lang', 'Languages'), F('craft', 'Craft & Arts'), F('music', 'Instruments'), F('work', 'Work'), F('life', 'Life Skills'), F('mind', 'Mind & Games'),
    F('workout', 'Workout'), F('combat', 'Combat', 'workout'), F('running', 'Running', 'workout'), F('climbing', 'Climbing', 'workout'), F('strength', 'Strength & Mobility', 'workout'), F('water', 'Water', 'workout'),
    F('ball', 'Ball & Racket', 'workout'), F('outdoor', 'Outdoor & Winter', 'workout'), F('dance', 'Dance', 'workout'), F('custom', 'Custom')];
  const CAT_FOLDER = { Faith: 'faith', Study: 'study', Languages: 'lang', Craft: 'craft', Instruments: 'music', Work: 'work', Combat: 'combat', Climbing: 'climbing', Running: 'running', Exercise: 'strength' };
  const ID_FOLDER = { skiing: 'outdoor', swimming: 'water', waterpolo: 'water', basketball: 'ball', soccer: 'ball', tennis: 'ball', cycling: 'outdoor', hiking: 'outdoor' };
  SKILLS.forEach(s => { if (!s.f) s.f = ID_FOLDER[s.id] || CAT_FOLDER[s.cat] || 'custom'; });

  /* Belt ladders (common adult systems; they vary by school, so the app lets you edit them).
     m = how many marks a belt can carry, ml = what they're called: stripe / degree / dan / kyu; d0 = first dan number on that belt. */
  const B = (n, c, m = 0, ml = 'stripe', c2 = null, d0 = 1) => ({ n, c, c2, m, ml, d0 });
  const WH = '#f2f0ea', BK = '#161616', RD = '#c4302b', YE = '#e9c629', OR = '#e7832b', GR = '#2f8f46', BL = '#2c5fbf', PU = '#6c3fa8', BR = '#6b4424';
  const blackDan = n => B('Black', BK, n, 'dan');
  const BELTS = {
    bjj: { belts: [B('White', WH, 4), B('Blue', BL, 4), B('Purple', PU, 4), B('Brown', BR, 4), B('Black', BK, 6, 'degree'), B('Red & Black', RD, 0, 'stripe', BK), B('Red & White', RD, 0, 'stripe', WH), B('Red', RD)] },
    judo: { belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Blue', BL), B('Brown', BR), B('Black', BK, 4, 'dan'), B('Red & White', RD, 2, 'dan', WH, 6), B('Red', RD, 1, 'dan', null, 9)] },
    karate: { belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Blue', BL), B('Purple', PU), B('Brown', BR), blackDan(9)] },
    taekwondo: { belts: [B('White', WH), B('Yellow', YE), B('Green', GR), B('Blue', BL), B('Red', RD), blackDan(8)] },
    kickboxing: { belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Blue', BL), B('Brown', BR), blackDan(9)] },
    kravmaga: { belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Blue', BL), B('Brown', BR), blackDan(9)] },
    kungfu: { word: 'Sash', belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Blue', BL), B('Purple', PU), B('Red', RD), B('Brown', BR), B('Black', BK, 9, 'degree')] },
    hapkido: { belts: [B('White', WH), B('Yellow', YE), B('Orange', OR), B('Green', GR), B('Purple', PU), B('Blue', BL), B('Brown', BR), B('Red', RD), blackDan(9)] },
    aikido: { belts: [B('White', WH, 5, 'kyu'), B('Black', BK, 7, 'dan')] },
  };
  // martial arts with a belt system get a "Belt" side on their hexagon (before practice hours & consistency)
  Object.keys(BELTS).forEach(id => { const s = SKILLS.find(x => x.id === id); if (s && !s.stats.some(x => x.t === 'belt')) s.stats.splice(s.stats.length - 2, 0, { k: 'belt', n: 'Belt', t: 'belt' }); });

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
    Milestones: ['Graduated College', 'Moved Out', 'Moved Abroad', 'Half Marathon', 'Marathon', 'First Amateur Fight', 'First Muay Thai Fight', 'Climbed V5', 'Climbed V8', 'Black Diamond Run', 'Published Writing', 'First Performance (music)', 'Baptism', 'Confirmation', 'Got Married', 'Became a Parent', 'Bought a Home', 'Debt-Free'],
  };

  /* Task quests: everyday things that don't need a hexagon. unit 'times' = check-offs (sessions per day),
     unit 'min' = a timed session whose length grows with the task's level. diff 1 easy / 2 medium / 3 hard.
     ach = 6 achievement names for 1 / 7 / 30 / 100 / 365 / 1,000 days of completions (scaled for tasks that
     aren't daily). IDs are permanent (achievement IDs are built from them). */
  const T = (id, name, unit, sessions, base, max, diff, list, days, ach, extra) => Object.assign({ id, name, unit, sessions, base, max, diff, list, days, ach }, extra || {});
  const ALL = [0, 1, 2, 3, 4, 5, 6];
  const TASKS = [
    T('bed', 'Make the bed', 'times', 1, 0, 0, 1, 'Morning', ALL, ['Fitted Sheet Survivor', 'Tucked In', 'Hospital Corners', 'Pillow Architect', 'Admiral of the Mattress', 'The Bed Is Made. Forever.']),
    T('teeth', 'Brush teeth', 'times', 2, 0, 0, 1, 'Daily', ALL, ['Minty Fresh', 'Plaque Patrol', 'Enamel Guardian', "Dentist's Favorite", 'Smile of the Year', 'Thousand-Watt Smile']),
    T('floss', 'Floss', 'times', 1, 0, 0, 1, 'Wind Down', ALL, ['String Theory', 'Gumline Ranger', 'Floss Boss', 'Your Dentist Is Speechless', 'Year of the Floss', 'Floss Legend']),
    T('shower', 'Shower', 'times', 1, 0, 0, 1, 'Daily', ALL, ['Freshly Rinsed', 'Squeaky Clean', 'Soap Opera Star', 'Loofah Legend', 'Certified Not Smelly', 'Human Waterfall']),
    T('face', 'Wash face', 'times', 2, 0, 0, 1, 'Daily', ALL, ['Face Value', 'Fresh Face', 'Pores Under Control', 'Skin in the Game', 'Radiant', 'Face of the Franchise']),
    T('water', 'Drink a glass of water', 'times', 8, 0, 0, 1, 'Daily', ALL, ['First Sip', 'Hydrated', 'Camel Mode: Off', 'Walking Aquifer', 'Human Reservoir', 'Mostly Water Now']),
    T('pray', 'Prayer', 'min', 1, 10, 60, 2, 'Faith', ALL, ['First Prayer', 'A Week of Prayer', 'Forty Days of Prayer', 'Steadfast in Prayer', 'A Year on Your Knees', 'Pray Without Ceasing']),
    T('phone', 'Phone away & asleep', 'times', 1, 0, 0, 2, 'Wind Down', ALL, ['Lights Out', 'Sleep Hygienist', 'Doomscroll Dodger', "Sandman's Apprentice", 'Well-Rested Legend', 'Hibernation Master'], { lock: 'sleep' }),
    T('stretch', 'Stretch', 'min', 1, 5, 20, 1, 'Morning', ALL, ['Limber Up', 'Bendy', 'Rubber Band', 'Pretzel Apprentice', 'Human Slinky', 'Noodle Ascended']),
    T('sun', 'Morning sunlight', 'min', 1, 10, 30, 1, 'Morning', ALL, ['Sun-Kissed', 'Photon Collector', 'Solar Powered', 'Daylight Devotee', 'Vitamin D Dealer', 'Child of the Sun']),
    T('tidy', 'Tidy up', 'min', 1, 10, 30, 1, 'Chores', ALL, ['Clutter Cutter', 'Tidy Tactician', 'Dust Bunny Hunter', 'Feng Shui Sergeant', 'Zen Den', 'Minimalist Monk']),
    T('dishes', 'Do the dishes', 'times', 1, 0, 0, 1, 'Chores', ALL, ['Sink Is Clear', 'Suds Soldier', 'Plate Whisperer', 'Sponge Sage', 'Lord of the Rinse', 'The Dishwasher Is You']),
    T('trash', 'Take out the trash', 'times', 1, 0, 0, 1, 'Chores', [2, 5], ['Curbside Hero', 'Bin There, Done That', 'Garbage Day Guardian', "Raccoon's Nemesis", 'Waste Management Exec', 'Trash Titan']),
    T('laundry', 'Do laundry', 'times', 1, 0, 0, 2, 'Chores', [6], ['Spin Cycle', 'Sock Matchmaker', 'Wrinkle Warrior', 'Fold Master', 'Laundry Lord', 'The Pile Has Been Defeated']),
    T('plants', 'Water the plants', 'times', 1, 0, 0, 1, 'Chores', [0, 3], ['Green Thumb', 'Plant Parent', 'Photosynthesis Sponsor', 'Leaf Whisperer', 'Jungle Keeper', 'Botanical Overlord']),
    T('journal', 'Journal', 'min', 1, 5, 20, 2, 'Wind Down', ALL, ['Dear Diary', 'Ink Spiller', 'Memoirist', 'Chronicler', 'Keeper of Days', 'Living Archive']),
    T('plan', 'Plan tomorrow', 'min', 1, 5, 15, 1, 'Wind Down', ALL, ['Plan Made', 'Ahead of Schedule', 'List Maker', 'Strategist', 'Chief of Tomorrow', 'Prophet of Productivity']),
    // v16: commute check-ins (weekdays by default; change the days in Calendar → Weekly plan)
    T('gowork', 'Go to work', 'times', 1, 0, 0, 1, 'Work', [1, 2, 3, 4, 5], ['Clocked In', 'Punctual Professional', 'Commute Conqueror', 'Office Fixture', 'Employee of the Year', 'Pillar of the Workforce']),
    T('leavework', 'Leave work', 'times', 1, 0, 0, 1, 'Work', [1, 2, 3, 4, 5], ['Clocked Out', 'Work-Life Balancer', 'Boundary Setter', 'Out the Door on Time', 'Master of the Exit', 'Legend of Leaving on Time']),
    T('goschool', 'Go to school', 'times', 1, 0, 0, 1, 'Study', [1, 2, 3, 4, 5], ['First Bell', 'Present!', 'Perfect Attendance', 'Hallway Regular', 'Honor Roll Commuter', 'Lifelong Learner']),
    T('leaveschool', 'Leave school', 'times', 1, 0, 0, 1, 'Study', [1, 2, 3, 4, 5], ['Final Bell', 'Homeward Bound', 'Backpack Unloaded', 'Bus Line Veteran', 'Recess Forever', 'Graduate of Going Home']),
  ];

  /* One-time and time-limited quest ideas the user can adopt and edit. dur: [n, 'd'|'w'|'m'|'y'] or null = until done. */
  const SIDE_TEMPLATES = {
    once: [
      { title: 'Go camping with friends', diff: 3, reward: { kind: 'custom', text: 'S’mores by the fire' } },
      { title: 'Watch a sunrise', diff: 1 },
      { title: 'Hike a trail you’ve never walked', diff: 2 },
      { title: 'Cook a recipe you’ve never made', diff: 2 },
      { title: 'Call an old friend', diff: 1 },
      { title: 'Visit a city you’ve never been to', diff: 3, reward: { kind: 'custom', text: 'A souvenir for yourself' } },
      { title: 'Donate clothes you no longer wear', diff: 1 },
      { title: 'Spend a full day offline', diff: 3, reward: { kind: 'custom', text: 'A slow breakfast out' } },
    ],
    timed: [
      { title: 'Finish a personal project', dur: null, track: 'cp', cps: ['Plan it out', 'Build the first version', 'Polish', 'Share it'], diff: 4, reward: { kind: 'custom', text: 'A launch-day dinner' } },
      { title: 'Deep-clean the whole house', dur: [3, 'd'], track: 'cp', cps: ['Kitchen', 'Bathroom', 'Bedroom', 'Living room'], diff: 2, reward: { kind: 'custom', text: 'Order takeout' } },
      { title: 'Train for a 5K', dur: [8, 'w'], track: 'time', goalH: 20, diff: 3, reward: { kind: 'custom', text: 'New running shoes' } },
      { title: 'Read the Gospels', dur: [1, 'm'], track: 'cp', cps: ['Matthew', 'Mark', 'Luke', 'John'], diff: 2 },
      { title: 'Learn 100 new Hanja', dur: [3, 'm'], track: 'time', goalH: 30, diff: 3 },
      { title: 'Build a portfolio', dur: [6, 'm'], track: 'cp', cps: ['Pick the best work', 'Write case studies', 'Make the site', 'Send it to 5 people'], diff: 4, reward: { kind: 'custom', text: 'New gear for the next project' } },
      { title: 'Practice an instrument for 50 hours', dur: [1, 'y'], track: 'time', goalH: 50, diff: 3 },
    ],
  };

  window.CATALOG = { ACTIVITIES, SKILLS, FOLDERS, BELTS, NORMS, CEFR, CEFR_PCT, RATING_PCT, RATING_LABEL, PENALTY, TITLE_CATALOG, TASKS, SIDE_TEMPLATES };
})();
