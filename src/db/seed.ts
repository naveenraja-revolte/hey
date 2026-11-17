import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { pathToFileURL } from 'node:url';
import { getDatabase, type AppDatabase } from './index';
import { listCouriers } from '../lib/couriers';
import { listDeliveries } from '../lib/deliveries';
import { couriers, deliveries, deliveryEvents } from './schema';

const courierRows = [
  { name: 'Maya Chen', phone: '+1 415 555 0132', email: 'maya.chen@example.test' },
  { name: 'Luis Ortega', phone: '+1 415 555 0177', email: 'luis.ortega@example.test' },
  { name: 'Asha Patel', phone: '+1 415 555 0149', email: 'asha.patel@example.test' },
  { name: 'Noah Brooks', phone: '+1 415 555 0191', email: 'noah.brooks@example.test' },
  { name: 'Zoe Williams', phone: '+1 415 555 0164', email: 'zoe.williams@example.test' },
];

const deliveryRows = [
  [
    'Olivia James',
    '555-0101',
    '18 Market Street, San Francisco',
    '42 Valencia Street, San Francisco',
    'Small parcel',
    'assigned',
    1,
  ],
  [
    'Ethan Miller',
    '555-0102',
    '200 Pine Street, San Francisco',
    '71 Howard Street, San Francisco',
    'Documents',
    'picked_up',
    2,
  ],
  [
    'Sofia Garcia',
    '555-0103',
    '10 King Street, San Francisco',
    '350 3rd Street, San Francisco',
    'Gift box',
    'in_transit',
    3,
  ],
  [
    'Amir Khan',
    '555-0104',
    '5 Mission Street, San Francisco',
    '99 Brannan Street, San Francisco',
    'Office supplies',
    'unassigned',
    null,
  ],
  [
    'Grace Lee',
    '555-0105',
    '1201 4th Street, San Francisco',
    '600 Townsend Street, San Francisco',
    'Fragile glassware',
    'delivered',
    4,
  ],
  [
    'Mateo Rivera',
    '555-0106',
    '88 King Street, San Francisco',
    '501 2nd Street, San Francisco',
    'Clothing',
    'assigned',
    5,
  ],
  [
    'Nina Park',
    '555-0107',
    '34 5th Street, San Francisco',
    '780 Mission Street, San Francisco',
    'Electronics',
    'unassigned',
    null,
  ],
  [
    'Daniel Wilson',
    '555-0108',
    '15 Spear Street, San Francisco',
    '220 Bush Street, San Francisco',
    'Books',
    'delivered',
    1,
  ],
  [
    'Avery Thomas',
    '555-0109',
    '601 3rd Street, San Francisco',
    '142 Townsend Street, San Francisco',
    'Medical supplies',
    'in_transit',
    2,
  ],
  [
    'Isabel Cruz',
    '555-0110',
    '77 Beale Street, San Francisco',
    '410 Brannan Street, San Francisco',
    'Bakery order',
    'cancelled',
    3,
  ],
  [
    'Leo Martin',
    '555-0111',
    '250 California Street, San Francisco',
    '18 Fremont Street, San Francisco',
    'Equipment case',
    'picked_up',
    4,
  ],
  [
    'Emma Davis',
    '555-0112',
    '900 Market Street, San Francisco',
    '12 4th Street, San Francisco',
    'Returns package',
    'unassigned',
    null,
  ],
] as const;

export async function seedDatabase(db: AppDatabase) {
  const alreadySeeded = await db.select({ id: couriers.id }).from(couriers).limit(1);
  if (alreadySeeded.length) return { seeded: false, deliveries: 0, couriers: alreadySeeded.length };

  const now = Date.now();
  db.transaction((tx) => {
    const createdCouriers = tx
      .insert(couriers)
      .values(
        courierRows.map((courier) => ({ ...courier, active: true, createdAt: now, updatedAt: now }))
      )
      .returning({ id: couriers.id })
      .all();
    const createdDeliveries = tx
      .insert(deliveries)
      .values(
        deliveryRows.map(
          (
            [
              recipientName,
              recipientPhone,
              pickupAddress,
              dropoffAddress,
              parcelDescription,
              status,
              courierId,
            ],
            index
          ) => ({
            recipientName,
            recipientPhone,
            pickupAddress,
            dropoffAddress,
            parcelDescription,
            notes: null,
            status,
            courierId,
            createdAt: now - index * 20 * 60 * 1000,
            updatedAt: now - index * 10 * 60 * 1000,
          })
        )
      )
      .returning({ id: deliveries.id, status: deliveries.status })
      .all();
    tx.insert(deliveryEvents)
      .values(
        createdDeliveries.map((delivery) => ({
          deliveryId: delivery.id,
          status: delivery.status,
          note: 'Seed delivery history',
          createdAt: now,
        }))
      )
      .run();
    if (!createdCouriers.length) throw new Error('Courier seed did not create rows');
  });

  const [seededDeliveries, seededCouriers] = await Promise.all([
    listDeliveries(db, {}),
    listCouriers(db, {}),
  ]);
  return { seeded: true, deliveries: seededDeliveries.total, couriers: seededCouriers.total };
}

async function main() {
  const result = await seedDatabase(getDatabase());
  if (result.seeded) {
    console.log(`Seeded ${result.deliveries} deliveries and ${result.couriers} couriers.`);
  } else {
    console.log('Seed data already exists; no changes made.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  });
}
