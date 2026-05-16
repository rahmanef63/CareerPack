/**
 * Financial Calculator feature types.
 */

export interface FinancialData {
    monthlyIncome: number;
    monthlyExpenses: {
        housing: number;
        food: number;
        transportation: number;
        utilities: number;
        entertainment: number;
        others: number;
    };
    savings: number;
    targetCity: string;
}

export interface CityCostOfLiving {
    name: string;
    country: string;
    costIndex: number;
    rentIndex: number;
    groceriesIndex: number;
    restaurantIndex: number;
}
