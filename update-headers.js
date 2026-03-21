const fs = require('fs');
const path = require('path');

const dir = './';
const newNav = `  <div class="kingz-nav">
    <a class="brand" href="index.html">
      <img src="assets/images/logo.png" alt="CargoDealer logo" style="height:50px;"/>
    </a>
    <button class="hamburger" onclick="this.classList.toggle('is-active'); this.parentElement.classList.toggle('nav-active');">
      <span></span><span></span><span></span>
    </button>
    <div class="kingz-menu">
      <a href="index.html">Home</a>
      <a href="index.html#services">Services</a>
      <a href="index.html#about">About Us</a>
      <a href="track.html">Tracking</a>
      <a href="get-quote.html">Quote</a>
      <a href="contact.html">Contact</a>
    </div>
    <div class="kingz-ctas">
      <a href="login.html" class="btn secondary small">Login</a>
      <a href="register.html" class="btn primary small">Sign Up</a>
    </div>
  </div>`;

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html') && !['login.html', 'register.html'].includes(file)) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        
        // Define the nav structure
        // If it's index.html, we use relative anchors. Otherwise, absolute.
        const isIndex = file === 'index.html';
        const homePrefix = isIndex ? '' : 'index.html';

        const dynamicNav = `  <div class="kingz-nav">
    <a class="brand" href="index.html">
      <img src="assets/images/logo.png" alt="CargoDealer logo" style="height:50px;"/>
    </a>
    <button class="hamburger" onclick="this.classList.toggle('is-active'); this.parentElement.classList.toggle('nav-active');">
      <span></span><span></span><span></span>
    </button>
    <div class="kingz-menu">
      <a href="${isIndex ? '#' : 'index.html'}">Home</a>
      <a href="${homePrefix}#services">Services</a>
      <a href="${homePrefix}#about">About Us</a>
      <a href="track.html">Tracking</a>
      <a href="get-quote.html">Quote</a>
      <a href="contact.html">Contact</a>
    </div>
    <div class="kingz-ctas">
      <a href="login.html" class="btn secondary small">Login</a>
      <a href="register.html" class="btn primary small">Sign Up</a>
    </div>
  </div>`;

        // Match from kingz-nav until we hit a major section or the end of the nav block
        const navRegex = /<div class="kingz-nav">[\s\S]*?(?=<header|<main|<section|<!-- Hero)/gi;

        const activeNav = dynamicNav.replace(`href="${file}"`, `href="${file}" class="active"`);

        if (content.match(navRegex)) {
            content = content.replace(navRegex, activeNav + '\n\n');
        } else {
            // Prepend if not found (fallback)
            content = content.replace(/<body[^>]*>/i, `$&\n${activeNav}\n`);
        }
        
        fs.writeFileSync(path.join(dir, file), content);
    }
});
