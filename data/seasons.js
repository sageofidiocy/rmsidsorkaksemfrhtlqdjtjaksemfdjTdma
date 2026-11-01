/* 24 solar terms (절기 節氣) × 3 pentads (후 候) = the 72 micro-seasons (칠십이후 七十二候).
   Each term: [hanja, hangul, English, month, approx. start day, season, [[hanja, hangul, English, scene], ×3]]
   Start dates are approximate (they shift by about a day year to year). Pentads begin every 5 days. */
window.SEASONS = {
  NAMES: { spring: ['春', '봄', 'Spring'], summer: ['夏', '여름', 'Summer'], autumn: ['秋', '가을', 'Autumn'], winter: ['冬', '겨울', 'Winter'] },
  JEOLGI: [
    ['小寒', '소한', 'Minor Cold', 1, 6, 'winter', [['雁北鄕', '안북향', 'Wild geese turn north', 'geeseN'], ['鵲始巢', '작시소', 'Magpies begin to nest', 'magpie'], ['雉始雊', '치시구', 'Pheasants begin to call', 'pheasant']]],
    ['大寒', '대한', 'Major Cold', 1, 20, 'winter', [['雞始乳', '계시유', 'Hens begin to lay', 'hen'], ['征鳥厲疾', '정조려질', 'Birds of prey fly swift and fierce', 'raptor'], ['水澤腹堅', '수택복견', 'Lakes and marshes freeze solid', 'lakeIce']]],
    ['立春', '입춘', 'Start of Spring', 2, 4, 'spring', [['東風解凍', '동풍해동', 'The east wind thaws the ice', 'thaw'], ['蟄蟲始振', '칩충시진', 'Hibernating insects begin to stir', 'insects'], ['魚陟負冰', '어척부빙', 'Fish rise, carrying ice on their backs', 'fishIce']]],
    ['雨水', '우수', 'Rain Water', 2, 19, 'spring', [['獺祭魚', '달제어', 'Otters lay out their fish', 'otterFish'], ['鴻雁來', '홍안래', 'Wild geese return', 'geeseN'], ['草木萌動', '초목맹동', 'Grass and trees begin to sprout', 'sprouts']]],
    ['驚蟄', '경칩', 'Awakening of Insects', 3, 6, 'spring', [['桃始華', '도시화', 'Peach trees begin to bloom', 'peach'], ['倉庚鳴', '창경명', 'Orioles sing', 'oriole'], ['鷹化爲鳩', '응화위구', 'Hawks turn into doves', 'dove']]],
    ['春分', '춘분', 'Spring Equinox', 3, 21, 'spring', [['玄鳥至', '현조지', 'Swallows arrive', 'swallows'], ['雷乃發聲', '뇌내발성', 'Thunder raises its voice', 'thunder'], ['始電', '시전', 'Lightning first flashes', 'lightning']]],
    ['淸明', '청명', 'Clear and Bright', 4, 5, 'spring', [['桐始華', '동시화', 'Paulownia trees begin to bloom', 'paulownia'], ['田鼠化爲鴽', '전서화위여', 'Field mice turn into quail', 'quail'], ['虹始見', '홍시견', 'Rainbows first appear', 'rainbow']]],
    ['穀雨', '곡우', 'Grain Rain', 4, 20, 'spring', [['萍始生', '평시생', 'Duckweed begins to grow', 'duckweed'], ['鳴鳩拂其羽', '명구불기우', 'Turtledoves preen their feathers', 'dove'], ['戴勝降于桑', '대승강우상', 'Hoopoes alight on the mulberry', 'hoopoe']]],
    ['立夏', '입하', 'Start of Summer', 5, 6, 'summer', [['螻蟈鳴', '누괵명', 'Frogs begin to croak', 'frog'], ['蚯蚓出', '구인출', 'Earthworms come out', 'worms'], ['王瓜生', '왕과생', 'Snake gourds sprout', 'gourd']]],
    ['小滿', '소만', 'Grain Buds', 5, 21, 'summer', [['苦菜秀', '고채수', 'Bitter herbs flourish', 'herbs'], ['靡草死', '미초사', 'Delicate grasses wither', 'grassDry'], ['麥秋至', '맥추지', 'Barley harvest arrives', 'barley']]],
    ['芒種', '망종', 'Grain in Ear', 6, 6, 'summer', [['螳螂生', '당랑생', 'Mantises hatch', 'mantis'], ['鵙始鳴', '격시명', 'Shrikes begin to call', 'shrike'], ['反舌無聲', '반설무성', 'Mockingbirds fall silent', 'quietBird']]],
    ['夏至', '하지', 'Summer Solstice', 6, 21, 'summer', [['鹿角解', '녹각해', 'Deer shed their antlers', 'antlers'], ['蜩始鳴', '조시명', 'Cicadas begin to sing', 'cicada'], ['半夏生', '반하생', 'Crow-dipper sprouts', 'herbs']]],
    ['小暑', '소서', 'Minor Heat', 7, 7, 'summer', [['溫風至', '온풍지', 'Warm winds arrive', 'warmWind'], ['蟋蟀居壁', '실솔거벽', 'Crickets shelter in the walls', 'cricketWall'], ['鷹始鷙', '응시지', 'Young hawks learn to hunt', 'hawk']]],
    ['大暑', '대서', 'Major Heat', 7, 23, 'summer', [['腐草爲螢', '부초위형', 'Rotting grass becomes fireflies', 'fireflies'], ['土潤溽暑', '토윤욕서', 'The earth is damp, the air sultry', 'humid'], ['大雨時行', '대우시행', 'Great rains sweep through', 'rain']]],
    ['立秋', '입추', 'Start of Autumn', 8, 8, 'autumn', [['涼風至', '양풍지', 'Cool winds arrive', 'coolWind'], ['白露降', '백로강', 'White dew descends', 'dew'], ['寒蟬鳴', '한선명', 'Autumn cicadas sing', 'cicada']]],
    ['處暑', '처서', 'End of Heat', 8, 23, 'autumn', [['鷹乃祭鳥', '응내제조', 'Hawks lay out their prey', 'hawk'], ['天地始肅', '천지시숙', 'Heaven and earth grow austere', 'solemn'], ['禾乃登', '화내등', 'The grain ripens', 'grain']]],
    ['白露', '백로', 'White Dew', 9, 8, 'autumn', [['鴻雁來', '홍안래', 'Wild geese arrive', 'geeseS'], ['玄鳥歸', '현조귀', 'Swallows depart', 'swallows'], ['群鳥養羞', '군조양수', 'Birds store up food', 'birdsStore']]],
    ['秋分', '추분', 'Autumn Equinox', 9, 23, 'autumn', [['雷始收聲', '뇌시수성', 'Thunder lowers its voice', 'thunderFade'], ['蟄蟲坏戶', '칩충배호', 'Insects seal their burrows', 'burrows'], ['水始涸', '수시학', 'Waters begin to dry', 'pondDry']]],
    ['寒露', '한로', 'Cold Dew', 10, 8, 'autumn', [['鴻雁來賓', '홍안래빈', 'Wild geese arrive as guests', 'geeseS'], ['雀入大水爲蛤', '작입대수위합', 'Sparrows enter the sea and become clams', 'clam'], ['菊有黃華', '국유황화', 'Chrysanthemums bloom yellow', 'chrysanthemum']]],
    ['霜降', '상강', 'Frost Descent', 10, 23, 'autumn', [['豺乃祭獸', '시내제수', 'Wild dogs lay out their prey', 'paws'], ['草木黃落', '초목황락', 'Leaves turn yellow and fall', 'leavesFall'], ['蟄蟲咸俯', '칩충함부', 'Insects all lie dormant', 'burrows']]],
    ['立冬', '입동', 'Start of Winter', 11, 7, 'winter', [['水始冰', '수시빙', 'Water begins to freeze', 'iceForm'], ['地始凍', '지시동', 'The earth begins to freeze', 'frost'], ['雉入大水爲蜃', '치입대수위신', 'Pheasants enter the sea and become clams', 'clam']]],
    ['小雪', '소설', 'Minor Snow', 11, 22, 'winter', [['虹藏不見', '홍장불견', 'Rainbows hide away', 'overcast'], ['天氣上升地氣下降', '천기상승지기하강', "Heaven's breath rises, earth's sinks", 'qi'], ['閉塞而成冬', '폐색이성동', 'All is closed; winter sets in', 'closed']]],
    ['大雪', '대설', 'Major Snow', 12, 7, 'winter', [['鶡鴠不鳴', '갈단불명', 'The night bird falls silent', 'quietBird'], ['虎始交', '호시교', 'Tigers begin to court', 'paws'], ['荔挺出', '여정출', 'Irises push up shoots', 'iris']]],
    ['冬至', '동지', 'Winter Solstice', 12, 22, 'winter', [['蚯蚓結', '구인결', 'Earthworms knot together', 'wormKnot'], ['麋角解', '미각해', 'Elk shed their antlers', 'antlers'], ['水泉動', '수천동', 'Frozen springs begin to stir', 'springWater']]],
  ],
};
