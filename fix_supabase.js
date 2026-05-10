const fs = require('fs');
let content = fs.readFileSync('public/index.html', 'utf8');

// Replace the declaration
content = content.replace(
  "const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);",
  "const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);"
);

// Replace supabase.auth and supabase.from
content = content.replace(/await supabase\./g, 'await supabaseClient.');
content = content.replace(/supabase\.auth/g, 'supabaseClient.auth');
content = content.replace(/supabase\.from/g, 'supabaseClient.from');

fs.writeFileSync('public/index.html', content);
console.log('Fixed supabase references in public/index.html');
