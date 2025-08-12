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
    console.log('Seeding initial ships...');
    
    for (let i = 0; i < initialShips.length; i++) {
      const shipName = initialShips[i];
      const slug = shipName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if ship already exists
      const existingShip = await storage.getShipBySlug(slug);
      if (existingShip) {
        continue;
      }
      
      await storage.createShip({
        name: shipName,
        slug: slug,
        description: `${shipName} gemisi için Starlink veri paketleri`,
        isActive: true,
        sortOrder: i
      });
      
      console.log(`Created ship: ${shipName}`);
    }
    
    console.log('Initial ships seeded successfully');
  } catch (error) {
    console.error('Error seeding initial ships:', error);
  }
}