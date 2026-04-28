import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const BULK_DIR = './bulk_pdfs';
const STORAGE_BUCKET = 'news-pdfs';
const DB_TABLE = 'news_items';

// Load .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function extractDate(filename: string): string {
    // Pattern 1: 10th April 2026
    const pattern1 = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i;
    const match1 = filename.match(pattern1);
    if (match1) {
        const d = match1[1].padStart(2, '0');
        const m = months[match1[2].toLowerCase()];
        const y = match1[3];
        if (m) return `${y}-${m}-${d}`;
    }

    // Pattern 2: YYYY-MM-DD or DD-MM-YYYY
    const pattern2 = /(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})/;
    const match2 = filename.match(pattern2);
    if (match2) {
        const found = match2[0];
        if (/^\d{2}-\d{2}-\d{4}$/.test(found)) {
            const [d, m, y] = found.split('-');
            return `${y}-${m}-${d}`;
        }
        return found;
    }

    // Default to today if no date found
    return new Date().toISOString().split('T')[0];
}

const isDryRun = process.argv.includes('--dry-run');

async function run() {
    console.log(`🚀 Starting Bulk Import ${isDryRun ? '(DRY RUN)' : ''}...`);
    
    if (!fs.existsSync(BULK_DIR)) {
        console.error(`❌ Directory ${BULK_DIR} not found`);
        return;
    }

    const files = fs.readdirSync(BULK_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`\n📂 Found ${files.length} PDF files.`);

    // --- CLEANUP ---
    console.log('\n🧹 Cleaning up old bulk items...');
    const { error: delError } = await supabase.from(DB_TABLE).delete().like('id', 'news-bulk-%');
    if (delError) console.warn('⚠️ Cleanup warning:', delError.message);

    // --- DRY RUN ---
    console.log('\n--- DRY RUN PREVIEW ---');
    const previews = files.map(f => ({
        file: f,
        extractedDate: extractDate(f),
        title: f.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
    }));
    previews.forEach((p, i) => console.log(`${i+1}. [${p.extractedDate}] ${p.title}`));

    if (isDryRun) {
        console.log('\n✅ Dry run complete. No files were uploaded.');
        return;
    }

    console.log('\n--- STARTING UPLOAD ---');
    
    for (const p of previews) {
        try {
            console.log(`\n⏳ Processing: ${p.file}...`);
            
            const fileData = fs.readFileSync(path.join(BULK_DIR, p.file));
            const fileName = `bulk/${Date.now()}-${p.file.replace(/\s+/g, '_')}`;

            // 1. Upload to Storage
            const { data: storageData, error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, fileData, { contentType: 'application/pdf' });

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);

            // 2. Create News Item
            const sanitizedName = p.file.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const itemId = `news-bulk-${sanitizedName}`;
            
            // Get first layout template
            const { data: layouts } = await supabase.from('news_layout_templates').select('*').limit(1);
            const template = layouts?.[0];

            const newsItem = {
                id: itemId,
                template_id: template?.template_id,
                author: 'System Bulk Import',
                status: 'published',
                tags: ['Intelligence', 'Archive'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                published_at: new Date(p.extractedDate).toISOString(),
                blocks: [
                    { blockId: 'title', type: 'title', value: p.title },
                    { blockId: 'pdf', type: 'pdf', value: { url: publicUrl, filename: p.file } },
                    { blockId: 'category', type: 'category', value: 'Intelligence' }
                ],
                meta: {
                    source: 'bulk_import',
                    original_filename: p.file,
                    pdfUrl: publicUrl,
                    pdfName: p.file
                }
            };

            const { error: dbError } = await supabase.from(DB_TABLE).upsert(newsItem);
            if (dbError) throw dbError;

            console.log(`✅ Success: ${p.file} -> ${p.extractedDate}`);

        } catch (err: any) {
            console.error(`❌ Error processing ${p.file}:`, err.message);
        }
    }

    console.log('\n✨ Bulk Import Complete!');
}

run();
