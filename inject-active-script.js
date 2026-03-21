const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const scriptContent = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash;
  
  const links = document.querySelectorAll('.kingz-menu a, .footer-col ul li a');
  links.forEach(link => {
    link.classList.remove('active'); // Clear server-side or hardcoded active states
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Hash match logic
    if (currentHash && href === (currentPath + currentHash)) {
       link.classList.add('active');
    } 
    // Exact page match (no hash on current page)
    else if (!currentHash && href === currentPath) {
       link.classList.add('active');
    }
    // Default home state
    else if ((currentPath === 'index.html' || currentPath === '') && (!currentHash || currentHash === '') && href === 'index.html') {
       link.classList.add('active');
    }
  });
});
</script>
</body>`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("const links = document.querySelectorAll('.kingz-menu a, .footer-col ul li a');")) {
    content = content.replace('</body>', scriptContent);
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
