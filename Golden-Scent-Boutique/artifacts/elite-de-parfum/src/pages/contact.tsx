import { motion } from "framer-motion";
import { Phone, Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { SiWhatsapp, SiInstagram, SiFacebook } from "react-icons/si";

export default function Contact() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <div className="w-full min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary text-[10px] uppercase tracking-[0.3em] font-mono">Get in Touch</span>
            <div className="h-px w-10 bg-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-serif text-foreground mb-6"
          >
            At Your Service
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground max-w-2xl mx-auto font-serif italic text-lg"
          >
            Whether you need fragrance advice, want to check stock availability, or have a question about your order — we're here to help.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact Info */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="space-y-10"
          >
            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <SiWhatsapp size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">WhatsApp</h3>
                <p className="text-muted-foreground text-sm mb-3">Fastest way to reach us. Ask about availability, pricing, or get a fragrance recommendation.</p>
                <a href="https://wa.me/17866824792" className="text-primary uppercase tracking-widest text-xs hover:underline font-mono">Message Us on WhatsApp</a>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Phone</h3>
                <p className="text-muted-foreground text-sm mb-3">Call or text us directly. We're happy to discuss inventory and help you find the right scent.</p>
                <a href="tel:+17866824792" className="text-foreground font-mono text-sm hover:text-primary transition-colors">+1 (786) 682-4792</a>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Email</h3>
                <p className="text-muted-foreground text-sm mb-3">For general inquiries, wholesale requests, or order-related questions.</p>
                <a href="mailto:contact@elitedaparfum.com" className="text-primary uppercase tracking-widest text-xs hover:underline font-mono">contact@elitedaparfum.com</a>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Our Location</h3>
                <p className="text-muted-foreground text-sm mb-1">Hattiesburg, Mississippi</p>
                <p className="text-muted-foreground text-sm">Visit us in-store to browse our full selection in person. Please contact us ahead of your visit to confirm availability.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Hours</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Monday – Saturday: 10:00 AM – 7:00 PM</p>
                  <p>Sunday: 12:00 PM – 5:00 PM</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <SiInstagram size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Social Media</h3>
                <p className="text-muted-foreground text-sm mb-3">Follow us for new arrivals, behind-the-scenes, and exclusive deals.</p>
                <div className="flex items-center gap-5">
                  <a href="https://www.instagram.com/elitedaparfum1" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary uppercase tracking-widest text-xs hover:underline font-mono">
                    <SiInstagram size={14} /> @elitedaparfum1
                  </a>
                  <a href="https://www.facebook.com/people/Elite-Da-Parfum/61589275449563/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary uppercase tracking-widest text-xs hover:underline font-mono">
                    <SiFacebook size={14} /> Facebook
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex gap-6 items-start">
              <div className="w-11 h-11 rounded-full border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-foreground mb-2">Shipping</h3>
                <p className="text-muted-foreground text-sm">We ship to all 50 US states only. No international shipping at this time. Orders are processed within 1–2 business days and ship via USPS or UPS with tracking.</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Inquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-card p-8 md:p-12 border border-border"
          >
            <h3 className="text-2xl font-serif text-foreground mb-2">Send an Inquiry</h3>
            <p className="text-muted-foreground text-sm mb-8 font-mono uppercase tracking-widest text-[10px]">We'll respond within 24 hours</p>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="Your name"
                  data-testid="input-contact-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Email or Phone</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 text-sm"
                  placeholder="your@email.com or (601) 000-0000"
                  data-testid="input-contact-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Message</label>
                <textarea
                  rows={4}
                  className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none text-sm"
                  placeholder="Ask about a specific fragrance, check stock, or inquire about an order..."
                  data-testid="input-contact-message"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-foreground text-background py-4 uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary hover:text-primary-foreground transition-colors mt-4 font-mono"
                data-testid="btn-contact-submit"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>

        {/* Notice banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-primary/5 border border-primary/20 p-6 text-center"
        >
          <p className="text-foreground font-serif text-lg mb-1">We carry premium brands only — 100% authentic.</p>
          <p className="text-muted-foreground text-sm">Tom Ford · Chanel · Dolce &amp; Gabbana · Dior · Versace · YSL · Armani · Creed &amp; more</p>
          <p className="text-muted-foreground text-xs mt-2 font-mono uppercase tracking-widest">US domestic shipping only · Based in Hattiesburg, MS</p>
        </motion.div>
      </div>
    </div>
  );
}
