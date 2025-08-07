import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MyInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentLanguage } = useLanguage();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const translations = {
    en: {
      title: "Football at CS SPORT",
      welcome: "Welcome to CS SPORT – your ultimate destination for everything Football! Stay on top of the action with live scores from over 1,000 competitions worldwide, including today's hottest matches from the UEFA Champions League Qualifiers, UEFA Champions League, and the Premier League.",
      exploreTitle: "Explore Your Favorite Teams & Players",
      exploreText: "Want to know how FC Barcelona, Real Madrid, or Manchester United are doing? Dive into the latest results, upcoming fixtures, league standings, breaking news, match highlights, and in-depth stats for top stars like Lionel Messi, Cristiano Ronaldo, and Lamine Yamal.",
      whyChooseTitle: "Why Choose CS SPORT?",
      allInOne: "All-in-One Platform: Get the latest news, fixtures, standings, results, and live scores for leagues, cups, and tournaments around the globe.",
      trackFavorites: "Track Your Favorites: Follow your teams and players, and never miss a moment. Smart Predictions: Use our insights and tips to make better Football predictions and outsmart your friends!",
      smartPredictions: "Smart Predictions: Use our insights and tips to make better Football predictions and outsmart your friends.",
      readyText: "Ready to experience Football like never before?",
      startExploring: "Start exploring now and join the CS SPORT community!",
      footballInfo: "Football Info",
      showLess: "Show Less",
      faqTitle: "Football FAQ",
      whoInvented: "Who invented Football?",
      whoInventedAnswer: "Football's roots go way back! While ball games have been played for centuries across the world, the modern game was shaped in England in the 19th century. The English Football Association set the official rules in 1863, giving us the Football we know and love today.",
      whereInvented: "Where was Football invented?",
      whereInventedAnswer: "The modern version of Football was born in England. Although similar games existed globally, it was in England where the rules were standardized, making it the home of modern Football.",
      pitchLength: "What is the length of a Football pitch?",
      pitchLengthAnswer: "Great question! A standard Football pitch is rectangular, ranging from 90–120 meters in length and 45–90 meters in width, as set by the International Football Association Board (IFAB). These dimensions are used for professional and international matches.",
      bestPlayer: "Who is the best Football player in the world?",
      bestPlayerAnswer: "This is always up for debate! Legends like Pelé, Diego Maradona, Lionel Messi, and Cristiano Ronaldo have all left their mark. Each has a unique style and legacy, so the \"best\" often depends on who you ask!",
      moreFun: "Want more Football fun?",
      moreFunAnswer: "Check out live stats, highlights, and join the conversation with fans worldwide – only on",
      csSport: "CS SPORT! 🚀"
    },
    es: {
      title: "Fútbol en CS SPORT",
      welcome: "¡Bienvenido a CS SPORT: tu destino definitivo para todo lo relacionado con el fútbol! Mantente al día con marcadores en vivo de más de 1,000 competiciones mundiales, incluyendo los partidos más emocionantes de hoy de las Clasificatorias de la UEFA Champions League, UEFA Champions League y la Premier League.",
      exploreTitle: "Explora Tus Equipos y Jugadores Favoritos",
      exploreText: "¿Quieres saber cómo están FC Barcelona, Real Madrid o Manchester United? Sumérgete en los últimos resultados, próximos partidos, clasificaciones de liga, noticias de última hora, resúmenes de partidos y estadísticas detalladas de las mejores estrellas como Lionel Messi, Cristiano Ronaldo y Lamine Yamal.",
      whyChooseTitle: "¿Por Qué Elegir CS SPORT?",
      allInOne: "Plataforma Todo-en-Uno: Obtén las últimas noticias, partidos, clasificaciones, resultados y marcadores en vivo de ligas, copas y torneos de todo el mundo.",
      trackFavorites: "Sigue a Tus Favoritos: Sigue a tus equipos y jugadores, y nunca te pierdas un momento. Predicciones Inteligentes: ¡Usa nuestras ideas y consejos para hacer mejores predicciones de fútbol y superar a tus amigos!",
      smartPredictions: "Predicciones Inteligentes: ¡Usa nuestras ideas y consejos para hacer mejores predicciones de fútbol y superar a tus amigos!",
      readyText: "¿Listo para experimentar el fútbol como nunca antes?",
      startExploring: "¡Comienza a explorar ahora y únete a la comunidad de CS SPORT!",
      footballInfo: "Info de Fútbol",
      showLess: "Mostrar Menos",
      faqTitle: "Preguntas Frecuentes de Fútbol",
      whoInvented: "¿Quién inventó el fútbol?",
      whoInventedAnswer: "¡Las raíces del fútbol se remontan muy atrás! Aunque los juegos de pelota se han jugado durante siglos en todo el mundo, el juego moderno se formó en Inglaterra en el siglo XIX. La Asociación Inglesa de Fútbol estableció las reglas oficiales en 1863, dándonos el fútbol que conocemos y amamos hoy.",
      whereInvented: "¿Dónde se inventó el fútbol?",
      whereInventedAnswer: "La versión moderna del fútbol nació en Inglaterra. Aunque existían juegos similares globalmente, fue en Inglaterra donde se estandarizaron las reglas, convirtiéndola en el hogar del fútbol moderno.",
      pitchLength: "¿Cuál es la longitud de un campo de fútbol?",
      pitchLengthAnswer: "¡Gran pregunta! Un campo de fútbol estándar es rectangular, con un rango de 90-120 metros de largo y 45-90 metros de ancho, según lo establecido por la Junta Internacional de Asociaciones de Fútbol (IFAB). Estas dimensiones se usan para partidos profesionales e internacionales.",
      bestPlayer: "¿Quién es el mejor jugador de fútbol del mundo?",
      bestPlayerAnswer: "¡Esto siempre está en debate! Leyendas como Pelé, Diego Maradona, Lionel Messi y Cristiano Ronaldo han dejado su huella. Cada uno tiene un estilo único y un legado, así que el \"mejor\" a menudo depende de a quién le preguntes!",
      moreFun: "¿Quieres más diversión futbolística?",
      moreFunAnswer: "Revisa estadísticas en vivo, resúmenes y únete a la conversación con fanáticos de todo el mundo, solo en",
      csSport: "¡CS SPORT! 🚀"
    },
    "zh-hk": {
      title: "CS SPORT 足球",
      welcome: "歡迎來到 CS SPORT - 您足球的終極目的地！透過超過 1,000 項全球賽事的即時比分保持領先，包括今日最熱門的歐洲冠軍聯賽外圍賽、歐洲冠軍聯賽和英格蘭超級聯賽比賽。",
      exploreTitle: "探索您最愛的球隊和球員",
      exploreText: "想知道巴塞隆納、皇家馬德里或曼聯的表現如何？深入了解最新結果、即將到來的賽程、聯賽積分榜、突發新聞、比賽精華，以及頂級球星如梅西、C羅和拉明·亞馬爾的深度統計。",
      whyChooseTitle: "為什麼選擇 CS SPORT？",
      allInOne: "一站式平台：獲得全球聯賽、盃賽和錦標賽的最新新聞、賽程、積分榜、結果和即時比分。",
      trackFavorites: "追蹤您的最愛：關注您的球隊和球員，永不錯過任何時刻。智能預測：使用我們的洞察和技巧做出更好的足球預測並超越您的朋友！",
      smartPredictions: "智能預測：使用我們的洞察和技巧做出更好的足球預測並超越您的朋友！",
      readyText: "準備以前所未有的方式體驗足球了嗎？",
      startExploring: "立即開始探索並加入 CS SPORT 社群！",
      footballInfo: "足球資訊",
      showLess: "顯示較少",
      faqTitle: "足球常見問題",
      whoInvented: "誰發明了足球？",
      whoInventedAnswer: "足球的根源可以追溯到很久以前！雖然球類遊戲在世界各地已經進行了幾個世紀，但現代足球是在19世紀的英格蘭形成的。英格蘭足球協會在1863年制定了官方規則，給了我們今天所知道和熱愛的足球。",
      whereInvented: "足球是在哪裡發明的？",
      whereInventedAnswer: "現代版本的足球誕生於英格蘭。雖然全球存在類似的遊戲，但正是在英格蘭標準化了規則，使其成為現代足球的故鄉。",
      pitchLength: "足球場的長度是多少？",
      pitchLengthAnswer: "好問題！標準足球場是矩形的，長度範圍從90-120米，寬度45-90米，由國際足球協會理事會（IFAB）設定。這些尺寸用於專業和國際比賽。",
      bestPlayer: "誰是世界上最好的足球運動員？",
      bestPlayerAnswer: "這總是有爭議的！像比利、馬拉多納、梅西和C羅這樣的傳奇人物都留下了他們的印記。每個人都有獨特的風格和遺產，所以"最好"往往取決於您問誰！",
      moreFun: "想要更多足球樂趣嗎？",
      moreFunAnswer: "查看即時統計、精華，並與全世界的球迷一起對話，只在",
      csSport: "CS SPORT！🚀"
    },
    zh: {
      title: "CS SPORT 足球",
      welcome: "欢迎来到 CS SPORT - 您足球的终极目的地！通过超过 1,000 项全球赛事的实时比分保持领先，包括今日最热门的欧洲冠军联赛外围赛、欧洲冠军联赛和英格兰超级联赛比赛。",
      exploreTitle: "探索您最爱的球队和球员",
      exploreText: "想知道巴塞罗那、皇家马德里或曼联的表现如何？深入了解最新结果、即将到来的赛程、联赛积分榜、突发新闻、比赛精华，以及顶级球星如梅西、C罗和拉明·亚马尔的深度统计。",
      whyChooseTitle: "为什么选择 CS SPORT？",
      allInOne: "一站式平台：获得全球联赛、杯赛和锦标赛的最新新闻、赛程、积分榜、结果和实时比分。",
      trackFavorites: "追踪您的最爱：关注您的球队和球员，永不错过任何时刻。智能预测：使用我们的洞察和技巧做出更好的足球预测并超越您的朋友！",
      smartPredictions: "智能预测：使用我们的洞察和技巧做出更好的足球预测并超越您的朋友！",
      readyText: "准备以前所未有的方式体验足球了吗？",
      startExploring: "立即开始探索并加入 CS SPORT 社群！",
      footballInfo: "足球信息",
      showLess: "显示较少",
      faqTitle: "足球常见问题",
      whoInvented: "谁发明了足球？",
      whoInventedAnswer: "足球的根源可以追溯到很久以前！虽然球类游戏在世界各地已经进行了几个世纪，但现代足球是在19世纪的英格兰形成的。英格兰足球协会在1863年制定了官方规则，给了我们今天所知道和热爱的足球。",
      whereInvented: "足球是在哪里发明的？",
      whereInventedAnswer: "现代版本的足球诞生于英格兰。虽然全球存在类似的游戏，但正是在英格兰标准化了规则，使其成为现代足球的故乡。",
      pitchLength: "足球场的长度是多少？",
      pitchLengthAnswer: "好问题！标准足球场是矩形的，长度范围从90-120米，宽度45-90米，由国际足球协会理事会（IFAB）设定。这些尺寸用于专业和国际比赛。",
      bestPlayer: "谁是世界上最好的足球运动员？",
      bestPlayerAnswer: "这总是有争议的！像贝利、马拉多纳、梅西和C罗这样的传奇人物都留下了他们的印记。每个人都有独特的风格和遗产，所以"最好"往往取决于您问谁！",
      moreFun: "想要更多足球乐趣吗？",
      moreFunAnswer: "查看实时统计、精华，并与全世界的球迷一起对话，只在",
      csSport: "CS SPORT！🚀"
    },
    de: {
      title: "Fußball bei CS SPORT",
      welcome: "Willkommen bei CS SPORT – Ihrem ultimativen Ziel für alles rund um den Fußball! Bleiben Sie mit Live-Ergebnissen von über 1.000 weltweiten Wettbewerben auf dem Laufenden, einschließlich der heutigen heißesten Spiele aus den UEFA Champions League Qualifikationen, UEFA Champions League und der Premier League.",
      exploreTitle: "Entdecken Sie Ihre Lieblingsteams und -spieler",
      exploreText: "Möchten Sie wissen, wie es dem FC Barcelona, Real Madrid oder Manchester United geht? Tauchen Sie ein in die neuesten Ergebnisse, anstehende Begegnungen, Ligatabellen, aktuelle Nachrichten, Spielhöhepunkte und detaillierte Statistiken zu Topstars wie Lionel Messi, Cristiano Ronaldo und Lamine Yamal.",
      whyChooseTitle: "Warum CS SPORT wählen?",
      allInOne: "Alles-in-einem-Plattform: Erhalten Sie die neuesten Nachrichten, Spiele, Tabellen, Ergebnisse und Live-Ergebnisse von Ligen, Pokalen und Turnieren weltweit.",
      trackFavorites: "Verfolgen Sie Ihre Favoriten: Folgen Sie Ihren Teams und Spielern und verpassen Sie nie einen Moment. Intelligente Vorhersagen: Nutzen Sie unsere Einblicke und Tipps, um bessere Fußballvorhersagen zu treffen und Ihre Freunde zu übertreffen!",
      smartPredictions: "Intelligente Vorhersagen: Nutzen Sie unsere Einblicke und Tipps, um bessere Fußballvorhersagen zu treffen und Ihre Freunde zu übertreffen!",
      readyText: "Bereit, Fußball wie nie zuvor zu erleben?",
      startExploring: "Beginnen Sie jetzt zu erkunden und treten Sie der CS SPORT-Community bei!",
      footballInfo: "Fußball Info",
      showLess: "Weniger anzeigen",
      faqTitle: "Fußball FAQ",
      whoInvented: "Wer hat den Fußball erfunden?",
      whoInventedAnswer: "Die Wurzeln des Fußballs reichen weit zurück! Während Ballspiele jahrhundertelang auf der ganzen Welt gespielt wurden, wurde das moderne Spiel im 19. Jahrhundert in England geprägt. Der englische Fußballverband stellte 1863 die offiziellen Regeln auf und gab uns den Fußball, den wir heute kennen und lieben.",
      whereInvented: "Wo wurde der Fußball erfunden?",
      whereInventedAnswer: "Die moderne Version des Fußballs wurde in England geboren. Obwohl ähnliche Spiele global existierten, war es in England, wo die Regeln standardisiert wurden, was es zur Heimat des modernen Fußballs macht.",
      pitchLength: "Wie lang ist ein Fußballplatz?",
      pitchLengthAnswer: "Tolle Frage! Ein Standard-Fußballplatz ist rechteckig und reicht von 90-120 Meter Länge und 45-90 Meter Breite, wie vom International Football Association Board (IFAB) festgelegt. Diese Dimensionen werden für professionelle und internationale Spiele verwendet.",
      bestPlayer: "Wer ist der beste Fußballspieler der Welt?",
      bestPlayerAnswer: "Das steht immer zur Debatte! Legenden wie Pelé, Diego Maradona, Lionel Messi und Cristiano Ronaldo haben alle ihre Spuren hinterlassen. Jeder hat einen einzigartigen Stil und ein Vermächtnis, also hängt der \"Beste\" oft davon ab, wen Sie fragen!",
      moreFun: "Möchten Sie mehr Fußballspaß?",
      moreFunAnswer: "Schauen Sie sich Live-Statistiken, Höhepunkte an und nehmen Sie am Gespräch mit Fans weltweit teil – nur auf",
      csSport: "CS SPORT! 🚀"
    },
    it: {
      title: "Calcio su CS SPORT",
      welcome: "Benvenuto su CS SPORT – la tua destinazione definitiva per tutto ciò che riguarda il calcio! Rimani aggiornato con i punteggi in diretta di oltre 1.000 competizioni mondiali, incluse le partite più calde di oggi dalle Qualificazioni UEFA Champions League, UEFA Champions League e Premier League.",
      exploreTitle: "Esplora le Tue Squadre e Giocatori Preferiti",
      exploreText: "Vuoi sapere come stanno andando FC Barcelona, Real Madrid o Manchester United? Immergiti nei risultati più recenti, prossimi incontri, classifiche di campionato, ultime notizie, highlights delle partite e statistiche approfondite delle migliori stelle come Lionel Messi, Cristiano Ronaldo e Lamine Yamal.",
      whyChooseTitle: "Perché Scegliere CS SPORT?",
      allInOne: "Piattaforma Tutto-in-Uno: Ottieni le ultime notizie, partite, classifiche, risultati e punteggi in diretta di campionati, coppe e tornei di tutto il mondo.",
      trackFavorites: "Segui i Tuoi Preferiti: Segui le tue squadre e giocatori, e non perdere mai un momento. Previsioni Intelligenti: Usa i nostri approfondimenti e consigli per fare migliori previsioni calcistiche e battere i tuoi amici!",
      smartPredictions: "Previsioni Intelligenti: Usa i nostri approfondimenti e consigli per fare migliori previsioni calcistiche e battere i tuoi amici!",
      readyText: "Pronto a vivere il calcio come mai prima d'ora?",
      startExploring: "Inizia a esplorare ora e unisciti alla comunità CS SPORT!",
      footballInfo: "Info Calcio",
      showLess: "Mostra Meno",
      faqTitle: "FAQ Calcio",
      whoInvented: "Chi ha inventato il calcio?",
      whoInventedAnswer: "Le radici del calcio risalgono a molto tempo fa! Mentre i giochi con la palla sono stati giocati per secoli in tutto il mondo, il gioco moderno è stato plasmato in Inghilterra nel 19° secolo. La Football Association inglese stabilì le regole ufficiali nel 1863, dandoci il calcio che conosciamo e amiamo oggi.",
      whereInvented: "Dove è stato inventato il calcio?",
      whereInventedAnswer: "La versione moderna del calcio è nata in Inghilterra. Anche se giochi simili esistevano globalmente, fu in Inghilterra dove le regole furono standardizzate, rendendola la casa del calcio moderno.",
      pitchLength: "Qual è la lunghezza di un campo da calcio?",
      pitchLengthAnswer: "Ottima domanda! Un campo da calcio standard è rettangolare, con una lunghezza che varia da 90-120 metri e una larghezza di 45-90 metri, come stabilito dall'International Football Association Board (IFAB). Queste dimensioni sono utilizzate per le partite professionali e internazionali.",
      bestPlayer: "Chi è il miglior giocatore di calcio al mondo?",
      bestPlayerAnswer: "Questo è sempre oggetto di dibattito! Leggende come Pelé, Diego Maradona, Lionel Messi e Cristiano Ronaldo hanno tutti lasciato il loro segno. Ognuno ha uno stile unico e un'eredità, quindi il \"migliore\" spesso dipende da chi chiedi!",
      moreFun: "Vuoi più divertimento calcistico?",
      moreFunAnswer: "Controlla statistiche in diretta, highlights e unisciti alla conversazione con i fan di tutto il mondo – solo su",
      csSport: "CS SPORT! 🚀"
    },
    pt: {
      title: "Futebol no CS SPORT",
      welcome: "Bem-vindo ao CS SPORT – seu destino definitivo para tudo sobre futebol! Fique por dentro da ação com placares ao vivo de mais de 1.000 competições mundiais, incluindo os jogos mais quentes de hoje das Eliminatórias da UEFA Champions League, UEFA Champions League e Premier League.",
      exploreTitle: "Explore Seus Times e Jogadores Favoritos",
      exploreText: "Quer saber como estão o FC Barcelona, Real Madrid ou Manchester United? Mergulhe nos resultados mais recentes, próximos jogos, tabelas de classificação, notícias de última hora, melhores momentos dos jogos e estatísticas detalhadas das maiores estrelas como Lionel Messi, Cristiano Ronaldo e Lamine Yamal.",
      whyChooseTitle: "Por Que Escolher o CS SPORT?",
      allInOne: "Plataforma Tudo-em-Um: Obtenha as últimas notícias, jogos, tabelas, resultados e placares ao vivo de ligas, copas e torneios ao redor do globo.",
      trackFavorites: "Acompanhe Seus Favoritos: Siga seus times e jogadores, e nunca perca um momento. Previsões Inteligentes: Use nossas percepções e dicas para fazer melhores previsões de futebol e superar seus amigos!",
      smartPredictions: "Previsões Inteligentes: Use nossas percepções e dicas para fazer melhores previsões de futebol e superar seus amigos!",
      readyText: "Pronto para experimentar o futebol como nunca antes?",
      startExploring: "Comece a explorar agora e junte-se à comunidade CS SPORT!",
      footballInfo: "Info Futebol",
      showLess: "Mostrar Menos",
      faqTitle: "FAQ Futebol",
      whoInvented: "Quem inventou o futebol?",
      whoInventedAnswer: "As raízes do futebol remontam há muito tempo! Enquanto jogos de bola têm sido jogados por séculos ao redor do mundo, o jogo moderno foi moldado na Inglaterra no século 19. A Associação Inglesa de Futebol estabeleceu as regras oficiais em 1863, nos dando o futebol que conhecemos e amamos hoje.",
      whereInvented: "Onde o futebol foi inventado?",
      whereInventedAnswer: "A versão moderna do futebol nasceu na Inglaterra. Embora jogos similares existissem globalmente, foi na Inglaterra onde as regras foram padronizadas, tornando-a o lar do futebol moderno.",
      pitchLength: "Qual é o comprimento de um campo de futebol?",
      pitchLengthAnswer: "Ótima pergunta! Um campo de futebol padrão é retangular, variando de 90-120 metros de comprimento e 45-90 metros de largura, conforme estabelecido pela International Football Association Board (IFAB). Essas dimensões são usadas para jogos profissionais e internacionais.",
      bestPlayer: "Quem é o melhor jogador de futebol do mundo?",
      bestPlayerAnswer: "Isso sempre está em debate! Lendas como Pelé, Diego Maradona, Lionel Messi e Cristiano Ronaldo deixaram sua marca. Cada um tem um estilo único e legado, então o \"melhor\" frequentemente depende de quem você pergunta!",
      moreFun: "Quer mais diversão futebolística?",
      moreFunAnswer: "Confira estatísticas ao vivo, destaques e junte-se à conversa com fãs ao redor do mundo – apenas no",
      csSport: "CS SPORT! 🚀"
    }
  };

  const t = translations[currentLanguage as keyof typeof translations] || translations.en;

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-sm font-semibold -mb-2 -mt-2 text-gray-900 dark:text-white">
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="text-xs text-gray-700 dark:text-white space-y-3 px-6 pb-0">
          <p>
            {t.welcome}
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-xs">
                {t.exploreTitle}
              </h3>
              <p className="text-xs text-gray-600 dark:text-white">
                {t.exploreText}
              </p>
            </div>
          </div>

          <div className="">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              {t.whyChooseTitle}
            </h3>
            <p className="text-xs text-gray-600 dark:text-white">
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {t.allInOne}
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {t.trackFavorites}
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-600 dark:bg-white rounded-full mr-3"></span>
                {t.smartPredictions}
              </li>
              
            </p>
            <div>
              <p className="text-xs text-gray-600 dark:text-white mt-2">
                {t.readyText}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-12 text-sm">
                {t.startExploring}
              </h3>

              {/* Toggle Button - Full Width - Only show when collapsed */}
              {!isExpanded && (
                <div className="-mx-6">
                  <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <span>{t.footballInfo}</span>
                    <ChevronDown size={18} />
                  </button>
                </div>
              )}

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="space-y-4 -mx-6">
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm px-6">
                    {t.faqTitle}
                  </h3>

                  <div className="text-xs text-gray-600 dark:text-white space-y-3 px-6">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.whoInvented}
                      </h3>
                      <p>
                        {t.whoInventedAnswer}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.whereInvented}
                      </h3>
                      <p>
                        {t.whereInventedAnswer}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.pitchLength}
                      </h3>
                      <p>
                        {t.pitchLengthAnswer}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.bestPlayer}
                      </h3>
                      <p>
                        {t.bestPlayerAnswer}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.moreFun}
                      </h3>
                      <p>
                        {t.moreFunAnswer}
                      </p>
                      <h3 className="font-medium text-gray-800 dark:text-white my-2 text-xs">
                        {t.csSport}
                      </h3>
                    </div>
                  </div>

                  {/* Show Less Button at the bottom */}
                  <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 -mb-6"
                  >
                    <span>{t.showLess}</span>
                    <ChevronUp size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyInfo;
