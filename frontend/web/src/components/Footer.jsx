import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* TOP SECTION: BRAND & NEWSLETTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-100">
                <span className="text-white font-extrabold text-lg">M</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900">MockX</span>
            </div>
            <p className="text-gray-500 text-base leading-relaxed max-w-sm mb-8">
              Empowering students to achieve their dreams through high-fidelity
              mock exams and data-driven performance analytics.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Get exam updates & tips</h3>
                <p className="text-gray-500 text-sm mb-6">Join 10,000+ students. No spam, just value.</p>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-grow px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                    Subscribe
                  </button>
                </form>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mb-16" />

        {/* MIDDLE SECTION: LINKS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Exams</h4>
            <ul className="space-y-4">
              {['MHTCET', 'IMUCET', 'CUET',].map((link) => (
                <li key={link}><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4">
              {['Instant Results', 'Mock Tests', 'Analysis Tool', 'Rank Predictor'].map((link) => (
                <li key={link}><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Contact', 'Careers', 'Privacy Policy'].map((link) => (
                <li key={link}><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors text-sm">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-indigo-500" />MockXhelp@Gmail.com
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-indigo-500" /> +91 123-456-7890
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-indigo-500 mt-1" /> MockX
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: COPYRIGHT */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {currentYear} MockX Education Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;