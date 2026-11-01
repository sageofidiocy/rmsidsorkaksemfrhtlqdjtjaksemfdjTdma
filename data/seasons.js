/* 24 solar terms (절기 節氣) × 3 pentads (후 候) = the 72 micro-seasons (칠십이후 七十二候).
   NAMES:  season: [hanja, Korean word (뜻), English, hanja reading (음), romanized reading]
   JEOLGI: [hanja, hangul reading, English, month, approx. start day, season, pentads, Korean explanation (뜻풀이), romanized]
   pentad: [hanja, hangul reading, English, scene, Korean explanation (뜻풀이), romanized (Revised Romanization, split by meaning)]
   Start dates are approximate (they shift by about a day year to year). Pentads begin every 5 days. */
window.SEASONS = {
  NAMES: { spring: ["春", "봄", "Spring", "춘", "Chun"], summer: ["夏", "여름", "Summer", "하", "Ha"], autumn: ["秋", "가을", "Autumn", "추", "Chu"], winter: ["冬", "겨울", "Winter", "동", "Dong"] },
  JEOLGI: [
    ["小寒", "소한", "Minor Cold", 1, 6, "winter", [
      ["雁北鄕", "안북향", "Wild geese turn north", "geeseN", "기러기가 북쪽으로 돌아간다", "An bukhyang"],
      ["鵲始巢", "작시소", "Magpies begin to nest", "magpie", "까치가 둥지를 짓기 시작한다", "Jak siso"],
      ["雉始雊", "치시구", "Pheasants begin to call", "pheasant", "꿩이 울기 시작한다", "Chi sigu"]],
      "본격적인 겨울 추위가 시작됨", "Sohan"],
    ["大寒", "대한", "Major Cold", 1, 20, "winter", [
      ["雞始乳", "계시유", "Hens begin to lay", "hen", "닭이 알을 낳기 시작한다", "Gye siyu"],
      ["征鳥厲疾", "정조려질", "Birds of prey fly swift and fierce", "raptor", "사나운 새가 높고 빠르게 난다", "Jeongjo ryeojil"],
      ["水澤腹堅", "수택복견", "Lakes and marshes freeze solid", "lakeIce", "연못과 늪이 속까지 꽁꽁 언다", "Sutaek bokgyeon"]],
      "한 해의 마지막 큰 추위", "Daehan"],
    ["立春", "입춘", "Start of Spring", 2, 4, "spring", [
      ["東風解凍", "동풍해동", "The east wind thaws the ice", "thaw", "동풍이 불어 얼음이 녹는다", "Dongpung haedong"],
      ["蟄蟲始振", "칩충시진", "Hibernating insects begin to stir", "insects", "겨울잠 자던 벌레가 꿈틀대기 시작한다", "Chipchung sijin"],
      ["魚陟負冰", "어척부빙", "Fish rise, carrying ice on their backs", "fishIce", "물고기가 얼음을 등에 지고 떠오른다", "Eocheok bubing"]],
      "봄이 시작됨", "Ipchun"],
    ["雨水", "우수", "Rain Water", 2, 19, "spring", [
      ["獺祭魚", "달제어", "Otters lay out their fish", "otterFish", "수달이 잡은 물고기를 늘어놓는다", "Dal je-eo"],
      ["鴻雁來", "홍안래", "Wild geese return", "geeseN", "기러기가 돌아온다", "Hong-an rae"],
      ["草木萌動", "초목맹동", "Grass and trees begin to sprout", "sprouts", "풀과 나무에 싹이 트기 시작한다", "Chomok maengdong"]],
      "눈이 녹아 비가 됨", "Usu"],
    ["驚蟄", "경칩", "Awakening of Insects", 3, 6, "spring", [
      ["桃始華", "도시화", "Peach trees begin to bloom", "peach", "복숭아꽃이 피기 시작한다", "Do sihwa"],
      ["倉庚鳴", "창경명", "Orioles sing", "oriole", "꾀꼬리가 운다", "Changgyeong myeong"],
      ["鷹化爲鳩", "응화위구", "Hawks turn into doves", "dove", "매가 비둘기로 변한다", "Eunghwa wigu"]],
      "겨울잠 자던 벌레가 깨어남", "Gyeongchip"],
    ["春分", "춘분", "Spring Equinox", 3, 21, "spring", [
      ["玄鳥至", "현조지", "Swallows arrive", "swallows", "제비가 날아온다", "Hyeonjo ji"],
      ["雷乃發聲", "뇌내발성", "Thunder raises its voice", "thunder", "우레가 소리를 내기 시작한다", "Noenae balseong"],
      ["始電", "시전", "Lightning first flashes", "lightning", "번개가 치기 시작한다", "Sijeon"]],
      "낮과 밤의 길이가 같아짐", "Chunbun"],
    ["淸明", "청명", "Clear and Bright", 4, 5, "spring", [
      ["桐始華", "동시화", "Paulownia trees begin to bloom", "paulownia", "오동나무 꽃이 피기 시작한다", "Dong sihwa"],
      ["田鼠化爲鴽", "전서화위여", "Field mice turn into quail", "quail", "들쥐가 메추라기로 변한다", "Jeonseo hwawi yeo"],
      ["虹始見", "홍시견", "Rainbows first appear", "rainbow", "무지개가 처음 나타난다", "Hong sigyeon"]],
      "하늘이 맑고 밝아짐", "Cheongmyeong"],
    ["穀雨", "곡우", "Grain Rain", 4, 20, "spring", [
      ["萍始生", "평시생", "Duckweed begins to grow", "duckweed", "개구리밥이 돋아나기 시작한다", "Pyeong sisaeng"],
      ["鳴鳩拂其羽", "명구불기우", "Turtledoves preen their feathers", "dove", "산비둘기가 깃을 다듬는다", "Myeonggu bul giu"],
      ["戴勝降于桑", "대승강우상", "Hoopoes alight on the mulberry", "hoopoe", "후투티가 뽕나무에 내려앉는다", "Daeseung gang usang"]],
      "곡식을 살찌우는 봄비가 내림", "Gogu"],
    ["立夏", "입하", "Start of Summer", 5, 6, "summer", [
      ["螻蟈鳴", "누괵명", "Frogs begin to croak", "frog", "개구리가 울기 시작한다", "Nugoek myeong"],
      ["蚯蚓出", "구인출", "Earthworms come out", "worms", "지렁이가 땅 위로 나온다", "Gu-in chul"],
      ["王瓜生", "왕과생", "Snake gourds sprout", "gourd", "쥐참외가 돋아난다", "Wanggwa saeng"]],
      "여름이 시작됨", "Ipha"],
    ["小滿", "소만", "Grain Buds", 5, 21, "summer", [
      ["苦菜秀", "고채수", "Bitter herbs flourish", "herbs", "씀바귀가 무성하게 자란다", "Gochae su"],
      ["靡草死", "미초사", "Delicate grasses wither", "grassDry", "여린 풀이 말라 죽는다", "Micho sa"],
      ["麥秋至", "맥추지", "Barley harvest arrives", "barley", "보리 거둘 때가 온다", "Maekchu ji"]],
      "만물이 자라 차오르기 시작함", "Soman"],
    ["芒種", "망종", "Grain in Ear", 6, 6, "summer", [
      ["螳螂生", "당랑생", "Mantises hatch", "mantis", "사마귀가 알에서 깨어난다", "Dangnang saeng"],
      ["鵙始鳴", "격시명", "Shrikes begin to call", "shrike", "때까치가 울기 시작한다", "Gyeok simyeong"],
      ["反舌無聲", "반설무성", "Mockingbirds fall silent", "quietBird", "지빠귀가 울음을 그친다", "Banseol museong"]],
      "보리는 거두고 벼는 심는 때", "Mangjong"],
    ["夏至", "하지", "Summer Solstice", 6, 21, "summer", [
      ["鹿角解", "녹각해", "Deer shed their antlers", "antlers", "사슴의 뿔이 빠진다", "Nokgak hae"],
      ["蜩始鳴", "조시명", "Cicadas begin to sing", "cicada", "매미가 울기 시작한다", "Jo simyeong"],
      ["半夏生", "반하생", "Crow-dipper sprouts", "herbs", "반하(끼무릇)가 돋아난다", "Banha saeng"]],
      "낮이 가장 긴 날", "Haji"],
    ["小暑", "소서", "Minor Heat", 7, 7, "summer", [
      ["溫風至", "온풍지", "Warm winds arrive", "warmWind", "더운 바람이 불어온다", "Onpung ji"],
      ["蟋蟀居壁", "실솔거벽", "Crickets shelter in the walls", "cricketWall", "귀뚜라미가 벽 틈에 깃든다", "Silsol geobyeok"],
      ["鷹始鷙", "응시지", "Young hawks learn to hunt", "hawk", "어린 매가 사냥을 배운다", "Eung siji"]],
      "본격적인 더위가 시작됨", "Soseo"],
    ["大暑", "대서", "Major Heat", 7, 23, "summer", [
      ["腐草爲螢", "부초위형", "Rotting grass becomes fireflies", "fireflies", "썩은 풀이 반딧불이가 된다", "Bucho wihyeong"],
      ["土潤溽暑", "토윤욕서", "The earth is damp, the air sultry", "humid", "땅이 눅눅하고 날이 무덥다", "Toyun yokseo"],
      ["大雨時行", "대우시행", "Great rains sweep through", "rain", "큰비가 때때로 쏟아진다", "Dae-u sihaeng"]],
      "한 해 중 가장 더운 때", "Daeseo"],
    ["立秋", "입추", "Start of Autumn", 8, 8, "autumn", [
      ["涼風至", "양풍지", "Cool winds arrive", "coolWind", "서늘한 바람이 불어온다", "Yangpung ji"],
      ["白露降", "백로강", "White dew descends", "dew", "흰 이슬이 내린다", "Baengno gang"],
      ["寒蟬鳴", "한선명", "Autumn cicadas sing", "cicada", "쓰르라미가 운다", "Hanseon myeong"]],
      "가을이 시작됨", "Ipchu"],
    ["處暑", "처서", "End of Heat", 8, 23, "autumn", [
      ["鷹乃祭鳥", "응내제조", "Hawks lay out their prey", "hawk", "매가 잡은 새를 늘어놓는다", "Eungnae jejo"],
      ["天地始肅", "천지시숙", "Heaven and earth grow austere", "solemn", "하늘과 땅이 숙연해지기 시작한다", "Cheonji sisuk"],
      ["禾乃登", "화내등", "The grain ripens", "grain", "곡식이 여문다", "Hwa naedeung"]],
      "더위가 물러남", "Cheoseo"],
    ["白露", "백로", "White Dew", 9, 8, "autumn", [
      ["鴻雁來", "홍안래", "Wild geese arrive", "geeseS", "기러기가 날아온다", "Hong-an rae"],
      ["玄鳥歸", "현조귀", "Swallows depart", "swallows", "제비가 남쪽으로 돌아간다", "Hyeonjo gwi"],
      ["群鳥養羞", "군조양수", "Birds store up food", "birdsStore", "새들이 겨울 먹이를 모아 둔다", "Gunjo yangsu"]],
      "흰 이슬이 내리기 시작함", "Baengno"],
    ["秋分", "추분", "Autumn Equinox", 9, 23, "autumn", [
      ["雷始收聲", "뇌시수성", "Thunder lowers its voice", "thunderFade", "우레가 소리를 거두기 시작한다", "Noesi suseong"],
      ["蟄蟲坏戶", "칩충배호", "Insects seal their burrows", "burrows", "벌레가 흙으로 굴 입구를 막는다", "Chipchung baeho"],
      ["水始涸", "수시학", "Waters begin to dry", "pondDry", "물이 마르기 시작한다", "Su sihak"]],
      "밤과 낮의 길이가 같아짐", "Chubun"],
    ["寒露", "한로", "Cold Dew", 10, 8, "autumn", [
      ["鴻雁來賓", "홍안래빈", "Wild geese arrive as guests", "geeseS", "기러기가 손님처럼 찾아온다", "Hong-an raebin"],
      ["雀入大水爲蛤", "작입대수위합", "Sparrows enter the sea and become clams", "clam", "참새가 바다에 들어가 조개가 된다", "Jak ip daesu wi hap"],
      ["菊有黃華", "국유황화", "Chrysanthemums bloom yellow", "chrysanthemum", "국화가 노랗게 핀다", "Gugyu hwanghwa"]],
      "찬 이슬이 맺힘", "Hallo"],
    ["霜降", "상강", "Frost Descent", 10, 23, "autumn", [
      ["豺乃祭獸", "시내제수", "Wild dogs lay out their prey", "paws", "승냥이가 잡은 짐승을 늘어놓는다", "Sinae jesu"],
      ["草木黃落", "초목황락", "Leaves turn yellow and fall", "leavesFall", "풀과 나뭇잎이 누렇게 물들어 떨어진다", "Chomok hwangnak"],
      ["蟄蟲咸俯", "칩충함부", "Insects all lie dormant", "burrows", "벌레가 모두 겨울잠에 든다", "Chipchung hambu"]],
      "서리가 내리기 시작함", "Sanggang"],
    ["立冬", "입동", "Start of Winter", 11, 7, "winter", [
      ["水始冰", "수시빙", "Water begins to freeze", "iceForm", "물이 얼기 시작한다", "Su sibing"],
      ["地始凍", "지시동", "The earth begins to freeze", "frost", "땅이 얼기 시작한다", "Ji sidong"],
      ["雉入大水爲蜃", "치입대수위신", "Pheasants enter the sea and become clams", "clam", "꿩이 바다에 들어가 큰 조개가 된다", "Chi ip daesu wi sin"]],
      "겨울이 시작됨", "Ipdong"],
    ["小雪", "소설", "Minor Snow", 11, 22, "winter", [
      ["虹藏不見", "홍장불견", "Rainbows hide away", "overcast", "무지개가 숨어 보이지 않는다", "Hongjang bulgyeon"],
      ["天氣上升地氣下降", "천기상승지기하강", "Heaven's breath rises, earth's sinks", "qi", "하늘 기운은 오르고 땅 기운은 내려간다", "Cheon-gi sangseung jigi hagang"],
      ["閉塞而成冬", "폐색이성동", "All is closed; winter sets in", "closed", "천지가 꽉 막혀 겨울이 된다", "Pyesaek i seongdong"]],
      "첫눈이 조금 내림", "Soseol"],
    ["大雪", "대설", "Major Snow", 12, 7, "winter", [
      ["鶡鴠不鳴", "갈단불명", "The night bird falls silent", "quietBird", "갈단새가 울지 않는다", "Galdan bulmyeong"],
      ["虎始交", "호시교", "Tigers begin to court", "paws", "호랑이가 짝짓기를 시작한다", "Ho sigyo"],
      ["荔挺出", "여정출", "Irises push up shoots", "iris", "타래붓꽃이 싹을 내민다", "Yeo jeongchul"]],
      "눈이 많이 내림", "Daeseol"],
    ["冬至", "동지", "Winter Solstice", 12, 22, "winter", [
      ["蚯蚓結", "구인결", "Earthworms knot together", "wormKnot", "지렁이가 땅속에서 서로 엉킨다", "Gu-in gyeol"],
      ["麋角解", "미각해", "Elk shed their antlers", "antlers", "고라니의 뿔이 빠진다", "Migak hae"],
      ["水泉動", "수천동", "Frozen springs begin to stir", "springWater", "얼었던 샘물이 움직이기 시작한다", "Sucheon dong"]],
      "밤이 가장 긴 날", "Dongji"],
  ],
};
