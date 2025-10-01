import { storage } from "./storage";

const initialShips = [
  "LBC_OYKU",
  "NERMIN KARABEKIR", 
  "TAMREY S",
  "LadyBerna",
  "MONA",
  "LBC_TUGCE",
  "AJOS",
  "HAVVA KARABEKIR",
  "BUNDU",
  "FORTUNATE",
  "FERTILE",
  "YUKSEL KARABEKIR",
  "NIKSAR",
  "GITO"
];

export async function seedInitialShips() {
  try {
    // Skip seeding if SEED_SHIPS environment variable is set to 'false'
    if (process.env.SEED_SHIPS === 'false') {
      console.log('⏭️  Ship seeding disabled via SEED_SHIPS env variable');
      return;
    }
    
    // Check if any ships exist already
    const existingShips = await storage.getShips();
    if (existingShips.length > 0) {
      console.log(`⏭️  Skipping ship seeding - ${existingShips.length} ships already exist`);
      return;
    }
    
    console.log('🚢 Seeding initial ships...');
    
    for (let i = 0; i < initialShips.length; i++) {
      const shipName = initialShips[i];
      const slug = shipName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      await storage.createShip({
        name: shipName,
        slug: slug,
        description: `${shipName} gemisi için Starlink veri paketleri`,
        isActive: true,
        sortOrder: i
      });
      
      console.log(`✅ Created ship: ${shipName}`);
    }
    
    console.log('✅ Initial ships seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding initial ships:', error);
  }
}