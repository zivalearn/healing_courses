import React from 'react';
import { Sparkles, Phone, Mail, Globe, Instagram, Facebook, Youtube, MessageCircle, Flower2, Camera } from 'lucide-react';

interface FooterProps {
  onOpenContact: () => void;
  onOpenAdmin: (tab?: 'list' | 'create' | 'edit' | 'image-studio') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact, onOpenAdmin }) => {
  return (
    <footer className="bg-[#072E2C] text-white pt-14 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 5 Columns Layout as in Image 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 items-start">
          
          {/* Column 1: Logo & Description & Socials */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#103E3B] border border-[#CBA258]/50 flex items-center justify-center text-[#CBA258]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1 font-serif text-xl tracking-wide">
                <span className="text-white font-normal">Heal With</span>
                <span className="text-[#CBA258] font-bold">HEER</span>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-normal">
              A sacred space for healing, transformation and spiritual growth. You deserve to heal, rise and thrive.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2 text-white/80">
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/15 hover:text-[#CBA258] transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/15 hover:text-[#CBA258] transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/15 hover:text-[#CBA258] transition-all">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); onOpenContact(); }} className="p-2 rounded-full bg-white/5 hover:bg-white/15 hover:text-[#CBA258] transition-all cursor-pointer">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">About Me</a></li>
              <li><a href="#featured" className="hover:text-white transition-colors">Healing Modalities</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Programs</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Blog</a></li>
              <li><button onClick={onOpenContact} className="hover:text-white transition-colors text-left cursor-pointer">Contact</button></li>
            </ul>
          </div>

          {/* Column 3: Healing Modalities */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Healing Modalities
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><a href="#courses" className="hover:text-white transition-colors">Neuro Linguistic Programming (NLP)</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Relationship Mastery</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Trauma Healing</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Reiki Healing & Chakra Balancing</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Hypnotherapy and EFT</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Energy Healing & Cord Cutting</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Timeline Therapy</a></li>
              <li><a href="#courses" className="hover:text-white transition-colors">Tarot and Numerology</a></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Support
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Contact
            </h4>
            <div className="space-y-3 text-xs text-white/80">
              <a href="tel:+919876543210" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#CBA258] shrink-0" />
                <span>+91 98765 43210</span>
              </a>

              <a href="mailto:hello@healwithheer.com" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#CBA258] shrink-0" />
                <span>hello@healwithheer.com</span>
              </a>

              <div className="flex items-center gap-2.5">
                <Globe className="w-3.5 h-3.5 text-[#CBA258] shrink-0" />
                <span>Worldwide (Online)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={() => onOpenAdmin('list')}
                className="text-[10px] text-[#CBA258] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Admin Portal</span>
              </button>
              <span className="text-white/30 text-[10px]">•</span>
              <button
                onClick={() => onOpenAdmin('image-studio')}
                className="text-[10px] text-white/90 hover:text-[#CBA258] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Camera className="w-3 h-3 text-[#CBA258]" />
                <span>Image Studio</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar matching Image 3 screenshot */}
        <div className="pt-8 border-t border-white/10 flex flex-col items-center justify-center gap-2 text-center text-xs text-white/70">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>© 2026 Heal With Heer. All Rights Reserved.</span>
            <Flower2 className="w-3.5 h-3.5 text-[#CBA258]" />
            <button
              onClick={() => onOpenAdmin('image-studio')}
              className="hover:text-white underline transition-colors cursor-pointer text-[#CBA258] font-bold ml-1 text-xs"
            >
              Image Studio
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
