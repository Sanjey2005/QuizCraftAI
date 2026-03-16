const fs = require('fs');

const explicitFiles = [
  'app/dashboard/instructor/page.tsx',
  'app/classrooms/[id]/page.tsx'
];

const explicitReplacements = [
  { from: /bg-\[\#111111\]/g, to: 'bg-[#1A1A1A]' },
  { from: /border-\[\#2A2A2A\]/g, to: 'border-white/30' },
  { from: /border-\[\#1A1A1A\]/g, to: 'border-white/20' },
  { from: /border-\[\#555555\]/g, to: 'border-white/40' },
  { from: /hover:border-\[\#555555\]/g, to: 'hover:border-white' },
  { from: /text-\[\#A0A0A0\]/g, to: 'text-white/80' },
  { from: /text-\[\#555555\]/g, to: 'text-white/60' },
  { from: /text-\[\#333333\]/g, to: 'text-white/40' },
  { from: /text-\[\#222222\]/g, to: 'text-white/20' },
  { from: /border-t-\[\#555555\]/g, to: 'border-t-white/40' },
  { from: /border-t-\[\#333333\]/g, to: 'border-t-white/30' },
  { from: /border-t-\[\#222222\]/g, to: 'border-t-white/20' }
];

explicitFiles.forEach(f => {
  let content = fs.readFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, 'utf8');
  explicitReplacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, content);
  console.log('Fixed', f);
});

const semanticFiles = [
  'app/dashboard/student/page.tsx',
  'app/quizzes/page.tsx',
  'app/quizzes/generate/page.tsx',
  'app/quizzes/[id]/page.tsx',
  'app/quizzes/[id]/attempt/page.tsx'
];

const semanticReplacements = [
  { from: /bg-surface/g, to: 'bg-surface-2' },
  { from: /border-border\/50/g, to: 'border-white/30' },
  { from: /border-border/g, to: 'border-white/30' },
  { from: /text-secondary/g, to: 'text-white/80' },
  { from: /text-muted/g, to: 'text-white/60' }
];

semanticFiles.forEach(f => {
  if (fs.existsSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f)) {
    let content = fs.readFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, 'utf8');
    semanticReplacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    // special fixes: bg-surface-2 was previously matched as bg-surface, which becomes bg-surface-2-2, fix it:
    content = content.replace(/bg-surface-2-2/g, 'bg-surface-2');
    fs.writeFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, content);
    console.log('Fixed', f);
  }
});
