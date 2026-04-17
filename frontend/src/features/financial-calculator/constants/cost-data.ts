/**
 * City cost of living data for salary comparisons.
 */

import type { CityCostOfLiving } from '../types';

export const cityCostData: CityCostOfLiving[] = [
    { name: 'Jakarta', country: 'Indonesia', costIndex: 100, rentIndex: 100, groceriesIndex: 100, restaurantIndex: 100 },
    { name: 'Bandung', country: 'Indonesia', costIndex: 75, rentIndex: 60, groceriesIndex: 80, restaurantIndex: 75 },
    { name: 'Surabaya', country: 'Indonesia', costIndex: 80, rentIndex: 65, groceriesIndex: 85, restaurantIndex: 80 },
    { name: 'Yogyakarta', country: 'Indonesia', costIndex: 65, rentIndex: 45, groceriesIndex: 70, restaurantIndex: 65 },
    { name: 'Bali', country: 'Indonesia', costIndex: 85, rentIndex: 80, groceriesIndex: 90, restaurantIndex: 95 },
    { name: 'Singapore', country: 'Singapore', costIndex: 280, rentIndex: 350, groceriesIndex: 240, restaurantIndex: 220 },
    { name: 'Kuala Lumpur', country: 'Malaysia', costIndex: 140, rentIndex: 160, groceriesIndex: 130, restaurantIndex: 140 },
    { name: 'Bangkok', country: 'Thailand', costIndex: 120, rentIndex: 130, groceriesIndex: 110, restaurantIndex: 120 },
    { name: 'Tokyo', country: 'Japan', costIndex: 320, rentIndex: 380, groceriesIndex: 280, restaurantIndex: 260 },
    { name: 'Sydney', country: 'Australia', costIndex: 340, rentIndex: 420, groceriesIndex: 300, restaurantIndex: 280 },
];
