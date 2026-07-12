import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Flame, Wind, Shield, BarChart3, Package, Users, CheckCircle, Phone, Mail, MapPin, Menu, X, ChevronRight, Star, Zap, Globe } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const NAV_LINKS = ['Home', 'About', 'Services', 'Products', 'Features', 'Contact'];

const SERVICES = [
  { icon: Flame, title: 'Biogas Systems', desc: 'Complete biogas plant setup, maintenance and equipment supply for household and commercial use.' },
  { icon: Wind, title: 'CNG Solutions', desc: 'CNG cylinders, regulators, compressors and dispensing equipment for fleets and filling stations.' },
  { icon: Package, title: 'Pipe & Fittings', desc: 'HDPE, MS, GI pipes with full range of fittings, valves and compression assemblies.' },
  { icon: Shield, title: 'Safety Equipment', desc: 'Certified pressure relief valves, solenoid shutoffs and monitoring systems.' },
  { icon: Zap, title: 'Compressors', desc: 'Industrial grade biogas and CNG compressors from 5HP to 50HP capacity.' },
  { icon: Globe, title: 'Installation & AMC', desc: 'End-to-end installation, commissioning and annual maintenance contracts.' },
];

const PRODUCTS = [
  { name: 'Electrical', icon: '⚡', color: 'from-blue-500 to-indigo-600', items: ['Single/Double Pole MCBs', 'Schneider Contactors', 'Indicators & Push Buttons', 'Plastic Wire Trays & Plugs'] },
  { name: 'Hydraulic', icon: '🎛️', color: 'from-purple-500 to-violet-600', items: ['ABC Fire Extinguishers', 'PVC Braided Hoses', 'LPG Rubber Hoses & Adaptors', 'Hex Nipples & Brass Nuts'] },
  { name: 'Bearing', icon: '⚙️', color: 'from-orange-500 to-amber-600', items: ['UCP Bearing Housings', 'UCF SKF BRG Housings', 'UCFL & UCT series SMTB', 'Bearings 6000ZZ / 2RS'] },
  { name: 'Consumable', icon: '🔧', color: 'from-red-500 to-rose-600', items: ['4" & 7" Cut Off Wheels', 'Mop Wheels (various sizes)', 'DC Wheels (Green/Black)', 'Flap Discs (N CUT)'] },
];

