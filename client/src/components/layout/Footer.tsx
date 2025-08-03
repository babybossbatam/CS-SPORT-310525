
import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 ">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Company Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/cs-sport-logo.png" alt="CS Sport" className="h-8 w-auto mr-3" />
              <span className="text-xl font-bold">CS Sport</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-2xl">
              CS Sport is the fastest, most accurate online live scores service, serving over 100 million fans 
              worldwide since 2012. Our Football coverage includes latest news, fixtures & results, standings, statistics 
              and live match updates of competitions from all over the world including FIFA Club World Cup, UEFA WC 
              Qualification, UEFA Champions League, Premier League and La Liga
            </p>
            
            {/* Footer Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <a href="/about" className="text-gray-300 hover:text-white block mb-2">About</a>
                <a href="/contact" className="text-gray-300 hover:text-white block mb-2">Contact Us</a>
                <a href="/sports-tv" className="text-gray-300 hover:text-white block mb-2">Sports On TV Today</a>
              </div>
              <div>
                <a href="/privacy" className="text-gray-300 hover:text-white block mb-2">Privacy Policy</a>
                <a href="/terms" className="text-gray-300 hover:text-white block mb-2">Terms of Use</a>
                <a href="/fifa-club-world-cup" className="text-gray-300 hover:text-white block mb-2">FIFA Club World Cup</a>
              </div>
              <div>
                <a href="/publishers" className="text-gray-300 hover:text-white block mb-2">Publishers</a>
                <a href="/jobs" className="text-gray-300 hover:text-white block mb-2">Jobs</a>
              </div>
              <div>
                <a href="/advertise" className="text-gray-300 hover:text-white block mb-2">Advertise</a>
                <a href="/news" className="text-gray-300 hover:text-white block mb-2">News</a>
              </div>
            </div>
          </div>

          {/* Right Section - Mobile Apps & Social */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Get the complete mobile experience:</h3>
              <div className="flex flex-col space-y-3">
                <a 
                  href="https://play.google.com/store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play" 
                    className="h-12 w-auto"
                  />
                </a>
                <a 
                  href="https://apps.apple.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                    alt="Download on the App Store" 
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-white font-semibold mb-4">Follow Us:</h3>
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-black p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Gambling Awareness */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center text-xs text-gray-400">
                <div className="bg-gray-600 rounded-full p-1 mr-2">
                  <span className="text-white font-bold text-xs">18+</span>
                </div>
                <span>Winners know when to stop</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">gambleaware.co.uk</p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} CS Sport. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
