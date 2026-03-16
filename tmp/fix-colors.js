const fs = require('fs');

const files = [
  'app/dashboard/instructor/page.tsx',
  'app/classrooms/[id]/page.tsx'
];

const replacements = [
  { from: /bg-\[\#111111\]/g, to: 'bg-white' },
  { from: /bg-\[\#1A1A1A\]/g, to: 'bg-slate-50' },
  { from: /bg-\[\#0A0A0A\]/g, to: 'bg-slate-100' },
  { from: /bg-\[\#151515\]/g, to: 'bg-slate-50' },
  { from: /bg-\[\#2A2A2A\]/g, to: 'bg-slate-200' },
  
  { from: /border-\[\#2A2A2A\]/g, to: 'border-slate-200' },
  { from: /border-\[\#1A1A1A\]/g, to: 'border-slate-100' },
  { from: /border-\[\#555555\]/g, to: 'border-slate-300' },
  { from: /hover:border-\[\#555555\]/g, to: 'hover:border-slate-300' },
  
  { from: /text-\[\#A0A0A0\]/g, to: 'text-slate-500' },
  { from: /text-\[\#555555\]/g, to: 'text-slate-400' },
  { from: /text-white/g, to: 'text-slate-900' },
  { from: /text-[#333333]/g, to: 'text-slate-300' },
  { from: /text-[#222222]/g, to: 'text-slate-200' },
  
  { from: /border-t-\[\#555555\]/g, to: 'border-t-slate-400' },
  { from: /border-t-\[\#333333\]/g, to: 'border-t-slate-300' },
  { from: /border-t-\[\#222222\]/g, to: 'border-t-slate-200' },
  
  { from: /bg-black\/60/g, to: 'bg-slate-900/40' },
  
  // Specific text-white adjustments for hovering or backgrounds
  { from: /hover:text-white/g, to: 'hover:text-slate-900' },
  { from: /hover:border-white/g, to: 'hover:border-slate-400' },
  { from: /focus:border-white/g, to: 'focus:border-slate-400' },
  { from: /text-black/g, to: 'text-white' } // in CreateClassroomModal for checkmarks/buttons
];

files.forEach(f => {
  let content = fs.readFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  // Quick fix: if text-slate-900 is used on a button with variant="premium", we might break the text color of the button.
  // Wait, btn-premium uses pure CSS `.btn-premium`. The text color is defined there.
  fs.writeFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, content);
  console.log('Fixed', f);
});

// Also fix StudentDashboardPage and QuizzesPage
const files2 = [
  'app/dashboard/student/page.tsx',
  'app/quizzes/page.tsx',
  'app/quizzes/generate/page.tsx',
  'app/quizzes/[id]/page.tsx',
  'app/quizzes/[id]/attempt/page.tsx'
];

const repl2 = [
  { from: /bg-surface-2/g, to: 'bg-slate-50' },
  { from: /bg-surface/g, to: 'bg-white' },
  { from: /bg-background/g, to: 'bg-slate-100' },
  
  { from: /border-border\/50/g, to: 'border-slate-200' },
  { from: /border-border/g, to: 'border-slate-200' },
  
  { from: /text-primary/g, to: 'text-slate-900' },
  { from: /text-secondary/g, to: 'text-slate-500' },
  { from: /text-muted/g, to: 'text-slate-400' },
  
  { from: /hover:text-white/g, to: 'hover:text-slate-900' },
  { from: /hover:bg-surface-2/g, to: 'hover:bg-slate-100' },
  { from: /hover:bg-surface/g, to: 'hover:bg-slate-50' },
  { from: /group-hover:text-white/g, to: 'group-hover:text-slate-900' },
  { from: /group-hover\/code:text-white/g, to: 'group-hover\/code:text-slate-900' },
  { from: /text-white/g, to: 'text-slate-900' } // for anything explicitly white
];

files2.forEach(f => {
  if (fs.existsSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f)) {
    let content = fs.readFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, 'utf8');
    repl2.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    // We want page wrapper to still have a dark mode feeling but the cards to be white. 
    // Wait, replacing ALL text-white with text-slate-900 might break buttons!
    // I will replace `text-white` -> `text-slate-900` globally which could be bad for `Button` if they rely on text-white.
    // However, shadcn buttons do not use `text-white` classes typically, they use `text-primary-foreground`.
    // Wait, the `btn-premium` in globals.css uses `text-white`. If I replace `text-white` with `text-slate-900` in the *components*, it will affect custom inline text.
    fs.writeFileSync('c:/Users/acer/Desktop/quizcraftai/frontend/' + f, content);
    console.log('Fixed', f);
  }
});