const STATS = [
  { value: '15+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '1000+', label: 'Happy Clients' },
  { value: '50+', label: 'Product Categories' },
];

const WHY_US = [
  { icon: '🏭', title: 'In-House Manufacturing', desc: 'All products manufactured in our own facility ensuring quality control at every step.' },
  { icon: '✅', title: 'BIS Certified', desc: 'All CNG cylinders and pressure equipment are BIS/PESO certified and compliant.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fast and reliable delivery across Gujarat and all major Indian cities.' },
  { icon: '🔧', title: 'Expert Support', desc: '24/7 technical support with experienced engineers for installation and AMC.' },
  { icon: '💰', title: 'Competitive Pricing', desc: 'Factory-direct pricing with no middlemen — get the best rates always.' },
  { icon: '📋', title: 'GST Compliant', desc: 'Full GST invoicing with GSTIN, HSN codes and e-invoice ready documentation.' },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', formData);
      setFormSent(true);
      setTimeout(() => setFormSent(false), 5000);
      setFormData({ name: '', email: '', phone: '', message: '' });
      toast.success('Inquiry sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── STICKY NAVBAR ─────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Vardhman Family" className="h-12 w-16 object-contain" onError={e => { e.target.style.display='none'; }} />
            </div>
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a key={link} href={`#${link.toLowerCase()}`} className={`text-sm font-medium hover:text-primary-500 transition-colors ${scrolled ? 'text-gray-600' : 'text-white/90'}`}>{link}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden sm:flex btn-primary text-sm py-2 px-5 items-center gap-2">
                <Shield size={15} /> ERP Login
              </Link>
              <button onClick={() => setNavOpen(!navOpen)} className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-600' : 'text-white'}`}>
                {navOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {navOpen && (
            <div className="lg:hidden bg-white/95 backdrop-blur-md rounded-2xl mx-2 mb-2 p-4 shadow-xl border border-gray-100 animate-fade-in">
              {NAV_LINKS.map(link => (
                <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setNavOpen(false)} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">{link}</a>
              ))}
              <Link to="/login" className="btn-primary w-full text-center mt-3 py-2.5 flex items-center justify-center gap-2">
                <Shield size={15} /> Login to ERP
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex items-center bg-mesh overflow-hidden">
        {/* Animated particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="hero-particle" style={{
            width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
            top: `${10 + i * 15}%`, left: `${5 + i * 15}%`,
            animationDelay: `${i * 1.2}s`, animationDuration: `${7 + i}s`
          }} />
        ))}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-1.5 mb-6">
              <Leaf size={14} className="text-primary-400" />
              <span className="text-primary-300 text-sm font-medium">All About Bio-Gas Machinery</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-heading font-black text-white leading-tight mb-6">
              Vardhman <span className="text-gradient">Family</span>
              <br /><span className="text-3xl lg:text-4xl text-primary-300 font-semibold">Biogas & CNG Solutions</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
              Gujarat's trusted in-house manufacturer of biogas components, CNG equipment, industrial pipes, valves and compressors since 2008.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#products" className="btn-primary text-base py-3 px-8 flex items-center gap-2">
                Explore Products <ChevronRight size={18} />
              </a>
              <a href="#contact" className="btn-secondary text-base py-3 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                Contact Us
              </a>
            </div>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {STATS.map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-center hover:scale-105 transition-transform">
                <p className="text-4xl font-black text-primary-400 font-heading">{stat.value}</p>
                <p className="text-gray-300 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#about" className="flex flex-col items-center gap-2 text-primary-400">
            <span className="text-xs">Scroll Down</span>
            <div className="w-5 h-8 border-2 border-primary-400 rounded-full flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 bg-primary-400 rounded-full animate-bounce" />
            </div>
          </a>
        </div>
      </section>

      {/* ── ABOUT SECTION ─────────────────────────────── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">About Us</span>
              <h2 className="text-4xl font-heading font-bold text-gray-900 mt-2 mb-6">India's Pioneer in <span className="text-gradient">Biogas & CNG</span> Manufacturing</h2>
              <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                Vardhman Family is a Gujarat-based in-house manufacturer specializing in biogas machinery, CNG equipment and industrial gas infrastructure. Located in Piplav, Anand — we deliver quality across India.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                With our state-of-the-art ERP system, we manage inventory, procurement, billing and order tracking ensuring seamless operations for our clients and internal teams.
              </p>
              <div className="flex flex-wrap gap-3">
                {['BIS Certified', 'PESO Approved', 'GST Registered', 'ISO Compliant'].map(badge => (
                  <span key={badge} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-4 py-2 rounded-full text-sm font-semibold">
                    <CheckCircle size={14} /> {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['🌱 Eco-Friendly', '🏭 In-House Mfg', '🚀 Fast Delivery', '🔒 Quality Assured'].map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-100 rounded-2xl p-6 text-center hover:shadow-card-hover transition-all">
                  <div className="text-3xl mb-2">{item.split(' ')[0]}</div>
                  <p className="font-semibold text-gray-800 text-sm">{item.split(' ').slice(1).join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────── */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Services</span>
            <h2 className="text-4xl font-heading font-bold text-gray-900 mt-2">What We <span className="text-gradient">Offer</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all group border border-transparent hover:border-primary-100">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <svc.icon size={22} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{svc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT CATEGORIES ───────────────────────── */}
      <section id="products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Products</span>
            <h2 className="text-4xl font-heading font-bold text-gray-900 mt-2">Our <span className="text-gradient">Product Range</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((prod, i) => (
              <div key={i} className="group rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all">
                <div className={`bg-gradient-to-br ${prod.color} p-8 flex flex-col items-center text-white`}>
                  <span className="text-5xl mb-3">{prod.icon}</span>
                  <h3 className="font-heading font-bold text-xl">{prod.name}</h3>
                </div>
                <div className="bg-white p-5">
                  <ul className="space-y-2">
                    {prod.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-600 text-sm">
                        <CheckCircle size={14} className="text-primary-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-dark-900 to-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-widest">Why Us</span>
            <h2 className="text-4xl font-heading font-bold text-white mt-2">Why Choose <span className="text-gradient">Vardhman Family</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map((item, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all group">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-heading font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Contact</span>
            <h2 className="text-4xl font-heading font-bold text-gray-900 mt-2">Get In <span className="text-gradient">Touch</span></h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              {[
                { icon: MapPin, title: 'Address', content: 'Behind Piplav Dairy, At Piplav, Ta: Sojitra, Di: Anand, Gujarat 388460' },
                { icon: Phone, title: 'Phone', content: '+91 9998160084 | Support: +91 90168 22495' },
                { icon: Mail, title: 'Email', content: 'vardhmanfamily.corporate@gmail.com' },
              ].map((info, i) => (
                <div key={i} className="flex gap-4 bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <info.icon size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{info.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{info.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleContact} className="bg-white rounded-2xl p-8 shadow-card border border-gray-100 space-y-4">
              {formSent && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm text-center">✅ Message sent! We'll get back to you soon.</div>}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" placeholder="Your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input-field" placeholder="+91 9999999999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="your@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input-field" rows={4} placeholder="Tell us about your requirement..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-dark-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <p className="text-white font-heading font-bold">Vardhman Family</p>
                  <p className="text-primary-400 text-xs">Biogas & CNG Solutions</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">"All About Bio-Gas machinery manufacturer (In House)"</p>
              <div className="flex items-center gap-2 mt-4 text-primary-400">
                <Phone size={16} />
                <span className="text-lg font-bold text-white">+91 90168 22495</span>
              </div>
              <p className="text-xs text-primary-400">Customer Support</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2"><MapPin size={16} className="text-primary-400 flex-shrink-0 mt-0.5" /><span>Behind Piplav Dairy, At Piplav, Ta: Sojitra, Di: Anand, 388460</span></div>
                <div className="flex gap-2"><Phone size={16} className="text-primary-400 flex-shrink-0" /><span>+91 9998160084</span></div>
                <div className="flex gap-2"><Mail size={16} className="text-primary-400 flex-shrink-0" /><span>vardhmanfamily.corporate@gmail.com</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                {['About Us', 'Services', 'Work and Achievement', 'Contact Us'].map(link => (
                  <a key={link} href="#" className="block hover:text-primary-400 transition-colors">{link}</a>
                ))}
                <Link to="/login" className="block text-primary-400 font-semibold hover:text-primary-300 transition-colors">🔐 ERP Login</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-dark-600 py-4">
          <p className="text-center text-sm text-gray-600">Copyright © 2025 Vardhman Family. All rights reserved. Made by Zalak & Diya</p>
        </div>
      </footer>
    </div>
  );
}
