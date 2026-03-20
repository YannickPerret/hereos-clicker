const fs = require('fs');
const path = require('path');

const enemies = [
  { icon: 'drone', color: '#ffcc00', shape: 'drone' },
  { icon: 'rat', color: '#00ff41', shape: 'beast' },
  { icon: 'thug', color: '#ff0040', shape: 'humanoid' },
  { icon: 'aidrone', color: '#ff0040', shape: 'drone' },
  { icon: 'jackal', color: '#00d0ff', shape: 'beast' },
  { icon: 'wraith', color: '#b900ff', shape: 'abstract' },
  { icon: 'secbot', color: '#0088ff', shape: 'robot' },
  { icon: 'netrunner', color: '#ff00aa', shape: 'humanoid' },
  { icon: 'mech', color: '#ff6600', shape: 'robot' },
  { icon: 'archon', color: '#ffffff', shape: 'abstract' },
  { icon: 'dragon', color: '#ff0040', shape: 'dragon' },
  { icon: 'voidking', color: '#000000', shape: 'abstract' },
];

const dir = path.join(__dirname, 'public', 'images', 'enemies');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateSVG(enemy) {
  const { color, shape, icon } = enemy;
  let body = '';
  
  const filter = `
    <defs>
      <filter id="glow-${icon}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  `;

  if (shape === 'drone') {
    body = `
      <circle cx="50" cy="50" r="25" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <line x1="25" y1="50" x2="10" y2="50" stroke="${color}" stroke-width="2" />
      <line x1="75" y1="50" x2="90" y2="50" stroke="${color}" stroke-width="2" />
      <circle cx="50" cy="50" r="5" fill="${color}" filter="url(#glow-${icon})"/>
      <path d="M40 30 L45 25 M60 70 L65 75" stroke="#ffffff" stroke-width="1" />
    `;
  } else if (shape === 'beast') {
    body = `
      <polygon points="30,70 50,30 70,70" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <circle cx="45" cy="50" r="3" fill="#ff0040" filter="url(#glow-${icon})"/>
      <circle cx="55" cy="50" r="3" fill="#ff0040" filter="url(#glow-${icon})"/>
      <path d="M30 70 Q 50 90 70 70" fill="none" stroke="${color}" stroke-width="2" />
    `;
  } else if (shape === 'humanoid') {
    body = `
      <rect x="35" y="20" width="30" height="30" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <rect x="20" y="55" width="60" height="25" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <rect x="50" y="25" width="10" height="5" fill="#ff0040" filter="url(#glow-${icon})"/>
    `;
  } else if (shape === 'robot') {
    body = `
      <rect x="30" y="20" width="40" height="60" fill="none" stroke="${color}" stroke-width="4" filter="url(#glow-${icon})"/>
      <line x1="30" y1="40" x2="70" y2="40" stroke="${color}" stroke-width="2" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="${color}" stroke-width="2" />
      <circle cx="50" cy="30" r="6" fill="#ff0040" filter="url(#glow-${icon})"/>
    `;
  } else if (shape === 'abstract') {
    body = `
      <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <polygon points="50,25 75,50 50,75 25,50" fill="none" stroke="#ffffff" stroke-width="1" filter="url(#glow-${icon})"/>
      <circle cx="50" cy="50" r="10" fill="${color}" filter="url(#glow-${icon})"/>
    `;
  } else if (shape === 'dragon') {
    body = `
      <path d="M20,80 Q50,10 80,80 Q50,50 20,80 Z" fill="none" stroke="${color}" stroke-width="3" filter="url(#glow-${icon})"/>
      <polygon points="50,30 60,40 40,40" fill="${color}" filter="url(#glow-${icon})"/>
      <path d="M45,40 Q50,60 55,40" fill="none" stroke="#00d0ff" stroke-width="2" filter="url(#glow-${icon})"/>
    `;
  }

  return '<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\\n' +
    filter + '\n' +
    '<rect width="100" height="100" fill="transparent" />\n' +
    body + '\n' +
  '</svg>';
}

enemies.forEach(enemy => {
  const filePath = path.join(dir, enemy.icon + '.svg');
  fs.writeFileSync(filePath, generateSVG(enemy));
  console.log('Generated ' + filePath);
});