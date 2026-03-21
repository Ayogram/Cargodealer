const fs = require('fs');
const path = require('path');

const dir = './';

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        
        // Remove literal \n before </head>
        content = content.replace(/\\n<\/head>/g, '\n</head>');
        content = content.replace(/<\/style>\\n<\/head>/g, '</style>\n</head>');
        
        fs.writeFileSync(path.join(dir, file), content);
    }
});
console.log('Cleaned up literal \\n in HTML files.');
