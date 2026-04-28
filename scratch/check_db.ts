import { storageService } from './src/services/storageService';

async function checkItems() {
  try {
    const items = await storageService.getNewsItems();
    console.log('Total items:', items.length);
    items.forEach(i => {
      const title = i.blocks.find(b => b.type === 'title')?.value;
      console.log(`[${i.status}] ${title} | Tags: ${i.tags?.join(', ')} | Source: ${i.meta?.source}`);
    });
  } catch (e) {
    console.error(e);
  }
}

checkItems();
