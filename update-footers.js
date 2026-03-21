const fs = require('fs');
const path = require('path');

const newFooter = `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-contact">
          <img src="assets/images/logo.png" alt="CargoDealer Logo" class="footer-logo" style="max-width: 160px; filter: none; margin-bottom: 15px;"/>
          <p><strong>CargoDealer Nigeria Limited</strong></p>
          <p>19 Allen Ave, Ikeja</p>
          <p>Lagos, Nigeria</p>
          <p>📞 +234 703 644 6393</p>
          <div class="social-links">
            <a href="https://web.facebook.com/profile.php?id=61560297002676" target="_blank" class="social-icon" style="background:#1877F2;">
              <svg style="width:20px; height:20px; fill:#fff;" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/cargodealer_inc?igsh=OGp3N3Y3OXYyZ2o0" target="_blank" class="social-icon" style="background:linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);">
              <svg style="width:20px; height:20px; fill:#fff;" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@cargodealer_inc?is_from_webapp=1&sender_device=pc" target="_blank" class="social-icon" style="background:#000000;">
              <svg style="width:20px; height:20px; fill:#fff;" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.9-.39-2.72.12-.6.33-1.04.91-1.21 1.57-.18.78-.03 1.65.41 2.3.43.68 1.15 1.15 1.94 1.25.79.1 1.61-.1 2.25-.57.8-.57 1.25-1.52 1.23-2.52-.01-4.7-.01-9.41-.02-14.11z"/></svg>
            </a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="index.html#services">Air Freight</a></li>
            <li><a href="index.html#services">Ocean Freight</a></li>
            <li><a href="index.html#services">Courier</a></li>
            <li><a href="track.html">Tracking</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Information</h4>
          <ul>
            <li><a href="index.html#how">How It Works</a></li>
            <li><a href="index.html#faq">FAQ</a></li>
            <li><a href="contact.html">Contact Us</a></li>
            <li><a href="index.html#about">About Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="login.html">Sign In</a></li>
            <li><a href="register.html">Sign Up</a></li>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 CargoDealerInc Logistics. All Rights Reserved.
      </div>
    </div>
  </footer>

  <a href="https://wa.me/2347036446393" target="_blank" class="wa-widget" aria-label="Chat on WhatsApp">
    <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-5.824 4.74-10.563 10.564-10.563 5.826 0 10.564 4.738 10.564 10.562s-4.738 10.564-10.564 10.564z"/></svg>
  </a>`;

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.html') && file !== 'index.html') {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Check if there is an existing footer block to replace
    const footerRegex = /<footer\b[^>]*>[\s\S]*?<\/footer>/gi;
    if (footerRegex.test(content)) {
      content = content.replace(footerRegex, newFooter);
    } else {
      // Find the first occurrence of </body> or <script
      const insertAt = content.lastIndexOf('<script');
      if (insertAt !== -1) {
        content = content.substring(0, insertAt) + newFooter + '\n' + content.substring(insertAt);
      } else {
        const bodyAt = content.lastIndexOf('</body>');
        if (bodyAt !== -1) {
          content = content.substring(0, bodyAt) + newFooter + '\n' + content.substring(bodyAt);
        } else {
          content += newFooter;
        }
      }
    }
    
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    console.log('Updated ' + file);
  }
});
