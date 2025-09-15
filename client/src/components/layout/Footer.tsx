
import React from 'react';
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  // Footer-specific translations
  const footerTranslations = {
    companyName: {
      en: 'CS SPORT',
      'zh-hk': 'CS體育',
      'zh-tw': 'CS體育',
      zh: 'CS体育',
      es: 'CS SPORT',
      de: 'CS SPORT',
      it: 'CS SPORT',
      pt: 'CS SPORT'
    },
    description: {
      en: 'is the fastest, most accurate online live scores service, serving over 100 million fans worldwide since 2012. Our Football coverage includes latest news, fixtures & results, standings, statistics and live match updates of competitions from all over the world including FIFA Club World Cup, UEFA WC Qualification, UEFA Champions League, Premier League and La Liga',
      'zh-hk': '是最快速、最準確的網上即時比分服務，自2012年以來為全球超過1億球迷提供服務。我們的足球覆蓋包括最新新聞、賽程和結果、積分榜、統計數據以及來自世界各地賽事的即時比賽更新，包括FIFA世界冠軍球會盃、歐洲足協世界盃外圍賽、歐洲冠軍聯賽、英超聯賽和西甲聯賽',
      'zh-tw': '是最快速、最準確的網上即時比分服務，自2012年以來為全球超過1億球迷提供服務。我們的足球覆蓋包括最新新聞、賽程和結果、積分榜、統計數據以及來自世界各地賽事的即時比賽更新，包括FIFA世界冠軍球會盃、歐洲足協世界盃外圍賽、歐洲冠軍聯賽、英超聯賽和西甲聯賽',
      zh: '是最快速、最准确的在线实时比分服务，自2012年以来为全球超过1亿球迷提供服务。我们的足球覆盖包括最新新闻、赛程和结果、积分榜、统计数据以及来自世界各地赛事的实时比赛更新，包括FIFA世界俱乐部杯、欧足联世界杯预选赛、欧洲冠军联赛、英超联赛和西甲联赛',
      es: 'es el servicio de resultados en vivo más rápido y preciso, sirviendo a más de 100 millones de fanáticos en todo el mundo desde 2012. Nuestra cobertura de fútbol incluye las últimas noticias, partidos y resultados, clasificaciones, estadísticas y actualizaciones en vivo de competiciones de todo el mundo, incluyendo la Copa Mundial de Clubes FIFA, Clasificación al Mundial UEFA, Liga de Campeones UEFA, Premier League y La Liga',
      de: 'ist der schnellste und genaueste Online-Live-Score-Service, der seit 2012 über 100 Millionen Fans weltweit bedient. Unsere Fußballberichterstattung umfasst aktuelle Nachrichten, Spielpläne und Ergebnisse, Tabellen, Statistiken und Live-Match-Updates von Wettbewerben aus der ganzen Welt, einschließlich FIFA Club World Cup, UEFA WM-Qualifikation, UEFA Champions League, Premier League und La Liga',
      it: 'è il servizio di punteggi live online più veloce e accurato, che serve oltre 100 milioni di tifosi in tutto il mondo dal 2012. La nostra copertura calcistica include ultime notizie, partite e risultati, classifiche, statistiche e aggiornamenti live delle partite di competizioni da tutto il mondo, inclusi FIFA Club World Cup, Qualificazioni Mondiali UEFA, UEFA Champions League, Premier League e La Liga',
      pt: 'é o serviço de resultados ao vivo online mais rápido e preciso, servindo mais de 100 milhões de fãs em todo o mundo desde 2012. Nossa cobertura de futebol inclui últimas notícias, jogos e resultados, classificações, estatísticas e atualizações ao vivo de competições de todo o mundo, incluindo Copa do Mundo de Clubes FIFA, Eliminatórias da Copa do Mundo UEFA, Liga dos Campeões UEFA, Premier League e La Liga'
    },
    about: {
      en: 'About',
      'zh-hk': '關於我們',
      'zh-tw': '關於我們',
      zh: '关于我们',
      es: 'Acerca de',
      de: 'Über uns',
      it: 'Chi siamo',
      pt: 'Sobre'
    },
    contactUs: {
      en: 'Contact Us',
      'zh-hk': '聯絡我們',
      'zh-tw': '聯絡我們',
      zh: '联系我们',
      es: 'Contáctanos',
      de: 'Kontakt',
      it: 'Contattaci',
      pt: 'Entre em contato'
    },
    sportsOnTv: {
      en: 'Sports On TV Today',
      'zh-hk': '今日體育電視節目',
      'zh-tw': '今日體育電視節目',
      zh: '今日体育电视节目',
      es: 'Deportes en TV Hoy',
      de: 'Sport im TV Heute',
      it: 'Sport in TV Oggi',
      pt: 'Esportes na TV Hoje'
    },
    privacyPolicy: {
      en: 'Privacy Policy',
      'zh-hk': '私隱政策',
      'zh-tw': '隱私政策',
      zh: '隐私政策',
      es: 'Política de Privacidad',
      de: 'Datenschutzrichtlinie',
      it: 'Privacy Policy',
      pt: 'Política de Privacidade'
    },
    termsOfUse: {
      en: 'Terms of Use',
      'zh-hk': '使用條款',
      'zh-tw': '使用條款',
      zh: '使用条款',
      es: 'Términos de Uso',
      de: 'Nutzungsbedingungen',
      it: 'Termini di Uso',
      pt: 'Termos de Uso'
    },
    fifaClubWorldCup: {
      en: 'FIFA Club World Cup',
      'zh-hk': 'FIFA世界冠軍球會盃',
      'zh-tw': 'FIFA世界冠軍球會盃',
      zh: 'FIFA世界俱乐部杯',
      es: 'Copa Mundial de Clubes FIFA',
      de: 'FIFA Klub-Weltmeisterschaft',
      it: 'Coppa del Mondo per Club FIFA',
      pt: 'Copa do Mundo de Clubes FIFA'
    },
    publishers: {
      en: 'Publishers',
      'zh-hk': '發佈商',
      'zh-tw': '發佈商',
      zh: '发布商',
      es: 'Editores',
      de: 'Herausgeber',
      it: 'Editori',
      pt: 'Editores'
    },
    jobs: {
      en: 'Jobs',
      'zh-hk': '工作機會',
      'zh-tw': '工作機會',
      zh: '工作机会',
      es: 'Empleos',
      de: 'Jobs',
      it: 'Lavori',
      pt: 'Empregos'
    },
    advertise: {
      en: 'Advertise',
      'zh-hk': '廣告',
      'zh-tw': '廣告',
      zh: '广告',
      es: 'Publicitar',
      de: 'Werbung',
      it: 'Pubblicità',
      pt: 'Anunciar'
    },
    news: {
      en: 'News',
      'zh-hk': '新聞',
      'zh-tw': '新聞',
      zh: '新闻',
      es: 'Noticias',
      de: 'Nachrichten',
      it: 'Notizie',
      pt: 'Notícias'
    },
    mobileExperience: {
      en: 'Get the complete mobile experience:',
      'zh-hk': '獲得完整的手機體驗：',
      'zh-tw': '獲得完整的手機體驗：',
      zh: '获得完整的手机体验：',
      es: 'Obtén la experiencia móvil completa:',
      de: 'Holen Sie sich die komplette mobile Erfahrung:',
      it: 'Ottieni l\'esperienza mobile completa:',
      pt: 'Obtenha a experiência móvel completa:'
    },
    followUs: {
      en: 'Follow Us:',
      'zh-hk': '關注我們：',
      'zh-tw': '關注我們：',
      zh: '关注我们：',
      es: 'Síguenos:',
      de: 'Folgen Sie uns:',
      it: 'Seguici:',
      pt: 'Siga-nos:'
    },
    winnersKnow: {
      en: 'Winners know when to stop',
      'zh-hk': '贏家知道何時停止',
      'zh-tw': '贏家知道何時停止',
      zh: '赢家知道何时停止',
      es: 'Los ganadores saben cuándo parar',
      de: 'Gewinner wissen, wann sie aufhören müssen',
      it: 'I vincitori sanno quando fermarsi',
      pt: 'Os vencedores sabem quando parar'
    },
    gambleAware: {
      en: 'gambleaware.co.uk',
      'zh-hk': 'gambleaware.co.uk',
      'zh-tw': 'gambleaware.co.uk',
      zh: 'gambleaware.co.uk',
      es: 'juegoseguro.es',
      de: 'spielen-mit-verantwortung.de',
      it: 'giocosicuro.it',
      pt: 'jogacomresponsabilidade.pt'
    },
    copyright: {
      en: 'CS Sport. All rights reserved.',
      'zh-hk': 'CS體育。版權所有。',
      'zh-tw': 'CS體育。版權所有。',
      zh: 'CS体育。版权所有。',
      es: 'CS Sport. Todos los derechos reservados.',
      de: 'CS Sport. Alle Rechte vorbehalten.',
      it: 'CS Sport. Tutti i diritti riservati.',
      pt: 'CS Sport. Todos os direitos reservados.'
    }
  };

  const getTranslation = (key: keyof typeof footerTranslations) => {
    return footerTranslations[key][currentLanguage as keyof typeof footerTranslations[typeof key]] || footerTranslations[key].en;
  };

  return (
    <footer className="bg-gray-900 text-white py-6 md:py-8">
      <div className="container mx-4 md:mx-20">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Section - Company Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-3 md:mb-4">
              <img src="/CSSPORT_1_updated.png" alt="CS Sport" className="h-6 md:h-8 w-auto mr-2 md:mr-3" />
              <span className="text-lg md:text-xl font-bold uppercase">{getTranslation('companyName')}</span>
            </div>
            
            <span className="text-lg md:text-xl font-bold uppercase ">{getTranslation('companyName')}
            </span>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 md:mb-6 max-w-2xl">
              {getTranslation('description')}
            </p>
            
            {/* Footer Links - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              <div className="space-y-2">
                <a href="/about" className="text-gray-300 hover:text-white block touch-target">{getTranslation('about')}</a>
                <a href="/contact" className="text-gray-300 hover:text-white block touch-target">{getTranslation('contactUs')}</a>
                <a href="/sports-tv" className="text-gray-300 hover:text-white block touch-target">{getTranslation('sportsOnTv')}</a>
              </div>
              <div className="space-y-2">
                <a href="/privacy" className="text-gray-300 hover:text-white block touch-target">{getTranslation('privacyPolicy')}</a>
                <a href="/terms" className="text-gray-300 hover:text-white block touch-target">{getTranslation('termsOfUse')}</a>
                <a href="/fifa-club-world-cup" className="text-gray-300 hover:text-white block touch-target">{getTranslation('fifaClubWorldCup')}</a>
              </div>
              <div className="space-y-2 md:block hidden">
                <a href="/publishers" className="text-gray-300 hover:text-white block touch-target">{getTranslation('publishers')}</a>
                <a href="/jobs" className="text-gray-300 hover:text-white block touch-target">{getTranslation('jobs')}</a>
              </div>
              <div className="space-y-2 md:block hidden">
                <a href="/advertise" className="text-gray-300 hover:text-white block touch-target">{getTranslation('advertise')}</a>
                <a href="/news" className="text-gray-300 hover:text-white block touch-target">{getTranslation('news')}</a>
              </div>
              
              {/* Mobile: Show remaining links in second row */}
              <div className="space-y-2 md:hidden col-span-2">
                <div className="flex flex-wrap gap-4">
                  <a href="/publishers" className="text-gray-300 hover:text-white touch-target">{getTranslation('publishers')}</a>
                  <a href="/jobs" className="text-gray-300 hover:text-white touch-target">{getTranslation('jobs')}</a>
                  <a href="/advertise" className="text-gray-300 hover:text-white touch-target">{getTranslation('advertise')}</a>
                  <a href="/news" className="text-gray-300 hover:text-white touch-target">{getTranslation('news')}</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Mobile Apps & Social */}
          <div className="lg:col-span-1">
            <div className="mb-4 md:mb-6">
              <h3 className="text-white font-semibold mb-3 md:mb-4 text-base">{getTranslation('mobileExperience')}</h3>
              <div className="flex flex-col space-y-2 md:space-y-3">
                <a 
                  href="https://play.google.com/store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block touch-target"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play" 
                    className="h-10 md:h-12 w-auto"
                  />
                </a>
                <a 
                  href="https://apps.apple.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block touch-target"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                    alt="Download on the App Store" 
                    className="h-10 md:h-12 w-auto"
                  />
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="mb-4 md:mb-0">
              <h3 className="text-white font-semibold mb-3 md:mb-4 text-base">{getTranslation('followUs')}</h3>
              <div className="flex space-x-3 md:space-x-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 md:w-12 md:h-12 hover:opacity-80 transition-opacity touch-target-large"
                >
                  <img 
                    src="/assets/matchdetaillogo/FBLogo_Blueprint.png" 
                    alt="Facebook" 
                    className="w-full h-full object-contain"
                  />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 md:w-12 md:h-12 hover:opacity-80 transition-opacity touch-target-large"
                >
                  <img 
                    src="/assets/matchdetaillogo/twitter-x.svg" 
                    alt="Twitter" 
                    className="w-full h-full object-contain"
                  />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 md:w-12 md:h-12 hover:opacity-80 transition-opacity touch-target-large"
                >
                  <img 
                    src="/assets/matchdetaillogo/instagram.jpg" 
                    alt="Instagram" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </a>
              </div>
            </div>

            {/* Gambling Awareness */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-700">
              <div className="flex items-center text-xs text-gray-400">
                <div className="bg-gray-600 rounded-full p-1 mr-2">
                  <span className="text-white font-bold text-xs">18+</span>
                </div>
                <span>{getTranslation('winnersKnow')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{getTranslation('gambleAware')}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-700 mt-6 md:mt-8 pt-4 md:pt-6 text-center">
          <p className="text-gray-400 text-xs md:text-sm">
            © {new Date().getFullYear()} {getTranslation('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
