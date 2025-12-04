import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-primary-foreground">ExamShield</span>
            </div>
            <p className="text-sm text-primary-foreground/60">
              India's most trusted online exam platform for JEE and NEET preparation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Study Material</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Video Tutorials</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2024 ExamShield. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/50">
            <a href="#" className="hover:text-primary-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
